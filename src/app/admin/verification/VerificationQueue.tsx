'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import {
  subscribeToVerificationQueue,
  getVerificationSubject,
  decideVerification,
  type VerificationRequest,
  type VerificationSubject,
} from '@/lib/data/verification'
import { RegisterRow } from '@/components/ui/RegisterRow'

type Stage = 'checking' | 'ready' | 'offline'
type RowAction = 'idle' | 'confirming-reject' | 'busy'

function formatDate(ts: VerificationRequest['submittedAt']): string {
  if (!ts) return '—'
  return ts.toDate().toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })
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

export function VerificationQueue() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('checking')
  const [requests, setRequests] = useState<VerificationRequest[] | null>(null)
  const [subjects, setSubjects] = useState<Record<string, VerificationSubject>>({})
  const [rowAction, setRowAction] = useState<Record<string, RowAction>>({})
  const [rowNote, setRowNote] = useState<Record<string, string>>({})
  const [rowError, setRowError] = useState<Record<string, string>>({})
  const fetchedSubjects = useRef(new Set<string>())

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/signup')
        return
      }
      user.getIdTokenResult(true).then((token) => {
        if (token.claims.role !== 'admin') {
          router.replace('/')
          return
        }
        setStage('ready')
      })
    })
    return unsubAuth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (stage !== 'ready') return
    const unsub = subscribeToVerificationQueue(setRequests, () => setStage('offline'))
    return unsub
  }, [stage])

  useEffect(() => {
    if (!requests) return
    const missing = requests
      .map((r) => r.uid)
      .filter((uid) => !fetchedSubjects.current.has(uid))
    if (missing.length === 0) return
    for (const uid of missing) fetchedSubjects.current.add(uid)
    Promise.all(missing.map(async (uid) => [uid, await getVerificationSubject(uid)] as const)).then(
      (pairs) => {
        setSubjects((prev) => {
          const next = { ...prev }
          for (const [uid, subject] of pairs) if (subject) next[uid] = subject
          return next
        })
      }
    )
  }, [requests])

  async function approve(requestId: string) {
    setRowAction((s) => ({ ...s, [requestId]: 'busy' }))
    setRowError((s) => ({ ...s, [requestId]: '' }))
    try {
      await decideVerification({ requestId, decision: 'approve' })
    } catch {
      setRowError((s) => ({ ...s, [requestId]: "Couldn't approve — try again." }))
    }
    setRowAction((s) => ({ ...s, [requestId]: 'idle' }))
  }

  async function reject(requestId: string) {
    setRowAction((s) => ({ ...s, [requestId]: 'busy' }))
    setRowError((s) => ({ ...s, [requestId]: '' }))
    try {
      await decideVerification({ requestId, decision: 'reject', note: rowNote[requestId]?.trim() || undefined })
    } catch {
      setRowError((s) => ({ ...s, [requestId]: "Couldn't reject — try again." }))
      setRowAction((s) => ({ ...s, [requestId]: 'confirming-reject' }))
      return
    }
    setRowAction((s) => ({ ...s, [requestId]: 'idle' }))
  }

  if (stage === 'checking') {
    return <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }} aria-live="polite" />
  }

  if (stage === 'offline') {
    return (
      <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }}>
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Offline</p>
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>You&rsquo;re offline</h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Reconnect and reload to see the verification queue.
        </p>
      </div>
    )
  }

  const pending = (requests ?? []).filter((r) => !r.decision)
  const decided = (requests ?? []).filter((r) => r.decision)

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>Verification queue</h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        Check the name against the eligibility list before approving.
      </p>

      <div className="mt-lg">
        {requests === null ? null : pending.length === 0 ? (
          <p className="type-body mt-lg" style={{ color: 'var(--color-ink-3)' }}>
            No pending requests.
          </p>
        ) : (
          pending.map((request) => {
            const subject = subjects[request.uid]
            const action = rowAction[request.id] ?? 'idle'
            const busy = action === 'busy'
            return (
              <div key={request.id}>
                <RegisterRow
                  index={formatDate(request.submittedAt)}
                  primary={subject?.displayName || 'Loading…'}
                  secondary={
                    subject
                      ? [subject.department, subject.facility, `Folio ${request.folioNumber}`, subject.email]
                          .filter(Boolean)
                          .join(' · ')
                      : `Folio ${request.folioNumber}`
                  }
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
            {decided.map((request, i) => {
              const subject = subjects[request.uid]
              return (
                <RegisterRow
                  key={request.id}
                  index={formatDate(request.submittedAt)}
                  primary={subject?.displayName || request.uid}
                  secondary={`Folio ${request.folioNumber} · ${request.decision === 'approve' ? 'Approved' : 'Rejected'}`}
                  last={i === decided.length - 1}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
