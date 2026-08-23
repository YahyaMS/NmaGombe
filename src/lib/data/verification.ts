/**
 * Client-SDK access for the verification decision — the one thing about
 * verification that's still client-side. Reading the queue moved to the
 * Admin SDK (lib/data/verificationAdmin.ts, server-only) once the list view
 * was converted to a Server Component; this file used to also hold
 * subscribeToVerificationQueue()/getVerificationSubject() for that, removed
 * as dead code once VerificationQueue.tsx stopped calling them.
 *
 * No inline httpsCallable in components — see CLAUDE.md conventions.
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase/functions'

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
