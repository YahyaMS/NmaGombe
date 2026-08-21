'use client'

/**
 * Auth-aware replacement for the header's static "Member sign in" pill.
 * Only rendered on routes that already ship firebase/auth client-side
 * (portal, admin, (auth)) — see SiteHeader's `authAware` prop. Never on
 * (public), which stays JS-auth-free to protect the route bundle budget.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'

type AccountState = 'signed-out' | 'admin' | 'member' | 'pending'

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

function destinationFor(state: AccountState): { label: string; href: string } {
  switch (state) {
    case 'admin':
      return { label: 'Admin', href: '/admin/verification' }
    case 'member':
      return { label: 'My account', href: '/portal/profile' }
    case 'pending':
      return { label: 'Pending', href: '/pending' }
    case 'signed-out':
      return { label: 'Member sign in', href: '/signin' }
  }
}

export function HeaderAccountLink() {
  const router = useRouter()
  // Starts 'signed-out' so the initial render matches the static markup this
  // replaces — no hydration mismatch, no layout shift for the common case.
  const [state, setState] = useState<AccountState>('signed-out')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setState('signed-out')
        return
      }
      void user.getIdTokenResult(true).then((token) => {
        if (token.claims.role === 'admin' || token.claims.role === 'exec') {
          setState('admin')
        } else if (token.claims.verified === true) {
          setState('member')
        } else {
          setState('pending')
        }
      })
    })
    return unsub
  }, [])

  async function handleSignOut() {
    await signOut(auth)
    router.replace('/')
  }

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
