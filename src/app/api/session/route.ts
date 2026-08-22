/**
 * Creates/refreshes and clears the server session used by src/proxy.ts and
 * the /portal, /admin layouts. Two cookies, set together, one job each:
 * __session (HttpOnly) is the only thing any authorization check reads;
 * nma_display (plain) is display-only, for the header — see
 * src/lib/auth/session.ts and HeaderAccountLink.tsx.
 *
 * NEVER import this file's logic elsewhere — it's the one place allowed to
 * mint a session. See CLAUDE.md rule #1: trust fields (here, "who you are")
 * are never taken at face value from the client without verification.
 */

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

const SESSION_COOKIE = '__session'
const DISPLAY_COOKIE = 'nma_display'
const SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60 // Firebase's own hard cap on session cookies

function roleFromClaims(claims: Record<string, unknown>): 'member' | 'exec' | 'admin' {
  return claims.role === 'admin' || claims.role === 'exec' ? claims.role : 'member'
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const idToken = typeof body?.idToken === 'string' ? body.idToken : null
  if (!idToken) {
    return NextResponse.json({ error: 'idToken is required' }, { status: 400 })
  }

  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(idToken)
  } catch {
    return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 })
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  })

  const role = roleFromClaims(decoded)
  const verified = decoded.verified === true
  const display = JSON.stringify({ signedIn: true, role, verified })

  const res = NextResponse.json({ ok: true as const })
  res.cookies.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  res.cookies.set(DISPLAY_COOKIE, display, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return res
}

export async function DELETE(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))
  const sessionCookie = match?.[1]

  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie)
      await adminAuth.revokeRefreshTokens(decoded.uid)
    } catch {
      // Already invalid/expired — nothing to revoke. Still clear cookies below.
    }
  }

  const res = NextResponse.json({ ok: true as const })
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  res.cookies.set(DISPLAY_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
