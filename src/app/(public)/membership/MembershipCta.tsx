'use client'

/**
 * The CTA section of /membership — "Ready to join?" makes no sense to a
 * visitor who already is a member. Same pattern as HeaderAccountLink: reads
 * nma_display, a display-only cookie, client-side only. No Firebase SDK, no
 * move to dynamic rendering — the page around this island stays a static
 * Server Component either way.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { readDisplayCookie, resolveDisplayState, type DisplayAccountState } from '@/lib/auth/displayCookie'

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
} as const

export function MembershipCta() {
  const [state, setState] = useState<DisplayAccountState>('checking')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(resolveDisplayState(readDisplayCookie()))
  }, [])

  // Server render and the first client render both show nothing — same
  // unavoidable shape as HeaderAccountLink. Reserves roughly the same
  // height so nothing visibly shifts once resolved.
  if (state === 'checking') {
    return <div aria-hidden="true" style={{ minHeight: '128px' }} />
  }

  if (state === 'member' || state === 'admin') {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: 'var(--spacing-lg)',
        }}
      >
        <div>
          <p className="type-h2" style={{ color: 'var(--color-ink)' }}>You&rsquo;re already a member</p>
          <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
            Head to your portal for your folio card, the directory, CPD log and more.
          </p>
        </div>
        <Link
          href="/portal"
          className="type-body font-semibold px-lg py-sm whitespace-nowrap"
          style={primaryButtonStyle}
        >
          Go to your portal
        </Link>
      </div>
    )
  }

  if (state === 'pending') {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: 'var(--spacing-lg)',
        }}
      >
        <div>
          <p className="type-h2" style={{ color: 'var(--color-ink)' }}>Your account is under review</p>
          <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
            An admin checks your folio number against the membership list — usually within a
            few days.
          </p>
        </div>
        <Link
          href="/pending"
          className="type-body font-semibold px-lg py-sm whitespace-nowrap"
          style={primaryButtonStyle}
        >
          Check your status
        </Link>
      </div>
    )
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: 'var(--spacing-lg)',
        }}
      >
        <div>
          <p className="type-h2" style={{ color: 'var(--color-ink)' }}>Ready to join?</p>
          <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
            Takes a few minutes. You&rsquo;ll need your MDCN folio number.
          </p>
        </div>
        <Link
          href="/signup"
          className="type-body font-semibold px-lg py-sm whitespace-nowrap"
          style={primaryButtonStyle}
        >
          Create your account
        </Link>
      </div>
      <p className="type-small mt-lg" style={{ color: 'var(--color-ink-3)' }}>
        Already have an account?{' '}
        <Link href="/signin" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>
          Sign in
        </Link>
      </p>
    </>
  )
}
