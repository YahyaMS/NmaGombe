'use client'

/**
 * The list itself is server-rendered (see page.tsx, lib/data/verificationAdmin.ts)
 * — no more onSnapshot subscription or per-row getVerificationSubject() round
 * trip. This component only owns the interactive part: approve/reject, which
 * still goes through decideVerification() (a Cloud Function via httpsCallable —
 * see docs/09-DECISIONS.md on why that write path isn't being duplicated into
 * a Route Handler). After a successful action, router.refresh() re-runs the
 * page's server data fetch instead of a live listener keeping this in sync —
 * a deliberate trade for bytes on a route only a couple of exec members open.
 *
 * useExecGuard is still needed here, unlike the read-only admin routes: the
 * Cloud Function call needs a real client-side Firebase Auth session to
 * attach an ID token, and the guard is what gets that session established
 * and ready before a click can fire.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useExecGuard } from '@/lib/auth/useExecGuard'
import { decideVerification } from '@/lib/data/verification'
import type { VerificationQueueRow } from '@/lib/data/verificationAdmin'
import { RegisterRow } from '@/components/ui/RegisterRow'

type RowAction = 'idle' | 'confirming-reject' | 'busy'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Africa/Lagos',
  })
}

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: 'pointer',
} as const

const dangerButtonStyle = {
  backgroundColor: 'transparent',
  color: 'var(--color-danger)',
  border: '1px solid var(--color-danger)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
} as const

const ghostButtonStyle = {
  backgroundColor: 'transparent',
  color: 'var(--color-ink-2)',
  border: '1px solid var(--color-rule-strong)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
} as const

export function VerificationQueue({ initialRequests }: { initialRequests: VerificationQueueRow[] }) {
  const router = useRouter()
  const { state: guardState } = useExecGuard()
  const [rowAction, setRowAction] = useState<Record<string, RowAction>>({})
  const [rowNote, setRowNote] = useState<Record<string, string>>({})
  const [rowError, setRowError] = useState<Record<string, string>>({})

  async function approve(requestId: string) {
    setRowAction((s) => ({ ...s, [requestId]: 'busy' }))
    setRowError((s) => ({ ...s, [requestId]: '' }))
    try {
      await decideVerification({ requestId, decision: 'approve' })
      router.refresh()
    } catch {
      setRowError((s) => ({ ...s, [requestId]: "Couldn't approve — try again." }))
      setRowAction((s) => ({ ...s, [requestId]: 'idle' }))
    }
  }

  async function reject(requestId: string) {
    setRowAction((s) => ({ ...s, [requestId]: 'busy' }))
    setRowError((s) => ({ ...s, [requestId]: '' }))
    try {
      await decideVerification({ requestId, decision: 'reject', note: rowNote[requestId]?.trim() || undefined })
      router.refresh()
    } catch {
      setRowError((s) => ({ ...s, [requestId]: "Couldn't reject — try again." }))
      setRowAction((s) => ({ ...s, [requestId]: 'confirming-reject' }))
    }
  }

  if (guardState !== 'ready') {
    return <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }} aria-live="polite" />
  }

  const pending = initialRequests.filter((r) => !r.decision)
  const decided = initialRequests.filter((r) => r.decision)

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>Verification queue</h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        Check the name against the eligibility list before approving.
      </p>

      <div className="mt-lg">
        {pending.length === 0 ? (
          <p className="type-body mt-lg" style={{ color: 'var(--color-ink-3)' }}>
            No pending requests.
          </p>
        ) : (
          pending.map((request) => {
            const action = rowAction[request.id] ?? 'idle'
            const busy = action === 'busy'
            return (
              <div key={request.id}>
                <RegisterRow
                  index={formatDate(request.submittedAt)}
                  primary={request.displayName || 'Unnamed'}
                  secondary={[request.department, request.facility, `Folio ${request.folioNumber}`, request.email]
                    .filter(Boolean)
                    .join(' · ')}
                  last={action === 'confirming-reject'}
                  action={
                    <div className="flex items-center gap-sm">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => approve(request.id)}
                        className="type-small font-semibold px-md py-xs"
                        style={{ ...primaryButtonStyle, opacity: busy ? 0.6 : 1 }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          setRowAction((s) => ({
                            ...s,
                            [request.id]: action === 'confirming-reject' ? 'idle' : 'confirming-reject',
                          }))
                        }
                        className="type-small font-semibold px-md py-xs"
                        style={{ ...dangerButtonStyle, opacity: busy ? 0.6 : 1 }}
                      >
                        Reject
                      </button>
                    </div>
                  }
                />
                {action === 'confirming-reject' && (
                  <div
                    className="flex flex-col gap-sm"
                    style={{
                      paddingBottom: 'var(--spacing-md)',
                      borderBottom: '1px solid var(--color-rule)',
                    }}
                  >
                    <label htmlFor={`note-${request.id}`} className="type-small" style={{ color: 'var(--color-ink-2)' }}>
                      Reason (optional — the member won&rsquo;t see this)
                    </label>
                    <textarea
                      id={`note-${request.id}`}
                      value={rowNote[request.id] ?? ''}
                      onChange={(e) => setRowNote((s) => ({ ...s, [request.id]: e.target.value }))}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-sm)',
                        border: '1px solid var(--color-rule-strong)',
                        borderRadius: 'var(--radius)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '14px',
                      }}
                    />
                    <div className="flex items-center gap-sm">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => reject(request.id)}
                        className="type-small font-semibold px-md py-xs"
                        style={{ ...dangerButtonStyle, backgroundColor: 'var(--color-danger)', color: 'var(--color-surface)', opacity: busy ? 0.6 : 1 }}
                      >
                        {busy ? 'Rejecting…' : 'Confirm reject'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setRowAction((s) => ({ ...s, [request.id]: 'idle' }))}
                        className="type-small font-semibold px-md py-xs"
                        style={ghostButtonStyle}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {rowError[request.id] && (
                  <p className="type-small" style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-xs)' }}>
                    {rowError[request.id]}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>

      {decided.length > 0 && (
        <div className="mt-2xl">
          <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Decided</p>
          <div className="mt-md">
            {decided.map((request, i) => (
              <RegisterRow
                key={request.id}
                index={formatDate(request.submittedAt)}
                primary={request.displayName || request.uid}
                secondary={`Folio ${request.folioNumber} · ${request.decision === 'approve' ? 'Approved' : 'Rejected'}`}
                last={i === decided.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
