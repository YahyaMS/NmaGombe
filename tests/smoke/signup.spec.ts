/**
 * End-to-end signup and sign-in against the emulators.
 *
 * This flow broke twice in production on its first day live (ADR-025, ADR-026)
 * and neither failure was catchable by typecheck, lint or a rules test — both
 * were about what did or didn't reach Firestore after the browser did something
 * real. So this drives the actual form and then asserts on the documents, not
 * on the screen: a member seeing "we're reviewing your application" while the
 * admin queue stays empty is exactly the bug that started all of this, and it
 * looks like success from the browser alone.
 */

import { test, expect } from '@playwright/test'
import { adminAuth, adminDb } from '../../src/lib/firebase/admin'

const PASSWORD = 'smoke-test-password'

function uniqueEmail(): string {
  return `smoke-signup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

async function deleteAccount(email: string): Promise<void> {
  try {
    const user = await adminAuth.getUserByEmail(email)
    const requests = await adminDb
      .collection('verificationRequests')
      .where('uid', '==', user.uid)
      .get()
    await Promise.all(requests.docs.map((d) => d.ref.delete()))
    await adminDb.collection('members').doc(user.uid).delete()
    await adminAuth.deleteUser(user.uid)
  } catch {
    // Nothing to clean up.
  }
}

async function fillSignupForm(page: import('@playwright/test').Page, email: string) {
  await page.goto('/signup')
  await page.getByLabel('Full name').fill('Smoke Test Doctor')
  await page.getByLabel('Department (specialty)').fill('Paediatrics')
  await page.getByLabel('Folio number').fill('SMOKE-0001')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
}

test('signup creates the account, the profile and the verification request together', async ({
  page,
}) => {
  const email = uniqueEmail()
  try {
    await fillSignupForm(page, email)
    await page.getByRole('button', { name: 'Create account' }).click()

    await page.waitForURL((url) => url.pathname === '/pending')
    await expect(page.getByRole('heading', { name: /reviewing your application/i })).toBeVisible()

    // The half the browser can't show: both documents must exist, or this is
    // the ADR-025 failure wearing a success screen.
    const user = await adminAuth.getUserByEmail(email)
    const member = await adminDb.collection('members').doc(user.uid).get()
    expect(member.exists).toBe(true)
    expect(member.data()?.status).toBe('pending')
    expect(member.data()?.folioNumber).toBe('SMOKE-0001')

    const requests = await adminDb
      .collection('verificationRequests')
      .where('uid', '==', user.uid)
      .get()
    expect(requests.size).toBe(1)
    // The admin queue orders by this field, and Firestore silently omits
    // documents that lack the field it orders by.
    expect(requests.docs[0].data().submittedAt).toBeTruthy()
  } finally {
    await deleteAccount(email)
  }
})

test('a member can sign in again with the password they set', async ({ page, context }) => {
  const email = uniqueEmail()
  try {
    await fillSignupForm(page, email)
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.waitForURL((url) => url.pathname === '/pending')

    await context.clearCookies()
    await page.evaluate(() => window.localStorage.clear())

    await page.goto('/signin')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await page.waitForURL((url) => url.pathname === '/pending')
    await expect(page.getByRole('heading', { name: /reviewing your application/i })).toBeVisible()
  } finally {
    await deleteAccount(email)
  }
})

test('signing in with the wrong password says so without confirming the account exists', async ({
  page,
}) => {
  await page.goto('/signin')
  await page.getByLabel('Email').fill('definitely-not-registered@example.com')
  await page.getByLabel('Password').fill('not-the-right-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Scoped to the <p>: Next's own route announcer is also role="alert".
  const alert = page.locator('p[role="alert"]')
  await expect(alert).toContainText(/don't match/i)
  // Anything naming the account's existence would make this form a way to test
  // whether a given doctor is a member here.
  await expect(alert).not.toContainText(/no account|not found|doesn't exist/i)
})
