/**
 * decideVerification — the only way a member's folio submission becomes
 * verified. Sets the verified:true custom claim (only the Admin SDK can do
 * this) and records status + the decision audit trail in the same call.
 *
 * The caller's admin role is re-checked here even though Firestore rules
 * already gate the admin's own reads — the Admin SDK bypasses rules
 * entirely, so this Function must authorise itself. See CLAUDE.md rule #2
 * and docs/09-DECISIONS.md ADR-002.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { z } from 'zod'

// Matches Firestore's region — see docs/09-DECISIONS.md ADR-008.
const REGION = 'europe-west1'

const inputSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(['approve', 'reject']),
  note: z.string().trim().max(500).optional(),
})

export const decideVerification = onCall({ region: REGION }, async (request) => {
  if (!request.auth || request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only an admin can decide a verification request.')
  }

  const parsed = inputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'requestId and a valid decision are required.')
  }
  const { requestId, decision, note } = parsed.data

  const db = getFirestore()
  const requestRef = db.doc(`verificationRequests/${requestId}`)
  const requestSnap = await requestRef.get()
  if (!requestSnap.exists) {
    throw new HttpsError('not-found', 'That verification request no longer exists.')
  }

  const requestData = requestSnap.data()!
  if (requestData.decision) {
    throw new HttpsError('failed-precondition', 'This request has already been decided.')
  }

  const uid = requestData.uid as string

  // Set the claim first — if this succeeds but the Firestore writes below
  // fail, a retry is safe (re-setting the same claim is a no-op) and the
  // "already decided" check above still lets it through.
  if (decision === 'approve') {
    const user = await getAuth().getUser(uid)
    await getAuth().setCustomUserClaims(uid, {
      ...(user.customClaims ?? {}),
      role: (user.customClaims?.role as string | undefined) ?? 'member',
      verified: true,
    })
  }

  const batch = db.batch()
  batch.update(db.doc(`members/${uid}`), {
    status: decision === 'approve' ? 'verified' : 'rejected',
    ...(decision === 'approve' ? { verifiedAt: FieldValue.serverTimestamp() } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  })
  batch.update(requestRef, {
    decision,
    decidedBy: request.auth.uid,
    decidedAt: FieldValue.serverTimestamp(),
    note: note ?? null,
  })
  await batch.commit()

  return { ok: true as const }
})
