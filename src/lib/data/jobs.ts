/**
 * All Firestore access to jobs/ goes through here. No inline getDocs/
 * onSnapshot/addDoc in components — see CLAUDE.md conventions.
 *
 * Query-side filtered (status == 'active'), not client-filtered like the
 * directory — this board doesn't need live keystroke search, and syncing
 * every historical expired listing to every client for no reason is the
 * wrong default. `status` flips to 'filled' explicitly but never
 * automatically to 'expired' — a listing whose expiry has just passed but
 * hasn't been swept yet by the scheduled cleanup Function (up to a 30-day
 * grace window, functions/src/jobs.ts) would otherwise still read as
 * active, so expiresAt is re-checked client-side per row too.
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
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { jobSchema, type JobItem, type JobPostInput } from './schemas'

export interface JobRow extends JobItem {
  id: string
  expiresAt: Timestamp
  createdAt: Timestamp | null
}

export function subscribeToActiveJobs(
  onChange: (jobs: JobRow[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const jobsQuery = query(
    collection(db, 'jobs'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(
    jobsQuery,
    (snap) => {
      const now = Timestamp.now()
      const jobs: JobRow[] = []
      for (const docSnap of snap.docs) {
        const data = docSnap.data()
        const parsed = jobSchema.safeParse(data)
        if (!parsed.success) continue
        const expiresAt = data.expiresAt as Timestamp | undefined
        if (!expiresAt || expiresAt.toMillis() <= now.toMillis()) continue // expired, not yet swept
        jobs.push({
          id: docSnap.id,
          ...parsed.data,
          expiresAt,
          createdAt: (data.createdAt as Timestamp | undefined) ?? null,
        })
      }
      onChange(jobs)
    },
    (err) => onError?.(err)
  )
}

export async function postJob(uid: string, input: JobPostInput): Promise<string> {
  const ref = await addDoc(collection(db, 'jobs'), {
    title: input.title,
    facility: input.facility,
    town: input.town,
    type: input.type,
    description: input.description,
    contactVia: input.contactVia,
    postedBy: uid,
    status: 'active' as const,
    expiresAt: Timestamp.fromDate(new Date(input.expiresAt)),
    createdAt: serverTimestamp(),
  })
  return ref.id
}

/** Owner-only under firestore.rules — marks a listing filled without
 * touching its expiry, so it simply stops matching the active-listings
 * query rather than being deleted outright. */
export async function markJobFilled(jobId: string): Promise<void> {
  await updateDoc(doc(db, 'jobs', jobId), { status: 'filled' })
}

/** Owner or exec/admin under firestore.rules — the poster removing their
 * own stale listing, or exec moderating one that shouldn't be here. */
export async function deleteJob(jobId: string): Promise<void> {
  await deleteDoc(doc(db, 'jobs', jobId))
}
