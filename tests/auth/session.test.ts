/**
 * Pure unit tests for verifySession — no emulator needed, firebase-admin is
 * mocked. Complements tests/rules: those prove the Firestore rules boundary,
 * these prove the session-cookie boundary that src/proxy.ts and the
 * /portal, /admin layouts sit behind. Run: npm run test:auth
 */

const verifySessionCookie = jest.fn()

jest.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifySessionCookie: (...args: unknown[]) => verifySessionCookie(...args),
  },
}))

import { verifySession } from '@/lib/auth/session'

describe('verifySession', () => {
  beforeEach(() => {
    verifySessionCookie.mockReset()
  })

  test('no cookie value at all returns null without calling the Admin SDK', async () => {
    const result = await verifySession(undefined, { checkRevoked: false })
    expect(result).toBeNull()
    expect(verifySessionCookie).not.toHaveBeenCalled()
  })

  test('expired cookie returns null', async () => {
    verifySessionCookie.mockRejectedValue(new Error('Firebase ID token has expired'))
    const result = await verifySession('expired-cookie', { checkRevoked: false })
    expect(result).toBeNull()
  })

  test('tampered/malformed cookie returns null', async () => {
    verifySessionCookie.mockRejectedValue(new Error('Decoding Firebase session cookie failed'))
    const result = await verifySession('not-a-real-cookie', { checkRevoked: false })
    expect(result).toBeNull()
  })

  test('valid cookie resolves to the decoded identity, defaulting role to member', async () => {
    verifySessionCookie.mockResolvedValue({ uid: 'abc123' })
    const result = await verifySession('valid-cookie', { checkRevoked: false })
    expect(result).toEqual({ uid: 'abc123', role: 'member', verified: false })
  })

  test('valid cookie carries through admin role and verified claims', async () => {
    verifySessionCookie.mockResolvedValue({ uid: 'admin-uid', role: 'admin', verified: true })
    const result = await verifySession('valid-cookie', { checkRevoked: false })
    expect(result).toEqual({ uid: 'admin-uid', role: 'admin', verified: true })
  })

  test('an unrecognised role value is not trusted as-is — falls back to member', async () => {
    verifySessionCookie.mockResolvedValue({ uid: 'x', role: 'superuser', verified: true })
    const result = await verifySession('valid-cookie', { checkRevoked: false })
    expect(result?.role).toBe('member')
  })

  test('checkRevoked is forwarded to the Admin SDK so a revoked session can be rejected', async () => {
    verifySessionCookie.mockResolvedValue({ uid: 'x' })
    await verifySession('valid-cookie', { checkRevoked: true })
    expect(verifySessionCookie).toHaveBeenCalledWith('valid-cookie', true)

    await verifySession('valid-cookie', { checkRevoked: false })
    expect(verifySessionCookie).toHaveBeenCalledWith('valid-cookie', false)
  })

  test('a revoked session rejected only under checkRevoked: true is null, not a thrown error', async () => {
    // Simulates what the real Admin SDK does: verifySessionCookie(cookie, true)
    // throws on a revoked session; verifySessionCookie(cookie, false) would
    // have resolved. Confirms verifySession converts that rejection to null
    // rather than letting it propagate and crash the proxy/layout.
    verifySessionCookie.mockRejectedValue(new Error('Firebase session cookie has been revoked'))
    const result = await verifySession('revoked-cookie', { checkRevoked: true })
    expect(result).toBeNull()
  })
})

describe('display cookie cannot substitute for a session', () => {
  test('verifySession has no code path that reads or accepts a display-cookie-shaped value', async () => {
    // nma_display (see src/app/api/session/route.ts) is a plain JSON string
    // like {"signedIn":true,"role":"admin","verified":true}. Passing that
    // shape in as if it were a session cookie must fail exactly like any
    // other malformed value — there is no parsing path that would accept it.
    verifySessionCookie.mockRejectedValue(new Error('Decoding Firebase session cookie failed'))
    const displayCookieValue = JSON.stringify({ signedIn: true, role: 'admin', verified: true })
    const result = await verifySession(displayCookieValue, { checkRevoked: true })
    expect(result).toBeNull()
    expect(verifySessionCookie).toHaveBeenCalledWith(displayCookieValue, true)
  })
})
