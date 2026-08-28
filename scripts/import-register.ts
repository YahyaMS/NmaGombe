/**
 * One-time (or occasional re-) import: writes the association-supplied
 * register CSV into registerEntries/, the Admin-SDK-only collection
 * lib/data/registerMatch.ts checks against during /admin/verification.
 * See docs/09-DECISIONS.md ADR-024 — this data is never read by any client,
 * only by that server-only matcher.
 *
 * Wipes and re-writes every entry on each run, so re-running with an
 * updated CSV is safe and doesn't require manual cleanup first.
 *
 * Against the real project: needs FIREBASE_SERVICE_ACCOUNT_B64 in
 * .env.local — same credential grant-admin.ts uses, download a service
 * account key from Firebase console > Project settings > Service accounts,
 * base64-encode the JSON file. Against the emulators
 * (NEXT_PUBLIC_USE_EMULATORS=true in .env.local): no credentials needed.
 *
 * Usage: npm run import-register -- data/roster-doctors-list-2026.csv
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const csvPath = process.argv[2]
if (!csvPath) {
  console.error('Usage: npm run import-register -- <path-to-csv>')
  process.exit(1)
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const usingEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'

if (usingEmulators) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
  initializeApp({ projectId })
  console.log(`Targeting the local emulator for project ${projectId}.`)
} else {
  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
  if (!serviceAccountB64) {
    console.error('FIREBASE_SERVICE_ACCOUNT_B64 is not set in .env.local.')
    process.exit(1)
  }
  const serviceAccount = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf-8'))
  initializeApp({ credential: cert(serviceAccount) })
  console.log(`Targeting the real project ${projectId}. This writes real personal data — double-check the CSV before running.`)
}

/** First column only, header row skipped, blank lines skipped. Deliberately
 * naive — this CSV is a single "name" column, not general-purpose parsing. */
function parseNames(csv: string): string[] {
  const lines = csv.split(/\r?\n/).map((l) => l.trim())
  const [header, ...rows] = lines
  if (header?.toLowerCase() !== 'name') {
    console.error(`Expected the first line to be "name", got: "${header}"`)
    process.exit(1)
  }
  return rows.filter((line) => line.length > 0)
}

async function main() {
  const names = parseNames(readFileSync(csvPath, 'utf-8'))
  const db = getFirestore()

  const existing = await db.collection('registerEntries').get()
  const deleteBatch = db.batch()
  existing.docs.forEach((d) => deleteBatch.delete(d.ref))
  if (existing.size > 0) await deleteBatch.commit()

  const writeBatch = db.batch()
  for (const name of names) {
    writeBatch.set(db.collection('registerEntries').doc(), { name })
  }
  await writeBatch.commit()

  console.log(`Imported ${names.length} names into registerEntries (replaced ${existing.size} existing).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
