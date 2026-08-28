/**
 * /contact — click-to-WhatsApp to the secretariat (docs/05-ROUTES.md), plus
 * the secretariat's real address, email and social channels
 * (docs/00-INTAKE.md items 20/22, partially cleared 2026-08-28).
 * NEXT_PUBLIC_WHATSAPP_SECRETARIAT still isn't set — no real secretariat
 * WhatsApp number has been supplied yet, only the other channels. Rather
 * than invent one, this keeps the honest "not yet available" state for
 * WhatsApp specifically until the env var is set. See lib/whatsapp.ts for
 * the link-building helper this reuses.
 */

import type { Metadata } from 'next'
import { whatsAppLink } from '@/lib/whatsapp'

const SECRETARIAT_ADDRESS = 'Behind FIRS Office, New City Center, Gombe, Gombe State'
const SECRETARIAT_EMAIL = 'nmagombestate@gmail.com'
const X_HANDLE = 'gombenma'

export const metadata: Metadata = {
  title: 'Contact — NMA Gombe',
  description: 'Contact the Nigerian Medical Association, Gombe State Chapter secretariat.',
}

export default function ContactPage() {
  const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_SECRETARIAT
  const link = rawNumber ? whatsAppLink(rawNumber) : null

  return (
    <article style={{ backgroundColor: 'var(--color-paper)' }}>
      <header style={{ backgroundColor: 'var(--color-green-deep)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Contact
          </p>
          <h1 className="type-h1" style={{ color: 'var(--color-surface)', maxWidth: '22ch' }}>
            Reach the secretariat
          </h1>
        </div>
      </header>

      <section aria-label="Contact the secretariat">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-prose)' }}>
          {link ? (
            <>
              <p className="type-body" style={{ color: 'var(--color-ink-2)', maxWidth: '48ch' }}>
                For membership queries, verification status, or anything else — message the
                secretariat directly on WhatsApp.
              </p>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="type-body font-semibold px-lg py-sm mt-lg"
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--color-green)',
                  color: 'var(--color-surface)',
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                }}
              >
                Message the secretariat on WhatsApp
              </a>
            </>
          ) : (
            <p className="type-body" style={{ color: 'var(--color-ink-3)', maxWidth: '48ch' }}>
              The secretariat&rsquo;s WhatsApp contact isn&rsquo;t published here yet.
            </p>
          )}
        </div>
      </section>

      <div style={{ height: '1px', backgroundColor: 'var(--color-rule)', margin: '0 var(--spacing-md)' }} />

      <section aria-label="Other ways to reach the secretariat">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-prose)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '10ch 1fr',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md) 0',
              borderBottom: '1px solid var(--color-rule)',
            }}
          >
            <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)', paddingTop: '4px' }}>
              Address
            </span>
            <p className="type-body" style={{ color: 'var(--color-ink)' }}>{SECRETARIAT_ADDRESS}</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '10ch 1fr',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md) 0',
              borderBottom: '1px solid var(--color-rule)',
            }}
          >
            <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)', paddingTop: '4px' }}>
              Email
            </span>
            <a
              href={`mailto:${SECRETARIAT_EMAIL}`}
              className="type-body"
              style={{ color: 'var(--color-green)', textDecoration: 'underline' }}
            >
              {SECRETARIAT_EMAIL}
            </a>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '10ch 1fr',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md) 0',
            }}
          >
            <span className="type-eyebrow" style={{ color: 'var(--color-ink-3)', paddingTop: '4px' }}>
              X
            </span>
            <a
              href={`https://x.com/${X_HANDLE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="type-body"
              style={{ color: 'var(--color-green)', textDecoration: 'underline' }}
            >
              @{X_HANDLE}
            </a>
          </div>
        </div>
      </section>
    </article>
  )
}
