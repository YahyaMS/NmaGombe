/**
 * Homepage — /
 *
 * display-scale statement, one photograph (Members of NMA Gombe), two
 * primary actions, register-row "what we do" section. Two session-aware
 * client islands read nma_display — same pattern as HeaderAccountLink:
 * HeroAccountLink (the second hero action) and HomeFolioCard (the folio-card
 * section, which additionally fetches /api/portal/own-card for a verified
 * member's own card — an authenticated Route Handler call, not the Firestore
 * client SDK, so this stays a static Server Component with no move to
 * dynamic rendering). The communiqué section below is plain server data —
 * Admin SDK via lib/data/news.ts, the same pattern /news already uses.
 *
 * design.md §10. No feature grid, ever.
 */

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { HeroAccountLink } from './HeroAccountLink'
import { HomeFolioCard } from './HomeFolioCard'
import { listPublishedNews } from '@/lib/data/news'
import { newsCategoryLabels } from '@/lib/data/schemas'
import { RegisterRow } from '@/components/ui/RegisterRow'

export const metadata: Metadata = {
  title: 'Nigerian Medical Association — Gombe State Chapter',
  description:
    'Find a verified doctor in Gombe State, access member resources, and connect with the NMA Gombe chapter.',
}

function formatCommuniqueDate(ts: { toDate: () => Date } | null): string {
  if (!ts) return '—'
  return ts.toDate().toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })
}

export default async function HomePage() {
  const [latestCommunique] = await listPublishedNews()

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
          Signed out (or pending): the demo card, "Get verified →" / "Check
          your status →". Signed in as a verified member/admin: the
          visitor's own real card, fetched from /api/portal/own-card. All
          session-aware logic lives in HomeFolioCard — see its file comment.
         ── */}
      <section
        aria-label="Digital membership card"
        style={{ backgroundColor: 'var(--color-green-wash)', borderTop: '1px solid var(--color-rule)' }}
      >
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <HomeFolioCard
            copy={
              <>
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
              </>
            }
          />
        </div>
      </section>

      {/* ── Latest communiqué ──
          Server data, Admin SDK (lib/data/news.ts) — same pattern as /news.
          Absent entirely when nothing is published yet, never an empty panel. */}
      {latestCommunique && (
        <section aria-label="Latest communiqué" style={{ backgroundColor: 'var(--color-paper)', borderTop: '1px solid var(--color-rule)' }}>
          <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
            <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
              Latest communiqué
            </p>
            <RegisterRow
              index={formatCommuniqueDate(latestCommunique.publishedAt)}
              primary={latestCommunique.title}
              secondary={`${newsCategoryLabels[latestCommunique.category]} · ${latestCommunique.excerpt}`}
              href={`/news/${latestCommunique.slug}`}
              last
            />
          </div>
        </section>
      )}
    </>
  )
}
