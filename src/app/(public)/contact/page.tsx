/**
 * /contact — click-to-WhatsApp to the secretariat (docs/05-ROUTES.md).
 * NEXT_PUBLIC_WHATSAPP_SECRETARIAT isn't set yet (docs/00-INTAKE.md item 22 —
 * which WhatsApp groups exist, who admins them — is still open, and no real
 * secretariat number has been supplied). Rather than invent one, this renders
 * an honest "not yet available" state until the env var is set. See
 * lib/whatsapp.ts for the link-building helper this reuses.
 */

import type { Metadata } from 'next'
import { whatsAppLink } from '@/lib/whatsapp'

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
    </article>
  )
}
