/**
 * Server-only. Backs the public /news and /news/[slug] pages — Admin SDK, not
 * the client SDK, matching the ADR-013 pattern (verify.ts): a public page with
 * no interaction doesn't need to ship the ~211KB Firestore client SDK.
 *
 * IMPORTANT: the Admin SDK bypasses firestore.rules entirely (CLAUDE.md rule 2).
 * The `status == 'published'` filter below is the ONLY thing keeping drafts
 * private on this path — rules enforce it for the client SDK (admin's own
 * list view, newsAdmin.ts), but not here. Don't remove it "because rules
 * already check this" — they don't, for this file.
 *
 * NEVER import this from a Client Component.
 */

import { adminDb } from '@/lib/firebase/admin'
import { newsSchema, type NewsCategory, type NewsItem } from './schemas'

// Admin SDK and client SDK ship different Timestamp classes, so — same as
// verification.ts's submittedAt/decidedAt — this stays out of the shared Zod
// schema and gets attached per-file instead.
export interface PublicNewsItem extends NewsItem {
  publishedAt: FirebaseFirestore.Timestamp | null
}

export async function listPublishedNews(category?: NewsCategory): Promise<PublicNewsItem[]> {
  let q = adminDb.collection('news').where('status', '==', 'published') as FirebaseFirestore.Query
  if (category) q = q.where('category', '==', category)
  q = q.orderBy('publishedAt', 'desc')

  const snap = await q.get()
  const items: PublicNewsItem[] = []
  for (const doc of snap.docs) {
    const data = doc.data()
    const parsed = newsSchema.safeParse(data)
    if (parsed.success) items.push({ ...parsed.data, publishedAt: (data.publishedAt as FirebaseFirestore.Timestamp) ?? null })
  }
  return items
}

export async function getPublishedNewsBySlug(slug: string): Promise<PublicNewsItem | null> {
  const doc = await adminDb.collection('news').doc(slug).get()
  if (!doc.exists) return null
  const data = doc.data()
  if (data?.status !== 'published') return null // draft — not for the public page
  const parsed = newsSchema.safeParse(data)
  if (!parsed.success) return null
  return { ...parsed.data, publishedAt: (data.publishedAt as FirebaseFirestore.Timestamp) ?? null }
}
