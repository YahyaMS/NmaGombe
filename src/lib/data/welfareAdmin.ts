/**
 * Server-only. Admin-SDK access to welfareCases/ for the exec side — listing
 * and updating. Same conversion and reasoning as newsAdmin.ts/eventsAdmin.ts:
 * no Cloud Function ever wrote here, so the Route Handler
 * (src/app/api/admin/welfare/[id]/route.ts) is the only privileged write
 * path, and it re-checks isExec() itself (CLAUDE.md rule 2).
 *
 * IMPORTANT: the Admin SDK bypasses firestore.rules entirely. Every export
 * here is called only from that Route Handler or from a Server Component
 * already behind /admin's layout gate — this file does not re-check itself.
 *
 * NEVER import this from a Client Component.
 */

import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { welfareCaseSchema, type WelfareCaseStatus } from './schemas'

export interface AdminWelfareCase {
  id: string
  requester: string
  requesterName: string
  status: WelfareCaseStatus
  amount?: number
  createdAt: string | null
}

/**
 * Fetches each case's requester name via members/{uid} — an N+1 read, but
 * welfareCases is a handful-of-open-cases-at-a-time collection, not a mass
 * one like the directory (CLAUDE.md's "denormalise for reads" rule targets
 * exactly that scale problem, not this one), and duplicating a member's
 * displayName into every welfareCases doc for no other reason would be its
 * own, needless bit of data to keep in sync.
 */
export async function listWelfareCasesAdmin(): Promise<AdminWelfareCase[]> {
  const snap = await adminDb.collection('welfareCases').orderBy('createdAt', 'desc').get()

  const rows = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data()
      const parsed = welfareCaseSchema.safeParse(data)
      if (!parsed.success) return null

      const memberSnap = await adminDb.collection('members').doc(parsed.data.requester).get()
      const requesterName = (memberSnap.data()?.displayName as string | undefined) || 'Unknown member'

      const createdAt = data.createdAt as FirebaseFirestore.Timestamp | undefined
      return {
        id: d.id,
        ...parsed.data,
        requesterName,
        createdAt: createdAt ? createdAt.toDate().toISOString() : null,
      }
    })
  )

  return rows.filter((r): r is AdminWelfareCase => r !== null)
}

export async function updateWelfareCaseAdmin(
  caseId: string,
  updates: { status?: WelfareCaseStatus; amount?: number }
): Promise<void> {
  await adminDb.collection('welfareCases').doc(caseId).update(updates)
}
