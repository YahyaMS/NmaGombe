/**
 * /executives — current executive council and past leadership, on one page.
 * Split out from /about (which previously nested this at /about/executives
 * and /about/past-leadership) at the user's request, 2026-08-29: a
 * standalone page, more prominent photos, linked from the footer and header
 * nav rather than buried under About. Affiliate organisations stayed on
 * /about — only leadership moved.
 *
 * Photos are deliberately larger and bolder than the old register-row
 * treatment (48px avatars) — still no boxes or shadows (design.md: "no
 * boxes, no shadow" is the rule for every surface except the folio card),
 * just a wider grid and much bigger circular photos, so "bold and bigger"
 * doesn't mean introducing a new boxed-card language to the site.
 */

import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Executive Council',
  description:
    'Current executive council and past leadership of the Nigerian Medical Association, Gombe State Chapter.',
}

interface Executive {
  role: string
  name: string
  /** Path relative to /public, or null if no photo */
  photo: string | null
  initials: string
}

const EXECUTIVES: Executive[] = [
  { role: 'Chairman', name: 'Dr. Ishaq Inuwa Gombe', photo: '/photos/Dr Ishaq Inuwa Gombe.jpg', initials: 'IIG' },
  { role: 'Deputy Chairman', name: 'Dr. Daniel Apollos', photo: '/photos/Dr Daniel Apolos - Deputy Chairman.jpg', initials: 'DA' },
  { role: 'Vice Chairman', name: 'Dr. Mohammed Bose Abdullahi', photo: null, initials: 'MBA' },
  { role: 'Secretary', name: 'Dr. Joel Iliya Alphayo', photo: '/photos/Dr Joel Iliya Alphayo - Secretary.jpg', initials: 'JIA' },
  { role: 'Asst. Secretary', name: 'Dr. Tinu Joshua Gani', photo: '/photos/Dr Tinu Joshua Gani - Asst. Sect Gen.jpg', initials: 'TJG' },
  { role: 'Treasurer', name: 'Dr. Anuwa Hassan Dankano', photo: '/photos/Dr Anuwa Hassan Dankano - Treasurer.jpg', initials: 'AHD' },
  { role: 'Financial Secretary', name: 'Dr. Umar M. Abdullahi', photo: '/photos/Dr Umar M Abdullahi - Financial Secretary.jpg', initials: 'UMA' },
  { role: 'Director, Social Welfare', name: 'Dr. Fatima Bakari', photo: null, initials: 'FB' },
  { role: 'P.R.O.', name: 'Dr. Ukasha Musa Hashim', photo: null, initials: 'UMH' },
  { role: 'Editor of Journal', name: 'Dr. Joshua Abubakar Difa', photo: null, initials: 'JAD' },
  { role: 'Ex-Officio I', name: 'Dr. Ahmad Adamu Girbo', photo: '/photos/Dr Ahmad Adamu Girbo - Ex-officio I.jpg', initials: 'AAG' },
  { role: 'Ex-Officio II', name: 'Dr. Samuel Lembi Lamech', photo: '/photos/Dr Samuel Lembi Lamech - Ex-officio II.jpg', initials: 'SLL' },
]

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

const PHOTO_SIZE = 160

function ExecPhoto({ exec }: { exec: Executive }) {
  if (exec.photo) {
    return (
      <div
        style={{
          width: `${PHOTO_SIZE}px`,
          height: `${PHOTO_SIZE}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          filter: 'grayscale(15%)',
        }}
      >
        <Image
          src={exec.photo}
          alt={exec.name}
          width={PHOTO_SIZE}
          height={PHOTO_SIZE}
          style={{ objectFit: 'cover', objectPosition: 'center top', width: '100%', height: '100%' }}
        />
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      style={{
        width: `${PHOTO_SIZE}px`,
        height: `${PHOTO_SIZE}px`,
        borderRadius: '50%',
        backgroundColor: 'var(--color-green-deep)',
        color: 'rgba(255,255,255,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '28px',
        fontWeight: 500,
        letterSpacing: '0.04em',
      }}
    >
      {exec.initials}
    </div>
  )
}

export default function ExecutivesPage() {
  const historicalRows = PAST_LEADERS.slice(0, -1) // all except current
  const currentRow = PAST_LEADERS[PAST_LEADERS.length - 1]!

  return (
    <div style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* ── Page header ── */}
      <header style={{ backgroundColor: 'var(--color-green-deep)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Executive council
          </p>
          <h1 className="type-h1" style={{ color: 'var(--color-surface)', maxWidth: '22ch' }}>
            The people leading the chapter
          </h1>
          <p className="type-body-lg" style={{ color: 'rgba(255,255,255,0.70)', marginTop: 'var(--spacing-md)', maxWidth: '40ch' }}>
            2026 — present
          </p>
        </div>
      </header>

      {/* ── Current executives — bold photo grid, no boxes ── */}
      <section aria-label="Current executive council">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 'var(--spacing-xl)',
            }}
          >
            {EXECUTIVES.map((exec) => (
              <div key={exec.name} className="flex flex-col items-center text-center" style={{ gap: 'var(--spacing-sm)' }}>
                <ExecPhoto exec={exec} />
                <div>
                  <p className="type-h3" style={{ color: 'var(--color-ink)' }}>{exec.name}</p>
                  <p className="type-small mt-xs" style={{ color: 'var(--color-ink-3)' }}>{exec.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: '1px', backgroundColor: 'var(--color-rule)', margin: '0 var(--spacing-md)' }} />

      {/* ── Past leadership — register rows, unchanged from the old /about/past-leadership ── */}
      <section aria-label="Past leadership">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)', overflowX: 'auto' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
            Past leadership
          </p>

          {/* Column headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '10ch 1fr 1fr',
              gap: 'var(--spacing-md)',
              padding: '0 0 var(--spacing-sm)',
              borderBottom: '3px solid var(--color-green)',
            }}
          >
            <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>Period</span>
            <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>Chairman</span>
            <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>Secretary</span>
          </div>

          {historicalRows.map((row, i) => (
            <div
              key={row.year}
              style={{
                display: 'grid',
                gridTemplateColumns: '10ch 1fr 1fr',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md) 0',
                borderBottom: '1px solid var(--color-rule)',
                backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--color-green-wash)',
              }}
            >
              <span className="type-folio tabular" style={{ color: 'var(--color-ink-3)', fontSize: '13px' }}>{row.year}</span>
              <span className="type-body" style={{ color: 'var(--color-ink)' }}>{row.chairman}</span>
              <span className="type-body" style={{ color: 'var(--color-ink-2)' }}>{row.secretary}</span>
            </div>
          ))}

          {/* Current leadership — distinguished row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '10ch 1fr 1fr',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md) 0',
              marginTop: 'var(--spacing-xs)',
              backgroundColor: 'var(--color-green-wash)',
              borderLeft: '3px solid var(--color-green)',
              paddingLeft: 'var(--spacing-md)',
            }}
          >
            <span className="type-folio tabular" style={{ color: 'var(--color-green)', fontSize: '13px' }}>{currentRow.year}</span>
            <span className="type-body font-semibold" style={{ color: 'var(--color-ink)' }}>{currentRow.chairman}</span>
            <span className="type-body font-semibold" style={{ color: 'var(--color-ink)' }}>{currentRow.secretary}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
