/**
 * /about/past-leadership — Chairmen and Secretaries since 1998.
 *
 * Register-row table. Dates in tabular figures. No decoration.
 * design.md §5 — every list is register rows.
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Past Leadership',
  description:
    'Chairmen and secretaries of the NMA Gombe State Chapter since 1998.',
}

const PAST_LEADERS = [
  { year: '1998–2000', chairman: 'Dr. Ahmed Adamu Yarima',   secretary: 'Dr. Garba Manassa' },
  { year: '2000–2002', chairman: 'Dr. Bala Aude',            secretary: 'Dr. Alfred Awali Massa' },
  { year: '2002–2004', chairman: 'Dr. Iliya Galo',           secretary: 'Dr. Yarima Suleiman' },
  { year: '2004–2005', chairman: 'Dr. Saidu Abubakar',       secretary: 'Dr. Jaura Pobe Degri' },
  { year: '2005–2006', chairman: 'Dr. Yarima Suleiman',      secretary: 'Dr. Ishaya B. Kennedy' },
  { year: '2006–2008', chairman: 'Dr. Abubakar Sadiq',       secretary: 'Dr. Reuben Maigatanya' },
  { year: '2008–2010', chairman: 'Dr. Daniel D. Kokong',     secretary: 'Dr. Ahmed Ya\'u Kashere' },
  { year: '2010–2012', chairman: 'Dr. Benson Ogbogbu',       secretary: 'Dr. Babatunde Fakuade' },
  { year: '2012–2014', chairman: 'Dr. Jaura Pobe Degri',     secretary: 'Dr. Muhammad Sagir' },
  { year: '2014–2016', chairman: 'Dr. Adamu Danladi Bajide', secretary: 'Dr. Nuhu Bile' },
  { year: '2016–2018', chairman: 'Dr. Kelas Makadi Samu',    secretary: 'Dr. Sambo Samuil Abubakar' },
  { year: '2018–2020', chairman: 'Dr. Kelas Paul Zawaya',    secretary: 'Dr. Mohammed Bose Abdullahi' },
  { year: '2020–2022', chairman: 'Dr. Mohammed Bello Mahdi', secretary: 'Dr. Egwu O. Wabs' },
  { year: '2022–2024', chairman: 'Dr. Khalifa Abdulsalam',   secretary: 'Dr. Daniel Apollos' },
  { year: '2024–2026', chairman: 'Dr. Ahmad Adamu Girbo',    secretary: 'Dr. Samuel Lembi Lamech' },
  { year: '2026–present', chairman: 'Dr. Ishaq Inuwa Gombe', secretary: 'Dr. Joel Iliya Alphayo' },
]

export default function PastLeadershipPage() {
  const historicalRows = PAST_LEADERS.slice(0, -1)   // all except current
  const currentRow     = PAST_LEADERS[PAST_LEADERS.length - 1]!

  return (
    <div style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* ── Page header ── */}
      <header style={{ backgroundColor: 'var(--color-green-deep)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p
            className="type-eyebrow section-rule mb-lg"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            About · History
          </p>
          <h1 className="type-h1" style={{ color: 'var(--color-surface)', maxWidth: '22ch' }}>
            Past chairmen and secretaries
          </h1>
          <p
            className="type-body-lg"
            style={{ color: 'rgba(255,255,255,0.70)', marginTop: 'var(--spacing-md)', maxWidth: '44ch' }}
          >
            The record of chapter leadership since 1998.
          </p>
        </div>
      </header>

      {/* ── Table — register rows ── */}
      <section aria-label="Past leadership">
        <div className="mx-auto px-md" style={{ maxWidth: 'var(--width-shell)', overflowX: 'auto' }}>

          {/* Column headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '10ch 1fr 1fr',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-lg) 0 var(--spacing-sm)',
              borderBottom: '3px solid var(--color-green)',
            }}
          >
            <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>Period</span>
            <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>Chairman</span>
            <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>Secretary</span>
          </div>

          {/* Historical rows */}
          {historicalRows.map((row, i) => (
            <div
              key={row.year}
              style={{
                display: 'grid',
                gridTemplateColumns: '10ch 1fr 1fr',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md) 0',
                borderBottom: '1px solid var(--color-rule)',
                // Alternating green-wash for readability on a long table
                backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--color-green-wash)',
              }}
            >
              <span
                className="type-folio tabular"
                style={{ color: 'var(--color-ink-3)', fontSize: '13px' }}
              >
                {row.year}
              </span>
              <span className="type-body" style={{ color: 'var(--color-ink)' }}>
                {row.chairman}
              </span>
              <span className="type-body" style={{ color: 'var(--color-ink-2)' }}>
                {row.secretary}
              </span>
            </div>
          ))}

          {/* Current leadership — distinguished row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '10ch 1fr 1fr',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md) 0',
              marginBottom: 'var(--spacing-xl)',
              backgroundColor: 'var(--color-green-wash)',
              borderLeft: '3px solid var(--color-green)',
              paddingLeft: 'var(--spacing-md)',
            }}
          >
            <span
              className="type-folio tabular"
              style={{ color: 'var(--color-green)', fontSize: '13px' }}
            >
              {currentRow.year}
            </span>
            <span className="type-body font-semibold" style={{ color: 'var(--color-ink)' }}>
              {currentRow.chairman}
            </span>
            <span className="type-body font-semibold" style={{ color: 'var(--color-ink)' }}>
              {currentRow.secretary}
            </span>
          </div>
        </div>
      </section>

      {/* ── Back to executives ── */}
      <section style={{ borderTop: '1px solid var(--color-rule)' }}>
        <div className="mx-auto px-md py-lg" style={{ maxWidth: 'var(--width-shell)' }}>
          <Link
            href="/about/executives"
            className="type-small"
            style={{ color: 'var(--color-green)' }}
          >
            ← Current executive council
          </Link>
        </div>
      </section>
    </div>
  )
}
