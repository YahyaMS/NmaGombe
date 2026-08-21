/**
 * /doctors — public find-a-doctor. Name, specialty, facility ONLY, never
 * contacts (docs/05-ROUTES.md) — the source collection (publicDirectory)
 * never contains phone/WhatsApp/email to begin with, so there's nothing to
 * filter out here. Zero client JS, same philosophy as /news: plain GET links
 * and a plain search form, no live-as-you-type. Specialty pills are derived
 * from whatever departments actually exist in the current roster, same idea
 * as /portal/directory's specialty filter (docs/05-ROUTES.md), computed here
 * server-side against the full (unfiltered) dataset so they don't disappear
 * once a search narrows the results.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { listPublicDirectory, type PublicDirectoryRow } from '@/lib/data/publicDirectory'
import { gradeLabels } from '@/lib/data/schemas'
import { RegisterRow } from '@/components/ui/RegisterRow'

export const metadata: Metadata = {
  title: 'Find a doctor — NMA Gombe',
  description: 'Find a verified doctor in Gombe State by name, specialty or facility.',
}

function matches(row: PublicDirectoryRow, q: string): boolean {
  const haystack = `${row.displayName} ${row.department} ${row.facility ?? ''}`.toLowerCase()
  return haystack.includes(q.toLowerCase())
}

function secondaryLine(row: PublicDirectoryRow): string {
  const title = row.grade ? `${gradeLabels[row.grade]} · ${row.department}` : row.department
  return row.facility ? `${title} · ${row.facility}` : title
}

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; department?: string }>
}) {
  const { q, department } = await searchParams
  const all = await listPublicDirectory()

  const departments = [...new Set(all.map((r) => r.department))].sort()

  let results = all
  if (department) results = results.filter((r) => r.department === department)
  if (q?.trim()) results = results.filter((r) => matches(r, q.trim()))

  return (
    <div style={{ backgroundColor: 'var(--color-paper)' }}>
      <header style={{ backgroundColor: 'var(--color-green-deep)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Find a doctor
          </p>
          <h1 className="type-h1" style={{ color: 'var(--color-surface)', maxWidth: '22ch' }}>
            Verified doctors in Gombe State
          </h1>
          <p className="type-body mt-md" style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '48ch' }}>
            Name, specialty and facility only. For contact details, a member must sign in to the
            directory.
          </p>
        </div>
      </header>

      <div className="mx-auto px-md" style={{ maxWidth: 'var(--width-shell)' }}>
        <form method="GET" className="flex gap-sm mt-lg" role="search">
          {department && <input type="hidden" name="department" value={department} />}
          <label htmlFor="q" className="sr-only">
            Search by name, specialty or facility
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q ?? ''}
            placeholder="Search by name, specialty or facility"
            style={{
              flex: 1,
              padding: 'var(--spacing-sm) var(--spacing-md)',
              border: '1px solid var(--color-rule-strong)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
            }}
          />
          <button
            type="submit"
            className="type-small font-semibold px-lg py-sm"
            style={{
              backgroundColor: 'var(--color-green)',
              color: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>

        {departments.length > 0 && (
          <nav aria-label="Filter by specialty" className="flex flex-wrap gap-sm mt-md">
            <SpecialtyPill q={q} department={undefined} label="All specialties" active={!department} />
            {departments.map((d) => (
              <SpecialtyPill key={d} q={q} department={d} label={d} active={department === d} />
            ))}
          </nav>
        )}

        <div className="mt-lg" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          {all.length === 0 ? (
            <p className="type-body mt-lg" style={{ color: 'var(--color-ink-3)' }}>
              No members have opted into the public directory yet.
            </p>
          ) : results.length === 0 ? (
            <p className="type-body mt-lg" style={{ color: 'var(--color-ink-3)' }}>
              No members match your search.
            </p>
          ) : (
            results.map((row, i) => (
              <RegisterRow
                key={row.uid}
                primary={row.displayName}
                secondary={secondaryLine(row)}
                last={i === results.length - 1}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function SpecialtyPill({
  q,
  department,
  label,
  active,
}: {
  q?: string
  department: string | undefined
  label: string
  active: boolean
}) {
  const params = new URLSearchParams()
  if (q?.trim()) params.set('q', q.trim())
  if (department) params.set('department', department)
  const href = params.size > 0 ? `/doctors?${params.toString()}` : '/doctors'

  return (
    <Link
      href={href}
      className="type-small font-semibold px-md py-xs"
      style={{
        borderRadius: 'var(--radius)',
        textDecoration: 'none',
        backgroundColor: active ? 'var(--color-green)' : 'var(--color-green-wash)',
        color: active ? 'var(--color-surface)' : 'var(--color-green)',
      }}
    >
      {label}
    </Link>
  )
}
