import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedEventBySlug } from '@/lib/data/events'
import { renderMarkdown } from '@/lib/markdown'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const item = await getPublishedEventBySlug(slug)
  if (!item) return { title: 'Not found — NMA Gombe' }
  return { title: `${item.title} — NMA Gombe`, description: item.location }
}

function formatDateTime(ts: { toDate: () => Date } | null): string {
  if (!ts) return ''
  return ts.toDate().toLocaleDateString('en-NG', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = await getPublishedEventBySlug(slug)
  if (!item) notFound()

  return (
    <div style={{ backgroundColor: 'var(--color-paper)' }}>
      <header style={{ backgroundColor: 'var(--color-green-deep)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-prose)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Event
          </p>
          <h1 className="type-h1" style={{ color: 'var(--color-surface)' }}>
            {item.title}
          </h1>
          <p className="type-small mt-md" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {formatDateTime(item.startAt)} · {item.location}
          </p>
        </div>
      </header>

      <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-prose)' }}>
        {renderMarkdown(item.description)}

        <Link
          href="/events"
          className="type-small font-semibold mt-2xl"
          style={{ color: 'var(--color-green)', textDecoration: 'underline', display: 'inline-block' }}
        >
          ← All events
        </Link>
      </div>
    </div>
  )
}
