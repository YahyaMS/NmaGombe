import type { Metadata } from 'next'
import { lookupByFolio } from '@/lib/data/verify'
import { gradeLabels, type Grade } from '@/lib/data/schemas'

export const metadata: Metadata = {
  title: 'Verify a member — NMA Gombe',
  description: 'Confirm a doctor is a verified member of the Nigerian Medical Association, Gombe State Chapter.',
}

// The folio card's QR encodes hyphens in place of slashes (folioNumber.replace(/\//g, '-'))
// so the value survives as a single URL segment — reverse that here, not in the card.
function toStoredFolioNumber(segment: string): string {
  return segment.replace(/-/g, '/')
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ folio: string }>
}) {
  const { folio } = await params
  const result = await lookupByFolio(toStoredFolioNumber(folio))

  const shellStyle = {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    padding: 'var(--spacing-xl) var(--spacing-md)',
  }

  if (!result) {
    return (
      <div style={shellStyle}>
        <p className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>NMA Gombe</p>
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
          No record found
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Folio {toStoredFolioNumber(folio)} doesn&rsquo;t match a member on file.
        </p>
      </div>
    )
  }

  const isVerified = result.status === 'verified'

  return (
    <div style={shellStyle}>
      <p className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>NMA Gombe</p>

      <p
        className="type-small font-semibold mt-md px-md py-xs"
        style={{
          color: isVerified ? 'var(--color-green)' : 'var(--color-ink-3)',
          backgroundColor: isVerified ? 'var(--color-green-wash)' : 'var(--color-rule)',
          borderRadius: 'var(--radius)',
          display: 'inline-block',
        }}
      >
        {isVerified ? 'Verified member' : 'Not a current member'}
      </p>

      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
        {result.displayName}
      </h1>
      {result.grade && (
        <p className="type-body mt-xs" style={{ color: 'var(--color-ink-2)' }}>
          {gradeLabels[result.grade as Grade] ?? result.grade}
        </p>
      )}
      {result.facility && (
        <p className="type-small mt-xs" style={{ color: 'var(--color-ink-3)' }}>
          {result.facility}
        </p>
      )}
      <p className="type-folio tabular mt-md" style={{ color: 'var(--color-ink-3)' }}>
        {result.folioNumber}
      </p>
    </div>
  )
}
