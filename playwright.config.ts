import { defineConfig, devices } from '@playwright/test'

// Smoke must run against a production build, not `next dev` — dev is more
// permissive about the class of error this suite exists to catch (server/
// client boundary violations, hydration mismatches). See
// .claude/rules/nextjs-boundaries.md and docs/09-DECISIONS.md.
//
// Authenticated routes need the Firebase emulators running first — start
// them with `npm run emulators` (CI wraps the whole run in
// `firebase emulators:exec`, see .github/workflows/ci.yml). The project id
// below MUST be .firebaserc's default ("nma-gombe-c5a9d") — confirmed by
// running this against an already-running emulator with a different id
// ("nma-gombe-test", matching tests/rules): the Admin SDK calls that create
// fixture users silently succeeded against that id, but firebase.json's
// singleProjectMode locks the Auth emulator's actual sign-in/token-issuance
// endpoint to whatever project the emulator suite itself was started with —
// every ID token it issues carries that project's `aud` regardless of which
// project asked, so verifyIdToken() on our side rejected every one with an
// "incorrect aud claim" 401. tests/rules doesn't hit this: the Firestore
// emulator (unlike Auth) isn't project-locked, so its own "nma-gombe-test"
// id is unaffected and stays as is.
const FIREBASE_PROJECT_ID = 'nma-gombe-c5a9d'

// Set before globalSetup (tests/smoke/global-setup.ts) is imported: it
// statically imports src/lib/firebase/admin, whose Admin SDK app is built
// once at module-load time from these — set too late and it falls through
// to the "real project, need a service account" branch instead.
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = FIREBASE_PROJECT_ID
process.env.NEXT_PUBLIC_USE_EMULATORS = 'true'
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199'

export default defineConfig({
  testDir: './tests/smoke',
  globalSetup: require.resolve('./tests/smoke/global-setup'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 5 * 60 * 1000,
    env: {
      NEXT_PUBLIC_FIREBASE_API_KEY: 'smoke-test-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: `${FIREBASE_PROJECT_ID}.appspot.com`,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000000000',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_USE_EMULATORS: 'true',
      FIRESTORE_EMULATOR_HOST: 'localhost:8080',
      FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
      FIREBASE_STORAGE_EMULATOR_HOST: 'localhost:9199',
    },
  },
})
