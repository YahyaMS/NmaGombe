/**
 * Re-exports from the split modules — lib/firebase/app.ts (init),
 * lib/firebase/auth.ts (auth), lib/firebase/db.ts (db). Existing offline-tier
 * imports (`import { db, auth } from '@/lib/firebase/client'`) keep working
 * unchanged: the offline tier (card, directory, cpd, portal, profile) needs
 * both anyway, so importing them via this barrel costs nothing extra.
 *
 * Deliberately does NOT re-export `functions` — import it from
 * '@/lib/firebase/functions' directly. The three admin routes still on
 * httpsCallable (verification, members, broadcast) need auth + functions but
 * not Firestore; re-exporting functions here would tempt a future import via
 * this barrel that pulls db.ts's ~211KB-gzip Firestore SDK in for nothing.
 * See docs/09-DECISIONS.md.
 *
 * Import from here only — never call initializeApp() elsewhere. These keys
 * are safe to expose: they identify the project but authorise nothing.
 * Access control lives in firestore.rules. App Check (app.ts) adds a second
 * layer against scripted access, but is not yet enforced — see
 * docs/09-DECISIONS.md ADR-020. Rules alone are what's actually load-bearing
 * today.
 */

export { app } from './app'
export { auth } from './auth'
export { db } from './db'

// Storage loads only at the point something actually uploads — today that's
// only /portal/cpd's certificate attach (lib/data/cpd.ts). Memoized: repeat
// calls within one page load reuse the same connection/emulator setup, and
// markEmulatorConnected('storage') (app.ts) makes repeat calls across a Fast
// Refresh safe too — see app.ts's comment. (Previously this checked a
// `_isEmulator` property on the storage instance; that property does not
// exist anywhere in the installed Firebase SDK — confirmed by grepping every
// @firebase/* package — so the check was silently a no-op. Fixed here to use
// the real, verified mechanism; auth.ts/db.ts/functions.ts were built with
// the real mechanism from the start.)
import type { FirebaseStorage } from 'firebase/storage'
import { app, usingEmulators, markEmulatorConnected } from './app'

let storagePromise: Promise<FirebaseStorage> | undefined

export function getStorageClient(): Promise<FirebaseStorage> {
  if (!storagePromise) {
    storagePromise = import('firebase/storage').then(({ getStorage, connectStorageEmulator }) => {
      const storage = getStorage(app)
      if (usingEmulators && markEmulatorConnected('storage')) {
        connectStorageEmulator(storage, 'localhost', 9199)
      }
      return storage
    })
  }
  return storagePromise
}
