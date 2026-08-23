/**
 * Client-SDK access for a member's own event registration — /portal's
 * "Next event" card (register + check status). firestore.rules: a member
 * can create their own registration directly (verified() + own uid, not
 * privileged), but every attendance field is Function-only — see
 * lib/data/attendance.ts and functions/src/registrations.ts.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

function registrationId(eventId: string, uid: string): string {
  return `${eventId}_${uid}`
}

export async function getOwnRegistration(uid: string, eventId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'registrations', registrationId(eventId, uid)))
  return snap.exists()
}

export async function registerForEvent(uid: string, eventId: string): Promise<void> {
  await setDoc(doc(db, 'registrations', registrationId(eventId, uid)), {
    uid,
    eventId,
    attended: false,
  })
}
