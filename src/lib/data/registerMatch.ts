/**
 * Server-only. Backs /admin/verification's "is this name actually in the
 * association's own register" check (docs/09-DECISIONS.md ADR-024) —
 * loads `registerEntries/{id}` (Admin SDK only; firestore.rules denies
 * every client, including exec/admin, per-collection read/write) and does a
 * simple token-overlap match against a signup's self-entered display name.
 *
 * Deliberately not exact-string matching: the source register itself has
 * wildly inconsistent formatting (surname-first, firstname-first, ALL CAPS,
 * mixed), so exact matching would silently report almost everyone as "not
 * found." Token overlap is a fuzzy hint, not a verdict — this never blocks
 * or auto-approves anything; the admin still makes the actual call, same as
 * before this existed (VerificationQueue.tsx already said "check the name
 * against the eligibility list" — this just makes that check fast instead
 * of a separate spreadsheet lookup).
 *
 * NEVER import this from a Client Component.
 */

import 'server-only'
import { adminDb } from '@/lib/firebase/admin'

const MIN_MATCHING_TOKENS = 2

function normalize(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/^(dr|prof|mr|mrs|phc)\.?\s+/i, '')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1) // drop stray initials — too noisy to match on
}

function tokenOverlap(a: string[], b: string[]): number {
  const setB = new Set(b)
  return a.filter((token) => setB.has(token)).length
}

export interface RegisterMatchResult {
  /** True if some register entry shares enough name tokens with the candidate. */
  matched: boolean
  /** False if registerEntries is empty — lets the UI say "nothing to check
   *  against yet" instead of a misleading "not found". */
  registerLoaded: boolean
}

/** Loaded once per page render (by the caller) and passed to
 * matchAgainstRegister() per row — the collection is small, but there is no
 * reason to re-fetch it once per pending request on the same page load. */
export async function loadRegisterTokenSets(): Promise<string[][]> {
  const snap = await adminDb.collection('registerEntries').get()
  return snap.docs.map((d) => normalize((d.data().name as string | undefined) ?? ''))
}

export function matchAgainstRegister(candidateName: string, registerTokenSets: string[][]): RegisterMatchResult {
  if (registerTokenSets.length === 0) return { matched: false, registerLoaded: false }

  const candidateTokens = normalize(candidateName)
  if (candidateTokens.length === 0) return { matched: false, registerLoaded: true }

  const matched = registerTokenSets.some(
    (entryTokens) => tokenOverlap(candidateTokens, entryTokens) >= MIN_MATCHING_TOKENS
  )
  return { matched, registerLoaded: true }
}
