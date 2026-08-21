'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useExecGuard } from '@/lib/auth/useExecGuard'
import {
  subscribeToVerificationQueue,
  getVerificationSubject,
  type VerificationRequest,
  type VerificationSubject,
} from '@/lib/data/verification'
import { RegisterRow } from '@/components/ui/RegisterRow'

type Stage = 'checking' | 'ready' | 'offline'

const RECENT_COUNT = 5

const quickLinks = [
  { href: '/admin/verification', label: 'Verification queue' },
  { href: '/admin/members', label: 'Members' },
  { href: '/admin/news', label: 'News' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/broadcast', label: 'Broadcast' },
]

function formatDate(ts: VerificationRequest['submittedAt']): string {
  if (!ts) return '—'
  return ts.toDate().toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })
}

export function AdminDashboard() {
  const { state: guardState } = useExecGuard()
  const [stage, setStage] = useState<Stage>('checking')
  const [requests, setRequests] = useState<VerificationRequest[] | null>(null)
  const [subjects, setSubjects] = useState<Record<string, VerificationSubject>>({})

  useEffect(() => {
    if (guardState !== 'ready') return
    const unsub = subscribeToVerificationQueue(
      (r) => {
        setRequests(r)
        setStage('ready')
      },
      () => setStage('offline')
    )
    return unsub
  }, [guardState])

  const recent = (requests ?? [])
    .slice()
    .sort((a, b) => (b.submittedAt?.toMillis() ?? 0) - (a.submittedAt?.toMillis() ?? 0))
    .slice(0, RECENT_COUNT)

  useEffect(() => {
    const missing = recent.map((r) => r.uid).filter((uid) => !subjects[uid])
    if (missing.length === 0) return
    Promise.all(missing.map(async (uid) => [uid, await getVerificationSubject(uid)] as const)).then(
      (pairs) => {
        setSubjects((prev) => {
          const next = { ...prev }
          for (const [uid, subject] of pairs) if (subject) next[uid] = subject
          return next
        })
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests])

  if (guardState !== 'ready' || stage === 'checking') {
    return <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }} aria-live="polite" />
  }

  if (stage === 'offline') {
    return (
      <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }}>
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Offline</p>
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>You&rsquo;re offline</h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Reconnect and reload to see the dashboard.
        </p>
      </div>
    )
  }

  const pendingCount = (requests ?? []).filter((r) => !r.decision).length

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>Dashboard</h1>

      <Link
        href="/admin/verification"
        className="block mt-lg"
        style={{
          textDecoration: 'none',
          padding: 'var(--spacing-md) 0',
          borderTop: '1px solid var(--color-rule)',
          borderBottom: '1px solid var(--color-rule)',
        }}
      >
        <p className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>Pending verification</p>
        <p className="type-display mt-xs" style={{ color: pendingCount > 0 ? 'var(--color-harmattan)' : 'var(--color-ink)' }}>
          {pendingCount}
        </p>
      </Link>

      <div className="mt-lg">
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Recent signups</p>
        <div className="mt-md">
          {recent.length === 0 ? (
            <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
              No signups yet.
            </p>
          ) : (
            recent.map((request, i) => {
              const subject = subjects[request.uid]
              return (
                <RegisterRow
                  key={request.id}
                  index={formatDate(request.submittedAt)}
                  primary={subject?.displayName || 'Loading…'}
                  secondary={
                    request.decision
                      ? request.decision === 'approve' ? 'Approved' : 'Rejected'
                      : 'Pending'
                  }
                  last={i === recent.length - 1}
                />
              )
            })
          )}
        </div>
      </div>

      <div className="mt-2xl" style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--spacing-md)' }}>
        {quickLinks.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            className="type-body block"
            style={{
              padding: 'var(--spacing-sm) 0',
              borderBottom: i < quickLinks.length - 1 ? '1px solid var(--color-rule)' : undefined,
              color: 'var(--color-ink)',
              textDecoration: 'none',
            }}
          >
            {link.label} →
          </Link>
        ))}
      </div>
    </div>
  )
}
