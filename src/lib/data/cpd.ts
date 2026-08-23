/**
 * All Firestore/Storage access to cpdEntries/{uid}/entries/ goes through here.
 * No inline onSnapshot/addDoc/uploadBytes in components — see CLAUDE.md conventions.
 *
 * Entirely client-SDK, like lib/data/portalEvents.ts — cpdEntries is never read from a
 * Server Component. certificateUrl is attached in a separate call from addEntry(): entry
 * creation shouldn't need or wait on network for an upload (see docs/03-DATA-MODEL.md).
 *
 * The list is read via onSnapshot, not a one-time getDocs(): per @firebase/firestore's own
 * type docs, getDocs() "may return cached data or fail" while offline — not a guarantee.
 * onSnapshot reliably serves the persistent local cache first (same pattern
 * subscribeToOwnMemberProfile in lib/data/members.ts uses), which is what "offline for the
 * things that matter" (CLAUDE.md) actually requires. It also means writes below don't need
 * to manually patch component state — the subscription picks up every optimistic local write.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db, getStorageClient } from '@/lib/firebase/client'
import { cpdEntrySchema, type CpdEntry, type CpdEntryInput } from './schemas'

export interface CpdEntryRecord extends CpdEntry {
  id: string
}

function entriesCollection(uid: string) {
  return collection(db, 'cpdEntries', uid, 'entries')
}

export function subscribeToOwnCpdEntries(
  uid: string,
  onChange: (entries: CpdEntryRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(entriesCollection(uid), orderBy('dateAttended', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const entries: CpdEntryRecord[] = []
      for (const d of snap.docs) {
        const parsed = cpdEntrySchema.safeParse(d.data())
        if (parsed.success) entries.push({ id: d.id, ...parsed.data })
      }
      onChange(entries)
    },
    (err) => onError?.(err)
  )
}

export async function addCpdEntry(uid: string, input: CpdEntryInput): Promise<string> {
  const ref = await addDoc(entriesCollection(uid), {
    ...input,
    source: 'self_reported' as const,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteCpdEntry(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'cpdEntries', uid, 'entries', id))
}

/**
 * One certificate per entry — see storage.rules' /cpd/{uid}/{file} path.
 * Both the Storage SDK and the storage client are loaded here, at the point
 * of upload, not at module load — see getStorageClient() in client.ts.
 */
export async function attachCpdCertificate(uid: string, id: string, file: File): Promise<void> {
  const [{ ref, uploadBytes, getDownloadURL }, storage] = await Promise.all([
    import('firebase/storage'),
    getStorageClient(),
  ])
  const fileRef = ref(storage, `cpd/${uid}/${id}`)
  await uploadBytes(fileRef, file)
  const url = await getDownloadURL(fileRef)
  await updateDoc(doc(db, 'cpdEntries', uid, 'entries', id), { certificateUrl: url })
}
