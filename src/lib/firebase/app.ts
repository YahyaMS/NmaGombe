/**
 * The one place Firebase app init happens. lib/firebase/auth.ts,
 * lib/firebase/functions.ts and lib/firebase/db.ts each import `app` from
 * here and own their own service + emulator connection — kept as separate
 * modules specifically so a route that needs one service doesn't bundle the
 * others. See docs/09-DECISIONS.md for why this file was split out of what
 * used to be one client.ts.
 *
 * App Check belongs here too, once it's wired up — env.ts already reserves
 * NEXT_PUBLIC_APPCHECK_SITE_KEY for it. Not built yet (docs/00-INTAKE.md).
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

export const app = getFirebaseApp()

// NEXT_PUBLIC_USE_EMULATORS=true is set in .env.local (never in production).
export const usingEmulators =
  typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'

type AppWithEmulatorFlags = FirebaseApp & { __nmaEmulatorsConnected?: Set<string> }

/**
 * connectXEmulator() throws if called twice on the same instance, and each
 * service's SDK doesn't reliably expose its own "_isEmulator"-style flag by
 * a name we should depend on. This attaches our own flag to `app` instead —
 * `app` survives Fast Refresh via firebase/app's own getApps() registry, so
 * a flag stored on it does too, unlike a plain module-level variable in
 * auth.ts/db.ts/functions.ts (which Fast Refresh would reset, causing a
 * double-connect attempt and a thrown error on the next hot reload).
 *
 * Returns true the first time it's called for a given service on this app
 * instance — the caller should connect. Returns false every time after.
 */
export function markEmulatorConnected(service: 'auth' | 'firestore' | 'storage' | 'functions'): boolean {
  const a = app as AppWithEmulatorFlags
  a.__nmaEmulatorsConnected ??= new Set()
  if (a.__nmaEmulatorsConnected.has(service)) return false
  a.__nmaEmulatorsConnected.add(service)
  return true
}
