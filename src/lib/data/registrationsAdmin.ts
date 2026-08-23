/**
 * Server-only. Admin-SDK read backing /admin/events/[slug]/attendance's
 * registrant list. The mutation (markAttendance/unmarkAttendance) stays
 * client-side via httpsCallable — see lib/data/attendance.ts — for the
 * same reason verification/members/broadcast do: it's a Function-owned
 * write path, not duplicated into a Route Handler (docs/09-DECISIONS.md).
 *
 * NEVER import this from a Client Component.
 */

import 'server-only'
import { adminDb } from '@/lib/firebase/admin'

export interface RegistrantRow {
  uid: string
  eventId: string
  displayName: string
  folioNumber: string
  attended: boolean
  attendanceMarkedAt: string | null
  attendanceUnmarkedAt: string | null
  cpdEntryCredited: boolean
}

/** Registrants for one event, name-joined, alphabetical. */
export async function listRegistrantsAdmin(eventId: string): Promise<RegistrantRow[]> {
  const snap = await adminDb.collection('registrations').where('eventId', '==', eventId).get()

  const rows = await Promise.all(
    snap.docs.map(async (doc): Promise<RegistrantRow> => {
      const data = doc.data()
      const uid = data.uid as string
      const memberSnap = await adminDb.collection('members').doc(uid).get()
      const member = memberSnap.data()
      const markedAt = data.attendanceMarkedAt as FirebaseFirestore.Timestamp | undefined
      const unmarkedAt = data.attendanceUnmarkedAt as FirebaseFirestore.Timestamp | undefined
      return {
        uid,
        eventId,
        displayName: (member?.displayName as string | undefined) ?? '',
        folioNumber: (member?.folioNumber as string | undefined) ?? '',
        attended: data.attended === true,
        attendanceMarkedAt: markedAt ? markedAt.toDate().toISOString() : null,
        attendanceUnmarkedAt: unmarkedAt ? unmarkedAt.toDate().toISOString() : null,
        cpdEntryCredited: typeof data.cpdEntryId === 'string',
      }
    })
  )

  return rows.sort((a, b) => a.displayName.localeCompare(b.displayName))
}
