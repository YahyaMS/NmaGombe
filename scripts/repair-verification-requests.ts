/**
 * Files the missing verification request for any member stuck at
 * status:"pending" without one.
 *
 * Signup used to write members/{uid} and verificationRequests/{id} as two
 * separate client calls; a failure between them left the member reading "we're
 * reviewing your application" while the admin queue stayed empty, with nothing
 * in either view to show the mismatch. registerNewMember() now commits both in
 * one batch (src/lib/data/members.ts), so this can't happen again — this script
 * is for accounts stranded before that fix.
 *
 * Safe to re-run: a member who already has a request is skipped.
 * Dry run by default, and on the emulator by default. Pass --apply to write,
 * --prod to target the real project (see admin-app.ts).
 *
 * Prints uids only, never names, emails or folio numbers — NDPA 2023, see
 * docs/08-NDPA-COMPLIANCE.md.
 *
 * Usage: npm run repair-verification-requests -- --prod [--apply]
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { initAdminApp } from './admin-app'

const apply = process.argv.includes('--apply')

const { label } = initAdminApp()

async function main() {
  const db = getFirestore()

  const pending = await db.collection('members').where('status', '==', 'pending').get()
  if (pending.empty) {
    console.log(`No members are pending in ${label}. Nothing to repair.`)
    return
  }

  // One read of the whole collection rather than a query per member — the
  // queue is small (hundreds at most) and this is a hand-run repair, not a
  // request path.
  const requests = await db.collection('verificationRequests').get()
  const withRequest = new Set(requests.docs.map((d) => d.data().uid as string))

  const stranded = pending.docs.filter((d) => !withRequest.has(d.id))

  console.log(
    `In ${label}: ${pending.size} pending member(s), ${stranded.length} with no verification request.`
  )
  if (stranded.length === 0) return

  for (const member of stranded) {
    console.log(`  ${member.id}${apply ? '' : ' (dry run)'}`)
  }

  if (!apply) {
    console.log(`\nDry run — nothing written to ${label}. Re-run with --apply to file these requests.`)
    return
  }

  const batch = db.batch()
  for (const member of stranded) {
    const data = member.data()
    batch.set(db.collection('verificationRequests').doc(), {
      uid: member.id,
      folioNumber: (data.folioNumber as string | undefined) ?? '',
      // The member applied when they created their profile; using that keeps
      // the admin queue ordered by when they actually signed up, not by when
      // this repair ran.
      submittedAt: data.createdAt ?? FieldValue.serverTimestamp(),
    })
  }
  await batch.commit()

  console.log(
    `\nFiled ${stranded.length} verification request(s) in ${label}. They're in the admin queue now.`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
