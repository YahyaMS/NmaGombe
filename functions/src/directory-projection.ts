/**
 * onMemberWrite — single source of truth for directoryEntries/publicDirectory.
 * Fires on every members/{uid} write: decideVerification's approval write, and
 * any later /portal/profile edit — so neither directory can go stale between
 * verification and whatever the member does after. See docs/09-DECISIONS.md
 * ADR-012, ADR-013, ADR-014.
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// Matches Firestore's region — see docs/09-DECISIONS.md ADR-008.
const REGION = 'europe-west1'

/** Lowercased name/department/etc words, for directory prefix search. */
function searchTokens(...values: string[]): string[] {
  const tokens = new Set<string>()
  for (const value of values) {
    for (const word of value.toLowerCase().split(/[^a-z0-9]+/)) {
      if (word) tokens.add(word)
    }
  }
  return [...tokens]
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** publicListingConsent is a ConsentRecord ({granted, at, noticeVersion}),
 * not a bare boolean — see schemas.ts. */
function consentGranted(value: unknown): boolean {
  return typeof value === 'object' && value !== null && (value as { granted?: unknown }).granted === true
}

export const onMemberWrite = onDocumentWritten(
  { document: 'members/{uid}', region: REGION },
  async (event) => {
    const uid = event.params.uid
    const after = event.data?.after.exists ? event.data.after.data() : null
    const db = getFirestore()
    const directoryRef = db.doc(`directoryEntries/${uid}`)
    const publicRef = db.doc(`publicDirectory/${uid}`)

    // Not verified (pending/rejected/suspended, or the doc was deleted) —
    // neither directory should carry this member. Delete is a safe no-op if
    // the doc was never there.
    if (!after || after.status !== 'verified') {
      await Promise.all([directoryRef.delete(), publicRef.delete()])
      return
    }

    const displayName = str(after.displayName) ?? ''
    const department = str(after.department) ?? ''
    const grade = str(after.grade)
    const subspecialty = str(after.subspecialty)
    const facility = str(after.facility)
    const town = str(after.town)
    const visibility = (after.visibility ?? {}) as Record<string, boolean>
    const tokens = searchTokens(displayName, department, subspecialty ?? '', facility ?? '')

    await directoryRef.set({
      displayName,
      department,
      ...(grade ? { grade } : {}),
      ...(subspecialty ? { subspecialty } : {}),
      ...(facility ? { facility } : {}),
      ...(town ? { town } : {}),
      ...(visibility.phone && after.phone ? { phone: after.phone } : {}),
      ...(visibility.whatsapp && after.whatsapp ? { whatsapp: after.whatsapp } : {}),
      verifiedAt: after.verifiedAt ?? FieldValue.serverTimestamp(),
      searchTokens: tokens,
    })

    // Public listing needs explicit consent — see ADR-013/014. Never phone,
    // whatsapp, or email: this object literal is the only place that could
    // ever leak them here, and it doesn't reference either field.
    if (consentGranted(after.publicListingConsent)) {
      await publicRef.set({
        displayName,
        department,
        ...(grade ? { grade } : {}),
        ...(facility ? { facility } : {}),
        ...(town ? { town } : {}),
        folioNumber: str(after.folioNumber) ?? '',
        searchTokens: tokens,
      })
    } else {
      await publicRef.delete()
    }
  }
)
