/**
 * Publishes a news/communiqué item. Replaces a client-Firestore write under
 * firestore.rules' isExec() with a server-checked one — see
 * lib/data/newsAdmin.ts's comment for why this doesn't create a second
 * privileged write path (news/events never had a Cloud Function to begin
 * with, unlike verification/members/broadcast — see docs/09-DECISIONS.md).
 *
 * Re-checks authorisation itself (CLAUDE.md rule 2) — the admin layout
 * gates the *page*, not this Route Handler, which is a separate request.
 */

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifySession } from '@/lib/auth/session'
import { newsPublishInputSchema } from '@/lib/data/schemas'
import { publishNewsAdmin } from '@/lib/data/newsAdmin'

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const sessionCookie = cookieHeader.match(/(?:^|; )__session=([^;]+)/)?.[1]
  const session = await verifySession(sessionCookie, { checkRevoked: true })
  if (!session) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (session.role !== 'exec' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = newsPublishInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const authorSnap = await adminDb.collection('members').doc(session.uid).get()
  const author = (authorSnap.data()?.displayName as string | undefined) || 'NMA Gombe'

  const slug = await publishNewsAdmin(parsed.data, author)
  return NextResponse.json({ slug })
}
