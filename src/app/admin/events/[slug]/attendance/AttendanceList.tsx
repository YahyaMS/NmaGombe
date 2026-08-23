'use client'

/**
 * The registrant list is server-rendered (see page.tsx,
 * lib/data/registrationsAdmin.ts). router.refresh() re-fetches it after a
 * mark/unmark, same pattern as /admin/verification — see
 * docs/09-DECISIONS.md. useExecGuard is still needed here even though the
 * layout already gates the page: markAttendance/unmarkAttendance are Cloud
 * Functions called via httpsCallable, which needs a real client-side
 * Firebase Auth session to attach an ID token.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useExecGuard } from '@/lib/auth/useExecGuard'
import { markAttendance, unmarkAttendance } from '@/lib/data/attendance'
import type { AdminEventItem } from '@/lib/data/eventsAdmin'
import type { RegistrantRow } from '@/lib/data/registrationsAdmin'
import { RegisterRow } from '@/components/ui/RegisterRow'

type RowAction = 'idle' | 'busy'

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
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

const ghostButtonStyle = {
  backgroundColor: 'transparent',
  color: 'var(--color-ink-2)',
  border: '1px solid var(--color-rule-strong)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
} as const

export function AttendanceList({
  event,
  registrants,
}: {
  event: AdminEventItem
  registrants: RegistrantRow[]
}) {
  const router = useRouter()
  const { state: guardState } = useExecGuard()
  const [rowAction, setRowAction] = useState<Record<string, RowAction>>({})
  const [rowError, setRowError] = useState<Record<string, string>>({})

  async function handleMark(uid: string) {
    setRowAction((s) => ({ ...s, [uid]: 'busy' }))
    setRowError((s) => ({ ...s, [uid]: '' }))
    try {
      await markAttendance({ eventId: event.slug, uid })
      router.refresh()
    } catch {
      setRowError((s) => ({ ...s, [uid]: "Couldn't mark attendance — try again." }))
    } finally {
      setRowAction((s) => ({ ...s, [uid]: 'idle' }))
    }
  }

  async function handleUnmark(uid: string) {
    setRowAction((s) => ({ ...s, [uid]: 'busy' }))
    setRowError((s) => ({ ...s, [uid]: '' }))
    try {
      await unmarkAttendance({ eventId: event.slug, uid })
      router.refresh()
    } catch {
      setRowError((s) => ({ ...s, [uid]: "Couldn't undo — try again." }))
    } finally {
      setRowAction((s) => ({ ...s, [uid]: 'idle' }))
    }
  }

  if (guardState !== 'ready') {
    return <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }} aria-live="polite" />
  }

  const attendedCount = registrants.filter((r) => r.attended).length

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>{event.title}</h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        {formatDateTime(event.startAt)} · {event.location}
      </p>
      <p className="type-small mt-sm" style={{ color: 'var(--color-ink-3)' }}>
        {event.cpdCreditUnits
          ? `Marking attendance credits ${event.cpdCreditUnits} CPD unit${event.cpdCreditUnits === 1 ? '' : 's'} to the member's log.`
          : 'This event has no CPD credit units set — marking attendance here records it but adds nothing to a CPD log.'}
      </p>

      <div className="mt-lg" style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--spacing-md)' }}>
        <p className="type-small" style={{ color: 'var(--color-ink-2)' }}>
          {registrants.length} registered · {attendedCount} marked attended
        </p>
      </div>

      <div className="mt-md">
        {registrants.length === 0 ? (
          <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
            No one has registered for this event yet.
          </p>
        ) : (
          registrants.map((r, i) => {
            const action = rowAction[r.uid] ?? 'idle'
            const busy = action === 'busy'
            const secondaryParts = [`Folio ${r.folioNumber}`]
            if (r.attended) {
              secondaryParts.push(`Attended, marked ${formatDateTime(r.attendanceMarkedAt)}`)
              if (r.cpdEntryCredited) secondaryParts.push('CPD credited')
            } else if (r.attendanceUnmarkedAt) {
              secondaryParts.push(`Attendance withdrawn ${formatDateTime(r.attendanceUnmarkedAt)}`)
            }

            return (
              <div key={r.uid}>
                <RegisterRow
                  primary={r.displayName || 'Unnamed'}
                  secondary={secondaryParts.join(' · ')}
                  last={i === registrants.length - 1}
                  action={
                    r.attended ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleUnmark(r.uid)}
                        className="type-small font-semibold px-md py-xs"
                        style={{ ...ghostButtonStyle, opacity: busy ? 0.6 : 1 }}
                      >
                        {busy ? 'Undoing…' : 'Undo'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleMark(r.uid)}
                        className="type-small font-semibold px-md py-xs"
                        style={{ ...primaryButtonStyle, opacity: busy ? 0.6 : 1 }}
                      >
                        {busy ? 'Marking…' : 'Mark attended'}
                      </button>
                    )
                  }
                />
                {rowError[r.uid] && (
                  <p className="type-small" style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-xs)' }}>
                    {rowError[r.uid]}
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
