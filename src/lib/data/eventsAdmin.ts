/**
 * Server-only. Admin-SDK access to events/ for the exec admin side — listing
 * and publishing. Same conversion and reasoning as newsAdmin.ts.
 *
 * NEVER import this from a Client Component.
 */

import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { eventPublishInputSchema, eventSchema, type EventItem, type EventPublishInput } from './schemas'
import { slugify } from './slug'

export interface AdminEventItem extends EventItem {
  startAt: string | null
}

async function uniqueSlugAdmin(collectionPath: string, base: string, fallback: string): Promise<string> {
  let candidate = base || fallback
  let suffix = 2
  while ((await adminDb.collection(collectionPath).doc(candidate).get()).exists) {
    candidate = `${base || fallback}-${suffix}`
    suffix += 1
  }
  return candidate
}

/** Single-step create-and-publish — no separate draft workflow, matching news. */
export async function publishEventAdmin(input: EventPublishInput): Promise<string> {
  const parsed = eventPublishInputSchema.parse(input)
  const slug = await uniqueSlugAdmin('events', slugify(parsed.title), 'event')

  await adminDb
    .collection('events')
    .doc(slug)
    .set({
      title: parsed.title,
      slug,
      description: parsed.description,
      location: parsed.location,
      status: 'published',
      startAt: new Date(parsed.startAt),
      ...(parsed.cpdCreditUnits !== undefined ? { cpdCreditUnits: parsed.cpdCreditUnits } : {}),
    })

  return slug
}

/**
 * Edits an already-published event in place. Never touches `slug` or
 * `status` — the doc ID and existing registrations/attendance/cpdEntries
 * are all keyed to the slug, so changing it on an edit would orphan them.
 * `FieldValue.delete()` for a cleared cpdCreditUnits: unlike publishEventAdmin's
 * fresh `.set()`, this is an `.update()` on an existing doc, so simply
 * omitting the field would leave the old value in place rather than clear it.
 */
export async function updateEventAdmin(slug: string, input: EventPublishInput, editedBy: string): Promise<void> {
  const parsed = eventPublishInputSchema.parse(input)

  await adminDb
    .collection('events')
    .doc(slug)
    .update({
      title: parsed.title,
      description: parsed.description,
      location: parsed.location,
      startAt: new Date(parsed.startAt),
      cpdCreditUnits: parsed.cpdCreditUnits !== undefined ? parsed.cpdCreditUnits : FieldValue.delete(),
      lastEditedBy: editedBy,
      lastEditedAt: new Date().toISOString(),
    })
}

/** One event, for the admin attendance-marking page — regardless of status,
 * unlike lib/data/events.ts's public getPublishedEventBySlug. */
export async function getEventByIdAdmin(slug: string): Promise<AdminEventItem | null> {
  const doc = await adminDb.collection('events').doc(slug).get()
  if (!doc.exists) return null
  const data = doc.data()
  const parsed = eventSchema.safeParse(data)
  if (!parsed.success) return null
  const startAt = data?.startAt as FirebaseFirestore.Timestamp | undefined
  return { ...parsed.data, startAt: startAt ? startAt.toDate().toISOString() : null }
}

/**
 * The exec's own view, soonest first. Everything published through this file
 * is status:'published' immediately (no draft step in v1), but the query
 * itself isn't filtered by status, so it won't need a change if a draft
 * workflow is added later.
 */
export async function listAllEventsAdmin(): Promise<AdminEventItem[]> {
  const snap = await adminDb.collection('events').orderBy('startAt', 'asc').get()
  const items: AdminEventItem[] = []
  for (const d of snap.docs) {
    const data = d.data()
    const parsed = eventSchema.safeParse(data)
    if (!parsed.success) continue
    const startAt = data.startAt as FirebaseFirestore.Timestamp | undefined
    items.push({ ...parsed.data, startAt: startAt ? startAt.toDate().toISOString() : null })
  }
  return items
}
