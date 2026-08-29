/**
 * Email + password authentication. Replaces the email-link module entirely —
 * see docs/09-DECISIONS.md ADR-026 for why the inbox came off the critical path.
 *
 * The whole point of this module is that signing up is one continuous session
 * in one browser: create the account, write the profile, mint the session. No
 * round trip through an inbox, so no draft to carry across a browser boundary
 * and nothing to lose if the member opens their mail somewhere else. The inbox
 * is now involved in exactly one flow: resetting a forgotten password.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth'
// Imported from the split auth module, NOT the './client' barrel: that barrel
// re-exports db, so going through it would pull the ~211KB-gzip Firestore SDK
// into /signin and /reset-password, neither of which touches Firestore.
import { auth } from './auth'
import { env } from './env'
import { establishServerSession } from './session-bridge'

export type SignInDestination = 'admin' | 'member' | 'pending'

export interface SignedIn {
  destination: SignInDestination
  uid: string
}

/**
 * Mints the server session from a freshly-refreshed token and reports which
 * post-sign-in bucket the account falls into — by custom claim, never by a
 * field the client could write. The same refreshed token does both, rather
 * than forcing two refreshes.
 */
export async function establishSession(user: User): Promise<SignedIn> {
  const idToken = await user.getIdToken(true)
  await establishServerSession(idToken)
  const token = await user.getIdTokenResult()
  const destination: SignInDestination =
    token.claims.role === 'admin' ? 'admin' : token.claims.verified === true ? 'member' : 'pending'
  return { destination, uid: user.uid }
}

/**
 * Creates the Auth account only. The caller writes the member profile next —
 * see registerNewMember() — and both together are what a signup is. An account
 * without a profile is a recognised, recoverable state, not a dead end: /signup
 * detects it and asks for the details again.
 */
export async function createAccount(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function signIn(email: string, password: string): Promise<SignedIn> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return establishSession(credential.user)
}

/**
 * Firebase hosts the page that actually sets the new password, so there is no
 * second screen for us to build — this only asks for the link. The continue URL
 * drops them back on /signin afterwards.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email, { url: `${env.NEXT_PUBLIC_SITE_URL}/signin` })
}

/**
 * Turns a Firebase auth error into copy a member can act on.
 *
 * Email enumeration protection is enabled on this project, which is why
 * wrong-password and no-such-account collapse into one message: distinguishing
 * them would tell anyone who asks which addresses have accounts here. The older
 * auth/wrong-password and auth/user-not-found codes are handled too — Firebase
 * returns auth/invalid-credential with protection on, but the old codes still
 * appear in some paths, and both mean the same thing to the person typing.
 */
export function describeAuthError(err: unknown): string {
  const code = (err as { code?: string } | undefined)?.code
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return "That email and password don't match. Check them, or reset your password."
    case 'auth/email-already-in-use':
      return 'That email already has an account. Sign in instead, or reset your password.'
    case 'auth/weak-password':
      return 'Choose a longer password — at least 8 characters.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/user-disabled':
      return 'That account is disabled. Reach the secretariat on WhatsApp.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return "You're offline. Reconnect and try again."
    default:
      return 'Something went wrong. Try again.'
  }
}
