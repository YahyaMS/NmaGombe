/**
 * Firestore security rules test suite.
 *
 * Runs against the local Firestore emulator. Start it first:
 *   npm run emulators
 *
 * Run tests:
 *   npm run test:rules
 *
 * Every invariant from docs/03-DATA-MODEL.md has a corresponding denial test.
 * A test that only proves the happy path is worse than no test — false confidence.
 * See CLAUDE.md rule #1 and docs/10-TEST-PLAN.md §1.
 */

import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'

const PROJECT_ID = 'nma-gombe-test'
const RULES_PATH = resolve(__dirname, '../../firestore.rules')

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

afterEach(async () => {
  await testEnv.clearFirestore()
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function anon() {
  return testEnv.unauthenticatedContext()
}

function authed(uid: string) {
  return testEnv.authenticatedContext(uid, {
    // No custom claims — authenticated but not verified
  })
}

function verified(uid: string) {
  return testEnv.authenticatedContext(uid, { verified: true })
}

function exec(uid: string) {
  return testEnv.authenticatedContext(uid, { verified: true, role: 'exec' })
}

function admin(uid: string) {
  return testEnv.authenticatedContext(uid, { verified: true, role: 'admin' })
}

// ── Invariant 1: No client writes trust fields ────────────────────────────────

describe('members/{uid} — trust fields', () => {
  const uid = 'doc-001'

  beforeEach(async () => {
    // Seed a member doc via admin (bypasses rules)
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `members/${uid}`), {
        displayName: 'Dr. Aminu',
        status: 'verified',
        role: 'member',
        duesPaidThrough: '2025',
        folioNumber: 'NMA/GM/0001',
      })
    })
  })

  test('verified member cannot write status', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      updateDoc(doc(db, `members/${uid}`), { status: 'suspended' })
    )
  })

  test('verified member cannot write role', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      updateDoc(doc(db, `members/${uid}`), { role: 'admin' })
    )
  })

  test('verified member cannot write duesPaidThrough', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      updateDoc(doc(db, `members/${uid}`), { duesPaidThrough: '2030' })
    )
  })

  test('verified member cannot write verifiedAt', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      updateDoc(doc(db, `members/${uid}`), { verifiedAt: new Date().toISOString() })
    )
  })

  // Trust fields are Function-write-only even for an admin's own client session —
  // a raw admin write to `status` wouldn't set the actual `verified` custom claim
  // every other rule checks, silently desyncing the two. See docs/09-DECISIONS.md
  // and the admin/members feature-slice plan.
  test('admin cannot write status via direct client update', async () => {
    const db = admin('admin-user').firestore()
    await assertFails(
      updateDoc(doc(db, `members/${uid}`), { status: 'suspended' })
    )
  })

  test('admin cannot write role via direct client update', async () => {
    const db = admin('admin-user').firestore()
    await assertFails(
      updateDoc(doc(db, `members/${uid}`), { role: 'exec' })
    )
  })
})

// ── Invariant 2: directoryEntries readable only by verified ──────────────────

describe('directoryEntries/{uid}', () => {
  const entryUid = 'doc-002'

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `directoryEntries/${entryUid}`), {
        displayName: 'Dr. Halima Bello',
        specialty: 'Paediatrics',
      })
    })
  })

  test('unauthenticated cannot read directoryEntries', async () => {
    const db = anon().firestore()
    await assertFails(getDoc(doc(db, `directoryEntries/${entryUid}`)))
  })

  test('authenticated-but-unverified cannot read directoryEntries', async () => {
    const db = authed('other-user').firestore()
    await assertFails(getDoc(doc(db, `directoryEntries/${entryUid}`)))
  })

  test('verified member can read directoryEntries', async () => {
    const db = verified('verified-user').firestore()
    await assertSucceeds(getDoc(doc(db, `directoryEntries/${entryUid}`)))
  })

  test('no client can write to directoryEntries', async () => {
    const db = admin('admin-user').firestore()
    await assertFails(
      setDoc(doc(db, `directoryEntries/new-entry`), {
        displayName: 'Dr. New',
      })
    )
  })
})

// ── publicDirectory: no client access at all, either direction — ADR-013 ─────

describe('publicDirectory/{uid}', () => {
  const uid = 'doc-public-001'

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `publicDirectory/${uid}`), {
        displayName: 'Dr. Public Test',
        department: 'Cardiology',
      })
    })
  })

  test('unauthenticated cannot read publicDirectory', async () => {
    const db = anon().firestore()
    await assertFails(getDoc(doc(db, `publicDirectory/${uid}`)))
  })

  test('a verified member cannot read publicDirectory either', async () => {
    const db = verified('some-member').firestore()
    await assertFails(getDoc(doc(db, `publicDirectory/${uid}`)))
  })

  test('admin cannot read publicDirectory via the client SDK', async () => {
    const db = admin('admin-user').firestore()
    await assertFails(getDoc(doc(db, `publicDirectory/${uid}`)))
  })

  test('no client can write to publicDirectory', async () => {
    const db = admin('admin-user').firestore()
    await assertFails(
      setDoc(doc(db, `publicDirectory/new-entry`), { displayName: 'Dr. New' })
    )
  })
})

// ── Invariant 3: members/{uid} never readable by another member ──────────────

describe('members/{uid} — cross-member read', () => {
  const ownerUid = 'doc-003'
  const otherUid = 'doc-other'

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `members/${ownerUid}`), {
        displayName: 'Dr. Yusuf',
        status: 'verified',
        role: 'member',
        phone: '+2348001234567',
      })
    })
  })

  test('another verified member cannot read a member profile', async () => {
    const db = verified(otherUid).firestore()
    await assertFails(getDoc(doc(db, `members/${ownerUid}`)))
  })

  test('member can read their own profile', async () => {
    const db = verified(ownerUid).firestore()
    await assertSucceeds(getDoc(doc(db, `members/${ownerUid}`)))
  })

  test('unauthenticated cannot read any member profile', async () => {
    const db = anon().firestore()
    await assertFails(getDoc(doc(db, `members/${ownerUid}`)))
  })
})

// ── Invariant 4: payments/* — Function-only write ────────────────────────────

describe('payments/{ref}', () => {
  const ref = 'PSK_abc123'
  const ownerUid = 'doc-004'

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `payments/${ref}`), {
        uid: ownerUid,
        amountKobo: 5000000,
        year: '2025',
        status: 'success',
      })
    })
  })

  test('no client can write payments', async () => {
    const db = admin('admin-user').firestore()
    await assertFails(
      setDoc(doc(db, `payments/PSK_fake`), { uid: ownerUid, amountKobo: 1 })
    )
  })

  test('member can read their own payment', async () => {
    const db = verified(ownerUid).firestore()
    await assertSucceeds(getDoc(doc(db, `payments/${ref}`)))
  })

  test('different member cannot read another\'s payment', async () => {
    const db = verified('other-uid').firestore()
    await assertFails(getDoc(doc(db, `payments/${ref}`)))
  })
})

// ── Invariant 5: duesRates — no client writes ────────────────────────────────

describe('duesRates/{year}', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'duesRates/2025'), {
        member: 5000000,
        resident: 2500000,
      })
    })
  })

  test('signed-in member can read duesRates', async () => {
    const db = authed('any-user').firestore()
    await assertSucceeds(getDoc(doc(db, 'duesRates/2025')))
  })

  test('admin cannot write duesRates via client', async () => {
    const db = admin('admin-user').firestore()
    await assertFails(
      setDoc(doc(db, 'duesRates/2026'), { member: 6000000 })
    )
  })
})

// ── Invariant 6: welfareCases — exec-only ────────────────────────────────────

describe('welfareCases/{id}', () => {
  const requesterUid = 'doc-005'

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'welfareCases/case-001'), {
        status: 'open',
        requester: requesterUid,
      })
    })
  })

  test('non-exec verified member cannot read welfareCases', async () => {
    const db = verified('regular-member').firestore()
    await assertFails(getDoc(doc(db, 'welfareCases/case-001')))
  })

  test('exec can read welfareCases', async () => {
    const db = exec('exec-user').firestore()
    await assertSucceeds(getDoc(doc(db, 'welfareCases/case-001')))
  })

  test('unauthenticated cannot read welfareCases', async () => {
    const db = anon().firestore()
    await assertFails(getDoc(doc(db, 'welfareCases/case-001')))
  })

  test('the requester who opened a case cannot read it back', async () => {
    const db = verified(requesterUid).firestore()
    await assertFails(getDoc(doc(db, 'welfareCases/case-001')))
  })

  test('verified member can open their own case with the exact allowed shape', async () => {
    const db = verified(requesterUid).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'welfareCases/case-new'), {
        requester: requesterUid,
        status: 'open',
        createdAt: serverTimestamp(),
      })
    )
  })

  test('authenticated-but-unverified member cannot open a case', async () => {
    const db = authed(requesterUid).firestore()
    await assertFails(
      setDoc(doc(db, 'welfareCases/case-new'), {
        requester: requesterUid,
        status: 'open',
        createdAt: serverTimestamp(),
      })
    )
  })

  test('cannot open a case for another uid', async () => {
    const db = verified(requesterUid).firestore()
    await assertFails(
      setDoc(doc(db, 'welfareCases/case-new'), {
        requester: 'someone-else',
        status: 'open',
        createdAt: serverTimestamp(),
      })
    )
  })

  test('cannot open a case with a status other than "open"', async () => {
    const db = verified(requesterUid).firestore()
    await assertFails(
      setDoc(doc(db, 'welfareCases/case-new'), {
        requester: requesterUid,
        status: 'resolved',
        createdAt: serverTimestamp(),
      })
    )
  })

  test('cannot smuggle an amount in at create time', async () => {
    const db = verified(requesterUid).firestore()
    await assertFails(
      setDoc(doc(db, 'welfareCases/case-new'), {
        requester: requesterUid,
        status: 'open',
        createdAt: serverTimestamp(),
        amount: 5000000,
      })
    )
  })

  test('cannot backdate createdAt at create time — must be the server timestamp', async () => {
    const db = verified(requesterUid).firestore()
    await assertFails(
      setDoc(doc(db, 'welfareCases/case-new'), {
        requester: requesterUid,
        status: 'open',
        createdAt: daysFromNow(-1),
      })
    )
  })

  test('member cannot update their own case after creating it', async () => {
    const db = verified(requesterUid).firestore()
    await assertFails(updateDoc(doc(db, 'welfareCases/case-001'), { status: 'in_review' }))
  })

  test('member cannot delete their own case', async () => {
    const db = verified(requesterUid).firestore()
    await assertFails(deleteDoc(doc(db, 'welfareCases/case-001')))
  })

  test('exec can create a case directly with a full shape, including an amount', async () => {
    const db = exec('exec-user').firestore()
    await assertSucceeds(
      setDoc(doc(db, 'welfareCases/case-exec-opened'), {
        requester: requesterUid,
        status: 'in_review',
        amount: 5000000,
        createdAt: serverTimestamp(),
      })
    )
  })

  test('exec can update a case — record an amount and change status', async () => {
    const db = exec('exec-user').firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'welfareCases/case-001'), { status: 'resolved', amount: 5000000 })
    )
  })
})

// ── Invariant 7: folio number frozen after verification ──────────────────────

describe('members/{uid} — folio frozen after verification', () => {
  const uid = 'doc-006'

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `members/${uid}`), {
        displayName: 'Dr. Aisha',
        status: 'verified',
        role: 'member',
        folioNumber: 'NMA/GM/0006',
        duesPaidThrough: '2025',
      })
    })
  })

  test('verified member cannot change their folio number', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      updateDoc(doc(db, `members/${uid}`), {
        folioNumber: 'NMA/GM/FAKE',
      })
    )
  })
})

// ── /portal/profile: verified member can edit their own non-trust fields ─────

describe('members/{uid} — profile self-update', () => {
  const uid = 'doc-007'
  const otherUid = 'doc-007-other'

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `members/${uid}`), {
        displayName: 'Dr. Bello',
        status: 'verified',
        role: 'member',
        folioNumber: 'NMA/GM/0007',
        department: 'Paediatrics',
      })
    })
  })

  test('verified member can update grade, facility, visibility and consent', async () => {
    const db = verified(uid).firestore()
    await assertSucceeds(
      updateDoc(doc(db, `members/${uid}`), {
        grade: 'consultant',
        facility: 'Federal Teaching Hospital Gombe',
        subspecialty: 'Neonatology',
        town: 'Gombe',
        phone: '+2348001234567',
        whatsapp: '+2348001234567',
        visibility: { phone: true, whatsapp: false, email: false, facility: true },
        // A ConsentRecord, not a bare boolean (schemas.ts) — matches what
        // updateOwnProfile actually sends, not just what rules would allow.
        publicListingConsent: { granted: true, at: new Date().toISOString(), noticeVersion: '2026-08-25' },
      })
    )
  })

  test('a member cannot update another member\'s profile fields', async () => {
    const db = verified(otherUid).firestore()
    await assertFails(
      updateDoc(doc(db, `members/${uid}`), { grade: 'consultant' })
    )
  })

  test('a member cannot smuggle a trust-field change in with a legitimate profile edit', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      updateDoc(doc(db, `members/${uid}`), {
        facility: 'Federal Teaching Hospital Gombe',
        role: 'admin',
      })
    )
  })
})

// ── Signup slice: members/{uid} — create ─────────────────────────────────────

describe('members/{uid} — create on signup', () => {
  const uid = 'new-user-001'
  const email = 'doc@example.com'

  function signupPayload(overrides: Record<string, unknown> = {}) {
    return {
      displayName: 'Dr. Test',
      department: 'Paediatrics',
      folioNumber: 'NMA/GM/9999',
      email,
      status: 'pending',
      role: 'member',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    }
  }

  test('member can create their own pending profile', async () => {
    const db = testEnv.authenticatedContext(uid, { email }).firestore()
    await assertSucceeds(setDoc(doc(db, `members/${uid}`), signupPayload()))
  })

  test('cannot create with a status other than pending', async () => {
    const db = testEnv.authenticatedContext(uid, { email }).firestore()
    await assertFails(
      setDoc(doc(db, `members/${uid}`), signupPayload({ status: 'verified' }))
    )
  })

  test('cannot create with a role other than member', async () => {
    const db = testEnv.authenticatedContext(uid, { email }).firestore()
    await assertFails(
      setDoc(doc(db, `members/${uid}`), signupPayload({ role: 'admin' }))
    )
  })

  test('cannot create with duesPaidThrough set', async () => {
    const db = testEnv.authenticatedContext(uid, { email }).firestore()
    await assertFails(
      setDoc(doc(db, `members/${uid}`), signupPayload({ duesPaidThrough: 2026 }))
    )
  })

  test('cannot create with verifiedAt set', async () => {
    const db = testEnv.authenticatedContext(uid, { email }).firestore()
    await assertFails(
      setDoc(doc(db, `members/${uid}`), signupPayload({ verifiedAt: new Date().toISOString() }))
    )
  })

  test('cannot create with an email different from the signed-in identity', async () => {
    const db = testEnv.authenticatedContext(uid, { email }).firestore()
    await assertFails(
      setDoc(doc(db, `members/${uid}`), signupPayload({ email: 'someone-else@example.com' }))
    )
  })

  test('cannot create a profile for another uid', async () => {
    const db = testEnv.authenticatedContext(uid, { email }).firestore()
    await assertFails(
      setDoc(doc(db, `members/other-uid`), signupPayload())
    )
  })

  test('unauthenticated cannot create a member profile', async () => {
    const db = anon().firestore()
    await assertFails(setDoc(doc(db, `members/${uid}`), signupPayload()))
  })
})

// ── Signup slice: verificationRequests/{id} — create ─────────────────────────

describe('verificationRequests/{id} — create', () => {
  const uid = 'req-user-001'

  test('member can create their own verification request', async () => {
    const db = testEnv.authenticatedContext(uid, { email: 'a@example.com' }).firestore()
    await assertSucceeds(
      setDoc(doc(collection(db, 'verificationRequests')), {
        uid,
        folioNumber: 'NMA/GM/1234',
        submittedAt: new Date().toISOString(),
      })
    )
  })

  test('cannot create a verification request for another uid', async () => {
    const db = testEnv.authenticatedContext(uid, { email: 'a@example.com' }).firestore()
    await assertFails(
      setDoc(doc(collection(db, 'verificationRequests')), {
        uid: 'someone-else',
        folioNumber: 'NMA/GM/1234',
        submittedAt: new Date().toISOString(),
      })
    )
  })

  test('unauthenticated cannot create a verification request', async () => {
    const db = anon().firestore()
    await assertFails(
      setDoc(doc(collection(db, 'verificationRequests')), {
        uid: 'anyone',
        folioNumber: 'NMA/GM/1234',
        submittedAt: new Date().toISOString(),
      })
    )
  })

  test('member cannot read another member\'s verification request', async () => {
    const reqId = 'req-001'
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `verificationRequests/${reqId}`), {
        uid,
        folioNumber: 'NMA/GM/1234',
        submittedAt: new Date().toISOString(),
      })
    })
    const db = testEnv.authenticatedContext('someone-else', { email: 'b@example.com' }).firestore()
    await assertFails(getDoc(doc(db, `verificationRequests/${reqId}`)))
  })
})

// ── emailLinkAttempts — removed with email-link sign-in (ADR-026) ────────────

/**
 * The collection and its rules block are gone. A deleted rule is still a
 * behaviour change, and an untested one is just a hole nobody has looked in —
 * these assert the catch-all now denies what the old block used to allow,
 * including the unauthenticated create that was its whole purpose.
 */
describe('emailLinkAttempts/{email}/days/{date} — no longer a special case', () => {
  const path = 'emailLinkAttempts/doc-example.com/days/2026-08-29'

  test('unauthenticated can no longer create an attempt counter', async () => {
    await assertFails(
      setDoc(doc(anon().firestore(), path), { count: 1, lastAttemptAt: serverTimestamp() })
    )
  })

  test('a signed-in member cannot create one either', async () => {
    await assertFails(
      setDoc(doc(verified('member-user').firestore(), path), {
        count: 1,
        lastAttemptAt: serverTimestamp(),
      })
    )
  })

  test('an admin can neither read nor write the old path', async () => {
    const db = admin('admin-user').firestore()
    await assertFails(getDoc(doc(db, path)))
    await assertFails(setDoc(doc(db, path), { count: 1, lastAttemptAt: serverTimestamp() }))
  })
})

// ── Invariant 8: broadcasts — no client writes ───────────────────────────────

describe('broadcasts/{id}', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'broadcasts/b-001'), {
        message: 'Test broadcast',
        sentBy: 'exec-user',
        sentAt: new Date().toISOString(),
      })
    })
  })

  test('exec can read broadcasts', async () => {
    const db = exec('exec-user').firestore()
    await assertSucceeds(getDoc(doc(db, 'broadcasts/b-001')))
  })

  test('no client can write broadcasts', async () => {
    const db = exec('exec-user').firestore()
    await assertFails(
      setDoc(doc(db, 'broadcasts/b-new'), { message: 'Injected broadcast' })
    )
  })
})

// ── Invariant 9: events are public-readable ──────────────────────────────────

describe('events/{id}', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'events/cme-2025'), {
        title: 'Annual CME 2025',
        status: 'published',
      })
    })
  })

  test('unauthenticated can read events', async () => {
    const db = anon().firestore()
    await assertSucceeds(getDoc(doc(db, 'events/cme-2025')))
  })

  test('non-exec cannot write events', async () => {
    const db = verified('regular-member').firestore()
    await assertFails(
      updateDoc(doc(db, 'events/cme-2025'), { title: 'Tampered' })
    )
  })

  test('exec can set a valid cpdCreditUnits', async () => {
    const db = exec('exec-user').firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'events/cme-2025'), { cpdCreditUnits: 5 })
    )
  })

  test('exec cannot set cpdCreditUnits above the sanity bound', async () => {
    const db = exec('exec-user').firestore()
    await assertFails(
      updateDoc(doc(db, 'events/cme-2025'), { cpdCreditUnits: 500 })
    )
  })

  test('exec cannot set cpdCreditUnits to zero', async () => {
    const db = exec('exec-user').firestore()
    await assertFails(
      updateDoc(doc(db, 'events/cme-2025'), { cpdCreditUnits: 0 })
    )
  })
})

// ── Invariant 9c: registrations — self-create only, attendance is Function-only ──────

describe('registrations/{eventId}_{uid}', () => {
  const uid = 'reg-member-001'
  const otherUid = 'reg-member-002'
  const eventId = 'cme-2025'
  const regId = `${eventId}_${uid}`

  test('verified member can register themselves', async () => {
    const db = verified(uid).firestore()
    await assertSucceeds(
      setDoc(doc(db, `registrations/${regId}`), { uid, eventId, attended: false })
    )
  })

  test('unverified (authenticated only) member cannot register', async () => {
    const db = authed(uid).firestore()
    await assertFails(
      setDoc(doc(db, `registrations/${regId}`), { uid, eventId, attended: false })
    )
  })

  test('cannot register another uid', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      setDoc(doc(db, `registrations/${eventId}_${otherUid}`), { uid: otherUid, eventId, attended: false })
    )
  })

  test('cannot register with attended: true from the client', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      setDoc(doc(db, `registrations/${regId}`), { uid, eventId, attended: true })
    )
  })

  test('cannot smuggle an attendance field in at create time', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      setDoc(doc(db, `registrations/${regId}`), {
        uid,
        eventId,
        attended: false,
        attendanceMarkedBy: uid,
      })
    )
  })

  describe('after a registration exists', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), `registrations/${regId}`), { uid, eventId, attended: false })
      })
    })

    test('owner cannot update it directly — attendance is Function-only, not a trust-field carve-out', async () => {
      const db = verified(uid).firestore()
      await assertFails(
        updateDoc(doc(db, `registrations/${regId}`), { attended: true })
      )
    })

    test('exec cannot update it directly either', async () => {
      const db = exec('exec-user').firestore()
      await assertFails(
        updateDoc(doc(db, `registrations/${regId}`), { attended: true })
      )
    })

    test('owner can read their own registration', async () => {
      const db = verified(uid).firestore()
      await assertSucceeds(getDoc(doc(db, `registrations/${regId}`)))
    })

    test('another member cannot read someone else\'s registration', async () => {
      const db = verified(otherUid).firestore()
      await assertFails(getDoc(doc(db, `registrations/${regId}`)))
    })

    test('exec can delete (cancel) a registration', async () => {
      const db = exec('exec-user').firestore()
      await assertSucceeds(deleteDoc(doc(db, `registrations/${regId}`)))
    })

    test('the registrant cannot delete their own registration', async () => {
      const db = verified(uid).firestore()
      await assertFails(deleteDoc(doc(db, `registrations/${regId}`)))
    })
  })
})

// ── Invariant 9b: cpdEntries — self-reported only, verified-gated, no cross-member read ──

describe('cpdEntries/{uid}/entries/{id}', () => {
  const uid = 'cpd-member-001'
  const otherUid = 'cpd-member-002'

  function validEntry(overrides: Record<string, unknown> = {}) {
    return {
      title: 'Annual Paediatrics Update',
      provider: 'NPA Gombe Branch',
      creditUnits: 5,
      dateAttended: '2026-03-14',
      source: 'self_reported',
      createdAt: serverTimestamp(),
      ...overrides,
    }
  }

  test('unverified (authenticated only) member cannot create an entry', async () => {
    const db = authed(uid).firestore()
    await assertFails(
      setDoc(doc(db, `cpdEntries/${uid}/entries/e1`), validEntry())
    )
  })

  test('verified member can create a valid self-reported entry', async () => {
    const db = verified(uid).firestore()
    await assertSucceeds(
      setDoc(doc(db, `cpdEntries/${uid}/entries/e1`), validEntry())
    )
  })

  test('cannot create with source other than self_reported', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      setDoc(doc(db, `cpdEntries/${uid}/entries/e1`), validEntry({ source: 'chapter_event' }))
    )
  })

  test('cannot create for another uid', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      setDoc(doc(db, `cpdEntries/${otherUid}/entries/e1`), validEntry())
    )
  })

  test('cannot create with dateAttended in the wrong format', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      setDoc(doc(db, `cpdEntries/${uid}/entries/e1`), validEntry({ dateAttended: '14-03-2026' }))
    )
  })

  test('cannot create with creditUnits above the sanity bound', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      setDoc(doc(db, `cpdEntries/${uid}/entries/e1`), validEntry({ creditUnits: 9999 }))
    )
  })

  test('cannot create with zero or negative creditUnits', async () => {
    const db = verified(uid).firestore()
    await assertFails(
      setDoc(doc(db, `cpdEntries/${uid}/entries/e1`), validEntry({ creditUnits: 0 }))
    )
  })

  describe('after an entry exists', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), `cpdEntries/${uid}/entries/e1`), validEntry())
      })
    })

    test('owner can update a field like title', async () => {
      const db = verified(uid).firestore()
      await assertSucceeds(
        updateDoc(doc(db, `cpdEntries/${uid}/entries/e1`), { title: 'Corrected title' })
      )
    })

    test('owner can attach a certificate after creation', async () => {
      const db = verified(uid).firestore()
      await assertSucceeds(
        updateDoc(doc(db, `cpdEntries/${uid}/entries/e1`), {
          certificateUrl: 'https://firebasestorage.googleapis.com/cpd/x/e1',
        })
      )
    })

    test('source cannot be changed after creation', async () => {
      const db = verified(uid).firestore()
      await assertFails(
        updateDoc(doc(db, `cpdEntries/${uid}/entries/e1`), { source: 'chapter_event' })
      )
    })

    test('owner can delete their own entry', async () => {
      const db = verified(uid).firestore()
      await assertSucceeds(deleteDoc(doc(db, `cpdEntries/${uid}/entries/e1`)))
    })

    test('another verified member cannot read this entry', async () => {
      const db = verified(otherUid).firestore()
      await assertFails(getDoc(doc(db, `cpdEntries/${uid}/entries/e1`)))
    })

    test('another verified member cannot delete this entry', async () => {
      const db = verified(otherUid).firestore()
      await assertFails(deleteDoc(doc(db, `cpdEntries/${uid}/entries/e1`)))
    })

    test('admin can read a specific member\'s entry by known uid', async () => {
      const db = admin('admin-user').firestore()
      await assertSucceeds(getDoc(doc(db, `cpdEntries/${uid}/entries/e1`)))
    })
  })

  describe('a chapter_event entry (written by markAttendance via the Admin SDK)', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(
          doc(ctx.firestore(), `cpdEntries/${uid}/entries/evt1_${uid}`),
          validEntry({ source: 'chapter_event' })
        )
      })
    })

    test('owner cannot update it — not even a harmless field like title', async () => {
      const db = verified(uid).firestore()
      await assertFails(
        updateDoc(doc(db, `cpdEntries/${uid}/entries/evt1_${uid}`), { title: 'Edited' })
      )
    })

    test('owner cannot delete it', async () => {
      const db = verified(uid).firestore()
      await assertFails(deleteDoc(doc(db, `cpdEntries/${uid}/entries/evt1_${uid}`)))
    })

    test('owner can still read it', async () => {
      const db = verified(uid).firestore()
      await assertSucceeds(getDoc(doc(db, `cpdEntries/${uid}/entries/evt1_${uid}`)))
    })
  })
})

// ── Invariant 10: news is published-or-exec readable, exec-only writable ─────

describe('news/{slug}', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'news/published-item'), {
        title: 'Published communiqué',
        status: 'published',
      })
      await setDoc(doc(ctx.firestore(), 'news/draft-item'), {
        title: 'Draft communiqué',
        status: 'draft',
      })
    })
  })

  test('unauthenticated can read a published item', async () => {
    const db = anon().firestore()
    await assertSucceeds(getDoc(doc(db, 'news/published-item')))
  })

  test('unauthenticated cannot read a draft', async () => {
    const db = anon().firestore()
    await assertFails(getDoc(doc(db, 'news/draft-item')))
  })

  test('verified non-exec member cannot read a draft', async () => {
    const db = verified('regular-member').firestore()
    await assertFails(getDoc(doc(db, 'news/draft-item')))
  })

  test('exec can read a draft', async () => {
    const db = exec('exec-user').firestore()
    await assertSucceeds(getDoc(doc(db, 'news/draft-item')))
  })

  test('non-exec cannot write news', async () => {
    const db = verified('regular-member').firestore()
    await assertFails(
      updateDoc(doc(db, 'news/published-item'), { title: 'Tampered' })
    )
  })

  test('exec can write news', async () => {
    const db = exec('exec-user').firestore()
    await assertSucceeds(
      setDoc(doc(db, 'news/new-item'), { title: 'New', status: 'published' })
    )
  })
})

// ── Invariant 10a: documents (clinical guidelines/forms/circulars) — member-only read, no client write at all ──

describe('documents/{id}', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'documents/doc-001'), {
        title: 'Malaria treatment protocol',
        category: 'guideline',
      })
    })
  })

  test('unauthenticated cannot read', async () => {
    const db = anon().firestore()
    await assertFails(getDoc(doc(db, 'documents/doc-001')))
  })

  test('authenticated-but-unverified cannot read', async () => {
    const db = authed('someone').firestore()
    await assertFails(getDoc(doc(db, 'documents/doc-001')))
  })

  test('verified member can read', async () => {
    const db = verified('regular-member').firestore()
    await assertSucceeds(getDoc(doc(db, 'documents/doc-001')))
  })

  test('no client can write, not even exec — Admin SDK only', async () => {
    const db = exec('exec-user').firestore()
    await assertFails(
      setDoc(doc(db, 'documents/doc-002'), { title: 'New', category: 'form' })
    )
  })

  test('no client can update, not even admin', async () => {
    const db = admin('admin-user').firestore()
    await assertFails(updateDoc(doc(db, 'documents/doc-001'), { title: 'Tampered' }))
  })

  test('no client can delete, not even exec', async () => {
    const db = exec('exec-user').firestore()
    await assertFails(deleteDoc(doc(db, 'documents/doc-001')))
  })
})

// ── Invariant 11: registerEntries — Admin SDK only, no client access at all ──

describe('registerEntries/{id}', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'registerEntries/entry-001'), { name: 'Dr Test Person' })
    })
  })

  test('unauthenticated cannot read', async () => {
    const db = anon().firestore()
    await assertFails(getDoc(doc(db, 'registerEntries/entry-001')))
  })

  test('verified member cannot read', async () => {
    const db = verified('regular-member').firestore()
    await assertFails(getDoc(doc(db, 'registerEntries/entry-001')))
  })

  test('exec cannot read', async () => {
    const db = exec('exec-user').firestore()
    await assertFails(getDoc(doc(db, 'registerEntries/entry-001')))
  })

  test('admin cannot read', async () => {
    const db = admin('admin-user').firestore()
    await assertFails(getDoc(doc(db, 'registerEntries/entry-001')))
  })

  test('no client can write, not even admin', async () => {
    const db = admin('admin-user').firestore()
    await assertFails(setDoc(doc(db, 'registerEntries/entry-002'), { name: 'New Name' }))
  })
})

// ── Invariant 10b: jobs — member-posted, compulsory expiry, moderation is delete-only ──

function daysFromNow(days: number): Timestamp {
  return Timestamp.fromDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000))
}

function validJob(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Locum needed — weekend cover',
    facility: 'General Hospital Gombe',
    town: 'Gombe',
    type: 'locum',
    description: 'Weekend locum cover needed for the medical ward.',
    contactVia: '08031234567',
    postedBy: 'job-poster-001',
    expiresAt: daysFromNow(14),
    status: 'active',
    createdAt: serverTimestamp(),
    ...overrides,
  }
}

describe('jobs/{id}', () => {
  const posterUid = 'job-poster-001'
  const otherUid = 'job-other-001'

  test('unverified (authenticated only) member cannot create a listing', async () => {
    const db = authed(posterUid).firestore()
    await assertFails(setDoc(doc(db, 'jobs/job-1'), validJob()))
  })

  test('verified member can create a valid listing', async () => {
    const db = verified(posterUid).firestore()
    await assertSucceeds(setDoc(doc(db, 'jobs/job-1'), validJob()))
  })

  test('cannot create for another uid', async () => {
    const db = verified(posterUid).firestore()
    await assertFails(setDoc(doc(db, 'jobs/job-1'), validJob({ postedBy: otherUid })))
  })

  test('cannot create with an expiry in the past', async () => {
    const db = verified(posterUid).firestore()
    await assertFails(setDoc(doc(db, 'jobs/job-1'), validJob({ expiresAt: daysFromNow(-1) })))
  })

  test('cannot create with an expiry beyond the 60-day hard cap', async () => {
    const db = verified(posterUid).firestore()
    await assertFails(setDoc(doc(db, 'jobs/job-1'), validJob({ expiresAt: daysFromNow(61) })))
  })

  test('cannot create with an invalid type', async () => {
    const db = verified(posterUid).firestore()
    await assertFails(setDoc(doc(db, 'jobs/job-1'), validJob({ type: 'consultant' })))
  })

  test('cannot smuggle an extra field in at create time', async () => {
    const db = verified(posterUid).firestore()
    await assertFails(setDoc(doc(db, 'jobs/job-1'), { ...validJob(), boosted: true }))
  })

  test('cannot backdate createdAt at create time — must be the server timestamp', async () => {
    const db = verified(posterUid).firestore()
    await assertFails(setDoc(doc(db, 'jobs/job-1'), validJob({ createdAt: daysFromNow(-30) })))
  })

  describe('after a listing exists', () => {
    const jobId = 'job-existing'

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), `jobs/${jobId}`), validJob())
      })
    })

    test('owner can edit content fields', async () => {
      const db = verified(posterUid).firestore()
      await assertSucceeds(
        updateDoc(doc(db, `jobs/${jobId}`), { description: 'Updated description.' })
      )
    })

    test('owner can mark their listing filled', async () => {
      const db = verified(posterUid).firestore()
      await assertSucceeds(updateDoc(doc(db, `jobs/${jobId}`), { status: 'filled' }))
    })

    test('owner cannot extend expiresAt via update — reposting is the honest way to renew', async () => {
      const db = verified(posterUid).firestore()
      await assertFails(updateDoc(doc(db, `jobs/${jobId}`), { expiresAt: daysFromNow(59) }))
    })

    test('owner cannot reassign postedBy via update', async () => {
      const db = verified(posterUid).firestore()
      await assertFails(updateDoc(doc(db, `jobs/${jobId}`), { postedBy: otherUid }))
    })

    test('owner cannot backdate createdAt via update — it would bump the listing on a newest-first list', async () => {
      const db = verified(posterUid).firestore()
      await assertFails(updateDoc(doc(db, `jobs/${jobId}`), { createdAt: daysFromNow(0) }))
    })

    test('another verified member cannot update someone else\'s listing', async () => {
      const db = verified(otherUid).firestore()
      await assertFails(updateDoc(doc(db, `jobs/${jobId}`), { description: 'Hijacked.' }))
    })

    test('exec cannot update someone else\'s listing — moderation here is delete-only', async () => {
      const db = exec('exec-user').firestore()
      await assertFails(updateDoc(doc(db, `jobs/${jobId}`), { description: 'Exec edit.' }))
    })

    test('owner can delete their own listing', async () => {
      const db = verified(posterUid).firestore()
      await assertSucceeds(deleteDoc(doc(db, `jobs/${jobId}`)))
    })

    test('another verified member cannot delete someone else\'s listing', async () => {
      const db = verified(otherUid).firestore()
      await assertFails(deleteDoc(doc(db, `jobs/${jobId}`)))
    })

    test('exec can delete a listing that should not be on the platform', async () => {
      const db = exec('exec-user').firestore()
      await assertSucceeds(deleteDoc(doc(db, `jobs/${jobId}`)))
    })
  })
})

// ── Invariant 11: catch-all denies unknown paths ─────────────────────────────

describe('catch-all denial', () => {
  test('unauthenticated cannot read an arbitrary unknown collection', async () => {
    const db = anon().firestore()
    await assertFails(getDoc(doc(db, 'unknownCollection/someDoc')))
  })

  test('admin cannot write an arbitrary unknown path via client', async () => {
    const db = admin('admin-user').firestore()
    await assertFails(
      setDoc(doc(db, 'unknownCollection/someDoc'), { data: true })
    )
  })
})
