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

import { proxy } from '@/proxy'

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
