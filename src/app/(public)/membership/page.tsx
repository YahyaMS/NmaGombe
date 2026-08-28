/**
 * /membership — how to join, benefits, grades, dues. The conversion page
 * (docs/05-ROUTES.md). The dues figure below is informational text only —
 * no payment flow, no "Pay now" button. Online payment itself is Version 3,
 * unscheduled; the chapter has no CAC registration, a legal prerequisite
 * for a Nigerian payment gateway account. See docs/09-DECISIONS.md ADR-021.
 * Real figure supplied 2026-08-28 — docs/00-INTAKE.md item 7 cleared for
 * the amount; part-payment/waiver policy (same item) is still open.
 */

import type { Metadata } from 'next'
import { gradeLabels, gradeSchema } from '@/lib/data/schemas'
import { MembershipCta } from './MembershipCta'

const DUES_AMOUNT_NAIRA = 12000

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
    detail: 'Full directory access and your digital folio card.',
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
            Your grade sets the title shown on your folio card — set it in your profile after
            you&rsquo;re verified.
          </p>
        </div>
      </section>

      <div style={{ height: '1px', backgroundColor: 'var(--color-rule)', margin: '0 var(--spacing-md)' }} />

      {/* ── Dues ── */}
      <section aria-label="Dues">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
            Dues
          </p>
          <p className="type-h2" style={{ color: 'var(--color-ink)' }}>
            ₦{DUES_AMOUNT_NAIRA.toLocaleString('en-NG')} per member per month
          </p>
          <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)', maxWidth: '48ch' }}>
            A flat rate across all grades. Online payment isn&rsquo;t available on the site yet —
            contact the secretariat for how to pay.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section aria-label="Get started" style={{ backgroundColor: 'var(--color-green-wash)', borderTop: '1px solid var(--color-rule)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <MembershipCta />
        </div>
      </section>
    </article>
  )
}
