/**
 * One-time bootstrap: grants role:"admin" to a user by email.
 *
 * Run locally by hand, only once (or whenever a new admin needs bootstrapping
 * outside the normal Function-driven flow). Never deployed, never scheduled.
 * There is no other way to create the first admin — decideVerification
 * requires an admin to already exist to call it.
 *
 * Against the emulators (NEXT_PUBLIC_USE_EMULATORS=true in .env.local, the
 * same flag the app itself uses): no credentials needed, just the emulators
 * running (`npm run emulators`).
 *
 * Against the real project: needs FIREBASE_SERVICE_ACCOUNT_B64 in .env.local
 * — download a service account key from Firebase console > Project settings
 * > Service accounts, then base64-encode the JSON file.
 *
 * Usage: npm run grant-admin -- someone@example.com
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const email = process.argv[2]
if (!email) {
  console.error('Usage: npm run grant-admin -- <email>')
  process.exit(1)
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const usingEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'

if (usingEmulators) {
  // Matches the ports client.ts connects to — never point this at a real project.
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'
  initializeApp({ projectId })
  console.log(`Targeting the local emulators for project ${projectId}.`)
} else {
  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
  if (!serviceAccountB64) {
    console.error('FIREBASE_SERVICE_ACCOUNT_B64 is not set in .env.local.')
    process.exit(1)
  }
  const serviceAccount = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf-8'))
  initializeApp({ credential: cert(serviceAccount) })
  console.log(`Targeting the real project ${projectId}. This is not reversible by re-running the script with a different flag — double-check that's what you want.`)
}

async function main() {
  const auth = getAuth()
  const user = await auth.getUserByEmail(email)
  const existingClaims = user.customClaims ?? {}
  await auth.setCustomUserClaims(user.uid, { ...existingClaims, role: 'admin' })

  // Best-effort: keep the mirrored Firestore field in sync if a profile
  // already exists. The custom claim above is what rules actually check.
  const memberRef = getFirestore().doc(`members/${user.uid}`)
  const memberSnap = await memberRef.get()
  if (memberSnap.exists) {
    await memberRef.update({ role: 'admin' })
  }

  console.log(`Granted role:admin to ${email} (uid: ${user.uid}).`)
  console.log('They must sign out and back in for the new claim to take effect.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
