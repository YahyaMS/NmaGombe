/**
 * Client-SDK access to events/ for the admin (exec) side — creating and listing.
 * Public reads go through lib/data/events.ts (Admin SDK) instead — see that
 * file for why. firestore.rules gates writes to isExec(); this file doesn't
 * re-check that itself, the rules are the boundary (same as news, broadcasts).
 */

import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { eventPublishInputSchema, eventSchema, type EventItem, type EventPublishInput } from './schemas'
import { slugify, uniqueSlug } from './slug'

// See lib/data/events.ts's PublicEventItem comment — Timestamp isn't in the shared schema.
export interface AdminEventItem extends EventItem {
  startAt: Timestamp | null
}

/** Single-step create-and-publish — no separate draft workflow, matching news (docs/07-CONTENT-OPS.md). */
export async function publishEvent(input: EventPublishInput): Promise<string> {
  const parsed = eventPublishInputSchema.parse(input)
  const slug = await uniqueSlug('events', slugify(parsed.title), 'event')

  await setDoc(doc(db, 'events', slug), {
    title: parsed.title,
    slug,
    description: parsed.description,
    location: parsed.location,
    status: 'published',
    startAt: Timestamp.fromDate(new Date(parsed.startAt)),
  })

  return slug
}

/**
 * The exec's own view, soonest first. Everything published through this file
 * is status:'published' immediately (no draft step in v1 — see publishEvent),
 * but the query itself isn't filtered by status, so it won't need a change if
 * a draft workflow is added later.
 */
export async function listAllEvents(): Promise<AdminEventItem[]> {
  const snap = await getDocs(query(collection(db, 'events'), orderBy('startAt', 'asc')))
  const items: AdminEventItem[] = []
  for (const d of snap.docs) {
    const data = d.data()
    const parsed = eventSchema.safeParse(data)
    if (parsed.success) items.push({ ...parsed.data, startAt: (data.startAt as Timestamp) ?? null })
  }
  return items
}
