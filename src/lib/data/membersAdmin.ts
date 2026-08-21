/**
 * Admin-side member management: search/list, suspend/reinstate, grant roles.
 * No inline getDocs/httpsCallable in components — see CLAUDE.md conventions.
 *
 * Listing is a direct client-SDK read (firestore.rules already permits
 * `get, list` to isAdmin() — unaffected by the members/{uid} update-rule
 * fix, which only tightened writes). Status/role changes go through
 * Functions — firestore.rules denies all direct client writes to those
 * trust fields, deliberately, so the write can't skip the custom-claim sync.
 */

import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase/client'
import { memberProfileSchema, type MemberProfile } from './schemas'

export interface MemberRow extends MemberProfile {
  uid: string
}

/** One-shot fetch, filtered client-side — same deliberate shape as /portal/directory. */
export async function listAllMembers(): Promise<MemberRow[]> {
  const snap = await getDocs(query(collection(db, 'members'), orderBy('displayName')))
  const rows: MemberRow[] = []
  for (const d of snap.docs) {
    const parsed = memberProfileSchema.safeParse(d.data())
    if (parsed.success) rows.push({ uid: d.id, ...parsed.data })
  }
  return rows
}

interface SetMemberStatusInput {
  uid: string
  status: 'verified' | 'suspended'
}

const callSetMemberStatus = httpsCallable<SetMemberStatusInput, { ok: true }>(
  functions,
  'setMemberStatus'
)

export async function setMemberStatus(input: SetMemberStatusInput): Promise<void> {
  await callSetMemberStatus(input)
}

interface SetMemberRoleInput {
  uid: string
  role: 'member' | 'exec' | 'admin'
}

const callSetMemberRole = httpsCallable<SetMemberRoleInput, { ok: true }>(
  functions,
  'setMemberRole'
)

export async function setMemberRole(input: SetMemberRoleInput): Promise<void> {
  await callSetMemberRole(input)
}
