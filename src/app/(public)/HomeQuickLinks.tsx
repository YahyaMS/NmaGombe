'use client'

/**
 * Signed-in shortcuts to every member feature, shown directly on the
 * homepage below the visitor's own folio card — not a marketing feature
 * grid (design.md §10 forbids that for the public/signed-out side), just
 * the same register-row list PortalDashboard.tsx already uses, surfaced one
 * click earlier for a member who lands on `/` instead of `/portal`. Renders
 * nothing at all for a signed-out or pending visitor — see readDisplayCookie.
 *
 * Reads nma_display, the same display-only cookie every other session-aware
 * island on this page already reads — no Firebase SDK, no move to dynamic
 * rendering.
 */

import { useEffect, useState } from 'react'
import { readDisplayCookie, resolveDisplayState, type DisplayAccountState } from '@/lib/auth/displayCookie'
import { RegisterRow } from '@/components/ui/RegisterRow'

const QUICK_LINKS = [
  { href: '/portal/directory', label: 'Find a colleague', detail: 'Search the verified member directory' },
  { href: '/portal/cpd', label: 'Your CPD log', detail: 'Self-reported entries and certificates' },
  { href: '/portal/jobs', label: 'Jobs & locums', detail: 'Post or browse chapter listings' },
  { href: '/portal/documents', label: 'Guidelines & documents', detail: 'Clinical guidelines, forms, circulars' },
  { href: '/portal/welfare', label: 'Welfare fund', detail: 'Request assistance from the Welfare Committee' },
  { href: '/portal/profile', label: 'Edit your profile', detail: 'Grade, facility, visibility, MDCN renewal month' },
]

export function HomeQuickLinks() {
  const [state, setState] = useState<DisplayAccountState>('checking')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(resolveDisplayState(readDisplayCookie()))
  }, [])

  if (state !== 'member' && state !== 'admin') return null

  return (
    <section aria-label="Your shortcuts" style={{ backgroundColor: 'var(--color-paper)', borderTop: '1px solid var(--color-rule)' }}>
      <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
        <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
          Your shortcuts
        </p>
        {QUICK_LINKS.map((link, i) => (
          <RegisterRow
            key={link.href}
            primary={link.label}
            secondary={link.detail}
            href={link.href}
            last={i === QUICK_LINKS.length - 1}
          />
        ))}
      </div>
    </section>
  )
}
