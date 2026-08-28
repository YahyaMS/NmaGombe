/**
 * Client Firestore read access to documents/ (metadata only — title,
 * category, file size). firestore.rules grants verified() read, nothing
 * else: no client, member or exec, can write here. The file itself is never
 * fetched through this module — see lib/data/documentsAdmin.ts and
 * docs/09-DECISIONS.md ADR-022 for why it's a Bearer-token-authenticated
 * download instead of a Storage URL.
 */

import { collection, onSnapshot, orderBy, query, Timestamp, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { documentSchema, type DocumentItem } from './schemas'

export interface DocumentRow extends DocumentItem {
  id: string
  uploadedAt: Timestamp | null
}

export function subscribeToDocuments(
  onChange: (documents: DocumentRow[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const documentsQuery = query(collection(db, 'documents'), orderBy('uploadedAt', 'desc'))

  return onSnapshot(
    documentsQuery,
    (snap) => {
      const rows: DocumentRow[] = []
      for (const docSnap of snap.docs) {
        const data = docSnap.data()
        const parsed = documentSchema.safeParse(data)
        if (!parsed.success) continue
        rows.push({
          id: docSnap.id,
          ...parsed.data,
          uploadedAt: (data.uploadedAt as Timestamp | undefined) ?? null,
        })
      }
      onChange(rows)
    },
    (err) => onError?.(err)
  )
}
