/**
 * Firebase Admin SDK — server-only.
 *
 * NEVER import this in client components or pages that render client-side.
 * The service account key is loaded from an environment variable, not a file.
 *
 * IMPORTANT: Admin SDK bypasses all Firestore security rules.
 * Every function that touches member data MUST re-check authorisation itself.
 * See CLAUDE.md rule #2 and docs/09-DECISIONS.md ADR-002.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'

function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!

  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
  if (!serviceAccountB64) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_B64 is not set. ' +
        'Add the base64-encoded service account JSON to your environment.'
    )
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountB64, 'base64').toString('utf-8')
  )

  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    // Firestore region: europe-west1 — see docs/09-DECISIONS.md ADR-008
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
  })
}

export const adminApp  = getAdminApp()
export const adminDb   = getFirestore(adminApp)
export const adminAuth = getAuth(adminApp)
export const adminStorage = getStorage(adminApp)
