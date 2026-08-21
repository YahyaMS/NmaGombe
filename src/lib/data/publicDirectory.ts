/**
 * Server-only. Backs the public, unauthenticated /doctors page — Admin SDK,
 * not the client SDK, same reason as lib/data/news.ts and lib/data/events.ts:
 * a public page with no interaction doesn't need to ship the Firestore
 * client SDK. Doubly true here — firestore.rules denies ALL client access to
 * publicDirectory (`allow read, write: if false`), so the Admin SDK is the
 * only way to read it at all, by design (see docs/03-DATA-MODEL.md).
 *
 * NEVER import this from a Client Component.
 */

import { adminDb } from '@/lib/firebase/admin'
import { publicDirectoryEntrySchema, type PublicDirectoryEntry } from './schemas'

export interface PublicDirectoryRow extends PublicDirectoryEntry {
  uid: string
}

export async function listPublicDirectory(): Promise<PublicDirectoryRow[]> {
  const snap = await adminDb.collection('publicDirectory').orderBy('displayName').get()
  const rows: PublicDirectoryRow[] = []
  for (const doc of snap.docs) {
    const parsed = publicDirectoryEntrySchema.safeParse(doc.data())
    if (parsed.success) rows.push({ uid: doc.id, ...parsed.data })
  }
  return rows
}
