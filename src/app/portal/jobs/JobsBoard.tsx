'use client'

/**
 * /portal/jobs — locum/job board. See docs/03-DATA-MODEL.md's jobs section
 * for the compulsory-expiry and moderation-is-delete-only design decisions.
 *
 * The first member-generated, unmoderated content in the app (every other
 * write is exec-authored or self-scoped) — exec can remove a listing here,
 * members can only remove their own.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useVerifiedMemberGuard } from '@/lib/auth/useVerifiedMemberGuard'
import { getOwnMemberProfile } from '@/lib/data/members'
import { deleteJob, markJobFilled, subscribeToActiveJobs, type JobRow } from '@/lib/data/jobs'
import { jobTypeLabels } from '@/lib/data/schemas'
import { whatsAppLink, telLink } from '@/lib/whatsapp'
import { RegisterRow } from '@/components/ui/RegisterRow'

type Stage = 'loading' | 'ready' | 'offline'
type RowAction = 'idle' | 'busy'

const EXPIRING_SOON_DAYS = 3

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  border: 'none',
  textDecoration: 'none',
  display: 'inline-block',
} as const

function daysUntil(expiresAt: JobRow['expiresAt']): number {
  const ms = expiresAt.toDate().getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

function expiryLabel(days: number): string {
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  return `Expires in ${days} days`
}

export function JobsBoard() {
  const { state: guardState, uid } = useVerifiedMemberGuard()
  const [stage, setStage] = useState<Stage>('loading')
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [isExec, setIsExec] = useState(false)
  const [rowAction, setRowAction] = useState<Record<string, RowAction>>({})
  const [rowError, setRowError] = useState<Record<string, string>>({})

  useEffect(() => {
    if (guardState !== 'ready' || !uid) return
    void getOwnMemberProfile(uid).then((profile) => {
      setIsExec(profile?.role === 'exec' || profile?.role === 'admin')
    })
    return subscribeToActiveJobs(
      (rows) => {
        setJobs(rows)
        setStage('ready')
      },
      () => setStage('offline')
    )
  }, [guardState, uid])

  async function handleMarkFilled(jobId: string) {
    setRowAction((s) => ({ ...s, [jobId]: 'busy' }))
    setRowError((s) => ({ ...s, [jobId]: '' }))
    try {
      await markJobFilled(jobId)
    } catch {
      setRowError((s) => ({ ...s, [jobId]: "Couldn't update — try again." }))
    } finally {
      setRowAction((s) => ({ ...s, [jobId]: 'idle' }))
    }
  }

  async function handleDelete(jobId: string) {
    setRowAction((s) => ({ ...s, [jobId]: 'busy' }))
    setRowError((s) => ({ ...s, [jobId]: '' }))
    try {
      await deleteJob(jobId)
    } catch {
      setRowError((s) => ({ ...s, [jobId]: "Couldn't remove — try again." }))
      setRowAction((s) => ({ ...s, [jobId]: 'idle' }))
    }
  }

  const shellStyle = { maxWidth: '640px' } as const

  if (guardState !== 'ready' || stage === 'loading') {
    return <div className="mx-auto px-md py-2xl" style={shellStyle} aria-live="polite" />
  }

  if (stage === 'offline') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Offline</p>
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>You&rsquo;re offline</h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          The job board hasn&rsquo;t synced to this device yet, so there&rsquo;s nothing cached to
          show. Connect once and it&rsquo;ll be available offline after that.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto px-md py-2xl" style={shellStyle}>
      <div className="flex items-center justify-between">
        <div>
          <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Portal</p>
          <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>Jobs &amp; locums</h1>
        </div>
        <Link href="/portal/jobs/new" className="type-small font-semibold px-md py-sm" style={primaryButtonStyle}>
          Post a listing
        </Link>
      </div>

      <div className="mt-lg">
        {jobs.length === 0 ? (
          <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
            Nothing posted right now.
          </p>
        ) : (
          jobs.map((job, i) => {
            const days = daysUntil(job.expiresAt)
            const expiringSoon = days <= EXPIRING_SOON_DAYS
            const isOwner = job.postedBy === uid
            const action = rowAction[job.id] ?? 'idle'
            const busy = action === 'busy'
            const wa = whatsAppLink(job.contactVia)
            const call = telLink(job.contactVia)

            return (
              <div key={job.id}>
                <RegisterRow
                  index={expiryLabel(days)}
                  indexColor={expiringSoon ? 'var(--color-harmattan)' : undefined}
                  primary={job.title}
                  secondary={`${jobTypeLabels[job.type]} · ${job.facility} · ${job.town} · ${expiryLabel(days)}`}
                  last={i === jobs.length - 1}
                  action={
                    <div className="flex items-center gap-sm flex-wrap justify-end">
                      {wa && (
                        <a href={wa} target="_blank" rel="noopener noreferrer" className="type-small font-semibold" style={{ color: 'var(--color-green)' }}>
                          WhatsApp
                        </a>
                      )}
                      {call && (
                        <a href={call} className="type-small font-semibold" style={{ color: 'var(--color-green)' }}>
                          Call
                        </a>
                      )}
                      {isOwner && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleMarkFilled(job.id)}
                          className="type-small"
                          style={{ color: 'var(--color-ink-2)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
                        >
                          Mark filled
                        </button>
                      )}
                      {(isOwner || isExec) && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDelete(job.id)}
                          className="type-small"
                          style={{ color: 'var(--color-danger)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  }
                />
                {rowError[job.id] && (
                  <p className="type-small" style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-xs)' }}>
                    {rowError[job.id]}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
