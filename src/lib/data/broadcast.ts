/**
 * All Firestore/Function access for admin broadcasts goes through here.
 * No inline getDocs/httpsCallable in components — see CLAUDE.md conventions.
 *
 * Writing goes through the logBroadcast Function — firestore.rules denies
 * all client writes to broadcasts. Reading is a direct client-SDK query:
 * firestore.rules already permits `get, list` to isExec(), no Function
 * needed for that half.
 */

import { collection, getDocs, orderBy, query, type Timestamp } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase/client'
import { broadcastSchema, type Broadcast, type BroadcastComposeInput } from './schemas'

export interface BroadcastRow extends Broadcast {
  id: string
  sentAt: Timestamp | null
}

const callLogBroadcast = httpsCallable<BroadcastComposeInput, { ok: true; id: string }>(
  functions,
  'logBroadcast'
)

export async function logBroadcast(input: BroadcastComposeInput): Promise<void> {
  await callLogBroadcast(input)
}

/** The exec's own history, newest first — the record docs/07-CONTENT-OPS.md calls for. */
export async function listBroadcasts(): Promise<BroadcastRow[]> {
  const snap = await getDocs(query(collection(db, 'broadcasts'), orderBy('sentAt', 'desc')))
  const rows: BroadcastRow[] = []
  for (const d of snap.docs) {
    const data = d.data()
    const parsed = broadcastSchema.safeParse(data)
    if (parsed.success) rows.push({ id: d.id, ...parsed.data, sentAt: (data.sentAt as Timestamp) ?? null })
  }
  return rows
}
