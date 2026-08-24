/**
 * /about — Chapter background, vision, mission, executives, affiliates.
 *
 * design.md §10 — register rows, no boxes.
 * NMA Vision & Mission from official NMA Nigeria statements.
 */

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { AboutJoinCta } from './AboutJoinCta'

export const metadata: Metadata = {
  title: 'About',
  description:
    'About the Nigerian Medical Association, Gombe State Chapter — vision, mission, executive leadership and affiliate organisations.',
}

const AFFILIATES = [
  {
    name: 'Medical and Dental Consultants Association (MDCAN)',
    president: 'Dr. Aliyu Lawal',
    secretary: 'Dr. Umar A.M.',
  },
  {
    name: 'Medical Women Association of Nigeria (MWAN)',
    president: 'Dr. Hajara Aminu Galadima',
    secretary: 'Dr. Lateef Khifayah',
    note: 'Crown princess: Dr. Bilqis Uwani Muhammad',
  },
  {
    name: 'Association of Resident Doctors — FTH Gombe (ARD FTH)',
    president: 'Dr. Usman Sadiq Nasir',
    secretary: 'Dr. Kelvin Obianno',
  },
  {
    name: 'Association of Resident Doctors — SSH Gombe (ARD SSH)',
    president: 'Dr. Umar Billiri',
    secretary: 'Dr. Bedan Jinhama',
  },
]

export default function AboutPage() {
  return (
    <article style={{ backgroundColor: 'var(--color-paper)' }}>

      {/* ── Page header ── */}
      <header style={{ backgroundColor: 'var(--color-green-deep)', position: 'relative', overflow: 'hidden' }}>
        {/* Group photo — duotoned */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            filter: 'grayscale(100%) contrast(1.1) brightness(0.5)',
            mixBlendMode: 'luminosity',
            zIndex: 0,
          }}
        >
          <Image
            src="/photos/Members of NMA Gombe.jpg"
            alt=""
            fill
            style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
            priority
            sizes="100vw"
          />
        </div>
        <div
          className="relative mx-auto px-md py-xl"
          style={{ maxWidth: 'var(--width-shell)', zIndex: 1 }}
        >
          <p
            className="type-eyebrow section-rule mb-lg"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            About the chapter
          </p>
          <h1 className="type-h1" style={{ color: 'var(--color-surface)', maxWidth: '22ch' }}>
            NMA Gombe State Chapter
          </h1>
          <p
            className="type-body-lg"
            style={{ color: 'rgba(255,255,255,0.75)', marginTop: 'var(--spacing-md)', maxWidth: '44ch' }}
          >
            The professional body for medical doctors practising in Gombe State,
            supporting members across practice, welfare and continuing education.
          </p>
        </div>
      </header>

      {/* ── Vision & Mission ── */}
      <section aria-label="Vision and mission">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
            Vision and mission
          </p>

          {/* Vision — register row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '8ch 1fr',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md) 0',
              borderBottom: '1px solid var(--color-rule)',
            }}
          >
            <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)', paddingTop: '4px' }}>
              Vision
            </span>
            <p className="type-body-lg" style={{ color: 'var(--color-ink)', maxWidth: '60ch' }}>
              A formidable professional body committed to fostering effective and
              efficient healthcare delivery, high ethical standards and the interests
              of its members.
            </p>
          </div>

          {/* Mission — register row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '8ch 1fr',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md) 0',
            }}
          >
            <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)', paddingTop: '4px' }}>
              Mission
            </span>
            <p className="type-body" style={{ color: 'var(--color-ink-2)', maxWidth: '60ch' }}>
              To build a sustainable professional association of medical and dental
              practitioners in Nigeria that will advance the delivery of qualitative
              healthcare services to the populace.
            </p>
          </div>
        </div>
      </section>

      <div style={{ height: '1px', backgroundColor: 'var(--color-rule)', margin: '0 var(--spacing-md)' }} />

      {/* ── Executive council ── */}
      <section aria-label="Executive council">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>
              Executive council · 2026–present
            </p>
            <Link href="/about/executives" className="type-small" style={{ color: 'var(--color-green)', whiteSpace: 'nowrap' }}>
              Full list →
            </Link>
          </div>

          {/* Preview — first four officers only */}
          {[
            { role: 'Chairman',        name: 'Dr. Ishaq Inuwa Gombe' },
            { role: 'Deputy Chairman', name: 'Dr. Daniel Apollos' },
            { role: 'Secretary',       name: 'Dr. Joel Iliya Alphayo' },
            { role: 'Treasurer',       name: 'Dr. Anuwa Hassan Dankano' },
          ].map(({ role, name }, i, arr) => (
            <div
              key={role}
              style={{
                display: 'grid',
                gridTemplateColumns: '14ch 1fr',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md) 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--color-rule)' : undefined,
                minHeight: '48px',
              }}
            >
              <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>{role}</span>
              <span className="type-h3" style={{ color: 'var(--color-ink)' }}>{name}</span>
            </div>
          ))}

          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <Link
              href="/about/executives"
              className="type-small"
              style={{ color: 'var(--color-green)' }}
            >
              View all 12 officers and past leadership →
            </Link>
          </div>
        </div>
      </section>

      <div style={{ height: '1px', backgroundColor: 'var(--color-rule)', margin: '0 var(--spacing-md)' }} />

      {/* ── Affiliate organisations ── */}
      <section aria-label="Affiliate organisations">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
            Affiliate organisations
          </p>

          {AFFILIATES.map((org, i) => (
            <div
              key={org.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                padding: 'var(--spacing-md) 0',
                borderBottom: i < AFFILIATES.length - 1 ? '1px solid var(--color-rule)' : undefined,
              }}
            >
              <p className="type-h3" style={{ color: 'var(--color-ink)' }}>{org.name}</p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--spacing-lg)',
                  marginTop: 'var(--spacing-xs)',
                }}
              >
                <p className="type-small" style={{ color: 'var(--color-ink-3)' }}>
                  <span style={{ color: 'var(--color-ink-2)' }}>President:</span>{' '}
                  {org.president}
                </p>
                <p className="type-small" style={{ color: 'var(--color-ink-3)' }}>
                  <span style={{ color: 'var(--color-ink-2)' }}>Secretary:</span>{' '}
                  {org.secretary}
                </p>
                {org.note && (
                  <p className="type-small" style={{ color: 'var(--color-ink-3)' }}>
                    {org.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section aria-label="Join" style={{ backgroundColor: 'var(--color-green-wash)', borderTop: '1px solid var(--color-rule)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <AboutJoinCta />
        </div>
      </section>
    </article>
  )
}
