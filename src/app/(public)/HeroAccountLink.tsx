'use client'

/**
 * The homepage hero's second button — "Member sign in" is wrong once the
 * visitor already is one. Same destination mapping as HeaderAccountLink
 * (admin/exec -> /admin, verified member -> /portal, pending -> /pending),
 * client-side only via nma_display. No Firebase SDK, no move to dynamic
 * rendering — the homepage stays static either way.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { readDisplayCookie, resolveDisplayState, type DisplayAccountState } from '@/lib/auth/displayCookie'

function destinationFor(state: DisplayAccountState): { label: string; href: string } {
  switch (state) {
    case 'admin':
      return { label: 'Admin', href: '/admin' }
    case 'member':
      return { label: 'My account', href: '/portal' }
    case 'pending':
      return { label: 'Pending', href: '/pending' }
    default:
      return { label: 'Member sign in', href: '/signin' }
  }
}

const buttonStyle = {
  backgroundColor: 'transparent',
  color: 'var(--color-surface)',
  border: '1px solid rgba(255,255,255,0.40)',
  borderRadius: 'var(--radius)',
  transitionDuration: 'var(--motion-fast)',
} as const

export function HeroAccountLink() {
  const [state, setState] = useState<DisplayAccountState>('checking')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(resolveDisplayState(readDisplayCookie()))
  }, [])

  // Server render and the first client render both show nothing — same
  // unavoidable shape as HeaderAccountLink. A guessed default (e.g. always
  // starting with "Member sign in") would violate "never render a wrong
  // state" for the fraction of visitors who are actually signed in.
  if (state === 'checking') return null

  const { label, href } = destinationFor(state)

  return (
    <Link href={href} className="type-body font-semibold px-lg py-sm transition-colors" style={buttonStyle}>
      {label}
    </Link>
  )
}
