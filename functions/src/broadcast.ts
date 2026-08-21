/**
 * logBroadcast — records that a WhatsApp broadcast went out. It does not
 * send anything: WhatsApp integration in this project is free click-to-chat
 * + the admin's own broadcast lists (docs/02-ARCHITECTURE.md), not the paid
 * Business API. The admin pastes the message into WhatsApp themselves; this
 * Function only writes the audit trail docs/07-CONTENT-OPS.md calls for.
 *
 * Writes go through a Function (not a direct client write) because
 * firestore.rules denies all client writes to broadcasts — "so the log
 * cannot be edited after the fact." The caller's role is re-checked here
 * even though rules already gate reads, because the Admin SDK bypasses
 * rules entirely — see CLAUDE.md rule #2 and docs/09-DECISIONS.md ADR-002.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'

// Matches Firestore's region — see docs/09-DECISIONS.md ADR-008.
const REGION = 'europe-west1'

const inputSchema = z.object({
  message: z.string().trim().min(10).max(4000),
  audience: z.string().trim().min(2).max(120),
})

export const logBroadcast = onCall({ region: REGION }, async (request) => {
  const role = request.auth?.token.role
  if (!request.auth || (role !== 'admin' && role !== 'exec')) {
    throw new HttpsError('permission-denied', 'Only an admin or exec can log a broadcast.')
  }

  const parsed = inputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'A message and an audience are required.')
  }
  const { message, audience } = parsed.data

  const db = getFirestore()
  const ref = db.collection('broadcasts').doc()
  await ref.set({
    message,
    audience,
    channel: 'whatsapp' as const,
    sentBy: request.auth.uid,
    sentAt: FieldValue.serverTimestamp(),
  })

  return { ok: true as const, id: ref.id }
})
