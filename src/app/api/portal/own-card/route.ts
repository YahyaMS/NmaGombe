/**
 * The signed-in visitor's own card summary, for the homepage's real-card
 * section (src/app/(public)/HomeFolioCard.tsx). Same own-uid-only Admin SDK
 * lookup and field set as /portal/card/download, but authenticated via the
 * __session cookie + verifySession (the /api/admin/* pattern) instead of a
 * Bearer ID token — the homepage is public/SSR tier and must never ship the
 * Firebase Auth SDK just to read a cookie already sent with every same-origin
 * fetch. See .claude/rules/security-rules.md rule 3: re-checked here, not
 * assumed from proxy.ts (whose matcher doesn't cover /api/portal anyway).
 *
 * Returns only what a folio card needs to render — no new personal-data
 * surface: these fields are already documented in
 * docs/08-NDPA-COMPLIANCE.md as self-readable, this just adds a second read
 * path to the same data.
 */

import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { adminDb } from '@/lib/firebase/admin'
import { gradeLabels, type Grade } from '@/lib/data/schemas'

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const sessionCookie = cookieHeader.match(/(?:^|; )__session=([^;]+)/)?.[1]
  const session = await verifySession(sessionCookie, { checkRevoked: true })
  if (!session || !session.verified) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  // Own record only — the uid comes from the verified session, never from the request.
  const snap = await adminDb.collection('members').doc(session.uid).get()
  const member = snap.data()
  if (!member) {
    return NextResponse.json({ error: 'No profile on file' }, { status: 404 })
  }

  const displayName = typeof member.displayName === 'string' ? member.displayName : ''
  const folioNumber = typeof member.folioNumber === 'string' ? member.folioNumber : ''
  const department = typeof member.department === 'string' ? member.department : ''
  const grade: Grade | undefined =
    typeof member.grade === 'string' && member.grade in gradeLabels
      ? (member.grade as Grade)
      : undefined
  const gradeLine = [grade ? gradeLabels[grade] : null, department].filter(Boolean).join(' · ')

  if (!displayName || !folioNumber) {
    return NextResponse.json({ error: 'No profile on file' }, { status: 404 })
  }

  return NextResponse.json(
    { displayName, gradeLine, folioNumber },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
