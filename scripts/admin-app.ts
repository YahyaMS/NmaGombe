/**
 * Shared Admin SDK bootstrap for the hand-run operational scripts.
 *
 * These scripts exist to fix live incidents, but .env.local sets
 * NEXT_PUBLIC_USE_EMULATORS=true for everyday development — so the obvious
 * default silently pointed an incident fix at an empty local emulator and
 * reported "nothing found" about it, which reads exactly like a finding about
 * the real member. Targeting production is therefore explicit: pass --prod.
 * Without it these scripts stay on the emulator no matter what, and say so on
 * every line of output.
 *
 * --prod needs FIREBASE_SERVICE_ACCOUNT_B64 in .env.local (base64 of a service
 * account JSON from Firebase console > Project settings > Service accounts).
 *
 * These scripts bypass Firestore rules completely — that is the point of them,
 * and the reason they are run by hand rather than deployed. See CLAUDE.md rule #2.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'

export interface AdminTarget {
  projectId: string | undefined
  /** True when writes land on the real project. Print it next to every result. */
  live: boolean
  /** "the REAL project nma-gombe-xxxx" / "the local emulators" — for output lines. */
  label: string
}

export function initAdminApp(): AdminTarget {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const live = process.argv.includes('--prod')
  const label = live ? `the REAL project ${projectId}` : 'the local emulators'

  if (getApps().length) return { projectId, live, label }

  if (!live) {
    // Matches the ports client.ts connects to.
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'
    initializeApp({ projectId })
    console.log(`Targeting ${label}. Nothing here touches live member data.`)
    console.log('Add --prod to run this against the real project.\n')
    return { projectId, live, label }
  }

  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
  if (!serviceAccountB64) {
    console.error('--prod needs FIREBASE_SERVICE_ACCOUNT_B64 in .env.local, and it is not set.')
    console.error('Firebase console > Project settings > Service accounts > generate a key,')
    console.error('then base64-encode the JSON into that variable.')
    process.exit(1)
  }
  const serviceAccount = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf-8'))
  initializeApp({ credential: cert(serviceAccount) })
  console.log(`Targeting ${label}. These writes are live.\n`)
  return { projectId, live, label }
}
