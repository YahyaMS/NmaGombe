/**
 * Server-only. Admin-SDK read backing /admin/members' list — the mutations
 * (setMemberStatus, setMemberRole) stay in lib/data/membersAdmin.ts as
 * client-SDK httpsCallable calls; see docs/09-DECISIONS.md on why that
 * write path isn't being duplicated into a Route Handler.
 *
 * NEVER import this from a Client Component.
 */

import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { memberProfileSchema, type MemberProfile } from './schemas'

export interface MemberRow extends MemberProfile {
  uid: string
}

/** Full roster, one-shot — filtered client-side by MembersAdminList, same deliberate shape as /portal/directory. */
export async function listAllMembersAdmin(): Promise<MemberRow[]> {
  const snap = await adminDb.collection('members').orderBy('displayName').get()
  const rows: MemberRow[] = []
  for (const doc of snap.docs) {
    const parsed = memberProfileSchema.safeParse(doc.data())
    if (parsed.success) rows.push({ uid: doc.id, ...parsed.data })
  }
  return rows
}
