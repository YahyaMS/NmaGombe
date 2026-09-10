'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useVerifiedMemberGuard } from '@/lib/auth/useVerifiedMemberGuard'
import { getDirectoryEntry, type DirectoryRow } from '@/lib/data/directory'
import { gradeLabels } from '@/lib/data/schemas'
import { whatsAppLink, telLink } from '@/lib/whatsapp'
import { MemberPhoto } from '@/components/ui/MemberPhoto'

type Stage = 'loading' | 'ready' | 'not-found' | 'error'

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  border: 'none',
  textDecoration: 'none',
  display: 'inline-block',
} as const

export function DirectoryDetailView({ uid }: { uid: string }) {
  const { state: guardState } = useVerifiedMemberGuard()
  const [stage, setStage] = useState<Stage>('loading')
  const [entry, setEntry] = useState<DirectoryRow | null>(null)

  useEffect(() => {
    if (guardState !== 'ready') return
    let cancelled = false

    getDirectoryEntry(uid)
      .then((result) => {
        if (cancelled) return
        setEntry(result)
        setStage(result ? 'ready' : 'not-found')
      })
      .catch(() => {
        if (!cancelled) setStage('error')
      })

    return () => {
      cancelled = true
    }
  }, [guardState, uid])

  const shellStyle = { maxWidth: '480px' } as const

  if (guardState !== 'ready' || stage === 'loading') {
    return <div className="mx-auto px-md py-2xl" style={shellStyle} aria-live="polite" />
  }

  if (stage === 'error') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
          Couldn&rsquo;t load this profile. Reload the page.
        </p>
      </div>
    )
  }

  if (stage === 'not-found' || !entry) {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
          This member isn&rsquo;t in the directory.
        </p>
        <Link href="/portal/directory" className="type-small mt-md" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>
          Back to directory
        </Link>
      </div>
    )
  }

  const titleLine = [entry.grade ? gradeLabels[entry.grade] : entry.department, entry.subspecialty]
    .filter(Boolean)
    .join(' · ')
  const locationLine = [entry.facility, entry.town].filter(Boolean).join(' · ')
  const wa = entry.whatsapp ? whatsAppLink(entry.whatsapp) : null
  const call = entry.phone ? telLink(entry.phone) : null

  return (
    <div className="mx-auto px-md py-2xl" style={shellStyle}>
      <Link href="/portal/directory" className="type-small" style={{ color: 'var(--color-ink-3)', textDecoration: 'underline' }}>
        Directory
      </Link>

      <div className="flex items-center mt-md" style={{ gap: 'var(--spacing-md)' }}>
        <MemberPhoto uid={entry.uid} hasPhoto={entry.hasPhoto} displayName={entry.displayName} size={72} />
        <div>
          <h1 className="type-h2" style={{ color: 'var(--color-ink)' }}>
            {entry.displayName}
          </h1>
          {titleLine && (
            <p className="type-body mt-xs" style={{ color: 'var(--color-ink-2)' }}>
              {titleLine}
            </p>
          )}
        </div>
      </div>
      {locationLine && (
        <p className="type-small mt-xs" style={{ color: 'var(--color-ink-3)' }}>
          {locationLine}
        </p>
      )}
      {entry.languages && (
        <p className="type-small mt-xs" style={{ color: 'var(--color-ink-3)' }}>
          Speaks {entry.languages}
        </p>
      )}
      {entry.qualifiedYear && (
        <p className="type-small mt-xs" style={{ color: 'var(--color-ink-3)' }}>
          Practising since {entry.qualifiedYear}
        </p>
      )}

      {entry.bio && (
        <p className="type-body mt-lg" style={{ color: 'var(--color-ink-2)' }}>
          {entry.bio}
        </p>
      )}

      {entry.achievements && entry.achievements.length > 0 && (
        <div className="mt-lg">
          <p className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>
            Achievements
          </p>
          <ul className="mt-sm" style={{ paddingLeft: '1.2em' }}>
            {entry.achievements.map((item, i) => (
              <li key={`${item}-${i}`} className="type-small mt-xs" style={{ color: 'var(--color-ink-2)' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(wa || call) && (
        <div className="flex gap-sm mt-lg">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="type-body font-semibold px-lg py-sm" style={primaryButtonStyle}>
              WhatsApp
            </a>
          )}
          {call && (
            <a
              href={call}
              className="type-body font-semibold px-lg py-sm"
              style={{ ...primaryButtonStyle, backgroundColor: 'var(--color-green-wash)', color: 'var(--color-green)' }}
            >
              Call
            </a>
          )}
        </div>
      )}
    </div>
  )
}
