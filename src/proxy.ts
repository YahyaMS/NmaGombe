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
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth/session'

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value
  const session = await verifySession(sessionCookie, { checkRevoked: false })

  if (!session) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isExec = session.role === 'admin' || session.role === 'exec'
  if (isAdminRoute && !isExec) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/portal/:path*', '/admin/:path*'],
}
