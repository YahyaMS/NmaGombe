/**
 * Server-only. Backs /verify/[token] — the public credibility page.
 * Admin SDK, never the client SDK: there is no Firestore query a browser can
 * issue against members directly. NEVER import this from a Client Component.
 *
 * Looks members up by verificationToken, an opaque high-entropy id — never by
 * folioNumber. folioNumber is a few hundred sequential values (NMA/GM/nnnn),
 * so a folio-keyed lookup let anyone walk the entire roster without ever
 * holding a card. See docs/09-DECISIONS.md ADR-027.
 */

import { adminDb } from '@/lib/firebase/admin'

export interface VerifyResult {
  displayName: string
  grade: string | null
  folioNumber: string
  status: 'verified' | 'not-current'
}

export async function lookupByToken(token: string): Promise<VerifyResult | null> {
  const snap = await adminDb
    .collection('members')
    .where('verificationToken', '==', token)
    .select('displayName', 'grade', 'folioNumber', 'status')
    .limit(1)
    .get()

  if (snap.empty) return null
  const data = snap.docs[0].data()

  return {
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    grade: typeof data.grade === 'string' ? data.grade : null,
    folioNumber: typeof data.folioNumber === 'string' ? data.folioNumber : '',
    status: data.status === 'verified' ? 'verified' : 'not-current',
  }
}
