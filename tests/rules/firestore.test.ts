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
  collection,
  serverTimestamp,
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
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'welfareCases/case-001'), {
        status: 'open',
        requester: 'doc-005',
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
        publicListingConsent: true,
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

// ── Signup slice: emailLinkAttempts — pre-auth rate limit ─────────────────────

describe('emailLinkAttempts/{email}/days/{date}', () => {
  const path = 'emailLinkAttempts/doc-example.com/days/2026-08-19'

  test('unauthenticated can create the first attempt of the day', async () => {
    const db = anon().firestore()
    await assertSucceeds(
      setDoc(doc(db, path), { count: 1, lastAttemptAt: serverTimestamp() })
    )
  })

  test('cannot create with a count other than 1', async () => {
    const db = anon().firestore()
    await assertFails(
      setDoc(doc(db, path), { count: 2, lastAttemptAt: serverTimestamp() })
    )
  })

  test('can increment while under the daily cap', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), path), { count: 1, lastAttemptAt: serverTimestamp() })
    })
    const db = anon().firestore()
    await assertSucceeds(
      setDoc(doc(db, path), { count: 2, lastAttemptAt: serverTimestamp() })
    )
  })

  test('cannot exceed the daily cap', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), path), { count: 5, lastAttemptAt: serverTimestamp() })
    })
    const db = anon().firestore()
    await assertFails(
      setDoc(doc(db, path), { count: 6, lastAttemptAt: serverTimestamp() })
    )
  })

  test('nobody can read attempt counters, not even an admin', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), path), { count: 1, lastAttemptAt: serverTimestamp() })
    })
    const db = admin('admin-user').firestore()
    await assertFails(getDoc(doc(db, path)))
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
})

// ── Invariant 10: catch-all denies unknown paths ─────────────────────────────

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
