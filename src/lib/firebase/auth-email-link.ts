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
import { establishServerSession } from './session-bridge'
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
 * (max 10/day), this just performs the write and translates the resulting denial.
 *
 * ONLY a rules denial means the cap: this used to catch every error and report all
 * of them as "try again tomorrow", so an offline member, or one whose write was
 * rejected for any other reason, was told to give up for the day. A member locked
 * out that way has no way back in — the counter is unreadable and undeletable from
 * the client — so mislabelling a transient failure as the cap is the expensive
 * direction to be wrong in. Anything that isn't permission-denied is rethrown
 * unchanged for describeSignInError() to classify.
 */
async function recordEmailLinkAttempt(email: string): Promise<void> {
  const ref = doc(db, 'emailLinkAttempts', email, 'days', lagosDateString())
  try {
    await setDoc(ref, { count: increment(1), lastAttemptAt: serverTimestamp() }, { merge: true })
  } catch (err) {
    if ((err as { code?: string } | undefined)?.code === 'permission-denied') {
      throw new Error(DAILY_CAP_MESSAGE)
    }
    throw err
  }
}

/** Turns a thrown error from this module into copy a member can act on. */
export function describeSignInError(err: unknown): string {
  if (err instanceof Error && err.message === DAILY_CAP_MESSAGE) return err.message
  const code = (err as { code?: string } | undefined)?.code
  if (code === 'auth/network-request-failed' || code === 'unavailable') {
    return "You're offline. Reconnect and try again."
  }
  // Firebase's own per-address quota sits underneath our daily cap and can fire
  // first. Same situation for the member, so say the same thing.
  if (code === 'auth/too-many-requests') return DAILY_CAP_MESSAGE
  return 'Something went wrong sending the sign-in email. Try again.'
}

export async function requestSignInLink(email: string, returnPath: string): Promise<void> {
  await recordEmailLinkAttempt(email)
  await sendSignInLinkToEmail(auth, email, {
    url: `${process.env.NEXT_PUBLIC_SITE_URL}${returnPath}`,
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

export type ReturningSignInDestination = 'admin' | 'member' | 'pending'

export interface ReturningSignIn {
  destination: ReturningSignInDestination
  uid: string
}

/**
 * Completes a returning member's email-link sign-in and reports which
 * post-sign-in bucket they fall into, by custom claim rather than any
 * client-writable field. Establishes the server session with the same
 * freshly-refreshed token used to decide the bucket, rather than forcing
 * two separate token refreshes.
 *
 * The uid comes back with the destination because 'pending' isn't a single
 * situation — the signup form needs it to check whether a member profile
 * exists at all before sending someone to /pending. See SignupForm.tsx.
 */
export async function completeReturningSignIn(
  url: string,
  email: string
): Promise<ReturningSignIn> {
  const user = await completeEmailLinkSignIn(url, email)
  const idToken = await user.getIdToken(true)
  await establishServerSession(idToken)
  const token = await user.getIdTokenResult()
  const destination: ReturningSignInDestination =
    token.claims.role === 'admin' ? 'admin' : token.claims.verified === true ? 'member' : 'pending'
  return { destination, uid: user.uid }
}
