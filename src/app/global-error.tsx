'use client'

/**
 * Last-resort boundary — only fires if the ROOT LAYOUT ITSELF throws (a font
 * load failure, a crash in ServiceWorkerRegistration, something below
 * error.tsx can't catch because it wraps error.tsx too). Replaces the
 * *entire* document, <html> and <head> included — nothing from layout.tsx
 * is guaranteed to have rendered, so this can't rely on globals.css tokens,
 * next/font, or any shared layout. That's the deliberate reason for the raw
 * inline colors below — the one exception to "design tokens only" in this
 * codebase, because this is the one place that can't assume the token
 * system loaded. Kept as visually close to design.md's error styling as a
 * self-contained file can get.
 */

import { useEffect } from 'react'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled error caught by global-error.tsx (root layout failure)')
  }, [])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100dvh',
            padding: '16px',
            backgroundColor: '#FAFAF8',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '40ch', width: '100%' }}>
            <p style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5C6862', marginBottom: '16px' }}>
              Error
            </p>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0C1A13', margin: 0 }}>
              NMA Gombe couldn&rsquo;t load
            </h1>
            <p style={{ fontSize: '16px', color: '#3D4A43', marginTop: '12px' }}>
              Reload to try again. If it keeps happening, reach the secretariat on WhatsApp.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                marginTop: '24px',
                padding: '10px 24px',
                fontSize: '16px',
                fontWeight: 600,
                backgroundColor: '#015B30',
                color: '#FAFAF8',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
