/**
 * /membership — how to join, benefits, grades. The conversion page
 * (docs/05-ROUTES.md). No dues figures: docs/00-INTAKE.md item 7 (full dues
 * structure, actual amounts) is still an open blocker — see docs/09-DECISIONS.md
 * and CLAUDE.md's rule against inventing figures. Dues are mentioned only
 * qualitatively, matching how the homepage and /about already frame it.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { gradeLabels, gradeSchema } from '@/lib/data/schemas'

export const metadata: Metadata = {
  title: 'Membership — NMA Gombe',
  description: 'How to join the Nigerian Medical Association, Gombe State Chapter, and what verified membership gives you.',
}

const STEPS = [
  {
    index: '01',
    title: 'Create your account',
    detail: 'Sign up with your name, specialty and MDCN folio number.',
  },
  {
    index: '02',
    title: 'Admin reviews your folio number',
    detail: 'An admin checks it against the membership list — usually within a few days.',
  },
  {
    index: '03',
    title: 'You’re verified',
    detail: 'Full directory access, your digital folio card, and dues payment unlock.',
  },
]

const BENEFITS = [
  {
    title: 'Verified member directory',
    detail: 'Find a colleague by name, specialty or facility, and reach them in one tap.',
  },
  {
    title: 'Digital folio card',
    detail: 'Your membership in your pocket — works offline, scannable for instant verification.',
  },
  {
    title: 'Dues paid to the chapter',
    detail: 'Annual dues, set by the Treasurer by grade. A receipt and record either way.',
  },
]

export default function MembershipPage() {
  return (
    <article style={{ backgroundColor: 'var(--color-paper)' }}>
      <header style={{ backgroundColor: 'var(--color-green-deep)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Membership
          </p>
          <h1 className="type-h1" style={{ color: 'var(--color-surface)', maxWidth: '22ch' }}>
            Join the chapter
          </h1>
          <p className="type-body-lg mt-md" style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '48ch' }}>
            For medical doctors practising in Gombe State. Verification confirms your folio
            number against the membership list — it isn&rsquo;t automatic, and that&rsquo;s
            deliberate.
          </p>
        </div>
      </header>

      {/* ── How it works ── */}
      <section aria-label="How membership works">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
            How it works
          </p>

          {STEPS.map(({ index, title, detail }, i, arr) => (
            <div
              key={index}
              style={{
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
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: '1px', backgroundColor: 'var(--color-rule)', margin: '0 var(--spacing-md)' }} />

      {/* ── What you get ── */}
      <section aria-label="Membership benefits">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
            What you get, once verified
          </p>

          {BENEFITS.map((b, i, arr) => (
            <div
              key={b.title}
              style={{
                padding: 'var(--spacing-md) 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--color-rule)' : undefined,
              }}
            >
              <p className="type-h3" style={{ color: 'var(--color-ink)' }}>{b.title}</p>
              <p className="type-small mt-xs" style={{ color: 'var(--color-ink-3)' }}>{b.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: '1px', backgroundColor: 'var(--color-rule)', margin: '0 var(--spacing-md)' }} />

      {/* ── Grades ── */}
      <section aria-label="Membership grades">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
            Membership grades
          </p>
          <div className="flex flex-wrap gap-sm">
            {gradeSchema.options.map((g) => (
              <span
                key={g}
                className="type-small font-semibold px-md py-xs"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-green-wash)',
                  color: 'var(--color-green)',
                }}
              >
                {gradeLabels[g]}
              </span>
            ))}
          </div>
          <p className="type-small mt-md" style={{ color: 'var(--color-ink-3)' }}>
            Your grade sets the dues rate and the title shown on your folio card — set it in
            your profile after you&rsquo;re verified.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section aria-label="Get started" style={{ backgroundColor: 'var(--color-green-wash)', borderTop: '1px solid var(--color-rule)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: 'var(--spacing-lg)',
            }}
          >
            <div>
              <p className="type-h2" style={{ color: 'var(--color-ink)' }}>Ready to join?</p>
              <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
                Takes a few minutes. You&rsquo;ll need your MDCN folio number.
              </p>
            </div>
            <Link
              href="/signup"
              className="type-body font-semibold px-lg py-sm whitespace-nowrap"
              style={{
                backgroundColor: 'var(--color-green)',
                color: 'var(--color-surface)',
                borderRadius: 'var(--radius)',
              }}
            >
              Create your account
            </Link>
          </div>
          <p className="type-small mt-lg" style={{ color: 'var(--color-ink-3)' }}>
            Already have an account?{' '}
            <Link href="/signin" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </article>
  )
}
