/**
 * The one place Firebase app init happens. lib/firebase/auth.ts,
 * lib/firebase/functions.ts and lib/firebase/db.ts each import `app` from
 * here and own their own service + emulator connection — kept as separate
 * modules specifically so a route that needs one service doesn't bundle the
 * others. See docs/09-DECISIONS.md for why this file was split out of what
 * used to be one client.ts.
 *
 * App Check: see the initializeAppCheckIfConfigured() block below and
 * docs/09-DECISIONS.md ADR-020. Client-side init only — this makes calls
 * *carry* a token, it does not make Firebase *reject* anything yet.
 * Enforcement is a separate, later, deliberately-not-yet-taken step.
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

/**
 * A genuine no-op today: NEXT_PUBLIC_APPCHECK_SITE_KEY isn't set anywhere yet
 * (no reCAPTCHA v3 key has been registered in Firebase Console under App
 * Check — see docs/09-DECISIONS.md ADR-020), so this `if` never runs and
 * `firebase/app-check` is never even fetched. Dynamic import deliberately,
 * not static — a no-op should cost 0KB, not just do nothing at runtime.
 * Skipped under emulators too; App Check's local debug-token flow is a
 * separate setup this project hasn't needed yet.
 *
 * Once a real site key is set, this starts attaching a token to every
 * Firestore/Functions/Storage call — but nothing is *rejected* until
 * "Enforce" is turned on per-service in Firebase Console (or, for callable
 * Functions, `enforceAppCheck: true` is added there). ADR-020 spells out why
 * that second step must not happen until real traffic is confirmed to carry
 * valid tokens — flipping it early rejects every legitimate exec/admin
 * action, not just scripted ones.
 *
 * Reads process.env directly (a literal property access, so still inlined
 * correctly — see env.ts's own warning) rather than importing env.ts, same
 * as firebaseConfig above: env.ts's zod-validated schema module pulls zod
 * itself into every bundle that imports this file, measured at +14KB on the
 * admin-callable tier for a value most builds never even use. One optional
 * literal read isn't worth that for every consumer of app.ts.
 */
const appCheckSiteKey = process.env.NEXT_PUBLIC_APPCHECK_SITE_KEY
if (typeof window !== 'undefined' && !usingEmulators && appCheckSiteKey) {
  const siteKey = appCheckSiteKey
  void import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    })
  })
}

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
