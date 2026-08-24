/**
 * Scheduled cleanup for jobs/ — deletes listings expired more than 30 days.
 * NDPA data-minimisation: `contactVia` is a phone number, and there's no
 * reason to keep it once a listing is no longer even recently relevant
 * (docs/08-NDPA-COMPLIANCE.md). A listing already stops appearing on the
 * board the moment it expires — lib/data/jobs.ts's query only reads
 * `status == 'active'` and filters expired rows out client-side — this
 * Function is the actual data-deletion step, on a 30-day grace window
 * rather than the instant a listing lapses, so an expired-but-recent post
 * isn't gone before anyone notices it should have been reposted.
 */

import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const REGION = 'europe-west1'
const GRACE_DAYS = 30

export const cleanupExpiredJobs = onSchedule(
  { schedule: 'every day 03:00', region: REGION, timeZone: 'Africa/Lagos' },
  async () => {
    const db = getFirestore()
    const cutoff = Timestamp.fromMillis(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000)
    const snap = await db.collection('jobs').where('expiresAt', '<', cutoff).get()
    if (snap.empty) return

    // Chunked well under Firestore's 500-writes-per-batch limit — no chapter
    // jobs board will ever approach this in one day's sweep, but a silent
    // partial cleanup on the day it did would be a real bug, not a
    // hypothetical one.
    const docs = snap.docs
    for (let i = 0; i < docs.length; i += 400) {
      const batch = db.batch()
      for (const docSnap of docs.slice(i, i + 400)) batch.delete(docSnap.ref)
      await batch.commit()
    }
  }
)
