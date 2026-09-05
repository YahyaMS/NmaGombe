/**
 * Confirms src/proxy.ts's own behaviour, not just verifySession in
 * isolation: a request carrying only nma_display (the plain, client-readable
 * display cookie) — with no __session at all — must be treated identically
 * to a request carrying neither cookie. Uses Next's documented proxy-testing
 * pattern (constructing a real NextRequest and calling proxy() directly).
 * Run: npm run test:auth
 */

import { NextRequest } from 'next/server'

const verifySession = jest.fn()

jest.mock('@/lib/auth/session', () => ({
  verifySession: (...args: unknown[]) => verifySession(...args),
}))

import { proxy, resetRateLimiterForTests } from '@/proxy'

describe('proxy — /portal and /admin gating', () => {
  beforeEach(() => {
    verifySession.mockReset()
  })

  test('no cookies at all: redirected to /signin', async () => {
    verifySession.mockResolvedValue(null)
    const req = new NextRequest('https://example.com/portal')
    const res = await proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://example.com/signin')
  })

  test('only nma_display present, no __session: treated exactly like no cookies — redirected to /signin', async () => {
    // verifySession is mocked here as the real implementation would behave:
    // it's only ever called with the __session value, so a request with
    // only nma_display set passes `undefined` through, same as no cookies.
    verifySession.mockImplementation(async (cookie: string | undefined) => (cookie ? { uid: 'x', role: 'member', verified: true } : null))
    const req = new NextRequest('https://example.com/portal', {
      headers: { cookie: 'nma_display=' + encodeURIComponent(JSON.stringify({ signedIn: true, role: 'admin', verified: true })) },
    })
    const res = await proxy(req)
    expect(verifySession).toHaveBeenCalledWith(undefined, { checkRevoked: false })
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://example.com/signin')
  })

  test('valid __session for /portal: request proceeds', async () => {
    verifySession.mockResolvedValue({ uid: 'x', role: 'member', verified: true })
    const req = new NextRequest('https://example.com/portal', {
      headers: { cookie: '__session=valid' },
    })
    const res = await proxy(req)
    // NextResponse.next() has no redirect status — this is the "let it through" response.
    expect(res.headers.get('location')).toBeNull()
  })

  test('valid __session but role member hitting /admin: redirected to /portal', async () => {
    verifySession.mockResolvedValue({ uid: 'x', role: 'member', verified: true })
    const req = new NextRequest('https://example.com/admin', {
      headers: { cookie: '__session=valid' },
    })
    const res = await proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://example.com/portal')
  })

  test('valid __session with role exec hitting /admin: request proceeds', async () => {
    verifySession.mockResolvedValue({ uid: 'x', role: 'exec', verified: true })
    const req = new NextRequest('https://example.com/admin', {
      headers: { cookie: '__session=valid' },
    })
    const res = await proxy(req)
    expect(res.headers.get('location')).toBeNull()
  })
})

describe('proxy — rate limiting on /verify, /doctors, /api', () => {
  beforeEach(() => {
    resetRateLimiterForTests()
  })

  function requestFrom(ip: string, path: string) {
    return new NextRequest(`https://example.com${path}`, {
      headers: { 'x-forwarded-for': ip },
    })
  }

  test('the 61st request in a minute from the same IP is rejected with 429', async () => {
    for (let i = 0; i < 60; i++) {
      const res = await proxy(requestFrom('1.2.3.4', '/doctors'))
      expect(res.status).not.toBe(429)
    }
    const res = await proxy(requestFrom('1.2.3.4', '/doctors'))
    expect(res.status).toBe(429)
  })

  test('the count is shared across /verify, /doctors and /api for the same IP — not a separate bucket per route', async () => {
    for (let i = 0; i < 60; i++) {
      await proxy(requestFrom('5.6.7.8', i % 2 === 0 ? '/doctors' : '/verify/some-token'))
    }
    const res = await proxy(requestFrom('5.6.7.8', '/api/session'))
    expect(res.status).toBe(429)
  })

  test('a different IP is not affected by another IP already at the limit', async () => {
    for (let i = 0; i < 61; i++) {
      await proxy(requestFrom('9.9.9.9', '/doctors'))
    }
    const res = await proxy(requestFrom('1.1.1.1', '/doctors'))
    expect(res.status).not.toBe(429)
  })

  test('/portal and /admin are not rate-limited by this mechanism — auth gating still runs at request 61', async () => {
    verifySession.mockResolvedValue(null)
    for (let i = 0; i < 61; i++) {
      await proxy(requestFrom('2.2.2.2', '/doctors'))
    }
    const res = await proxy(requestFrom('2.2.2.2', '/portal'))
    // Redirected to /signin (307), not blocked with 429 — proves /portal took
    // the auth-gating branch, not the rate-limit branch, even though this IP
    // is already over the limit on the other branch.
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://example.com/signin')
  })

  // Regression test: this exact scenario broke the smoke suite twice. First
  // attempt at a fix exempted the literal string 'unknown' (no
  // x-forwarded-for header at all) — didn't hold, because a direct repro
  // against a real running server showed Next fills the header in from the
  // raw socket address on Node rather than leaving it absent: '::1' locally,
  // real loopback in CI too. Every request in local dev/CI shares that one
  // address regardless of which of many concurrent, unrelated requests sent
  // it. Both cases are covered here since both are real: an environment
  // where the header is truly absent, and this one, where Next supplies a
  // loopback value instead.
  test('requests with no x-forwarded-for header are never rate-limited', async () => {
    for (let i = 0; i < 200; i++) {
      const req = new NextRequest('https://example.com/doctors')
      const res = await proxy(req)
      expect(res.status).not.toBe(429)
    }
  })

  test('requests from a loopback address (::1, 127.0.0.1 — what Next actually supplies locally and in CI) are never rate-limited', async () => {
    for (let i = 0; i < 200; i++) {
      const res = await proxy(requestFrom(i % 2 === 0 ? '::1' : '127.0.0.1', '/doctors'))
      expect(res.status).not.toBe(429)
    }
  })
})
