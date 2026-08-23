/**
 * markAttendance / unmarkAttendance — Function calls only, see
 * functions/src/registrations.ts for the actual logic and why this isn't a
 * direct client write. No inline httpsCallable in components — see
 * CLAUDE.md conventions.
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase/functions'

interface AttendanceInput {
  eventId: string
  uid: string
}

const callMarkAttendance = httpsCallable<AttendanceInput, { ok: true; cpdEntryCreated: boolean }>(
  functions,
  'markAttendance'
)

export async function markAttendance(input: AttendanceInput): Promise<{ cpdEntryCreated: boolean }> {
  const result = await callMarkAttendance(input)
  return { cpdEntryCreated: result.data.cpdEntryCreated }
}

const callUnmarkAttendance = httpsCallable<AttendanceInput, { ok: true }>(functions, 'unmarkAttendance')

export async function unmarkAttendance(input: AttendanceInput): Promise<void> {
  await callUnmarkAttendance(input)
}
