/**
 * All Firestore/Function access for the verification queue goes through here.
 * No inline getDocs/httpsCallable in components — see CLAUDE.md conventions.
 */

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase/client'
import { verificationRequestSchema, type VerificationRequestData } from './schemas'

export interface VerificationRequest extends VerificationRequestData {
  id: string
  submittedAt: Timestamp | null
  decidedAt: Timestamp | null
}

export interface VerificationSubject {
  displayName: string
  department: string
  email: string
}

/** Live queue, newest submission first. Includes already-decided requests — the UI splits them. */
export function subscribeToVerificationQueue(
  onChange: (requests: VerificationRequest[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'verificationRequests'), orderBy('submittedAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const requests: VerificationRequest[] = []
      for (const docSnap of snap.docs) {
        const parsed = verificationRequestSchema.safeParse(docSnap.data())
        if (!parsed.success) continue
        const raw = docSnap.data()
        requests.push({
          id: docSnap.id,
          ...parsed.data,
          submittedAt: (raw.submittedAt as Timestamp) ?? null,
          decidedAt: (raw.decidedAt as Timestamp) ?? null,
        })
      }
      onChange(requests)
    },
    (err) => onError?.(err)
  )
}

/** The submitter's name/department/email, for display next to their request. */
export async function getVerificationSubject(uid: string): Promise<VerificationSubject | null> {
  const snap = await getDoc(doc(db, 'members', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    department: typeof data.department === 'string' ? data.department : '',
    email: typeof data.email === 'string' ? data.email : '',
  }
}

interface DecideVerificationInput {
  requestId: string
  decision: 'approve' | 'reject'
  note?: string
}

const callDecideVerification = httpsCallable<DecideVerificationInput, { ok: true }>(
  functions,
  'decideVerification'
)

export async function decideVerification(input: DecideVerificationInput): Promise<void> {
  await callDecideVerification(input)
}
