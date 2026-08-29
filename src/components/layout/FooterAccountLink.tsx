'use client'

/**
 * The footer's "Member portal" link, which used to point at /signin
 * unconditionally — so a signed-in member clicking it was sent to a sign-in
 * page they didn't need. Same nma_display read and same destination mapping as
 * HeaderAccountLink and HeroAccountLink; no Firebase SDK, and the footer's
 * pages stay static.
 *
 * A pending member goes to /pending, not /portal: /portal would bounce them
 * straight back, which is the same dead end from the other direction.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { readDisplayCookie, resolveDisplayState, type DisplayAccountState } from '@/lib/auth/displayCookie'

function destinationFor(state: DisplayAccountState): { label: string; href: string } {
  switch (state) {
    case 'admin':
      return { label: 'Admin', href: '/admin' }
    case 'member':
      return { label: 'Member portal', href: '/portal' }
    case 'pending':
      return { label: 'Your application', href: '/pending' }
    default:
      return { label: 'Member portal', href: '/signin' }
  }
}

export function FooterAccountLink() {
  const [state, setState] = useState<DisplayAccountState>('checking')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(resolveDisplayState(readDisplayCookie()))
  }, [])

  // Server render and the first client render show the signed-out destination
  // rather than nothing: this is a footer link, and leaving a hole in the
  // footer on every page load is worse than a link that corrects itself
  // synchronously on mount. It is never a *wrong* destination for a signed-out
  // visitor, who is the majority of this page's traffic.
  const { label, href } = destinationFor(state === 'checking' ? 'signed-out' : state)

  return (
    <Link
      href={href}
      className="type-small transition-colors"
      style={{
        color: 'rgba(255,255,255,0.55)',
        transitionDuration: 'var(--motion-fast)',
      }}
    >
      {label} →
    </Link>
  )
}
