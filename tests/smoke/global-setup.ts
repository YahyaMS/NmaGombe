/**
 * Runs once before the smoke suite. Creates two Auth-emulator fixture users
 * (a verified member, a verified exec) with real custom claims, and mints a
 * custom token for each — written to a gitignored JSON file that
 * tests/smoke/auth.ts reads. tests/smoke/pages.spec.ts exchanges these
 * tokens for a real session by driving the browser through /test-signin,
 * never by faking cookies directly (see that route for why).
 *
 * A static import, not dynamic — Playwright's TS transform only hooks
 * require()/static import, not a runtime import(), which would otherwise
 * try to load src/lib/firebase/admin.ts's untranspiled ESM `import` syntax
 * directly and fail. That means playwright.config.ts must set the emulator
 * env vars *before* this file is loaded, since admin.ts builds its Admin SDK
 * app once at module-init time from them — see the comment there.
 *
 * Requires the Auth emulator running first: npm run emulators. The project
 * id (set by playwright.config.ts before this file loads — see its comment)
 * must be .firebaserc's default: firebase.json's singleProjectMode locks the
 * Auth emulator's sign-in/token-issuance to whatever project the emulator
 * suite itself was started with, regardless of what a client asks for.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { adminAuth, adminDb } from '../../src/lib/firebase/admin'

// Fixed slugs so tests/smoke/pages.spec.ts can reach real
// /admin/events/[slug]/attendance and /admin/.../[slug]/edit pages, not
// just their not-found branches.
export const SMOKE_EVENT_SLUG = 'smoke-test-event'
export const SMOKE_NEWS_SLUG = 'smoke-test-news'

const AUTH_EMULATOR_HOST = 'localhost:9099'

const FIXTURES_DIR = path.join(__dirname, '.generated')
const FIXTURES_PATH = path.join(FIXTURES_DIR, 'auth-fixtures.json')

interface FixtureUser {
  uid: string
  email: string
  claims: { role: 'member' | 'exec'; verified: boolean }
}

const FIXTURE_USERS: Record<'member' | 'exec', FixtureUser> = {
  member: {
    uid: 'smoke-test-member',
    email: 'smoke-member@example.test',
    claims: { role: 'member', verified: true },
  },
  exec: {
    uid: 'smoke-test-exec',
    email: 'smoke-exec@example.test',
    claims: { role: 'exec', verified: true },
  },
}

async function mintToken(fixture: FixtureUser): Promise<string> {
  try {
    await adminAuth.createUser({ uid: fixture.uid, email: fixture.email })
  } catch (err) {
    if ((err as { code?: string }).code !== 'auth/uid-already-exists') throw err
  }
  await adminAuth.setCustomUserClaims(fixture.uid, fixture.claims)
  return adminAuth.createCustomToken(fixture.uid)
}

/**
 * The Auth user + custom claims above are enough for anything gated only on
 * the session (proxy.ts, the layouts). They are NOT enough for
 * PortalDashboard, which reads the signed-in member's own members/{uid}
 * document (subscribeToOwnMemberProfile) to render its content at all — with
 * no such document, /portal shows its own honest "We couldn't load your
 * profile" error state, which the pre-existing smoke tests never caught
 * because they only assert status code and banner visibility, both of which
 * pass on that error state too. Seeded for both fixtures — exec accounts are
 * members too, and AdminDashboard doesn't need this today, but a future
 * admin page reading the caller's own profile shouldn't hit the same gap.
 */
async function seedMemberProfile(fixture: FixtureUser, displayName: string, folioNumber: string): Promise<void> {
  await adminDb.doc(`members/${fixture.uid}`).set({
    displayName,
    department: 'General Practice',
    folioNumber,
    email: fixture.email,
    status: 'verified',
    role: fixture.claims.role,
  })
}

export default async function globalSetup(): Promise<void> {
  const [member, exec] = await Promise.all([
    mintToken(FIXTURE_USERS.member),
    mintToken(FIXTURE_USERS.exec),
  ]).catch((err) => {
    throw new Error(
      `Could not reach the Firebase Auth emulator at ${AUTH_EMULATOR_HOST} to mint smoke-test ` +
        `fixture users. Start it first: npm run emulators.\n${err}`
    )
  })

  await Promise.all([
    seedMemberProfile(FIXTURE_USERS.member, 'Smoke Test Member', 'NMA/GM/SMOKE-001'),
    seedMemberProfile(FIXTURE_USERS.exec, 'Smoke Test Exec', 'NMA/GM/SMOKE-002'),
  ])

  mkdirSync(FIXTURES_DIR, { recursive: true })
  writeFileSync(FIXTURES_PATH, JSON.stringify({ member: { token: member }, exec: { token: exec } }))

  // A real published event so /admin/events/[slug]/attendance and
  // /admin/events/[slug]/edit have something to render, not just their
  // not-found branches.
  await adminDb.doc(`events/${SMOKE_EVENT_SLUG}`).set({
    title: 'Smoke Test CME',
    slug: SMOKE_EVENT_SLUG,
    description: 'Seeded by tests/smoke/global-setup.ts — not a real event.',
    location: 'Test Fixture Hall',
    status: 'published',
    startAt: new Date(),
    cpdCreditUnits: 2,
  })

  // Same reasoning, for /admin/news/[slug]/edit.
  await adminDb.doc(`news/${SMOKE_NEWS_SLUG}`).set({
    title: 'Smoke Test Communiqué',
    slug: SMOKE_NEWS_SLUG,
    body: 'Seeded by tests/smoke/global-setup.ts — not a real communiqué.',
    excerpt: 'Seeded by tests/smoke/global-setup.ts — not a real communiqué.',
    author: 'NMA Gombe',
    category: 'communique',
    status: 'published',
    publishedAt: new Date(),
  })
}
