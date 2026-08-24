/**
 * Homepage — /
 *
 * display-scale statement, one photograph (Members of NMA Gombe), two
 * primary actions, register-row "what we do" section. The second hero
 * action (HeroAccountLink) and the folio-card section's link (FolioCtaLink)
 * are session-aware client islands, reading nma_display — same pattern as
 * HeaderAccountLink. No Firebase SDK, no move to dynamic rendering; this
 * page is still a static Server Component.
 *
 * NOT done: this originally intended (see docs/09-DECISIONS.md ADR-018)
 * for the folio-card section to show the signed-in visitor's own live card
 * in place of the static demo card below. That was never built — only the
 * two link-swap fixes above are. Fetching a member's own card data on a
 * public route without either shipping the Firestore client SDK to a
 * public page or moving it to dynamic rendering is a real design question,
 * not a quick fix — a future slice, not silently assumed solved here.
 *
 * design.md §10. No feature grid, ever.
 */

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FolioCard } from '@/components/ui/FolioCard'
import { HeroAccountLink } from './HeroAccountLink'
import { FolioCtaLink } from './FolioCtaLink'

export const metadata: Metadata = {
  title: 'Nigerian Medical Association — Gombe State Chapter',
  description:
    'Find a verified doctor in Gombe State, access member resources, and connect with the NMA Gombe chapter.',
}

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section
        aria-label="Chapter introduction"
        style={{ backgroundColor: 'var(--color-green-deep)', position: 'relative', overflow: 'hidden' }}
      >
        {/* Real group photo — duotone in --green-deep */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            filter: 'grayscale(100%) contrast(1.1) brightness(0.55)',
            mixBlendMode: 'luminosity',
            zIndex: 0,
          }}
        >
          <Image
            src="/photos/Members of NMA Gombe.jpg"
            alt=""
            fill
            style={{ objectFit: 'cover', objectPosition: 'center 35%' }}
            priority
            sizes="100vw"
          />
        </div>

        <div
          className="relative mx-auto px-md py-2xl flex flex-col gap-lg"
          style={{ maxWidth: 'var(--width-shell)', zIndex: 1 }}
        >
          <p
            className="type-eyebrow section-rule"
            style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 'fit-content' }}
          >
            Gombe State Chapter
          </p>

          <h1
            className="type-display"
            style={{ color: 'var(--color-surface)', maxWidth: '18ch' }}
          >
            The professional home of doctors in Gombe State.
          </h1>

          <p
            className="type-body-lg"
            style={{ color: 'rgba(255,255,255,0.80)', maxWidth: '42ch' }}
          >
            Find a verified colleague, follow chapter news, and carry your membership
            card — all in one place.
          </p>

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
            <HeroAccountLink />
          </div>
        </div>
      </section>

      {/* ── What the chapter does ── */}
      <section aria-label="Chapter focus" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
            What we do
          </p>

          {[
            {
              index: '01',
              title: 'Verified member directory',
              detail: 'Find a colleague by name, specialty or facility. One tap to call or WhatsApp.',
              href: '/doctors',
            },
            {
              index: '02',
              title: 'Professional community',
              detail: 'Communiqués, CME events and chapter news — the record of practice in Gombe State.',
              href: '/news',
            },
            {
              index: '03',
              title: 'Membership and dues',
              detail: 'Join the chapter, pay dues online, and carry your digital folio card.',
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
                borderBottom: i < arr.length - 1 ? '1px solid var(--color-rule)' : undefined,
                minHeight: '48px',
              }}
            >
              <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)', paddingTop: '4px' }}>
                {index}
              </span>
              <div>
                <p className="type-h3" style={{ color: 'var(--color-ink)' }}>{title}</p>
                <p className="type-small" style={{ color: 'var(--color-ink-3)', marginTop: 'var(--spacing-xs)' }}>
                  {detail}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Folio card preview ──
          Shows what members carry — a demo card, always, for every visitor.
          Replacing this with the signed-in visitor's own live card was the
          original intent but was never built; see the file-level comment
          above and docs/09-DECISIONS.md ADR-018. Only the link below it
          (FolioCtaLink) is session-aware.
         ── */}
      <section
        aria-label="Digital membership card"
        style={{ backgroundColor: 'var(--color-green-wash)', borderTop: '1px solid var(--color-rule)' }}
      >
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 'var(--spacing-xl)',
              alignItems: 'center',
            }}
            className="sm:grid-cols-2"
          >
            {/* Copy */}
            <div>
              <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
                Digital folio card
              </p>
              <h2 className="type-h2" style={{ color: 'var(--color-ink)' }}>
                Your membership in your pocket
              </h2>
              <p className="type-body" style={{ color: 'var(--color-ink-2)', marginTop: 'var(--spacing-md)', maxWidth: '42ch' }}>
                Verified members carry a digital folio card — available offline,
                scannable for instant verification, and downloadable as an image.
                Tap the card to flip it.
              </p>
              <FolioCtaLink />
            </div>

            {/* Demo card — Dr. Yahya's card as example */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <FolioCard
                name="Dr. Yahya Musa Sulaiman"
                grade="Consultant Obstetrician & Gynaecologist"
                folioNumber="NMA/GM/62376"
                duesYear="2026"
                status="active"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Communiqués — renders only when Firestore returns data (Phase 1).
          Empty = section absent entirely, not an empty panel. */}
    </>
  )
}
