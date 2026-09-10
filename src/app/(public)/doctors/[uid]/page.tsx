/**
 * /doctors/[uid] — a public member's expanded profile, if and only if they
 * opted their photo/bio/achievements into public visibility (both the
 * field's own visibility flag AND publicListingConsent — see
 * docs/09-DECISIONS.md). No contacts here, same boundary /doctors itself
 * holds: publicDirectory never carries phone/whatsapp/email to begin with.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicDirectoryEntry } from '@/lib/data/publicDirectory'
import { gradeLabels } from '@/lib/data/schemas'
import { MemberPhoto } from '@/components/ui/MemberPhoto'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uid: string }>
}): Promise<Metadata> {
  const { uid } = await params
  const entry = await getPublicDirectoryEntry(uid)
  return {
    title: entry ? `${entry.displayName} — NMA Gombe` : 'Doctor not found',
    robots: entry ? { index: true, follow: true } : { index: false },
  }
}

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ uid: string }>
}) {
  const { uid } = await params
  const entry = await getPublicDirectoryEntry(uid)
  if (!entry) notFound()

  const titleLine = entry.grade ? `${gradeLabels[entry.grade]} · ${entry.department}` : entry.department
  const locationLine = [entry.facility, entry.town].filter(Boolean).join(' · ')

  return (
    <div style={{ backgroundColor: 'var(--color-paper)' }}>
      <div className="mx-auto px-md py-2xl" style={{ maxWidth: '480px' }}>
        <Link href="/doctors" className="type-small" style={{ color: 'var(--color-ink-3)', textDecoration: 'underline' }}>
          Find a doctor
        </Link>

        <div className="flex items-center mt-md" style={{ gap: 'var(--spacing-md)' }}>
          <MemberPhoto uid={entry.uid} hasPhoto={entry.hasPhoto} displayName={entry.displayName} size={72} />
          <div>
            <h1 className="type-h2" style={{ color: 'var(--color-ink)' }}>
              {entry.displayName}
            </h1>
            <p className="type-body mt-xs" style={{ color: 'var(--color-ink-2)' }}>
              {titleLine}
            </p>
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

        <p className="type-small mt-xl" style={{ color: 'var(--color-ink-3)' }}>
          For contact details, a member must sign in to the directory.
        </p>
      </div>
    </div>
  )
}
