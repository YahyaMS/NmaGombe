/**
 * Reads the fixture tokens tests/smoke/global-setup.ts minted and drives the
 * browser through /test-signin to establish a real signed-in session —
 * both the client Firebase Auth state and the __session cookie, via the
 * app's own establishServerSession(). See src/app/test-signin for why a
 * real sign-in is used instead of injecting cookies directly: the portal
 * and admin dashboards gate on client-side auth state
 * (useVerifiedMemberGuard/useExecGuard), not on the cookie alone.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'

const FIXTURES_PATH = path.join(__dirname, '.generated', 'auth-fixtures.json')

interface AuthFixtures {
  member: { token: string }
  exec: { token: string }
}

function loadAuthFixtures(): AuthFixtures {
  try {
    return JSON.parse(readFileSync(FIXTURES_PATH, 'utf-8'))
  } catch {
    throw new Error(
      `No smoke-test auth fixtures at ${FIXTURES_PATH} — global setup did not run or failed. ` +
        `Run via: npm run test:smoke`
    )
  }
}

/** Signs in as the given role and lands on `redirectTo`, via a real sign-in. */
export async function signInAs(
  page: Page,
  role: 'member' | 'exec',
  redirectTo: string
): Promise<void> {
  const { token } = loadAuthFixtures()[role]
  await page.goto(
    `/test-signin?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirectTo)}`
  )
  await page.waitForURL((url) => url.pathname === redirectTo)
}
