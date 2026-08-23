/**
 * Deliberately its own module, not bundled into auth.ts: the offline-tier
 * routes (card, directory, cpd, portal, profile) need `auth` for their
 * client-side guards but call zero Cloud Functions — only the three admin
 * routes still on httpsCallable (verification, members, broadcast) import
 * this. See docs/09-DECISIONS.md.
 */

import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { app, usingEmulators, markEmulatorConnected } from './app'

// Region matches Firestore's europe-west1 — see docs/09-DECISIONS.md ADR-008.
export const functions = getFunctions(app, 'europe-west1')

if (usingEmulators && markEmulatorConnected('functions')) {
  connectFunctionsEmulator(functions, 'localhost', 5001)
}
