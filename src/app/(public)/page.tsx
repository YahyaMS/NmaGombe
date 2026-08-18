/**
 * Homepage — /
 *
 * Logged out: display-scale statement of what the chapter is, one photograph,
 * two actions — "Find a doctor" (primary) and "Member sign in".
 * Below: most recent communiqués as register rows if any exist.
 *
 * Logged in: folio card replaces the statement (Phase 1, not this page).
 * Same URL, different job — session detection happens in Phase 1.
 *
 * Design: design.md §10. No feature grid, ever.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { existsSync } from 'fs'
import path from 'path'

export const metadata: Metadata = {
  title: 'Nigerian Medical Association — Gombe State Chapter',
  description:
    'Find a verified doctor in Gombe State, access member resources, and connect with the NMA Gombe chapter.',
}

// Phase 1 will fetch recent communiqués from Firestore.
// For now the section is absent (correct empty-state behaviour per design.md §11).

function heroPhotoPath(): string | null {
  // The first photograph in public/photos/ is the hero image.
  // Real Gombe photos only — see design.md §9.
  const photosDir = path.join(process.cwd(), 'public/photos')
  try {
    const { readdirSync } = require('fs') as typeof import('fs')
    const files = readdirSync(photosDir).filter((f: string) =>
      /\.(jpe?g|png|webp|avif)$/i.test(f)
    )
    return files.length > 0 ? `/photos/${files[0]}` : null
  } catch {
    return null
  }
}

export default function HomePage() {
  const photo = heroPhotoPath()

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        aria-label="Chapter introduction"
        style={{ backgroundColor: 'var(--color-green-deep)', position: 'relative', overflow: 'hidden' }}
      >
        {/* Duotone photograph — real Gombe photo or typographic fallback */}
        {photo != null ? (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              // Duotone filter: maps to --green-deep at 92% per design.md §7.8
              filter: 'grayscale(100%) contrast(1.1) brightness(0.7)',
              mixBlendMode: 'luminosity',
              zIndex: 0,
            }}
          >
            <Image
              src={photo}
              alt=""
              fill
              style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
              priority
              sizes="100vw"
            />
          </div>
        ) : null}

        {/* Content — sits above photograph */}
        <div
          className="relative mx-auto px-md py-2xl flex flex-col gap-lg"
          style={{ maxWidth: 'var(--width-shell)', zIndex: 1 }}
        >
          {/* Eyebrow motif */}
          <p
            className="type-eyebrow section-rule"
            style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 'fit-content' }}
          >
            Gombe State Chapter
          </p>

          {/* Display statement — replace with the chapter's own words */}
          <h1
            className="type-display"
            style={{ color: 'var(--color-surface)', maxWidth: '16ch' }}
          >
            {/* CONTENT: Replace with an actual statement about the chapter */}
            Medicine. Community. Gombe.
          </h1>

          {/* Standfirst — replace with chapter's own description */}
          <p
            className="type-body-lg"
            style={{ color: 'rgba(255,255,255,0.80)', maxWidth: '42ch' }}
          >
            {/* CONTENT: Replace with chapter description — one sentence, active voice */}
            The professional body for medical doctors practising in Gombe State,
            supporting members across practice, welfare and continuing education.
          </p>

          {/* Primary actions */}
          <div className="flex flex-wrap gap-sm items-center">
            <Link
              href="/doctors"
              className="type-body font-semibold px-lg py-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-green)',
                borderRadius: 'var(--radius)',
                transitionDuration: 'var(--motion-fast)',
              }}
            >
              Find a doctor
            </Link>
            <Link
              href="/signin"
              className="type-body font-semibold px-lg py-sm transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-surface)',
                border: '1px solid rgba(255,255,255,0.40)',
                borderRadius: 'var(--radius)',
                transitionDuration: 'var(--motion-fast)',
              }}
            >
              Member sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── What the chapter does ────────────────────────────────────────────
          Three register rows, no boxes, no grid.
          Content: replace with real chapter priorities.
         ─────────────────────────────────────────────────────────────────── */}
      <section
        aria-label="Chapter focus"
        style={{ backgroundColor: 'var(--color-paper)' }}
      >
        <div
          className="mx-auto px-md py-xl"
          style={{ maxWidth: 'var(--width-shell)' }}
        >
          <p
            className="type-eyebrow section-rule mb-lg"
            style={{ color: 'var(--color-ink-3)' }}
          >
            What we do
          </p>

          {/* Register rows — no boxes */}
          {[
            {
              index: '01',
              title: 'Verified member directory',
              detail:
                'Find a colleague by name, specialty or facility. One tap to call or WhatsApp.',
              href: '/doctors',
            },
            {
              index: '02',
              title: 'Professional community',
              detail:
                'Communiqués, CME events and chapter news — the record of practice in Gombe State.',
              href: '/news',
            },
            {
              index: '03',
              title: 'Membership and dues',
              detail:
                'Join the chapter, pay dues online, and carry your digital folio card.',
              href: '/membership',
            },
          ].map(({ index, title, detail, href }, i, arr) => (
            <Link
              key={index}
              href={href}
              className="block"
              style={{
                textDecoration: 'none',
                display: 'grid',
                gridTemplateColumns: '5ch 1fr',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md) 0',
                borderBottom:
                  i < arr.length - 1 ? '1px solid var(--color-rule)' : undefined,
                minHeight: '48px',
                transition: `background-color var(--motion-fast)`,
              }}
            >
              <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)', paddingTop: '4px' }}>
                {index}
              </span>
              <div>
                <p className="type-h3" style={{ color: 'var(--color-ink)' }}>
                  {title}
                </p>
                <p
                  className="type-small"
                  style={{ color: 'var(--color-ink-3)', marginTop: 'var(--spacing-xs)' }}
                >
                  {detail}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Communiqués — renders only when Firestore returns data (Phase 1) ─
          Empty state: section is absent entirely, not an empty panel.
         ─────────────────────────────────────────────────────────────────── */}
    </>
  )
}
