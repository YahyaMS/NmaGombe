/**
 * Server Component — no client Firebase SDK. The admin/exec-only gate is the
 * layout's server-side session check (src/app/admin/layout.tsx); this file
 * has no client-side guard because it renders nothing until that check has
 * already passed. See docs/09-DECISIONS.md for the conversion this replaced.
 */

import Link from 'next/link'
import { listAllNewsAdmin } from '@/lib/data/newsAdmin'
import { newsCategoryLabels } from '@/lib/data/schemas'
import { RegisterRow } from '@/components/ui/RegisterRow'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Africa/Lagos',
  })
}

export async function NewsAdminList() {
  const items = await listAllNewsAdmin()

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
          <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>News</h1>
        </div>
        <Link
          href="/admin/news/new"
          className="type-small font-semibold px-md py-sm"
          style={{ backgroundColor: 'var(--color-green)', color: 'var(--color-surface)', borderRadius: 'var(--radius)', textDecoration: 'none' }}
        >
          New communiqué
        </Link>
      </div>

      <div className="mt-lg">
        {items.length === 0 ? (
          <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
            Nothing published yet.
          </p>
        ) : (
          items.map((item, i) => (
            <RegisterRow
              key={item.slug}
              index={formatDate(item.publishedAt)}
              primary={item.title}
              secondary={newsCategoryLabels[item.category]}
              href={`/news/${item.slug}`}
              last={i === items.length - 1}
            />
          ))
        )}
      </div>
    </div>
  )
}
