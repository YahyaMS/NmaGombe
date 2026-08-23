/**
 * No Firebase import at all, deliberately. Split out of auth-email-link.ts
 * (which needs `db` for email-link rate-limiting) so that
 * useVerifiedMemberGuard/useExecGuard — which call this for the 14-day
 * session-cookie refresh on every authenticated page load — don't
 * transitively bundle Firestore just by importing it. See
 * docs/09-DECISIONS.md.
 */

/**
 * Mints the server session (__session, HttpOnly) and the display-only
 * cookie (nma_display) that src/proxy.ts, the /portal and /admin layouts,
 * and HeaderAccountLink all read — see src/app/api/session/route.ts. Not
 * best-effort: /portal and /admin are now gated server-side on __session
 * existing, so a caller must surface failure here rather than swallow it,
 * or a properly-signed-in member would be silently unable to reach either.
 */
export async function establishServerSession(idToken: string): Promise<void> {
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) throw new Error('Could not establish a server session.')
}
