/**
 * Server Component — no client Firebase SDK. See NewsAdminList.tsx's comment;
 * same conversion, same reasoning.
 */

import Link from 'next/link'
import { listAllEventsAdmin } from '@/lib/data/eventsAdmin'
import { RegisterRow } from '@/components/ui/RegisterRow'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Africa/Lagos',
  })
}

export async function EventsAdminList() {
  const items = await listAllEventsAdmin()

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
        {items.length === 0 ? (
          <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
            No events published yet.
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
  )
}
