/**
 * setMemberStatus / setMemberRole — admin member-management actions
 * (docs/05-ROUTES.md: /admin/members — "search, edit, suspend, grant roles").
 * Both are Function-only because firestore.rules denies all direct client
 * writes to members/{uid}'s trust fields (status, role, duesPaidThrough,
 * verifiedAt) — see the members/{uid} update rule and its tests. A raw
 * document write would desync the Firestore field from the actual custom
 * claim every other rule checks, the same reason decideVerification exists.
 *
 * The caller's role is re-checked here even though firestore.rules already
 * gates the caller's own reads — the Admin SDK bypasses rules entirely, so
 * these Functions must authorise themselves. See CLAUDE.md rule #2.
 */

import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { z } from 'zod'

// Matches Firestore's region — see docs/09-DECISIONS.md ADR-008.
const REGION = 'europe-west1'

function requireExecCaller(request: CallableRequest): string {
  const role = request.auth?.token.role
  if (!request.auth || (role !== 'admin' && role !== 'exec')) {
    throw new HttpsError('permission-denied', 'Only an admin or exec can do this.')
  }
  return request.auth.uid
}

const statusInputSchema = z.object({
  uid: z.string().min(1),
  status: z.enum(['verified', 'suspended']),
})

export const setMemberStatus = onCall({ region: REGION }, async (request) => {
  const callerUid = requireExecCaller(request)

  const parsed = statusInputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'A uid and a valid status are required.')
  }
  const { uid, status } = parsed.data

  if (uid === callerUid) {
    throw new HttpsError('failed-precondition', "You can't change your own status here.")
  }

  const user = await getAuth().getUser(uid)
  await getAuth().setCustomUserClaims(uid, {
    ...(user.customClaims ?? {}),
    verified: status === 'verified',
  })

  await getFirestore().doc(`members/${uid}`).update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  })

  return { ok: true as const }
})

const roleInputSchema = z.object({
  uid: z.string().min(1),
  role: z.enum(['member', 'exec', 'admin']),
})

export const setMemberRole = onCall({ region: REGION }, async (request) => {
  const callerUid = requireExecCaller(request)
  const callerRole = request.auth!.token.role

  const parsed = roleInputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'A uid and a valid role are required.')
  }
  const { uid, role } = parsed.data

  if (uid === callerUid) {
    throw new HttpsError('failed-precondition', "You can't change your own role here.")
  }
  // Granting admin is the most sensitive transition — only an existing admin
  // can mint another one, matching decideVerification's admin-only precedent.
  if (role === 'admin' && callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Only an admin can grant the admin role.')
  }

  const user = await getAuth().getUser(uid)
  await getAuth().setCustomUserClaims(uid, {
    ...(user.customClaims ?? {}),
    role,
  })

  await getFirestore().doc(`members/${uid}`).update({
    role,
    updatedAt: FieldValue.serverTimestamp(),
  })

  return { ok: true as const }
})
