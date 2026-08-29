'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { establishServerSession } from '@/lib/firebase/session-bridge'
import { subscribeToOwnMemberProfile } from '@/lib/data/members'
import type { MemberProfile } from '@/lib/data/schemas'

type ViewState = 'loading' | 'offline' | 'no-profile' | MemberProfile['status']

/**
 * Approval happens on the server: decideVerification sets a custom claim the
 * member's browser knows nothing about. Their __session cookie and nma_display
 * cookie are both snapshots taken when they signed in, so /portal's layout
 * reads verified:false from a 14-day-old cookie and redirects them right back
 * here — a bounce loop behind a button that looks like it should work.
 *
 * useVerifiedMemberGuard would refresh the session, but it never gets to run:
 * the server layout redirects before the page it lives on ever renders. So the
 * refresh has to happen here, on the one page an approved-but-stale member can
 * still reach. Their Firestore document is already correct — that's what this
 * page subscribes to — so the moment it says "verified", we mint a new session
 * cookie from a freshly-refreshed ID token, and only then offer the button.
 */
type AccessState = 'idle' | 'refreshing' | 'ready' | 'failed'

const whatsappSecretariat = process.env.NEXT_PUBLIC_WHATSAPP_SECRETARIAT
const whatsappHref = whatsappSecretariat ? `https://wa.me/${whatsappSecretariat}` : undefined

function eyebrow(text: string) {
  return (
    <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>
      {text}
    </p>
  )
}

export function PendingStatus() {
  const router = useRouter()
  const [view, setView] = useState<ViewState>('loading')
  const [access, setAccess] = useState<AccessState>('idle')
  // The profile subscription fires on every document change; the refresh must
  // not. A ref rather than state because the guard has to be read and set
  // synchronously, before any re-render.
  const refreshing = useRef(false)
  const userRef = useRef<User | null>(null)

  async function refreshAccess(user: User) {
    if (refreshing.current) return
    refreshing.current = true
    setAccess('refreshing')
    try {
      await establishServerSession(await user.getIdToken(true))
      setAccess('ready')
    } catch {
      // Leave the door open for a retry — unlike the guard's opportunistic
      // refresh, this one is the only thing standing between an approved
      // member and their portal.
      refreshing.current = false
      setAccess('failed')
    }
  }

  useEffect(() => {
    let unsubProfile: (() => void) | undefined
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubProfile?.()
      if (!user) {
        router.replace('/signup')
        return
      }
      userRef.current = user
      unsubProfile = subscribeToOwnMemberProfile(
        user.uid,
        (profile) => {
          setView(profile ? profile.status : 'no-profile')
          if (profile?.status === 'verified') void refreshAccess(user)
        },
        () => setView('offline')
      )
    })
    return () => {
      unsubProfile?.()
      unsubAuth()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shellStyle = { maxWidth: '440px' } as const

  if (view === 'loading') {
    return <div className="mx-auto px-md py-2xl" style={shellStyle} aria-live="polite" />
  }

  if (view === 'offline') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        {eyebrow('Offline')}
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
          You&rsquo;re offline
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          We can&rsquo;t reach the server to check your verification status. Reconnect and reload
          this page.
        </p>
      </div>
    )
  }

  // Signed in, but no member profile — the signup details never reached
  // Firestore. This is recoverable without the secretariat: /signup detects the
  // same state and asks for the details again (see SignupForm.tsx), so send
  // them there first and keep WhatsApp as the fallback.
  if (view === 'no-profile') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        {eyebrow('Application incomplete')}
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
          We couldn&rsquo;t find your application
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Your sign-in worked, but your signup details didn&rsquo;t save. Enter them again and your
          application goes straight to an admin — you won&rsquo;t need another email link.
        </p>
        <Link
          href="/signup"
          className="type-body font-semibold px-lg py-sm mt-lg inline-block"
          style={{ backgroundColor: 'var(--color-green)', color: 'var(--color-surface)', borderRadius: 'var(--radius)' }}
        >
          Finish your application
        </Link>
        {whatsappHref && (
          <p className="type-small mt-lg" style={{ color: 'var(--color-ink-3)' }}>
            Still stuck?{' '}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-green)', textDecoration: 'underline' }}
            >
              Message the secretariat
            </a>
          </p>
        )}
      </div>
    )
  }

  if (view === 'verified') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        {eyebrow('Verified')}
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
          You&rsquo;re verified
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Welcome to NMA Gombe. Your member directory and folio card are ready.
        </p>

        {/* The link appears only once the new session cookie is in place.
            Offering it before that would send an approved member straight into
            the redirect loop this whole block exists to prevent. */}
        {access === 'ready' && (
          <Link
            href="/portal"
            className="type-body font-semibold px-lg py-sm mt-lg inline-block"
            style={{ backgroundColor: 'var(--color-green)', color: 'var(--color-surface)', borderRadius: 'var(--radius)' }}
          >
            Go to your portal
          </Link>
        )}

        {access !== 'ready' && access !== 'failed' && (
          <p className="type-small mt-lg" style={{ color: 'var(--color-ink-3)' }} aria-live="polite">
            Opening your portal…
          </p>
        )}

        {access === 'failed' && (
          <div className="mt-lg">
            <p className="type-small" style={{ color: 'var(--color-danger)' }} role="alert">
              We couldn&rsquo;t finish setting up your access. Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => {
                if (userRef.current) void refreshAccess(userRef.current)
              }}
              className="type-body font-semibold px-lg py-sm mt-md"
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
          </div>
        )}
      </div>
    )
  }

  if (view === 'rejected') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        {eyebrow('Not verified')}
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
          We couldn&rsquo;t verify your folio number
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Reach the secretariat on WhatsApp with your folio number and they&rsquo;ll help sort it
          out.
        </p>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="type-body font-semibold px-lg py-sm mt-lg inline-block"
            style={{ backgroundColor: 'var(--color-green)', color: 'var(--color-surface)', borderRadius: 'var(--radius)' }}
          >
            Message the secretariat
          </a>
        )}
      </div>
    )
  }

  if (view === 'suspended') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        {eyebrow('Account suspended')}
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
          Your account is suspended
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Reach the secretariat on WhatsApp if you think this is a mistake.
        </p>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="type-body font-semibold px-lg py-sm mt-lg inline-block"
            style={{ backgroundColor: 'var(--color-green)', color: 'var(--color-surface)', borderRadius: 'var(--radius)' }}
          >
            Message the secretariat
          </a>
        )}
      </div>
    )
  }

  // 'pending'
  return (
    <div className="mx-auto px-md py-2xl" style={shellStyle}>
      {eyebrow('Verification pending')}
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
        We&rsquo;re reviewing your application
      </h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        An admin checks your folio number against the membership list. This page updates itself
        the moment a decision is made — usually within a few days.
      </p>
      {whatsappHref && (
        <p className="type-small mt-lg" style={{ color: 'var(--color-ink-3)' }}>
          Question in the meantime?{' '}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-green)', textDecoration: 'underline' }}
          >
            Message the secretariat
          </a>
        </p>
      )}
    </div>
  )
}
