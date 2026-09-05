/**
 * Server-only. Admin-SDK reads backing /admin (dashboard summary) and
 * /admin/verification (the full queue). The mutation (decideVerification)
 * stays a Cloud Function called via httpsCallable from the client — see
 * docs/09-DECISIONS.md on why verification/members/broadcast keep a single
 * Function-owned write path rather than gaining a second one through a
 * Route Handler, even though that means this route keeps the Auth+Functions
 * client SDK weight the read-only admin routes don't.
 *
 * NEVER import this from a Client Component.
 */

import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { loadRegisterTokenSets, matchAgainstRegister } from './registerMatch'

export interface DashboardSignup {
  id: string
  submittedAt: string | null
  decision: 'approve' | 'reject' | null
  displayName: string
}

export interface VerificationDashboardSummary {
  pendingCount: number
  recent: DashboardSignup[]
}

// Deliberately generous, not just "however many fit on screen": the whole
// verificationRequests collection is already read in full just below (to
// count pendingCount), so raising this costs no extra Firestore reads — it
// only changes how many of the already-fetched docs the dashboard hands to
// the client for its "see more" reveal (RecentSignupsList.tsx).
const RECENT_COUNT = 30

export async function getVerificationDashboardSummary(): Promise<VerificationDashboardSummary> {
  const snap = await adminDb
    .collection('verificationRequests')
    .orderBy('submittedAt', 'desc')
    .get()

  let pendingCount = 0
  const recentDocs = snap.docs.slice(0, RECENT_COUNT)

  for (const doc of snap.docs) {
    if (!doc.data().decision) pendingCount += 1
  }

  const recent = await Promise.all(
    recentDocs.map(async (doc): Promise<DashboardSignup> => {
      const data = doc.data()
      const submittedAt = data.submittedAt as FirebaseFirestore.Timestamp | undefined
      const memberSnap = await adminDb.collection('members').doc(data.uid as string).get()
      const displayName = (memberSnap.data()?.displayName as string | undefined) || ''
      return {
        id: doc.id,
        submittedAt: submittedAt ? submittedAt.toDate().toISOString() : null,
        decision: data.decision === 'approve' || data.decision === 'reject' ? data.decision : null,
        displayName,
      }
    })
  )

  return { pendingCount, recent }
}

export interface VerificationQueueRow {
  id: string
  uid: string
  folioNumber: string
  submittedAt: string | null
  decision: 'approve' | 'reject' | null
  displayName: string
  department: string
  facility: string
  email: string
  /** Fuzzy name-token match against registerEntries — a hint, not a
   *  verdict. null when registerEntries is empty (nothing to check yet). */
  registerMatch: boolean | null
}

/**
 * The full queue, subject fields already joined server-side — the client no
 * longer needs a separate getVerificationSubject() round trip per row. No
 * live subscription: this is a one-time server read on page load. The
 * client re-fetches via router.refresh() after an approve/reject, rather
 * than an onSnapshot listener — see VerificationQueue.tsx.
 */
export async function listVerificationQueueAdmin(): Promise<VerificationQueueRow[]> {
  const [snap, registerTokenSets] = await Promise.all([
    adminDb.collection('verificationRequests').orderBy('submittedAt', 'desc').get(),
    loadRegisterTokenSets(),
  ])

  return Promise.all(
    snap.docs.map(async (doc): Promise<VerificationQueueRow> => {
      const data = doc.data()
      const submittedAt = data.submittedAt as FirebaseFirestore.Timestamp | undefined
      const memberSnap = await adminDb.collection('members').doc(data.uid as string).get()
      const member = memberSnap.data()
      const displayName = (member?.displayName as string | undefined) ?? ''
      const { matched, registerLoaded } = matchAgainstRegister(displayName, registerTokenSets)
      return {
        id: doc.id,
        uid: data.uid as string,
        folioNumber: (data.folioNumber as string) ?? '',
        submittedAt: submittedAt ? submittedAt.toDate().toISOString() : null,
        decision: data.decision === 'approve' || data.decision === 'reject' ? data.decision : null,
        displayName,
        department: (member?.department as string | undefined) ?? '',
        facility: (member?.facility as string | undefined) ?? '',
        email: (member?.email as string | undefined) ?? '',
        registerMatch: registerLoaded ? matched : null,
      }
    })
  )
}
