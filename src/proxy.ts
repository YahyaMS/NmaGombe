/**
 * Layer 1 of 2 for /portal and /admin (docs/05-ROUTES.md: "guarded in
 * middleware and re-checked server-side. Middleware alone is not
 * authorisation."). Fast, cheap check — no revocation lookup — so a signed-out
 * or session-less visitor never even reaches client code. The authoritative
 * re-check (with revocation) lives in the portal/admin layouts.
 *
 * Next.js 16 renamed middleware.ts to proxy.ts (same capability) and, as of
 * 16.0.0, Proxy defaults to the Node.js runtime — not Edge — which is why
 * firebase-admin (Node-only) can run directly in here at all.
 *
 * Only ever reads __session, never nma_display (the display-only cookie —
 * see src/lib/auth/session.ts and HeaderAccountLink.tsx). A request bearing
 * only nma_display, with no __session, is treated identically to a request
 * bearing neither.
 *
 * Also rate-limits /verify, /doctors and /api — the unauthenticated-reachable
 * routes with no limit of any kind before this (see docs/03-DATA-MODEL.md's
 * threat-model table; this is what moves "Rate limiting" from Intended toward
 * Implemented, not all the way there — see the limitations noted below).
 * Deliberately does NOT extend to /portal or /admin: the abuse this guards
 * against (scripted /verify token-guessing, expensive /doctors queries,
 * unauthenticated /api floods) is a request-volume problem this layer can see;
 * a member spamming Firestore writes via the client SDK from an authenticated
 * /portal session is a different problem this layer can't see at all (it never
 * touches proxy.ts), so there is nothing this rate limiter would actually stop
 * there — see F-05.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth/session'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 60

// In-memory, per-instance. Deliberately crude, not a real distributed rate
// limiter: Vercel can route a burst across multiple instances (each with its
// own empty Map), and every count resets on a cold start or redeploy. This
// stops a naive single-origin script; it does not stop a distributed one.
// Real rate limiting needs a shared store (Firestore-backed counter, Upstash,
// etc.) — tracked as still-Intended work, not delivered by this file alone.
const requestCounts = new Map<string, { count: number; windowStart: number }>()

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = requestCounts.get(ip)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestCounts.set(ip, { count: 1, windowStart: now })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT_MAX_REQUESTS
}

/** Test-only: the Map above is module-scoped and otherwise persists across every test in a file. */
export function resetRateLimiterForTests(): void {
  requestCounts.clear()
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isGated = pathname.startsWith('/portal') || pathname.startsWith('/admin')

  if (!isGated) {
    if (isRateLimited(clientIp(request))) {
      return new NextResponse('Too many requests. Try again in a minute.', { status: 429 })
    }
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('__session')?.value
  const session = await verifySession(sessionCookie, { checkRevoked: false })

  if (!session) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  const isAdminRoute = pathname.startsWith('/admin')
  const isExec = session.role === 'admin' || session.role === 'exec'
  if (isAdminRoute && !isExec) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/portal/:path*', '/admin/:path*', '/verify/:path*', '/doctors', '/api/:path*'],
}
