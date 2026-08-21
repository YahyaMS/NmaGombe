'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useExecGuard } from '@/lib/auth/useExecGuard'
import { listAllEvents, type AdminEventItem } from '@/lib/data/eventsAdmin'
import { RegisterRow } from '@/components/ui/RegisterRow'

type Stage = 'checking' | 'ready' | 'error'

function formatDate(ts: AdminEventItem['startAt']): string {
  if (!ts) return '—'
  return ts.toDate().toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })
}

export function EventsAdminList() {
  const { state: guardState } = useExecGuard()
  const [stage, setStage] = useState<Stage>('checking')
  const [items, setItems] = useState<AdminEventItem[]>([])

  useEffect(() => {
    if (guardState !== 'ready') return
    listAllEvents()
      .then((result) => {
        setItems(result)
        setStage('ready')
      })
      .catch(() => setStage('error'))
  }, [guardState])

  if (guardState !== 'ready' || stage === 'checking') {
    return <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }} aria-live="polite" />
  }

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
          <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>Events</h1>
        </div>
        <Link
          href="/admin/events/new"
          className="type-small font-semibold px-md py-sm"
          style={{ backgroundColor: 'var(--color-green)', color: 'var(--color-surface)', borderRadius: 'var(--radius)', textDecoration: 'none' }}
        >
          New event
        </Link>
      </div>

      <div className="mt-lg">
        {stage === 'error' && (
          <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
            Couldn&rsquo;t load the list. Reload the page.
          </p>
        )}

        {stage === 'ready' && items.length === 0 && (
          <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
            No events published yet.
          </p>
        )}

        {stage === 'ready' &&
          items.map((item, i) => (
            <RegisterRow
              key={item.slug}
              index={formatDate(item.startAt)}
              primary={item.title}
              secondary={item.location}
              href={`/events/${item.slug}`}
              last={i === items.length - 1}
            />
          ))}
      </div>
    </div>
  )
}
