/**
 * /events — CME sessions and chapter events, soonest first. Register rows per
 * design.md §5: mono index is the event date, the content's true identifier.
 * Past events are removed by the admin (docs/07-CONTENT-OPS.md quarterly
 * review — "delete, don't archive"), so this list is simply what's upcoming.
 */

import type { Metadata } from 'next'
import { listPublishedEvents } from '@/lib/data/events'
import { RegisterRow } from '@/components/ui/RegisterRow'

export const metadata: Metadata = {
  title: 'Events — NMA Gombe',
  description: 'CME sessions and chapter events from the Nigerian Medical Association, Gombe State Chapter.',
}

function formatDate(ts: { toDate: () => Date } | null): string {
  if (!ts) return '—'
  return ts.toDate().toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })
}

export default async function EventsPage() {
  const items = await listPublishedEvents()

  return (
    <div style={{ backgroundColor: 'var(--color-paper)' }}>
      <header style={{ backgroundColor: 'var(--color-green-deep)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Events
          </p>
          <h1 className="type-h1" style={{ color: 'var(--color-surface)', maxWidth: '22ch' }}>
            CME and chapter events
          </h1>
        </div>
      </header>

      <div className="mx-auto px-md" style={{ maxWidth: 'var(--width-shell)' }}>
        <div className="mt-lg" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          {items.length === 0 ? (
            <p className="type-body mt-lg" style={{ color: 'var(--color-ink-3)' }}>
              No upcoming events.
            </p>
          ) : (
            items.map((item, i) => (
              <RegisterRow
                key={item.slug}
                index={formatDate(item.startAt)}
                primary={item.title}
                secondary={item.location}
                href={`/events/${item.slug}`}
                last={i === items.length - 1}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
