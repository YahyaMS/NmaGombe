/**
 * Reads nma_display — the small, non-HttpOnly, display-only cookie
 * /api/session sets alongside the real __session cookie (see
 * src/lib/auth/session.ts). Nothing here, or anywhere else, uses this to
 * authorise anything; it exists purely so a page can render the right
 * auth-aware copy without shipping the Firebase SDK to find out.
 *
 * Shared by every public-page client island that needs to know "is this
 * visitor signed in, and as what" — HeaderAccountLink originated this
 * logic; pulled out here so every other instance (the homepage hero,
 * /membership, /about) shares one implementation instead of drifting.
 */

export type DisplayAccountState = 'checking' | 'signed-out' | 'admin' | 'member' | 'pending'

export interface DisplayCookie {
  signedIn: boolean
  role: 'member' | 'exec' | 'admin'
  verified: boolean
}

export function readDisplayCookie(): DisplayCookie | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|; )nma_display=([^;]*)/)
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match[1]))
  } catch {
    return null
  }
}

export function resolveDisplayState(display: DisplayCookie | null): Exclude<DisplayAccountState, 'checking'> {
  if (!display || !display.signedIn) return 'signed-out'
  if (display.role === 'admin' || display.role === 'exec') return 'admin'
  return display.verified ? 'member' : 'pending'
}
