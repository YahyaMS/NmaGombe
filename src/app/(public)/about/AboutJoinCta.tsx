'use client'

/**
 * The "Join the chapter" CTA on /about — wrong for a visitor who's already
 * a member. Same pattern as MembershipCta and HeaderAccountLink: reads
 * nma_display client-side only. No Firebase SDK, no move to dynamic
 * rendering — /about stays static either way.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { readDisplayCookie, resolveDisplayState, type DisplayAccountState } from '@/lib/auth/displayCookie'

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
} as const

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: 'var(--spacing-lg)',
} as const

export function AboutJoinCta() {
  const [state, setState] = useState<DisplayAccountState>('checking')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(resolveDisplayState(readDisplayCookie()))
  }, [])

  if (state === 'checking') {
    return <div aria-hidden="true" style={{ minHeight: '96px' }} />
  }

  if (state === 'member' || state === 'admin') {
    return (
      <div style={gridStyle}>
        <div>
          <p className="type-eyebrow section-rule mb-sm" style={{ color: 'var(--color-ink-3)' }}>
            Membership
          </p>
          <p className="type-h2" style={{ color: 'var(--color-ink)' }}>You&rsquo;re a member</p>
          <p className="type-body" style={{ color: 'var(--color-ink-2)', marginTop: 'var(--spacing-sm)' }}>
            Your folio card, the directory and your CPD log are in your portal.
          </p>
        </div>
        <Link href="/portal" className="type-body font-semibold px-lg py-sm whitespace-nowrap" style={primaryButtonStyle}>
          Go to your portal
        </Link>
      </div>
    )
  }

  if (state === 'pending') {
    return (
      <div style={gridStyle}>
        <div>
          <p className="type-eyebrow section-rule mb-sm" style={{ color: 'var(--color-ink-3)' }}>
            Membership
          </p>
          <p className="type-h2" style={{ color: 'var(--color-ink)' }}>Your account is under review</p>
          <p className="type-body" style={{ color: 'var(--color-ink-2)', marginTop: 'var(--spacing-sm)' }}>
            An admin is checking your folio number against the membership list.
          </p>
        </div>
        <Link href="/pending" className="type-body font-semibold px-lg py-sm whitespace-nowrap" style={primaryButtonStyle}>
          Check your status
        </Link>
      </div>
    )
  }

  return (
    <div style={gridStyle}>
      <div>
        <p className="type-eyebrow section-rule mb-sm" style={{ color: 'var(--color-ink-3)' }}>
          Membership
        </p>
        <p className="type-h2" style={{ color: 'var(--color-ink)' }}>Join the chapter</p>
        <p className="type-body" style={{ color: 'var(--color-ink-2)', marginTop: 'var(--spacing-sm)' }}>
          Verified members access the full directory, pay dues online, and carry
          a digital folio card.
        </p>
      </div>
      <Link href="/membership" className="type-body font-semibold px-lg py-sm whitespace-nowrap" style={primaryButtonStyle}>
        Learn more
      </Link>
    </div>
  )
}
