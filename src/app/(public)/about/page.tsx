/**
 * /about — Chapter history, constitution, and background.
 *
 * Content slots are marked CONTENT: — replace with real text before launch.
 * No content = section is absent. Never render empty panels.
 *
 * /about/executives lives in its own page once exec data exists (Phase 1).
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About',
  description:
    'About the Nigerian Medical Association, Gombe State Chapter — history, mandate and executive leadership.',
}

export default function AboutPage() {
  return (
    <article style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <header
        style={{ backgroundColor: 'var(--color-green-deep)', color: 'var(--color-surface)' }}
      >
        <div
          className="mx-auto px-md py-xl"
          style={{ maxWidth: 'var(--width-shell)' }}
        >
          <p
            className="type-eyebrow section-rule mb-lg"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            About the chapter
          </p>
          <h1 className="type-h1" style={{ color: 'var(--color-surface)', maxWidth: '20ch' }}>
            {/* CONTENT: Chapter founding statement — one sentence */}
            The NMA Gombe State Chapter
          </h1>
        </div>
      </header>

      {/* ── Chapter statement ────────────────────────────────────────────── */}
      <section aria-label="About">
        <div
          className="mx-auto px-md py-xl"
          style={{ maxWidth: 'var(--width-prose)' }}
        >
          <p
            className="type-eyebrow section-rule mb-lg"
            style={{ color: 'var(--color-ink-3)' }}
          >
            The chapter
          </p>
          {/* CONTENT: Chapter description — 2–3 paragraphs, active voice, no exclamation marks */}
          <p className="type-body-lg" style={{ color: 'var(--color-ink)' }}>
            The Nigerian Medical Association, Gombe State Chapter, represents medical doctors
            practising in Gombe State. The chapter is the state arm of the Nigerian Medical
            Association and works to advance the professional interests of its members and the
            health of the communities they serve.
          </p>
          <p
            className="type-body"
            style={{ color: 'var(--color-ink)', marginTop: 'var(--spacing-lg)' }}
          >
            {/* CONTENT: Additional chapter context — mandate, founding year, key milestones */}
            Replace this paragraph with the chapter&apos;s own history and mandate.
            Ask the Secretary for the chapter history text.
          </p>
        </div>
      </section>

      {/* ── Rule separator ───────────────────────────────────────────────── */}
      <div style={{ height: '1px', backgroundColor: 'var(--color-rule)', margin: '0 var(--spacing-md)' }} />

      {/* ── Mandate ──────────────────────────────────────────────────────── */}
      <section aria-label="Mandate">
        <div
          className="mx-auto px-md py-xl"
          style={{ maxWidth: 'var(--width-shell)' }}
        >
          <p
            className="type-eyebrow section-rule mb-lg"
            style={{ color: 'var(--color-ink-3)' }}
          >
            Mandate
          </p>

          {/* Three register rows — no boxes */}
          {[
            {
              index: '—',
              title: 'Professional advocacy',
              detail:
                'Representing the interests of doctors in Gombe State at state and national level.',
            },
            {
              index: '—',
              title: 'Continuing medical education',
              detail:
                'Coordinating CME programmes, scientific conferences and training for members.',
            },
            {
              index: '—',
              title: 'Welfare and support',
              detail:
                'Supporting the welfare of members and their families through the chapter welfare fund.',
            },
          ].map(({ index, title, detail }, i, arr) => (
            <div
              key={title}
              style={{
                display: 'grid',
                gridTemplateColumns: '3ch 1fr',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md) 0',
                borderBottom:
                  i < arr.length - 1 ? '1px solid var(--color-rule)' : undefined,
              }}
            >
              <span
                className="type-eyebrow"
                style={{ color: 'var(--color-ink-3)', paddingTop: '4px' }}
              >
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
            </div>
          ))}
        </div>
      </section>

      {/* ── Rule separator ───────────────────────────────────────────────── */}
      <div style={{ height: '1px', backgroundColor: 'var(--color-rule)', margin: '0 var(--spacing-md)' }} />

      {/* ── Executive council (placeholder — populated in Phase 1) ───────── */}
      <section aria-label="Executive council">
        <div
          className="mx-auto px-md py-xl"
          style={{ maxWidth: 'var(--width-shell)' }}
        >
          <div className="flex items-baseline justify-between gap-md mb-lg">
            <p
              className="type-eyebrow section-rule"
              style={{ color: 'var(--color-ink-3)', flexShrink: 0 }}
            >
              Executive council
            </p>
            <Link
              href="/about/executives"
              className="type-small"
              style={{ color: 'var(--color-green)' }}
            >
              Full list →
            </Link>
          </div>

          {/* CONTENT: Replace with real exec data once available.
              Phase 1 will fetch this from Firestore.
              Executives are register rows. */}
          <p className="type-small" style={{ color: 'var(--color-ink-3)' }}>
            Executive list will appear here once member data is available.
          </p>
        </div>
      </section>

      {/* ── Constitution ─────────────────────────────────────────────────── */}
      {/* Render only if the chapter makes the constitution available.
          If there is no document, this section is absent. */}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section
        aria-label="Join the chapter"
        style={{ backgroundColor: 'var(--color-green-wash)' }}
      >
        <div
          className="mx-auto px-md py-xl"
          style={{ maxWidth: 'var(--width-shell)' }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: 'var(--spacing-lg)',
              borderBottom: '1px solid var(--color-rule)',
              paddingBottom: 'var(--spacing-xl)',
            }}
          >
            <div>
              <p
                className="type-eyebrow section-rule mb-sm"
                style={{ color: 'var(--color-ink-3)' }}
              >
                Membership
              </p>
              <p className="type-h2" style={{ color: 'var(--color-ink)' }}>
                Join the chapter
              </p>
              <p
                className="type-body"
                style={{ color: 'var(--color-ink-2)', marginTop: 'var(--spacing-sm)' }}
              >
                Verified members access the full directory, pay dues online, and carry
                a digital folio card.
              </p>
            </div>
            <Link
              href="/membership"
              className="type-body font-semibold px-lg py-sm whitespace-nowrap"
              style={{
                backgroundColor: 'var(--color-green)',
                color: 'var(--color-surface)',
                borderRadius: 'var(--radius)',
              }}
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>
    </article>
  )
}
