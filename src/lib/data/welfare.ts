/**
 * All client Firestore access to welfareCases/ goes through here — and per
 * firestore.rules' welfareCaseCreateValid(), this is the member's *entire*
 * write surface: create one fixed shape, never read, update or delete it
 * back, their own case included. See docs/03-DATA-MODEL.md.
 *
 * The exec side (/admin/welfare) does not use this file — it reads and
 * writes via the Admin SDK (lib/data/welfareAdmin.ts, server-only), matching
 * newsAdmin.ts/eventsAdmin.ts, not this collection's older member-facing
 * client-Firestore pattern.
 */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

/** No parameters beyond the caller's own uid — there is nothing else a
 * member is allowed to submit at creation. */
export async function openWelfareCase(uid: string): Promise<void> {
  await addDoc(collection(db, 'welfareCases'), {
    requester: uid,
    status: 'open' as const,
    createdAt: serverTimestamp(),
  })
}
