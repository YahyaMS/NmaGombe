/**
 * Firestore only. Its own module for the same reason as auth.ts/functions.ts
 * — this is the ~211KB-gzip piece (docs/09-DECISIONS.md ADR-011) that the
 * offline tier (card, directory, cpd, portal, profile) genuinely needs and
 * the admin routes on httpsCallable (verification, members, broadcast —
 * except only members/broadcast still import this; verification no longer
 * does) don't.
 */

import {
  initializeFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentSingleTabManager,
  memoryLocalCache,
} from 'firebase/firestore'
import { app, usingEmulators, markEmulatorConnected } from './app'

// Persistent (IndexedDB) cache in the browser — required for "works offline"
// (CLAUDE.md non-negotiable constraints; design.md's directory/card offline
// states). Falls back to the in-memory cache during SSR, where indexedDB
// doesn't exist. Single-tab: this app has no need for cross-tab sync yet.
export const db = initializeFirestore(app, {
  localCache:
    typeof window !== 'undefined'
      ? persistentLocalCache({ tabManager: persistentSingleTabManager({}) })
      : memoryLocalCache(),
})

if (usingEmulators && markEmulatorConnected('firestore')) {
  connectFirestoreEmulator(db, 'localhost', 8080)
}
