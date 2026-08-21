'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useVerifiedMemberGuard } from '@/lib/auth/useVerifiedMemberGuard'
import { subscribeToOwnMemberProfile } from '@/lib/data/members'
import { getNextUpcomingEvent, type UpcomingEvent } from '@/lib/data/portalEvents'
import { gradeLabels, type MemberProfile } from '@/lib/data/schemas'
import { FolioCard, type FolioCardStatus } from '@/components/ui/FolioCard'

type Stage = 'loading' | 'ready' | 'offline' | 'no-profile'

const monthLabels = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const mdcnPortalUrl = process.env.NEXT_PUBLIC_MDCN_PORTAL_URL

function titleLine(profile: MemberProfile): string {
  const grade = profile.grade ? gradeLabels[profile.grade] : ''
  return [grade, profile.department].filter(Boolean).join(' · ')
}

function formatEventDate(ts: UpcomingEvent['startAt']): string {
  return ts.toDate().toLocaleDateString('en-NG', { weekday: 'short', day: '2-digit', month: 'short' })
}

const quickLinks = [
  { href: '/portal/card', label: 'Your folio card' },
  { href: '/portal/directory', label: 'Find a colleague' },
  { href: '/portal/profile', label: 'Edit your profile' },
]

export function PortalDashboard() {
  const { state: guardState, uid } = useVerifiedMemberGuard()
  const [stage, setStage] = useState<Stage>('loading')
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [nextEvent, setNextEvent] = useState<UpcomingEvent | null | undefined>(undefined)

  useEffect(() => {
    if (guardState !== 'ready' || !uid) return
    const unsub = subscribeToOwnMemberProfile(
      uid,
      (p) => {
        setProfile(p)
        setStage(p ? 'ready' : 'no-profile')
      },
      () => setStage('offline')
    )
    return unsub
  }, [guardState, uid])

  useEffect(() => {
    if (stage !== 'ready') return
    getNextUpcomingEvent()
      .then(setNextEvent)
      .catch(() => setNextEvent(null))
  }, [stage])

  const shellStyle = { maxWidth: '560px' } as const

  if (guardState !== 'ready' || stage === 'loading') {
    return <div className="mx-auto px-md py-2xl" style={shellStyle} aria-live="polite" />
  }

  if (stage === 'offline') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Offline</p>
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>You&rsquo;re offline</h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Your folio card still works from the last sync — open{' '}
          <Link href="/portal/card" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>
            your card
          </Link>{' '}
          directly.
        </p>
      </div>
    )
  }

  if (stage === 'no-profile' || !profile) {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
          We couldn&rsquo;t load your profile. Reload the page.
        </p>
      </div>
    )
  }

  const status: FolioCardStatus = 'dues-not-recorded'

  return (
    <div className="mx-auto px-md py-2xl" style={shellStyle}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Portal</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
        Welcome back, {profile.displayName}
      </h1>

      <div className="mt-lg" style={{ display: 'flex', justifyContent: 'center' }}>
        <FolioCard
          name={profile.displayName}
          grade={titleLine(profile)}
          folioNumber={profile.folioNumber}
          status={status}
        />
      </div>

      {profile.mdcnRenewalMonth && (
        <div
          className="mt-lg"
          style={{ padding: 'var(--spacing-md) 0', borderTop: '1px solid var(--color-rule)' }}
        >
          <p className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>MDCN renewal</p>
          <p className="type-body mt-xs" style={{ color: 'var(--color-ink)' }}>
            Your licence renews in {monthLabels[profile.mdcnRenewalMonth - 1]}.
          </p>
          {mdcnPortalUrl && (
            <a
              href={mdcnPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="type-small font-semibold"
              style={{ color: 'var(--color-green)', textDecoration: 'underline' }}
            >
              Renew on the MDCN portal →
            </a>
          )}
        </div>
      )}

      {nextEvent && (
        <div
          className="mt-lg"
          style={{ padding: 'var(--spacing-md) 0', borderTop: '1px solid var(--color-rule)' }}
        >
          <p className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>Next event</p>
          <Link href={`/events/${nextEvent.slug}`} className="block mt-xs" style={{ textDecoration: 'none' }}>
            <p className="type-h3" style={{ color: 'var(--color-ink)' }}>{nextEvent.title}</p>
            <p className="type-small mt-xs" style={{ color: 'var(--color-ink-3)' }}>
              {formatEventDate(nextEvent.startAt)} · {nextEvent.location}
            </p>
          </Link>
        </div>
      )}

      <div className="mt-lg" style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--spacing-md)' }}>
        {quickLinks.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            className="type-body block"
            style={{
              padding: 'var(--spacing-sm) 0',
              borderBottom: i < quickLinks.length - 1 ? '1px solid var(--color-rule)' : undefined,
              color: 'var(--color-ink)',
              textDecoration: 'none',
            }}
          >
            {link.label} →
          </Link>
        ))}
      </div>
    </div>
  )
}
