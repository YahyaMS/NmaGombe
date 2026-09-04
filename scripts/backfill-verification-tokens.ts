/**
 * One-time backfill: mints verificationToken for every already-verified member
 * who doesn't have one yet — see docs/09-DECISIONS.md ADR-027.
 *
 * decideVerification mints a token on every *future* approval. This script
 * covers the members who were approved before that code existed, so
 * /verify/[token] has something to look up for them once folio-based lookup
 * is removed. Run once, against production, after firestore.rules (which
 * blocks a client from ever setting this field) is deployed — the Admin SDK
 * bypasses rules regardless, so ordering here is about closing the window on
 * the client side, not about this script's own access.
 *
 * Safe to re-run: a member who already has a token is skipped.
 * Dry run by default, and on the emulator by default. Pass --apply to write,
 * --prod to target the real project (see admin-app.ts).
 *
 * Prints uids only, never names, emails or folio numbers — NDPA 2023, see
 * docs/08-NDPA-COMPLIANCE.md.
 *
 * Usage: npm run backfill-verification-tokens -- --prod [--apply]
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { randomBytes } from 'node:crypto'
import { initAdminApp } from './admin-app'

const apply = process.argv.includes('--apply')

const { label } = initAdminApp()

async function main() {
  const db = getFirestore()

  const verified = await db.collection('members').where('status', '==', 'verified').get()
  if (verified.empty) {
    console.log(`No verified members in ${label}. Nothing to backfill.`)
    return
  }

  const missing = verified.docs.filter((d) => !d.data().verificationToken)

  console.log(
    `In ${label}: ${verified.size} verified member(s), ${missing.length} without a verificationToken.`
  )
  if (missing.length === 0) return

  for (const member of missing) {
    console.log(`  ${member.id}${apply ? '' : ' (dry run)'}`)
  }

  if (!apply) {
    console.log(`\nDry run — nothing written to ${label}. Re-run with --apply to mint tokens.`)
    return
  }

  const batch = db.batch()
  for (const member of missing) {
    batch.update(member.ref, {
      verificationToken: randomBytes(16).toString('base64url'),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
  await batch.commit()

  console.log(`\nMinted ${missing.length} verificationToken(s) in ${label}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
