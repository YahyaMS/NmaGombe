'use client'

/**
 * The homepage's folio-card-preview link — "Get verified →" is wrong once
 * the visitor already is. Client-side only via nma_display, same pattern as
 * HeaderAccountLink. No Firebase SDK, no move to dynamic rendering.
 *
 * This does NOT fix the section above it still showing a static demo card
 * (Dr. Yahya's) rather than the visitor's own live one — that's a separate,
 * larger, not-yet-built feature (docs/09-DECISIONS.md ADR-018), not a bug
 * this component papers over.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { readDisplayCookie, resolveDisplayState, type DisplayAccountState } from '@/lib/auth/displayCookie'

function destinationFor(state: DisplayAccountState): { label: string; href: string } {
  switch (state) {
    case 'admin':
      return { label: 'Go to your portal →', href: '/admin' }
    case 'member':
      return { label: 'Go to your portal →', href: '/portal' }
    case 'pending':
      return { label: 'Check your status →', href: '/pending' }
    default:
      return { label: 'Get verified →', href: '/membership' }
  }
}

export function FolioCtaLink() {
  const [state, setState] = useState<DisplayAccountState>('checking')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(resolveDisplayState(readDisplayCookie()))
  }, [])

  if (state === 'checking') return <span aria-hidden="true" style={{ display: 'block', marginTop: 'var(--spacing-lg)', height: '1.25em' }} />

  const { label, href } = destinationFor(state)

  return (
    <Link
      href={href}
      className="type-small font-semibold"
      style={{ color: 'var(--color-green)', display: 'block', marginTop: 'var(--spacing-lg)' }}
    >
      {label}
    </Link>
  )
}
