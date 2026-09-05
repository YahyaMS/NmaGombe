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
        {/* Real photo of the chapter's State Officers' Committee — duotoned */}
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
            src="/photos/Executives.jpg"
            alt=""
            fill
            style={{ objectFit: 'cover', objectPosition: 'center 35%' }}
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

      {/* ── History ── */}
      <section aria-label="Chapter history">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
            History
          </p>

          <div className="flex flex-col gap-md" style={{ maxWidth: '68ch' }}>
            <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
              The Gombe State Branch of the Nigerian Medical Association (NMA) is the primary
              professional body for physicians practising in Gombe State. Its origins trace back
              to the wider Nigerian Medical Association, which began in 1951 as a branch of the
              British Medical Association in Nigeria, was rebranded the Nigerian Medical
              Association in 1960, and received official recognition in 1962.
            </p>
            <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
              Following the creation of Gombe State in 1996, the state&rsquo;s medical sector
              expanded significantly, mirroring the growth of institutions such as the State
              Specialist Hospital, the Federal Teaching Hospital Gombe (formerly the Federal
              Medical Centre), and Gombe State University&rsquo;s College of Medical Sciences —
              and, more recently, Federal Medical Centre Kumo and the National Orthopaedic
              Hospital, Biliri, among others. NMA Gombe became a crucial platform for the
              state&rsquo;s physicians, dedicated to their professional welfare, advocating for
              better healthcare services, upholding ethical practice, and building unity among
              practitioners.
            </p>
            <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
              The branch has advanced healthcare in Gombe State through medical outreach
              programmes, public health awareness campaigns, scientific conferences, and joint
              ventures with government agencies and other bodies. It has also developed numerous
              prominent medical leaders who have contributed to the association at both state and
              national level.
            </p>
            <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
              In recent years, NMA Gombe has prioritised strengthening its internal operations —
              improved welfare initiatives, avenues for professional development, publications
              such as the Gombe Doctors&rsquo; Bulletin, and projects to improve member identity
              and wellbeing, including a dedicated association building.
            </p>
            <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
              NMA Gombe remains a respected affiliate of the Nigerian Medical Association,
              committed to camaraderie among doctors, protecting members&rsquo; interests, and
              improving health outcomes for the people of Gombe State.
            </p>
            <div
              className="flex items-center"
              style={{ gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/photos/chairman NMA Gombe Dr Ishaq Inuwa Gombe.jpg"
                  alt=""
                  width={48}
                  height={48}
                  style={{ objectFit: 'cover', objectPosition: 'center top', width: '100%', height: '100%' }}
                />
              </div>
              <p className="type-small" style={{ color: 'var(--color-ink-3)' }}>
                Written by Dr. Ishaq Inuwa Gombe, Chairman, NMA Gombe State, 2026–present.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: '1px', backgroundColor: 'var(--color-rule)', margin: '0 var(--spacing-md)' }} />

      {/* ── State Officers' Committee pointer ──
          The full committee + past leadership moved to their own page,
          /executives — see docs/09-DECISIONS.md. Just a clear pointer here,
          not a preview; the header nav and footer also link there. */}
      <section aria-label="State Officers&rsquo; Committee" style={{ backgroundColor: 'var(--color-green-wash)' }}>
        <div
          className="mx-auto px-md py-xl flex items-center justify-between gap-md flex-wrap"
          style={{ maxWidth: 'var(--width-shell)' }}
        >
          <div>
            <p className="type-eyebrow section-rule mb-sm" style={{ color: 'var(--color-ink-3)' }}>
              Leadership
            </p>
            <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
              The State Officers&rsquo; Committee and past leadership since 1998.
            </p>
          </div>
          <Link
            href="/executives"
            className="type-small font-semibold whitespace-nowrap px-md py-sm"
            style={{
              backgroundColor: 'var(--color-green)',
              color: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
            }}
          >
            Meet the State Officers&rsquo; Committee →
          </Link>
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
