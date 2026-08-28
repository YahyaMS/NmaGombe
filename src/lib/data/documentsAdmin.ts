/**
 * Server-only. Admin-SDK access to documents/ (metadata) and the
 * guidelines/{id}/{file} Storage path (the actual bytes) — the exec upload
 * path (POST /api/admin/documents), the exec delete path
 * (DELETE /api/admin/documents/[id]), and the member download path
 * (GET /portal/documents/[id]/download) all go through here. Neither
 * firestore.rules nor storage.rules grant any client access to either the
 * metadata write or the file itself — see docs/09-DECISIONS.md ADR-022 for
 * why the file is never served via a Storage getDownloadURL().
 *
 * NEVER import this from a Client Component.
 */

import 'server-only'
import { adminDb, adminStorage } from '@/lib/firebase/admin'
import {
  documentSchema,
  DOCUMENT_MAX_SIZE_BYTES,
  DOCUMENT_ALLOWED_CONTENT_TYPE,
  type DocumentCategory,
  type DocumentItem,
} from './schemas'

export interface AdminDocumentItem extends DocumentItem {
  id: string
  uploadedAt: string | null
}

export async function listDocumentsAdmin(): Promise<AdminDocumentItem[]> {
  const snap = await adminDb.collection('documents').orderBy('uploadedAt', 'desc').get()
  const items: AdminDocumentItem[] = []
  for (const d of snap.docs) {
    const data = d.data()
    const parsed = documentSchema.safeParse(data)
    if (!parsed.success) continue
    const uploadedAt = data.uploadedAt as FirebaseFirestore.Timestamp | undefined
    items.push({ id: d.id, ...parsed.data, uploadedAt: uploadedAt ? uploadedAt.toDate().toISOString() : null })
  }
  return items
}

/**
 * Validates size/type itself — never trusts the client's declared
 * Content-Type or File.size (CLAUDE.md rule 4: never trust a client-supplied
 * value; the same discipline that applies to money applies here). Writes
 * the file to Storage and the metadata doc in that order, so a doc is never
 * created pointing at a file that doesn't exist.
 */
export async function createDocumentAdmin(
  input: { title: string; category: DocumentCategory },
  file: { name: string; type: string; size: number; buffer: Buffer },
  uploadedBy: string
): Promise<string> {
  if (file.size > DOCUMENT_MAX_SIZE_BYTES) {
    throw new Error('File too large')
  }
  if (file.type !== DOCUMENT_ALLOWED_CONTENT_TYPE) {
    throw new Error('Only PDF files are accepted')
  }

  const docRef = adminDb.collection('documents').doc()
  const storagePath = `guidelines/${docRef.id}/${file.name}`

  await adminStorage.bucket().file(storagePath).save(file.buffer, {
    metadata: { contentType: file.type },
  })

  await docRef.set({
    title: input.title,
    category: input.category,
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type,
    storagePath,
    uploadedBy,
    uploadedAt: new Date(),
  })

  return docRef.id
}

export async function deleteDocumentAdmin(id: string): Promise<void> {
  const snap = await adminDb.collection('documents').doc(id).get()
  const data = snap.data()
  if (data?.storagePath) {
    await adminStorage.bucket().file(data.storagePath as string).delete({ ignoreNotFound: true })
  }
  await adminDb.collection('documents').doc(id).delete()
}

/** Own-record-only in spirit even though this collection isn't uid-scoped —
 * every caller of this file already re-checked verified() before reaching
 * here (CLAUDE.md rule 2). Returns null rather than throwing for "not
 * found," matching /portal/card/download's own pattern. */
export async function getDocumentFileAdmin(
  id: string
): Promise<{ buffer: Buffer; contentType: string; fileName: string } | null> {
  const snap = await adminDb.collection('documents').doc(id).get()
  const data = snap.data()
  if (!data) return null
  const parsed = documentSchema.safeParse(data)
  if (!parsed.success) return null

  const [buffer] = await adminStorage.bucket().file(parsed.data.storagePath).download()
  return { buffer, contentType: parsed.data.contentType, fileName: parsed.data.fileName }
}
