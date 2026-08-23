/**
 * The logBroadcast mutation only — goes through a Function (firestore.rules
 * denies all client writes to broadcasts). The history read moved to the
 * Admin SDK (lib/data/broadcastAdminServer.ts, server-only) once
 * /admin/broadcast's history view became a Server Component.
 *
 * No inline httpsCallable in components — see CLAUDE.md conventions.
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase/functions'
import type { BroadcastComposeInput } from './schemas'

const callLogBroadcast = httpsCallable<BroadcastComposeInput, { ok: true; id: string }>(
  functions,
  'logBroadcast'
)

export async function logBroadcast(input: BroadcastComposeInput): Promise<void> {
  await callLogBroadcast(input)
}
