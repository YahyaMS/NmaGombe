/**
 * The one place that turns a session cookie into a verified identity.
 * Used by both src/proxy.ts (the fast, first-pass gate) and the
 * /portal and /admin layouts (the authoritative, server-side re-check) —
 * see docs/05-ROUTES.md: "guarded in middleware and re-checked
 * server-side. Middleware alone is not authorisation."
 *
 * Never reads nma_display (the display-only cookie) — display and
 * authorization are two separate cookies on purpose, see HeaderAccountLink.tsx.
 */

import { adminAuth } from '@/lib/firebase/admin'

export interface VerifiedSession {
  uid: string
  role: 'member' | 'exec' | 'admin'
  verified: boolean
}

/**
 * Returns null on ANY failure — expired, tampered, malformed, or (when
 * checkRevoked is true) explicitly revoked. Callers should treat null as
 * "not signed in," never distinguish the reason.
 */
export async function verifySession(
  cookieValue: string | undefined,
  { checkRevoked }: { checkRevoked: boolean }
): Promise<VerifiedSession | null> {
  if (!cookieValue) return null
  try {
    const decoded = await adminAuth.verifySessionCookie(cookieValue, checkRevoked)
    const role = decoded.role
    return {
      uid: decoded.uid,
      role: role === 'admin' || role === 'exec' ? role : 'member',
      verified: decoded.verified === true,
    }
  } catch {
    return null
  }
}
