/**
 * Auth only — no Firestore. Deliberately its own module so a route that
 * needs sign-in state but never touches Firestore (the admin routes still
 * on httpsCallable: verification, members, broadcast) doesn't bundle
 * Firestore's client SDK unused. See lib/firebase/db.ts and
 * docs/09-DECISIONS.md.
 */

import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { app, usingEmulators, markEmulatorConnected } from './app'

export const auth = getAuth(app)

if (usingEmulators && markEmulatorConnected('auth')) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
}
