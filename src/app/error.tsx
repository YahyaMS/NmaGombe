'use client'

/**
 * Root error boundary — catches an unhandled throw anywhere below the root
 * layout (any page, any route group: (public), (auth), portal, admin,
 * verify). Before this file, that was Next's raw "Application error" screen
 * — a blank failure with no explanation and no way back, on any Firestore
 * read that threw. Doesn't catch a throw in the root layout itself; see
 * global-error.tsx for that.
 *
 * Design: design.md §11 — "Errors state what happened and what to do." Same
 * shell as not-found.tsx, deliberately, so a failure reads like a designed
 * state of the site rather than a crash.
 */

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // No personal data ever reaches this — error.message is a stack-trace-adjacent
  // string, not member data, and Vercel's own runtime log already has the full
  // error server-side. This is only a signal that something rendered wrong.
  useEffect(() => {
    console.error('Unhandled error caught by error.tsx')
  }, [])

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
          Error
        </p>
        <h1 className="type-h1" style={{ color: 'var(--color-ink)' }}>
          Something went wrong loading this page
        </h1>
        <p
          className="type-body"
          style={{ color: 'var(--color-ink-2)', marginTop: 'var(--spacing-md)' }}
        >
          Reload to try again. If it keeps happening, reach the secretariat on WhatsApp.
        </p>
        <div
          className="flex gap-sm flex-wrap"
          style={{ marginTop: 'var(--spacing-xl)' }}
        >
          <button
            type="button"
            onClick={() => reset()}
            className="type-body font-semibold px-lg py-sm"
            style={{
              backgroundColor: 'var(--color-green)',
              color: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="type-body px-lg py-sm"
            style={{
              border: '1px solid var(--color-rule-strong)',
              color: 'var(--color-ink)',
              borderRadius: 'var(--radius)',
            }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
