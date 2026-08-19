/**
 * Firebase client-side SDK.
 *
 * Import from here only — never call initializeApp() elsewhere.
 * These keys are safe to expose: they identify the project but authorise nothing.
 * Access control lives in firestore.rules + App Check.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

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
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
// Region matches Firestore's europe-west1 — see docs/09-DECISIONS.md ADR-008.
export const functions = getFunctions(app, 'europe-west1')

// Point at local emulators in development.
// NEXT_PUBLIC_USE_EMULATORS=true is set in .env.local (never in production).
if (
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_USE_EMULATORS === 'true' &&
  // Prevent double-connection on hot reload
  !(auth as unknown as { _isEmulator?: boolean })._isEmulator
) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectStorageEmulator(storage, 'localhost', 9199)
  connectFunctionsEmulator(functions, 'localhost', 5001)
}
