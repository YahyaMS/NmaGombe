/**
 * Server-only. Admin-SDK read backing /admin/broadcast's history — the
 * mutation (logBroadcast) stays in lib/data/broadcast.ts as a client-SDK
 * httpsCallable call; see docs/09-DECISIONS.md.
 *
 * NEVER import this from a Client Component.
 */

import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { broadcastSchema, type Broadcast } from './schemas'

export interface BroadcastRow extends Broadcast {
  id: string
  sentAt: string | null
}

/** The exec's own history, newest first — the record docs/07-CONTENT-OPS.md calls for. */
export async function listBroadcastsAdmin(): Promise<BroadcastRow[]> {
  const snap = await adminDb.collection('broadcasts').orderBy('sentAt', 'desc').get()
  const rows: BroadcastRow[] = []
  for (const doc of snap.docs) {
    const data = doc.data()
    const parsed = broadcastSchema.safeParse(data)
    if (!parsed.success) continue
    const sentAt = data.sentAt as FirebaseFirestore.Timestamp | undefined
    rows.push({ id: doc.id, ...parsed.data, sentAt: sentAt ? sentAt.toDate().toISOString() : null })
  }
  return rows
}
