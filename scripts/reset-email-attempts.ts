/**
 * Clears the sign-in-email rate-limit counter for one address.
 *
 * A member who spends the daily cap (firestore.rules, emailLinkAttempts) can't
 * sign in at all until midnight Lagos time, and has no way out on their own:
 * the counter is unreadable and undeletable from the client, by design. This is
 * the way back in — the Admin SDK bypasses rules, which is exactly why this is
 * a hand-run script and not something the app can call.
 *
 * Deletes today's counter by default; --all clears every day this address has.
 * Runs against the emulator unless --prod is passed (see admin-app.ts).
 *
 * Usage: npm run reset-email-attempts -- someone@example.com --prod [--all]
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { getFirestore } from 'firebase-admin/firestore'
import { initAdminApp } from './admin-app'

const email = process.argv[2]?.trim().toLowerCase()
const clearAll = process.argv.includes('--all')

if (!email || email.startsWith('--')) {
  console.error('Usage: npm run reset-email-attempts -- <email> [--all]')
  process.exit(1)
}

// Must match lagosDateString() in src/lib/firebase/auth-email-link.ts — the
// counter is keyed by the member's local day, not the server's.
function lagosDateString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date())
}

const { label } = initAdminApp()

async function main() {
  const db = getFirestore()
  const days = db.collection('emailLinkAttempts').doc(email!).collection('days')

  if (clearAll) {
    const snap = await days.get()
    if (snap.empty) {
      console.log(`No attempt counters found for that address in ${label} — nothing to clear.`)
      return
    }
    const batch = db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    console.log(`Cleared ${snap.size} day(s) of attempts in ${label}. They can request a link now.`)
    return
  }

  const today = lagosDateString()
  const ref = days.doc(today)
  const snap = await ref.get()
  if (!snap.exists) {
    console.log(`No attempts recorded for ${today} in ${label} — they are not rate-limited by us.`)
    console.log("If they're still blocked, it's Firebase's own per-address quota; that one only clears with time.")
    return
  }
  await ref.delete()
  console.log(
    `Cleared ${snap.data()?.count ?? 0} attempt(s) for ${today} in ${label}. They can request a link now.`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
