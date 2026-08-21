/**
 * All Firestore access to directoryEntries/ goes through here.
 * No inline getDocs/onSnapshot in components — see CLAUDE.md conventions.
 *
 * One subscription to the whole collection, not a query per keystroke —
 * `allow list: if verified()` already permits this, and it's the same
 * "filter a local list" shape docs/09-DECISIONS.md ADR-013 endorses for the
 * future public directory. searchTokens (lowercased name+department+
 * subspecialty+facility words) is computed server-side by the onMemberWrite
 * trigger, so search-by-name/specialty/facility is one filter, not three.
 */

import { collection, doc, getDoc, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { directoryEntrySchema, type DirectoryEntry } from './schemas'

export interface DirectoryRow extends DirectoryEntry {
  uid: string
}

export interface DirectorySnapshotInfo {
  rows: DirectoryRow[]
  /** True when this snapshot came from the local cache, not a live server read. */
  fromCache: boolean
}

/**
 * Live subscription to the full verified-member roster. Firestore serves this
 * from its persistent local cache when offline (see lib/firebase/client.ts),
 * so the callback still fires with `fromCache: true` if a prior sync exists.
 */
export function subscribeToDirectory(
  onChange: (info: DirectorySnapshotInfo) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const directoryQuery = query(collection(db, 'directoryEntries'), orderBy('displayName'))

  return onSnapshot(
    directoryQuery,
    { includeMetadataChanges: true },
    (snap) => {
      const rows: DirectoryRow[] = []
      for (const docSnap of snap.docs) {
        const parsed = directoryEntrySchema.safeParse(docSnap.data())
        if (parsed.success) rows.push({ uid: docSnap.id, ...parsed.data })
      }
      onChange({ rows, fromCache: snap.metadata.fromCache })
    },
    (err) => onError?.(err)
  )
}

/** /portal/directory/[uid] — the same visibility-filtered projection, one doc. */
export async function getDirectoryEntry(uid: string): Promise<DirectoryRow | null> {
  const snap = await getDoc(doc(db, 'directoryEntries', uid))
  if (!snap.exists()) return null
  const parsed = directoryEntrySchema.safeParse(snap.data())
  return parsed.success ? { uid: snap.id, ...parsed.data } : null
}
