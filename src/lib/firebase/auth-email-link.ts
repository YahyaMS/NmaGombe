/**
 * Email-link (passwordless) sign-in. See docs/09-DECISIONS.md ADR-010.
 *
 * No Dynamic Links dependency for a web app, runs on the free Spark plan — confirmed against
 * Firebase's current docs, not assumed from memory.
 *
 * The email round-trips through the user's inbox, so we stash it (and the signup draft) in
 * localStorage before sending and read it back when the link is opened. This is Firebase's
 * own documented pattern, not a workaround.
 */

import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  type User,
} from 'firebase/auth'
import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore'
import { auth } from './client'
import { db } from './client'
import type { MemberSignupInput } from '@/lib/data/schemas'

type SignupDraft = Omit<MemberSignupInput, 'email'>

const STORED_EMAIL_KEY = 'nma-gombe:signin-email'
const STORED_DRAFT_KEY = 'nma-gombe:signup-draft'
const DAILY_CAP_MESSAGE =
  'Too many sign-in emails requested for this address today. Try again tomorrow, or reach the secretariat on WhatsApp.'

function lagosDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(d)
}

/**
 * Rate-limits sendSignInLinkToEmail — the cap is enforced by firestore.rules itself
 * (max 5/day), this just performs the write and translates the resulting denial.
 */
async function recordEmailLinkAttempt(email: string): Promise<void> {
  const ref = doc(db, 'emailLinkAttempts', email, 'days', lagosDateString())
  try {
    await setDoc(ref, { count: increment(1), lastAttemptAt: serverTimestamp() }, { merge: true })
  } catch {
    throw new Error(DAILY_CAP_MESSAGE)
  }
}

/** Turns a thrown error from this module into copy a member can act on. */
export function describeSignInError(err: unknown): string {
  if (err instanceof Error && err.message === DAILY_CAP_MESSAGE) return err.message
  const code = (err as { code?: string } | undefined)?.code
  if (code === 'auth/network-request-failed') {
    return "You're offline. Reconnect and try again."
  }
  return 'Something went wrong sending the sign-in email. Try again.'
}

export async function requestSignInLink(email: string): Promise<void> {
  await recordEmailLinkAttempt(email)
  await sendSignInLinkToEmail(auth, email, {
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/signup`,
    handleCodeInApp: true,
  })
  window.localStorage.setItem(STORED_EMAIL_KEY, email)
}

export function saveSignupDraft(draft: SignupDraft): void {
  window.localStorage.setItem(STORED_DRAFT_KEY, JSON.stringify(draft))
}

export function readSignupDraft(): SignupDraft | null {
  const raw = window.localStorage.getItem(STORED_DRAFT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSignupDraft(): void {
  window.localStorage.removeItem(STORED_DRAFT_KEY)
}

export function isEmailLinkReturn(url: string): boolean {
  return isSignInWithEmailLink(auth, url)
}

export function readStoredEmail(): string | null {
  return window.localStorage.getItem(STORED_EMAIL_KEY)
}

/** Completes sign-in from a clicked email link. Throws if no email is known — caller must prompt. */
export async function completeEmailLinkSignIn(url: string, email: string): Promise<User> {
  const result = await signInWithEmailLink(auth, email, url)
  window.localStorage.removeItem(STORED_EMAIL_KEY)
  return result.user
}
