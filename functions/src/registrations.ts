/**
 * markAttendance / unmarkAttendance — the only writers of a registration's
 * attendance fields and of a "chapter_event"-sourced cpdEntries doc
 * (docs/03-DATA-MODEL.md, docs/09-DECISIONS.md). firestore.rules denies all
 * direct client writes to both — the caller's exec/admin role is re-checked
 * here regardless, since the Admin SDK bypasses rules entirely (CLAUDE.md
 * rule #2).
 *
 * Both run inside a Firestore transaction, not just a batch: the
 * idempotency check (read current `attended` state, act only if it's
 * changing) has to be part of the same atomic operation as the write, or
 * two execs marking the same registrant at once could both read "not yet
 * attended" before either commits. The cpdEntries doc ID is also
 * deterministic ({eventId}_{uid}, same reasoning as the registration's own
 * ID) — a second write just overwrites the same document rather than
 * duplicating credit, a second line of defence on top of the transaction.
 */

import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { z } from 'zod'

// Matches Firestore's region — see docs/09-DECISIONS.md ADR-008.
const REGION = 'europe-west1'

function requireExecCaller(request: CallableRequest): string {
  const role = request.auth?.token.role
  if (!request.auth || (role !== 'admin' && role !== 'exec')) {
    throw new HttpsError('permission-denied', 'Only an admin or exec can do this.')
  }
  return request.auth.uid
}

const inputSchema = z.object({
  eventId: z.string().min(1),
  uid: z.string().min(1),
})

// A calendar day, not an instant — same reasoning as cpdEntries.dateAttended
// itself (docs/03-DATA-MODEL.md): a Timestamp would import a timezone
// question with no correct answer.
function lagosDateString(ts: Timestamp): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(ts.toDate())
}

export const markAttendance = onCall({ region: REGION, enforceAppCheck: true }, async (request) => {
  const callerUid = requireExecCaller(request)

  const parsed = inputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'eventId and uid are required.')
  }
  const { eventId, uid } = parsed.data
  const registrationId = `${eventId}_${uid}`
  const cpdEntryId = registrationId

  const db = getFirestore()
  const result = await db.runTransaction(async (tx) => {
    const registrationRef = db.doc(`registrations/${registrationId}`)
    const registrationSnap = await tx.get(registrationRef)
    if (!registrationSnap.exists) {
      throw new HttpsError('not-found', 'That registration does not exist.')
    }

    // Idempotent: a second call (two execs marking the same list at once,
    // or a retried request) is a no-op, not a duplicate credit.
    if (registrationSnap.data()?.attended === true) {
      return { cpdEntryCreated: false }
    }

    const eventSnap = await tx.get(db.doc(`events/${eventId}`))
    if (!eventSnap.exists) {
      throw new HttpsError('not-found', 'That event no longer exists.')
    }
    const event = eventSnap.data()!
    const cpdCreditUnits = event.cpdCreditUnits as number | undefined
    const earnsCredit = typeof cpdCreditUnits === 'number' && cpdCreditUnits > 0

    tx.update(registrationRef, {
      attended: true,
      attendanceMarkedBy: callerUid,
      // A plain ISO string, not FieldValue.serverTimestamp() — registrationSchema/
      // cpdEntrySchema declare these audit fields as z.string(), and cpdEntrySchema
      // is actually parsed client-side (lib/data/cpd.ts's subscribeToOwnCpdEntries).
      // A native Timestamp there fails that safeParse for the whole entry, which is
      // exactly how a withdrawn entry went missing from /portal/cpd instead of
      // showing "Withdrawn" — this was already deployed and wrong. No transaction-
      // retry concern: unlike the serverTimestamp() sentinel, this just reads the
      // wall clock at whichever attempt actually commits, which is fine for an
      // audit field with no ordering requirement across concurrent transactions.
      attendanceMarkedAt: new Date().toISOString(),
      ...(earnsCredit ? { cpdEntryId } : {}),
    })

    if (earnsCredit) {
      const startAt = event.startAt as Timestamp | undefined
      // set(), not update() — a fresh, full replace. A re-mark after an
      // unmark (see unmarkAttendance) naturally clears withdrawnAt/
      // withdrawnBy this way, since they're simply not in the new doc.
      tx.set(db.doc(`cpdEntries/${uid}/entries/${cpdEntryId}`), {
        title: event.title as string,
        provider: 'NMA Gombe',
        creditUnits: cpdCreditUnits,
        dateAttended: startAt ? lagosDateString(startAt) : lagosDateString(Timestamp.now()),
        source: 'chapter_event' as const,
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    return { cpdEntryCreated: earnsCredit }
  })

  return { ok: true as const, ...result }
})

export const unmarkAttendance = onCall({ region: REGION, enforceAppCheck: true }, async (request) => {
  const callerUid = requireExecCaller(request)

  const parsed = inputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'eventId and uid are required.')
  }
  const { eventId, uid } = parsed.data
  const registrationId = `${eventId}_${uid}`

  const db = getFirestore()
  await db.runTransaction(async (tx) => {
    const registrationRef = db.doc(`registrations/${registrationId}`)
    const registrationSnap = await tx.get(registrationRef)
    if (!registrationSnap.exists) {
      throw new HttpsError('not-found', 'That registration does not exist.')
    }
    const registration = registrationSnap.data()!
    if (registration.attended !== true) {
      throw new HttpsError('failed-precondition', 'This registration is not currently marked attended.')
    }

    // attendanceMarkedBy/At are deliberately left untouched — the record
    // should show both that attendance was marked and that it was later
    // withdrawn, by whom, when. Not a reset to the pre-marked state.
    tx.update(registrationRef, {
      attended: false,
      attendanceUnmarkedBy: callerUid,
      attendanceUnmarkedAt: new Date().toISOString(), // see markAttendance's comment on attendanceMarkedAt
    })

    // Withdraw, never delete — a member may already have printed the CPD
    // summary for MDCN (docs/03-DATA-MODEL.md). update(), not set(): this
    // only adds withdrawnAt/withdrawnBy, it doesn't touch the rest of the
    // entry.
    const cpdEntryId = registration.cpdEntryId as string | undefined
    if (cpdEntryId) {
      tx.update(db.doc(`cpdEntries/${uid}/entries/${cpdEntryId}`), {
        withdrawnAt: new Date().toISOString(), // plain string — see markAttendance's comment
        withdrawnBy: callerUid,
      })
    }
  })

  return { ok: true as const }
})
