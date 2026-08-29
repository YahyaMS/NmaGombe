/**
 * Shared Admin SDK bootstrap for the hand-run operational scripts.
 *
 * Same emulator flag the app and grant-admin.ts use: with
 * NEXT_PUBLIC_USE_EMULATORS=true in .env.local no credentials are needed, just
 * the emulators running. Against the real project it needs
 * FIREBASE_SERVICE_ACCOUNT_B64 (base64 of a service account JSON from Firebase
 * console > Project settings > Service accounts).
 *
 * These scripts bypass Firestore rules completely — that is the point of them,
 * and the reason they are run by hand rather than deployed. See CLAUDE.md rule #2.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'

export function initAdminApp(): { projectId: string | undefined; usingEmulators: boolean } {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const usingEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'

  if (getApps().length) return { projectId, usingEmulators }

  if (usingEmulators) {
    // Matches the ports client.ts connects to — never point this at a real project.
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'
    initializeApp({ projectId })
    console.log(`Targeting the local emulators for project ${projectId}.`)
    return { projectId, usingEmulators }
  }

  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
  if (!serviceAccountB64) {
    console.error('FIREBASE_SERVICE_ACCOUNT_B64 is not set in .env.local.')
    process.exit(1)
  }
  const serviceAccount = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf-8'))
  initializeApp({ credential: cert(serviceAccount) })
  console.log(`Targeting the REAL project ${projectId}.`)
  return { projectId, usingEmulators }
}
