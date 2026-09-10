/**
 * Streams a member's profile photo. Deliberately not a Storage getDownloadURL()
 * — see storage.rules' comment on profile-photos/{uid}/{file} and
 * docs/09-DECISIONS.md ADR-022: a download-URL token keeps working forever
 * once issued, independent of the member's current visibility choice, which
 * would defeat the opt-in/opt-out this feature exists to provide. Every
 * request re-reads members/{uid} and re-checks visibility.photo and
 * publicListingConsent live, so switching photo visibility off actually takes
 * effect on the very next request — no standing link survives it.
 *
 * Cookie session, not Bearer <ID token> — unlike /portal/card/download or
 * /portal/documents/[id]/download, both deliberate fetch()-triggered
 * downloads that can set an Authorization header themselves. This route is
 * loaded by a plain <img src> in MemberPhoto.tsx, everywhere a photo can
 * appear (the profile form's own preview, directory rows, the public
 * /doctors page) — an <img> tag cannot attach a custom header, only same-
 * origin cookies, so Bearer auth here would never work at all. Found by
 * direct repro against a real running server: the very first version of
 * this route used Bearer, and a member's own just-uploaded photo simply
 * never rendered anywhere, silently, because the <img> request could never
 * carry the token. verifySession (the same helper /api/portal/own-card
 * uses) reads __session instead, which the browser attaches automatically.
 *
 * Three audiences: the member viewing their OWN photo (always allowed once
 * uploaded, regardless of visibility.photo — previewing what you just
 * uploaded, before deciding whether anyone else should see it, is not
 * "someone else seeing it"), a signed-in verified member viewing the member
 * directory, or an anonymous visitor to the public /doctors page — allowed
 * only when the member has ALSO granted publicListingConsent, same as every
 * other public field.
 */

import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { adminDb, adminStorage } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params

  const snap = await adminDb.collection('members').doc(uid).get()
  const member = snap.data()
  if (!member || member.hasPhoto !== true) {
    return new Response('Not found.', { status: 404 })
  }

  const visibility = member.visibility as { photo?: boolean } | undefined
  const publicListingConsent = member.publicListingConsent as { granted?: boolean } | undefined
  const publiclyVisible = visibility?.photo === true && publicListingConsent?.granted === true

  if (!publiclyVisible) {
    // checkRevoked: false, deliberately — a directory list can render many
    // avatars on one page, one request each, and the cost of a stale-by-a-
    // few-minutes revocation check here is "one photo shows a beat longer
    // than it should," not a privileged action. Same reasoning as
    // src/proxy.ts's fast first-pass check (ADR-015): cheap and frequent,
    // not the authoritative gate for anything sensitive.
    const cookieHeader = request.headers.get('cookie') ?? ''
    const sessionCookie = cookieHeader.match(/(?:^|; )__session=([^;]+)/)?.[1]
    const session = await verifySession(sessionCookie, { checkRevoked: false })
    if (!session) {
      return new Response('Not found.', { status: 404 })
    }

    const isSelf = session.uid === uid
    const visibleToMember = visibility?.photo === true && session.verified
    if (!isSelf && !visibleToMember) {
      return new Response('Not found.', { status: 404 })
    }
  }

  try {
    const [buffer] = await adminStorage.bucket().file(`profile-photos/${uid}/photo.jpg`).download()
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        // Never cached by a shared/CDN cache when it's gated on the viewer's
        // own auth — only the genuinely-public case is safe to cache at all,
        // and even then briefly, since the member can revoke it at any time.
        'Cache-Control': publiclyVisible ? 'public, max-age=300' : 'private, no-store',
      },
    })
  } catch {
    return new Response('Not found.', { status: 404 })
  }
}
