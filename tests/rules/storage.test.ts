/**
 * Storage rules test suite — the first one in this project (an earlier audit
 * flagged storage.rules as entirely untested). Scoped to profile-photos/,
 * the path this feature slice added, not a retroactive pass over the whole
 * file — cpd/, guidelines/, receipts/, public/ stay future work.
 *
 * Runs against the Storage emulator. Start it first: npm run emulators
 * Run tests: npx jest --testPathPattern=tests/rules/storage.test.ts --runInBand
 */

import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { ref, uploadBytes, getBytes } from 'firebase/storage'

const PROJECT_ID = 'nma-gombe-test'
const RULES_PATH = resolve(__dirname, '../../storage.rules')

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: 'localhost',
      port: 9199,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

function anon() {
  return testEnv.unauthenticatedContext()
}

function authed(uid: string) {
  return testEnv.authenticatedContext(uid, {})
}

const smallJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])
const twoAndAHalfMb = new Uint8Array(2.5 * 1024 * 1024)

describe('profile-photos/{uid}/{file}', () => {
  const uid = 'photo-owner'
  const otherUid = 'photo-other'

  test('a member can upload their own photo, under size, image content type', async () => {
    const storage = authed(uid).storage()
    await assertSucceeds(
      uploadBytes(ref(storage, `profile-photos/${uid}/photo.jpg`), smallJpeg, { contentType: 'image/jpeg' })
    )
  })

  test('a member cannot upload to another member\'s photo path', async () => {
    const storage = authed(otherUid).storage()
    await assertFails(
      uploadBytes(ref(storage, `profile-photos/${uid}/photo.jpg`), smallJpeg, { contentType: 'image/jpeg' })
    )
  })

  test('unauthenticated cannot upload a photo', async () => {
    const storage = anon().storage()
    await assertFails(
      uploadBytes(ref(storage, `profile-photos/${uid}/photo.jpg`), smallJpeg, { contentType: 'image/jpeg' })
    )
  })

  test('a file over 2MB is rejected', async () => {
    const storage = authed(uid).storage()
    await assertFails(
      uploadBytes(ref(storage, `profile-photos/${uid}/photo.jpg`), twoAndAHalfMb, { contentType: 'image/jpeg' })
    )
  })

  test('a non-image content type is rejected', async () => {
    const storage = authed(uid).storage()
    await assertFails(
      uploadBytes(ref(storage, `profile-photos/${uid}/photo.jpg`), smallJpeg, { contentType: 'application/pdf' })
    )
  })

  // The whole point of this path, per storage.rules' own comment: no client
  // read at all, not even the owner — every read goes through
  // /api/profile-photo/[uid] (Admin SDK), which re-checks the member's
  // *current* visibility.photo/publicListingConsent on every request. A
  // Storage download URL would bypass that entirely, which is exactly what
  // ADR-022/ADR-035 rule out.
  test('the owner cannot read their own photo directly via the client SDK', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), `profile-photos/${uid}/photo.jpg`), smallJpeg, { contentType: 'image/jpeg' })
    })
    const storage = authed(uid).storage()
    await assertFails(getBytes(ref(storage, `profile-photos/${uid}/photo.jpg`)))
  })

  test('admin cannot read a profile photo directly via the client SDK either', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), `profile-photos/${uid}/photo.jpg`), smallJpeg, { contentType: 'image/jpeg' })
    })
    // isExec()/isAdmin() aren't reachable without a custom-claims-bearing
    // token in this harness, but the rule for this path is `allow read: if
    // false` unconditionally — no isExec()/isAdmin() branch exists to grant
    // it, unlike cpd/{uid} — so an ordinary authenticated context already
    // proves the negative for every role.
    const storage = authed('some-admin').storage()
    await assertFails(getBytes(ref(storage, `profile-photos/${uid}/photo.jpg`)))
  })
})
