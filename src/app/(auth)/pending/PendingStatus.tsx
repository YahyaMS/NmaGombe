'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { subscribeToOwnMemberProfile } from '@/lib/data/members'
import type { MemberProfile } from '@/lib/data/schemas'

type ViewState = 'loading' | 'offline' | 'no-profile' | MemberProfile['status']

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

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/signup')
        return
      }
      const unsubProfile = subscribeToOwnMemberProfile(
        user.uid,
        (profile) => setView(profile ? profile.status : 'no-profile'),
        () => setView('offline')
      )
      return unsubProfile
    })
    return unsubAuth
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

  if (view === 'no-profile') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        {eyebrow('Something went wrong')}
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
          We couldn&rsquo;t find your application
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Your sign-in worked, but your signup details didn&rsquo;t save. Reach the secretariat on
          WhatsApp and we&rsquo;ll sort it out.
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

  if (view === 'verified') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        {eyebrow('Verified')}
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
          You&rsquo;re verified
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Welcome to NMA Gombe. Your member directory, folio card and dues payment are on their
          way — we&rsquo;ll let you know the moment they&rsquo;re live.
        </p>
        <Link
          href="/"
          className="type-body font-semibold px-lg py-sm mt-lg inline-block"
          style={{ backgroundColor: 'var(--color-green)', color: 'var(--color-surface)', borderRadius: 'var(--radius)' }}
        >
          Back to home
        </Link>
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
