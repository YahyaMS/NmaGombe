/**
 * projectMember (directory-projection.ts) is the only code deciding what
 * leaves a member's private profile into directoryEntries (every verified
 * member) and publicDirectory (opted-in members only). Firestore rules can't
 * test this at all — the Admin SDK bypasses them entirely — so this is the
 * only real check standing between a member's hidden fields and a leak. See
 * docs/09-DECISIONS.md ADR-029.
 *
 * Runs against the Firestore emulator directly via the Admin SDK — no
 * Functions emulator needed, because projectMember is a plain function, not
 * the trigger itself. Start the emulator first: npm run emulators (from the
 * repo root). Run tests: npm test (from functions/).
 */

import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { projectMember } from '../src/directory-projection'

const PROJECT_ID = 'nma-gombe-test'

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'

let db: Firestore

beforeAll(() => {
  if (!getApps().length) initializeApp({ projectId: PROJECT_ID })
  db = getFirestore()
})

afterAll(async () => {
  // Admin SDK's gRPC connection otherwise keeps the process alive after the
  // suite finishes — this, not --forceExit, is the actual fix.
  await db.terminate()
})

async function cleanup(uid: string) {
  await Promise.all([
    db.doc(`directoryEntries/${uid}`).delete(),
    db.doc(`publicDirectory/${uid}`).delete(),
  ])
}

async function readBoth(uid: string) {
  const [directorySnap, publicSnap] = await Promise.all([
    db.doc(`directoryEntries/${uid}`).get(),
    db.doc(`publicDirectory/${uid}`).get(),
  ])
  return { directorySnap, publicSnap }
}

describe('projectMember', () => {
  test('not verified (pending): absent from both directoryEntries and publicDirectory', async () => {
    const uid = 'test-pending-001'
    await projectMember(db, uid, {
      status: 'pending',
      displayName: 'Dr. Pending',
      department: 'Cardiology',
      verificationToken: 'should-never-appear-anywhere',
    })

    const { directorySnap, publicSnap } = await readBoth(uid)
    expect(directorySnap.exists).toBe(false)
    expect(publicSnap.exists).toBe(false)
    await cleanup(uid)
  })

  test('verified, no consent, no contact visibility: directoryEntries gets exactly the base fields, publicDirectory stays absent', async () => {
    const uid = 'test-base-002'
    await projectMember(db, uid, {
      status: 'verified',
      displayName: 'Dr. Base',
      department: 'Paediatrics',
      grade: 'consultant',
      facility: 'FTH Gombe',
      verifiedAt: null,
      verificationToken: 'should-never-appear-anywhere',
      // no visibility, no publicListingConsent, no phone/whatsapp
    })

    const { directorySnap, publicSnap } = await readBoth(uid)
    expect(directorySnap.exists).toBe(true)
    const data = directorySnap.data()!
    expect(Object.keys(data).sort()).toEqual(
      ['department', 'displayName', 'facility', 'grade', 'searchTokens', 'verifiedAt'].sort()
    )
    expect(data).not.toHaveProperty('verificationToken')
    expect(data).not.toHaveProperty('phone')
    expect(data).not.toHaveProperty('whatsapp')
    expect(data).not.toHaveProperty('email')

    expect(publicSnap.exists).toBe(false)
    await cleanup(uid)
  })

  test('verified, consent granted, no contact visibility: publicDirectory gets exactly the public field set, no contact fields, no token', async () => {
    const uid = 'test-consent-003'
    await projectMember(db, uid, {
      status: 'verified',
      displayName: 'Dr. Public',
      department: 'Obstetrics',
      folioNumber: 'NMA/GM/0099',
      verificationToken: 'should-never-appear-anywhere',
      email: 'dr.public@example.com',
      publicListingConsent: { granted: true, at: '2026-01-01T00:00:00.000Z', noticeVersion: 'v1' },
    })

    const { publicSnap } = await readBoth(uid)
    expect(publicSnap.exists).toBe(true)
    const data = publicSnap.data()!
    expect(Object.keys(data).sort()).toEqual(
      ['department', 'displayName', 'folioNumber', 'searchTokens'].sort()
    )
    expect(data).not.toHaveProperty('verificationToken')
    expect(data).not.toHaveProperty('phone')
    expect(data).not.toHaveProperty('whatsapp')
    expect(data).not.toHaveProperty('email')
    await cleanup(uid)
  })

  test('verified, phone+whatsapp visibility on, no consent: directoryEntries carries contact fields, publicDirectory stays absent (contact visibility does not imply public listing)', async () => {
    const uid = 'test-visibility-004'
    await projectMember(db, uid, {
      status: 'verified',
      displayName: 'Dr. Visible',
      department: 'Surgery',
      phone: '+2348000000001',
      whatsapp: '+2348000000001',
      visibility: { phone: true, whatsapp: true },
      verificationToken: 'should-never-appear-anywhere',
      // no publicListingConsent
    })

    const { directorySnap, publicSnap } = await readBoth(uid)
    const data = directorySnap.data()!
    expect(data.phone).toBe('+2348000000001')
    expect(data.whatsapp).toBe('+2348000000001')
    expect(data).not.toHaveProperty('verificationToken')
    expect(publicSnap.exists).toBe(false)
    await cleanup(uid)
  })

  test('verified, phone+whatsapp visibility AND consent both on: publicDirectory still never carries phone, whatsapp, email, or verificationToken', async () => {
    const uid = 'test-critical-005'
    await projectMember(db, uid, {
      status: 'verified',
      displayName: 'Dr. Critical',
      department: 'Anaesthesia',
      folioNumber: 'NMA/GM/0100',
      phone: '+2348000000002',
      whatsapp: '+2348000000002',
      email: 'dr.critical@example.com',
      visibility: { phone: true, whatsapp: true },
      verificationToken: 'should-never-appear-anywhere',
      publicListingConsent: { granted: true, at: '2026-01-01T00:00:00.000Z', noticeVersion: 'v1' },
    })

    const { directorySnap, publicSnap } = await readBoth(uid)

    // directoryEntries (member-only) legitimately carries the contact fields —
    // this is the visibility opt-in working as intended.
    const directoryData = directorySnap.data()!
    expect(directoryData.phone).toBe('+2348000000002')
    expect(directoryData.whatsapp).toBe('+2348000000002')

    // publicDirectory (unauthenticated, indexable) must not, regardless of
    // visibility flags — this is the exact invariant the source comment
    // claims and the one a one-character regression would silently break.
    expect(publicSnap.exists).toBe(true)
    const publicData = publicSnap.data()!
    expect(publicData).not.toHaveProperty('phone')
    expect(publicData).not.toHaveProperty('whatsapp')
    expect(publicData).not.toHaveProperty('email')
    expect(publicData).not.toHaveProperty('verificationToken')
    expect(Object.keys(publicData).sort()).toEqual(
      ['department', 'displayName', 'folioNumber', 'searchTokens'].sort()
    )
    await cleanup(uid)
  })

  test('qualifiedYear and languages project unconditionally when present — same tier as grade/facility, no visibility flag needed', async () => {
    const uid = 'test-alwayson-007'
    await projectMember(db, uid, {
      status: 'verified',
      displayName: 'Dr. Senior',
      department: 'Internal Medicine',
      qualifiedYear: 2008,
      languages: 'English, Hausa, Fulfulde',
      // no visibility object at all, no publicListingConsent
    })

    const { directorySnap } = await readBoth(uid)
    const data = directorySnap.data()!
    expect(data.qualifiedYear).toBe(2008)
    expect(data.languages).toBe('English, Hausa, Fulfulde')
    await cleanup(uid)
  })

  test('photo/bio/achievements are absent from directoryEntries when their visibility flags are false, even though the underlying data exists', async () => {
    const uid = 'test-optin-off-008'
    await projectMember(db, uid, {
      status: 'verified',
      displayName: 'Dr. Private',
      department: 'Dermatology',
      hasPhoto: true,
      bio: 'A bio nobody should see yet.',
      achievements: ['An achievement nobody should see yet'],
      visibility: { photo: false, bio: false, achievements: false },
    })

    const { directorySnap } = await readBoth(uid)
    const data = directorySnap.data()!
    expect(data).not.toHaveProperty('hasPhoto')
    expect(data).not.toHaveProperty('bio')
    expect(data).not.toHaveProperty('achievements')
    await cleanup(uid)
  })

  test('photo/bio/achievements reach directoryEntries when their own visibility flag is on, even with no publicListingConsent', async () => {
    const uid = 'test-optin-member-009'
    await projectMember(db, uid, {
      status: 'verified',
      displayName: 'Dr. MemberVisible',
      department: 'Ophthalmology',
      hasPhoto: true,
      bio: 'Visible to colleagues only.',
      achievements: ['Visible to colleagues only'],
      visibility: { photo: true, bio: true, achievements: true },
      // no publicListingConsent
    })

    const { directorySnap, publicSnap } = await readBoth(uid)
    const data = directorySnap.data()!
    expect(data.hasPhoto).toBe(true)
    expect(data.bio).toBe('Visible to colleagues only.')
    expect(data.achievements).toEqual(['Visible to colleagues only'])
    expect(publicSnap.exists).toBe(false)
    await cleanup(uid)
  })

  // The feature's whole point: "let the member decide" is one flag, and when
  // that flag is on AND publicListingConsent is on, the SAME data the member
  // directory sees also reaches the public page — not a separate decision.
  test('photo/bio/achievements reach publicDirectory only when their visibility flag AND publicListingConsent are both true', async () => {
    const uid = 'test-optin-public-010'
    await projectMember(db, uid, {
      status: 'verified',
      displayName: 'Dr. PublicVisible',
      department: 'Cardiothoracic Surgery',
      folioNumber: 'NMA/GM/0110',
      hasPhoto: true,
      bio: 'Publicly visible bio.',
      achievements: ['Publicly visible achievement'],
      visibility: { photo: true, bio: true, achievements: true },
      publicListingConsent: { granted: true, at: '2026-01-01T00:00:00.000Z', noticeVersion: 'v1' },
    })

    const { publicSnap } = await readBoth(uid)
    expect(publicSnap.exists).toBe(true)
    const data = publicSnap.data()!
    expect(data.hasPhoto).toBe(true)
    expect(data.bio).toBe('Publicly visible bio.')
    expect(data.achievements).toEqual(['Publicly visible achievement'])
    await cleanup(uid)
  })

  test('achievements are capped at 10 and bio at 500 characters even if the source document somehow has more — defence in depth, not trusting firestore.rules alone', async () => {
    const uid = 'test-cap-011'
    await projectMember(db, uid, {
      status: 'verified',
      displayName: 'Dr. Capped',
      department: 'Family Medicine',
      hasPhoto: false,
      bio: 'x'.repeat(600),
      achievements: Array.from({ length: 15 }, (_, i) => `Achievement ${i}`),
      visibility: { bio: true, achievements: true },
    })

    const { directorySnap } = await readBoth(uid)
    const data = directorySnap.data()!
    expect((data.bio as string).length).toBe(500)
    expect((data.achievements as string[]).length).toBe(10)
    await cleanup(uid)
  })

  test('suspension removes the member from directoryEntries too, not only publicDirectory', async () => {
    const uid = 'test-suspend-006'
    await projectMember(db, uid, {
      status: 'verified',
      displayName: 'Dr. Suspended-Later',
      department: 'Radiology',
      folioNumber: 'NMA/GM/0101',
      publicListingConsent: { granted: true, at: '2026-01-01T00:00:00.000Z', noticeVersion: 'v1' },
    })
    let { directorySnap, publicSnap } = await readBoth(uid)
    expect(directorySnap.exists).toBe(true)
    expect(publicSnap.exists).toBe(true)

    await projectMember(db, uid, {
      status: 'suspended',
      displayName: 'Dr. Suspended-Later',
      department: 'Radiology',
    })
    ;({ directorySnap, publicSnap } = await readBoth(uid))
    expect(directorySnap.exists).toBe(false)
    expect(publicSnap.exists).toBe(false)
    await cleanup(uid)
  })
})
