/**
 * All Firestore access to members/ and verificationRequests/ goes through here.
 * No inline getDoc/setDoc in components — see CLAUDE.md conventions.
 */

import {
  doc,
  updateDoc,
  onSnapshot,
  getDoc,
  serverTimestamp,
  deleteField,
  collection,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import {
  memberSignupSchema,
  memberProfileSchema,
  profileUpdateSchema,
  PUBLIC_LISTING_CONSENT_NOTICE_VERSION,
  type MemberSignupInput,
  type MemberProfile,
  type ProfileUpdateInput,
} from './schemas'

/**
 * Registers a new member: their own profile AND the verification request an
 * admin reviews, in ONE atomic batch.
 *
 * These used to be two sequential awaits from the signup form, and the two
 * halves are read by different people — /pending reads members/{uid}, the admin
 * queue reads verificationRequests. A failure between them (a closed tab, a
 * dropped connection on the second write) left the member looking at "we're
 * reviewing your application" while the admin's queue stayed empty, with
 * nothing in either view to reveal the mismatch. A batch commits both or
 * neither, so that state is no longer reachable.
 *
 * Rules enforce status:"pending", role:"member", and that email matches the
 * signed-in identity; batched writes are evaluated per document, so both halves
 * are still checked independently — see firestore.rules.
 */
export async function registerNewMember(uid: string, input: MemberSignupInput): Promise<void> {
  const parsed = memberSignupSchema.parse(input)
  const batch = writeBatch(db)

  batch.set(doc(db, 'members', uid), {
    displayName: parsed.displayName,
    department: parsed.department,
    ...(parsed.facility ? { facility: parsed.facility } : {}),
    folioNumber: parsed.folioNumber,
    email: parsed.email,
    status: 'pending',
    role: 'member',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Kept a separate document from members/{uid} for the audit trail
  // (docs/03-DATA-MODEL.md). addDoc can't join a batch, so the id is generated
  // client-side by doc() instead — same random id, just minted locally.
  batch.set(doc(collection(db, 'verificationRequests')), {
    uid,
    folioNumber: parsed.folioNumber,
    submittedAt: serverTimestamp(),
  })

  await batch.commit()
}

/**
 * /portal/profile writes here directly — none of these are trust fields, and the
 * onMemberWrite trigger (functions/src/directory-projection.ts) picks up the change
 * and keeps directoryEntries/publicDirectory in sync. See ADR-014.
 */
export async function updateOwnProfile(uid: string, input: ProfileUpdateInput): Promise<void> {
  const parsed = profileUpdateSchema.parse(input)
  // Optional fields use deleteField() when empty, not omission — omitting a key
  // leaves Firestore's existing value untouched, so clearing a field in the form
  // would otherwise silently fail to clear it.
  await updateDoc(doc(db, 'members', uid), {
    department: parsed.department,
    grade: parsed.grade,
    facility: parsed.facility || deleteField(),
    subspecialty: parsed.subspecialty || deleteField(),
    town: parsed.town || deleteField(),
    phone: parsed.phone || deleteField(),
    whatsapp: parsed.whatsapp || deleteField(),
    visibility: parsed.visibility,
    // Re-stamped on every save, not only the first time this flips true — see
    // schemas.ts's ConsentRecord comment for why that's the honest choice.
    publicListingConsent: {
      granted: parsed.publicListingConsent,
      at: new Date().toISOString(),
      noticeVersion: PUBLIC_LISTING_CONSENT_NOTICE_VERSION,
    },
    mdcnRenewalMonth: parsed.mdcnRenewalMonth ?? deleteField(),
    updatedAt: serverTimestamp(),
  })
}

/** One-time read of the signed-in member's own profile, to prefill /portal/profile. */
export async function getOwnMemberProfile(uid: string): Promise<MemberProfile | null> {
  const snap = await getDoc(doc(db, 'members', uid))
  if (!snap.exists()) return null
  const parsed = memberProfileSchema.safeParse(snap.data())
  return parsed.success ? parsed.data : null
}

/** Live updates to the signed-in member's own profile — used by /pending to reflect approval. */
export function subscribeToOwnMemberProfile(
  uid: string,
  onChange: (profile: MemberProfile | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'members', uid),
    (snap) => {
      if (!snap.exists()) {
        onChange(null)
        return
      }
      const parsed = memberProfileSchema.safeParse(snap.data())
      onChange(parsed.success ? parsed.data : null)
    },
    (err) => onError?.(err)
  )
}
