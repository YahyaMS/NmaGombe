/**
 * Client-SDK read of the next upcoming event, for /portal's dashboard.
 * events/{id} is `allow get, list: if true` in firestore.rules — genuinely
 * public data — so this reads directly, unlike lib/data/events.ts which is
 * Admin-SDK/server-only for the public /events page (a Server Component
 * with no reason to ship the client SDK). /portal already ships it.
 */

import { collection, getDocs, limit, orderBy, query, Timestamp, where } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { eventSchema, type EventItem } from './schemas'

export interface UpcomingEvent extends EventItem {
  startAt: Timestamp
}

export async function getNextUpcomingEvent(): Promise<UpcomingEvent | null> {
  const q = query(
    collection(db, 'events'),
    where('status', '==', 'published'),
    where('startAt', '>', Timestamp.now()),
    orderBy('startAt', 'asc'),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null

  const data = snap.docs[0].data()
  const parsed = eventSchema.safeParse(data)
  if (!parsed.success || !(data.startAt instanceof Timestamp)) return null
  return { ...parsed.data, startAt: data.startAt }
}
