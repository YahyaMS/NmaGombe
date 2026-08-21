'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useVerifiedMemberGuard } from '@/lib/auth/useVerifiedMemberGuard'
import { subscribeToOwnMemberProfile } from '@/lib/data/members'
import { gradeLabels, type MemberProfile } from '@/lib/data/schemas'
import { FolioCard, type FolioCardStatus } from '@/components/ui/FolioCard'
import { auth } from '@/lib/firebase/client'

type Stage = 'loading' | 'ready' | 'offline' | 'no-profile'
type DownloadState = 'idle' | 'working' | 'error'

function titleLine(profile: MemberProfile): string {
  const grade = profile.grade ? gradeLabels[profile.grade] : ''
  return [grade, profile.department].filter(Boolean).join(' · ')
}

export function CardView() {
  const { state: guardState, uid } = useVerifiedMemberGuard()
  const [stage, setStage] = useState<Stage>('loading')
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [downloadState, setDownloadState] = useState<DownloadState>('idle')

  async function downloadCard(displayName: string) {
    if (!navigator.onLine) {
      setDownloadState('error')
      return
    }
    setDownloadState('working')
    try {
      const user = auth.currentUser
      if (!user) throw new Error('signed-out')
      const idToken = await user.getIdToken()
      const res = await fetch('/portal/card/download', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (!res.ok) throw new Error('download-failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `NMA-Gombe-${displayName.replace(/^dr\.?\s+/i, '').trim().replace(/[^a-zA-Z0-9]+/g, '-')}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setDownloadState('idle')
    } catch {
      setDownloadState('error')
    }
  }

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

  const shellStyle = { maxWidth: '480px' } as const

  if (guardState !== 'ready' || stage === 'loading') {
    return <div className="mx-auto px-md py-2xl" style={shellStyle} aria-live="polite" />
  }

  if (stage === 'offline') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Offline</p>
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>You&rsquo;re offline</h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Reconnect and reload to see your folio card.
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

  const status: FolioCardStatus = profile.status === 'verified' ? 'dues-not-recorded' : 'pending'
  const missingProfile = !profile.grade || !profile.facility

  return (
    <div className="mx-auto px-md py-2xl flex flex-col items-center" style={{ maxWidth: '520px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)', alignSelf: 'flex-start' }}>
        Your folio card
      </p>

      <div className="mt-lg" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <FolioCard
          name={profile.displayName}
          grade={titleLine(profile)}
          folioNumber={profile.folioNumber}
          status={status}
        />
      </div>

      {profile.status === 'verified' && (
        <>
          <button
            type="button"
            onClick={() => downloadCard(profile.displayName)}
            disabled={downloadState === 'working'}
            className="type-body font-semibold px-lg py-sm mt-lg"
            style={{
              backgroundColor: 'var(--color-green)',
              color: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: downloadState === 'working' ? 'default' : 'pointer',
              opacity: downloadState === 'working' ? 0.6 : 1,
            }}
          >
            {downloadState === 'working' ? 'Preparing your card…' : 'Download card'}
          </button>

          {downloadState === 'error' && (
            <p className="type-small mt-sm" style={{ color: 'var(--color-ink-3)', textAlign: 'center' }}>
              {navigator.onLine
                ? 'Couldn’t prepare your card. Try again.'
                : 'Connect to the internet to download your card.'}
            </p>
          )}
        </>
      )}

      {missingProfile && (
        <p className="type-small mt-lg" style={{ color: 'var(--color-ink-3)', textAlign: 'center' }}>
          Add your grade and facility to complete your card —{' '}
          <Link href="/portal/profile" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>
            edit profile
          </Link>
          .
        </p>
      )}
    </div>
  )
}
