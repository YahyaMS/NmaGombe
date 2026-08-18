/**
 * /about/executives — Current executive council, 2026–present.
 *
 * Register rows per design.md §5. Photos where available; typographic
 * avatar (initials on --green-deep) where not.
 * Past leadership lives at /about/past-leadership.
 */

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Executive Council',
  description:
    'Current executive council of the Nigerian Medical Association, Gombe State Chapter — 2026 to present.',
}

interface Executive {
  role: string
  name: string
  /** Path relative to /public, or null if no photo */
  photo: string | null
  initials: string
}

const EXECUTIVES: Executive[] = [
  {
    role: 'Chairman',
    name: 'Dr. Ishaq Inuwa Gombe',
    photo: '/photos/Dr Ishaq Inuwa Gombe.jpg',
    initials: 'IIG',
  },
  {
    role: 'Deputy Chairman',
    name: 'Dr. Daniel Apollos',
    photo: '/photos/Dr Daniel Apolos - Deputy Chairman.jpg',
    initials: 'DA',
  },
  {
    role: 'Vice Chairman',
    name: 'Dr. Mohammed Bose Abdullahi',
    photo: null,
    initials: 'MBA',
  },
  {
    role: 'Secretary',
    name: 'Dr. Joel Iliya Alphayo',
    photo: '/photos/Dr Joel Iliya Alphayo - Secretary.jpg',
    initials: 'JIA',
  },
  {
    role: 'Asst. Secretary',
    name: 'Dr. Tinu Joshua Gani',
    photo: '/photos/Dr Tinu Joshua Gani - Asst. Sect Gen.jpg',
    initials: 'TJG',
  },
  {
    role: 'Treasurer',
    name: 'Dr. Anuwa Hassan Dankano',
    photo: '/photos/Dr Anuwa Hassan Dankano - Treasurer.jpg',
    initials: 'AHD',
  },
  {
    role: 'Financial Secretary',
    name: 'Dr. Umar M. Abdullahi',
    photo: '/photos/Dr Umar M Abdullahi - Financial Secretary.jpg',
    initials: 'UMA',
  },
  {
    role: 'Director, Social Welfare',
    name: 'Dr. Fatima Bakari',
    photo: null,
    initials: 'FB',
  },
  {
    role: 'P.R.O.',
    name: 'Dr. Ukasha Musa Hashim',
    photo: null,
    initials: 'UMH',
  },
  {
    role: 'Editor of Journal',
    name: 'Dr. Joshua Abubakar Difa',
    photo: null,
    initials: 'JAD',
  },
  {
    role: 'Ex-Officio I',
    name: 'Dr. Ahmad Adamu Girbo',
    photo: '/photos/Dr Ahmad Adamu Girbo - Ex-officio I.jpg',
    initials: 'AAG',
  },
  {
    role: 'Ex-Officio II',
    name: 'Dr. Samuel Lembi Lamech',
    photo: '/photos/Dr Samuel Lembi Lamech - Ex-officio II.jpg',
    initials: 'SLL',
  },
]

function ExecAvatar({ exec }: { exec: Executive }) {
  if (exec.photo) {
    return (
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          // Duotone via CSS: desaturate + blend
          filter: 'grayscale(30%)',
        }}
      >
        <Image
          src={exec.photo}
          alt={exec.name}
          width={48}
          height={48}
          style={{ objectFit: 'cover', objectPosition: 'center top', width: '100%', height: '100%' }}
        />
      </div>
    )
  }

  // Typographic avatar — initials on --green-deep
  return (
    <div
      aria-hidden="true"
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-green-deep)',
        color: 'rgba(255,255,255,0.70)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.04em',
      }}
    >
      {exec.initials}
    </div>
  )
}

export default function ExecutivesPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* ── Page header ── */}
      <header style={{ backgroundColor: 'var(--color-green-deep)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p
            className="type-eyebrow section-rule mb-lg"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            About · Executive council
          </p>
          <h1 className="type-h1" style={{ color: 'var(--color-surface)', maxWidth: '22ch' }}>
            Executive council
          </h1>
          <p
            className="type-body-lg"
            style={{ color: 'rgba(255,255,255,0.70)', marginTop: 'var(--spacing-md)', maxWidth: '40ch' }}
          >
            2026 — present
          </p>
        </div>
      </header>

      {/* ── Register rows ── */}
      <section aria-label="Executive council members">
        <div className="mx-auto px-md" style={{ maxWidth: 'var(--width-shell)' }}>
          <div style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-xl)' }}>
            {EXECUTIVES.map((exec, i) => (
              <div
                key={exec.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '14ch auto 1fr',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-md) 0',
                  borderBottom:
                    i < EXECUTIVES.length - 1
                      ? '1px solid var(--color-rule)'
                      : undefined,
                  minHeight: '64px',
                }}
              >
                {/* Role index */}
                <span
                  className="type-eyebrow"
                  style={{ color: 'var(--color-ink-3)', paddingRight: 'var(--spacing-sm)' }}
                >
                  {exec.role}
                </span>

                {/* Avatar */}
                <ExecAvatar exec={exec} />

                {/* Name */}
                <p className="type-h3" style={{ color: 'var(--color-ink)' }}>
                  {exec.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Past leadership link ── */}
      <section
        style={{
          borderTop: '1px solid var(--color-rule)',
          backgroundColor: 'var(--color-green-wash)',
        }}
      >
        <div className="mx-auto px-md py-lg" style={{ maxWidth: 'var(--width-shell)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--spacing-md)',
            }}
          >
            <div>
              <p className="type-eyebrow section-rule mb-sm" style={{ color: 'var(--color-ink-3)' }}>
                History
              </p>
              <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
                Chairmen and secretaries since 1998.
              </p>
            </div>
            <Link
              href="/about/past-leadership"
              className="type-small font-semibold whitespace-nowrap px-md py-sm"
              style={{
                backgroundColor: 'var(--color-green)',
                color: 'var(--color-surface)',
                borderRadius: 'var(--radius)',
              }}
            >
              Past leadership →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
