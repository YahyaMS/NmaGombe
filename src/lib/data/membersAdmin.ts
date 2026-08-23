/**
 * Admin-side member mutations only — setMemberStatus/setMemberRole go
 * through Functions (firestore.rules denies all direct client writes to
 * those trust fields, so the write can't skip the custom-claim sync). The
 * list read moved to the Admin SDK (lib/data/membersAdminServer.ts,
 * server-only) once /admin/members' list view became a Server Component.
 *
 * No inline httpsCallable in components — see CLAUDE.md conventions.
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase/functions'

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
