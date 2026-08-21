/**
 * Server-only. Backs /verify/[folio] — the public credibility page.
 * Admin SDK, never the client SDK: there is no Firestore query a browser can
 * issue against members directly. NEVER import this from a Client Component.
 */

import { adminDb } from '@/lib/firebase/admin'

export interface VerifyResult {
  displayName: string
  grade: string | null
  facility: string | null
  folioNumber: string
  status: 'verified' | 'not-current'
}

// The folio card's QR encodes hyphens in place of slashes (folioNumber.replace(/\//g, '-'))
// so the value survives as a single URL segment — reverse that here, once, for every
// consumer of the /verify/[folio] segment (the page and its opengraph-image).
export function toStoredFolioNumber(segment: string): string {
  return segment.replace(/-/g, '/')
}

export async function lookupByFolio(folioNumber: string): Promise<VerifyResult | null> {
  const snap = await adminDb
    .collection('members')
    .where('folioNumber', '==', folioNumber)
    .select('displayName', 'grade', 'facility', 'folioNumber', 'status')
    .limit(1)
    .get()

  if (snap.empty) return null
  const data = snap.docs[0].data()

  return {
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    grade: typeof data.grade === 'string' ? data.grade : null,
    facility: typeof data.facility === 'string' ? data.facility : null,
    folioNumber: typeof data.folioNumber === 'string' ? data.folioNumber : folioNumber,
    status: data.status === 'verified' ? 'verified' : 'not-current',
  }
}
