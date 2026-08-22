'use client'

/**
 * Auth-aware replacement for the header's static "Member sign in" pill.
 * Renders on every page, public included — unlike its predecessor this
 * session, it ships no Firebase SDK at all: it only reads nma_display, a
 * small non-HttpOnly cookie set by /api/session alongside the real
 * (HttpOnly) __session cookie. nma_display is display-only by construction —
 * nothing here, or anywhere else, uses it to authorise anything. See
 * src/lib/auth/session.ts and src/app/api/session/route.ts.
 *
 * Server and the first client render both show nothing — this component
 * can't know the real state until it reads a cookie client-side, and a
 * guessed default would violate "never render a wrong state." The correct
 * state appears synchronously in the mount effect, not a network round trip,
 * so this reads as instant, not a flash.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'

type AccountState = 'checking' | 'signed-out' | 'admin' | 'member' | 'pending'

const pillStyle = {
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-green)',
  borderRadius: 'var(--radius)',
  transitionDuration: 'var(--motion-fast)',
} as const

const signOutLinkStyle = {
  color: 'rgba(255,255,255,0.65)',
  transitionDuration: 'var(--motion-fast)',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
} as const

function readDisplayCookie(): { signedIn: boolean; role: 'member' | 'exec' | 'admin'; verified: boolean } | null {
  const match = document.cookie.match(/(?:^|; )nma_display=([^;]*)/)
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match[1]))
  } catch {
    return null
  }
}

function destinationFor(state: AccountState): { label: string; href: string } {
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

export function HeaderAccountLink() {
  const [state, setState] = useState<AccountState>('checking')

  useEffect(() => {
    // Deliberately synchronous: nma_display only exists in the browser (no
    // document during SSR), so the server and the first client render both
    // have to show nothing — computing this in a useState initializer
    // instead would run during hydration too and produce a mismatch against
    // the server-rendered "nothing." This is the standard, unavoidable
    // shape for client-only state that can't be known at render time.
    const display = readDisplayCookie()
    const resolved: AccountState =
      !display || !display.signedIn
        ? 'signed-out'
        : display.role === 'admin' || display.role === 'exec'
          ? 'admin'
          : display.verified
            ? 'member'
            : 'pending'
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(resolved)
  }, [])

  async function handleSignOut() {
    await fetch('/api/session', { method: 'DELETE' }).catch(() => {})
    // Dynamically imported so signing out — an interaction, not page load —
    // is the only thing that ever pulls the Firebase Auth SDK into this
    // component. Needed so the client SDK's own session (which authorises
    // client-side Firestore reads on /portal/*) actually ends too, not just
    // the server session.
    const [{ auth }, { signOut }] = await Promise.all([
      import('@/lib/firebase/client'),
      import('firebase/auth'),
    ])
    await signOut(auth).catch(() => {})
    // A hard navigation, not router.push() — deliberate. This needs the
    // freshly-cleared cookies to be re-read by src/proxy.ts and every
    // Server Component on the next page, and every client-side Firestore
    // subscription (directory, folio card) to fully reset, not carry over
    // as a soft client-side transition would.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/'
  }

  if (state === 'checking') return <li aria-hidden="true" />

  const { label, href } = destinationFor(state)

  return (
    <li className="flex items-center gap-md">
      <Link
        href={href}
        className="type-small font-semibold transition-colors px-md py-xs"
        style={pillStyle}
      >
        {label}
      </Link>
      {state !== 'signed-out' && (
        <button
          type="button"
          onClick={handleSignOut}
          className="type-small transition-colors"
          style={signOutLinkStyle}
        >
          Sign out
        </button>
      )}
    </li>
  )
}
