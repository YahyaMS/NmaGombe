/**
 * 404 — not found.
 *
 * Austere. States what happened and what to do. Does not apologise.
 * Design: design.md §11 — "Errors state what happened and what to do."
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh px-md"
      style={{ backgroundColor: 'var(--color-paper)' }}
    >
      <div style={{ maxWidth: '40ch', width: '100%' }}>
        <p
          className="type-eyebrow section-rule mb-lg"
          style={{ color: 'var(--color-ink-3)' }}
        >
          404
        </p>
        <h1 className="type-h1" style={{ color: 'var(--color-ink)' }}>
          That page does not exist
        </h1>
        <p
          className="type-body"
          style={{ color: 'var(--color-ink-2)', marginTop: 'var(--spacing-md)' }}
        >
          Check the URL, or go back to the homepage.
        </p>
        <div
          className="flex gap-sm flex-wrap"
          style={{ marginTop: 'var(--spacing-xl)' }}
        >
          <Link
            href="/"
            className="type-body font-semibold px-lg py-sm"
            style={{
              backgroundColor: 'var(--color-green)',
              color: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
            }}
          >
            Go home
          </Link>
          <Link
            href="/doctors"
            className="type-body px-lg py-sm"
            style={{
              border: '1px solid var(--color-rule-strong)',
              color: 'var(--color-ink)',
              borderRadius: 'var(--radius)',
            }}
          >
            Find a doctor
          </Link>
        </div>
      </div>
    </div>
  )
}
