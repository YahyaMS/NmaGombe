/**
 * All Firestore access to members/ and verificationRequests/ goes through here.
 * No inline getDoc/setDoc in components — see CLAUDE.md conventions.
 */

import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  addDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { memberSignupSchema, memberProfileSchema, type MemberSignupInput, type MemberProfile } from './schemas'

/**
 * Creates the member's own profile on signup. Rules enforce status:"pending",
 * role:"member", and that email matches the signed-in identity — see firestore.rules.
 */
export async function createMemberProfile(uid: string, input: MemberSignupInput): Promise<void> {
  const parsed = memberSignupSchema.parse(input)
  await setDoc(doc(db, 'members', uid), {
    displayName: parsed.displayName,
    department: parsed.department,
    folioNumber: parsed.folioNumber,
    email: parsed.email,
    status: 'pending',
    role: 'member',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/**
 * Files the verification request an admin reviews against the eligibility list.
 * Kept separate from members/{uid} for the audit trail (docs/03-DATA-MODEL.md).
 */
export async function submitVerificationRequest(uid: string, folioNumber: string): Promise<void> {
  await addDoc(collection(db, 'verificationRequests'), {
    uid,
    folioNumber,
    submittedAt: serverTimestamp(),
  })
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
