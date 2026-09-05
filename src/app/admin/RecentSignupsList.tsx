'use client'

/**
 * AdminDashboard (Server Component) already reads up to RECENT_COUNT signups
 * from a single Admin-SDK call — this just decides how many of them to show
 * at once. "See more" is a pure client-side reveal of data already sent down
 * with the page, not a second fetch: the chapter asked for more names to be
 * visible without a click through to /admin/verification, and the data was
 * already there.
 */

import { useState } from 'react'
import { RegisterRow } from '@/components/ui/RegisterRow'
import type { DashboardSignup } from '@/lib/data/verificationAdmin'

const INITIAL_COUNT = 5

function formatDate(iso: DashboardSignup['submittedAt']): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Africa/Lagos',
  })
}

export function RecentSignupsList({ recent }: { recent: DashboardSignup[] }) {
  const [expanded, setExpanded] = useState(false)
  const showButton = !expanded && recent.length > INITIAL_COUNT
  const visible = expanded ? recent : recent.slice(0, INITIAL_COUNT)

  return (
    <>
      {visible.map((request, i) => (
        <RegisterRow
          key={request.id}
          index={formatDate(request.submittedAt)}
          primary={request.displayName || 'Unnamed'}
          secondary={
            request.decision
              ? request.decision === 'approve' ? 'Approved' : 'Rejected'
              : 'Pending'
          }
          last={i === visible.length - 1 && !showButton}
        />
      ))}
      {showButton && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="type-small font-semibold mt-sm"
          style={{
            color: 'var(--color-green)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          See more →
        </button>
      )}
    </>
  )
}
