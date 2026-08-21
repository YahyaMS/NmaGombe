/**
 * Server-only. Backs the public /events and /events/[slug] pages — Admin SDK,
 * not the client SDK, matching the ADR-013 pattern (verify.ts): a public page
 * with no interaction doesn't need to ship the ~211KB Firestore client SDK.
 *
 * IMPORTANT: the Admin SDK bypasses firestore.rules entirely (CLAUDE.md rule 2).
 * The `status == 'published'` filter below is the ONLY thing keeping drafts
 * private on this path — same caveat as lib/data/news.ts.
 *
 * NEVER import this from a Client Component.
 */

import { adminDb } from '@/lib/firebase/admin'
import { eventSchema, type EventItem } from './schemas'

// Admin SDK and client SDK ship different Timestamp classes, so — same as
// news.ts's publishedAt — this stays out of the shared Zod schema and gets
// attached per-file instead. startAt is the event's own date/time, not when
// it was posted — a calendar orders by that, not by publish order.
export interface PublicEventItem extends EventItem {
  startAt: FirebaseFirestore.Timestamp | null
}

export async function listPublishedEvents(): Promise<PublicEventItem[]> {
  const snap = await adminDb
    .collection('events')
    .where('status', '==', 'published')
    .orderBy('startAt', 'asc')
    .get()

  const items: PublicEventItem[] = []
  for (const doc of snap.docs) {
    const data = doc.data()
    const parsed = eventSchema.safeParse(data)
    if (parsed.success) items.push({ ...parsed.data, startAt: (data.startAt as FirebaseFirestore.Timestamp) ?? null })
  }
  return items
}

export async function getPublishedEventBySlug(slug: string): Promise<PublicEventItem | null> {
  const doc = await adminDb.collection('events').doc(slug).get()
  if (!doc.exists) return null
  const data = doc.data()
  if (data?.status !== 'published') return null // draft — not for the public page
  const parsed = eventSchema.safeParse(data)
  if (!parsed.success) return null
  return { ...parsed.data, startAt: (data.startAt as FirebaseFirestore.Timestamp) ?? null }
}
