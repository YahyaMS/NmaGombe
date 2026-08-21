/**
 * /news — communiqués, news, advocacy, obituaries. Filterable by category via
 * a plain ?category= link (no client JS — a Server Component page stays a
 * Server Component). Register rows per design.md §5: mono index is the
 * publish date, the content's true identifier.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { listPublishedNews } from '@/lib/data/news'
import { newsCategorySchema, newsCategoryLabels, type NewsCategory } from '@/lib/data/schemas'
import { RegisterRow } from '@/components/ui/RegisterRow'

export const metadata: Metadata = {
  title: 'News — NMA Gombe',
  description: 'Communiqués, news, advocacy and notices from the Nigerian Medical Association, Gombe State Chapter.',
}

function formatDate(ts: { toDate: () => Date } | null): string {
  if (!ts) return '—'
  return ts.toDate().toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category: rawCategory } = await searchParams
  const category = newsCategorySchema.safeParse(rawCategory).success
    ? (rawCategory as NewsCategory)
    : undefined

  const items = await listPublishedNews(category)

  return (
    <div style={{ backgroundColor: 'var(--color-paper)' }}>
      <header style={{ backgroundColor: 'var(--color-green-deep)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
            News
          </p>
          <h1 className="type-h1" style={{ color: 'var(--color-surface)', maxWidth: '22ch' }}>
            News and communiqués
          </h1>
        </div>
      </header>

      <div className="mx-auto px-md" style={{ maxWidth: 'var(--width-shell)' }}>
        <nav aria-label="Filter by category" className="flex flex-wrap gap-sm mt-lg">
          <CategoryPill href="/news" label="All" active={!category} />
          {newsCategorySchema.options.map((c) => (
            <CategoryPill key={c} href={`/news?category=${c}`} label={newsCategoryLabels[c]} active={category === c} />
          ))}
        </nav>

        <div className="mt-lg" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          {items.length === 0 ? (
            <p className="type-body mt-lg" style={{ color: 'var(--color-ink-3)' }}>
              {category ? `No ${newsCategoryLabels[category].toLowerCase()} items yet.` : 'Nothing published yet.'}
            </p>
          ) : (
            items.map((item, i) => (
              <RegisterRow
                key={item.slug}
                index={formatDate(item.publishedAt)}
                primary={item.title}
                secondary={`${newsCategoryLabels[item.category]} · ${item.excerpt}`}
                href={`/news/${item.slug}`}
                last={i === items.length - 1}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function CategoryPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="type-small font-semibold px-md py-xs"
      style={{
        borderRadius: 'var(--radius)',
        textDecoration: 'none',
        backgroundColor: active ? 'var(--color-green)' : 'var(--color-green-wash)',
        color: active ? 'var(--color-surface)' : 'var(--color-green)',
      }}
    >
      {label}
    </Link>
  )
}
