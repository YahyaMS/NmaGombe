/**
 * /privacy — NDPA 2023 privacy notice. Content is drawn directly from the
 * commitments already made in docs/08-NDPA-COMPLIANCE.md and the region
 * disclosure ADR-008 requires here — nothing asserted beyond what's actually
 * true of the running system today (no self-service export yet, no claimed
 * NDPC registration status). Per docs/08-NDPA-COMPLIANCE.md's own header,
 * this is not legal advice; the chapter should still have this confirmed by
 * a Nigerian data-protection practitioner before relying on it.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy — NMA Gombe',
  description: 'How the Nigerian Medical Association, Gombe State Chapter collects, uses and protects member data.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        padding: 'var(--spacing-lg) 0',
        borderBottom: '1px solid var(--color-rule)',
      }}
    >
      <h2 className="type-h3" style={{ color: 'var(--color-ink)' }}>{title}</h2>
      <div className="type-body mt-sm" style={{ color: 'var(--color-ink-2)', maxWidth: '60ch' }}>
        {children}
      </div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <article style={{ backgroundColor: 'var(--color-paper)' }}>
      <header style={{ backgroundColor: 'var(--color-green-deep)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Privacy
          </p>
          <h1 className="type-h1" style={{ color: 'var(--color-surface)', maxWidth: '22ch' }}>
            Privacy notice
          </h1>
          <p className="type-body mt-md" style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '48ch' }}>
            This describes what the Nigerian Medical Association, Gombe State Chapter collects
            through this site, why, and how to exercise your rights under the Nigeria Data
            Protection Act 2023.
          </p>
        </div>
      </header>

      <div className="mx-auto px-md" style={{ maxWidth: 'var(--width-prose)' }}>
        <Section title="What we collect">
          <p>
            Signing up: your name, specialty, MDCN folio number and email. Once verified, you can
            add your grade, subspecialty, practice location, phone and WhatsApp number in your
            profile — none of that is required. If you pay dues, we keep a record of the payment.
          </p>
        </Section>

        <Section title="Why">
          <p>
            To confirm you&rsquo;re a licensed doctor and chapter member, run the verified
            directory, issue your digital folio card, and administer dues. We never collect date
            of birth, home address, marital status, religion, ethnicity, or health information
            about you or your family.
          </p>
        </Section>

        <Section title="Who can see it">
          <p>
            You and the chapter&rsquo;s admins, always. Your specialty, facility and grade appear
            to other verified members in the member directory once you&rsquo;re verified. Your
            phone and WhatsApp number are shown to other members only if you turn that on,
            per field, in your profile. Nothing beyond your name, grade, specialty and facility
            is ever shown on the public, unauthenticated find-a-doctor page — and only if you
            explicitly opt in there too. We never sell your data or share it with recruiters,
            drug representatives, or anyone outside chapter administration.
          </p>
        </Section>

        <Section title="Where it's stored">
          <p>
            In Firebase (Google Cloud), in the <code>europe-west1</code> region — physically in
            Belgium. Google Cloud has no African region yet. This is a cross-border transfer
            under NDPA 2023; the Act permits it where the processor provides adequate protection,
            which Google Cloud&rsquo;s infrastructure does.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can view and correct most of your own data any time in your profile. To request
            a full copy of your data, or to have your account and data deleted, contact the
            secretariat directly — there isn&rsquo;t yet a self-service export button, so this is
            handled by request for now. Payment records may need to be kept for a period after a
            deletion request for financial record-keeping purposes.
          </p>
        </Section>

        <Section title="Who processes it">
          <p>
            Google (Firebase) hosts the data. Paystack processes dues payments. Our hosting
            provider serves the site itself. Each is a data processor acting on the chapter&rsquo;s
            instructions, not an independent user of your data.
          </p>
        </Section>

        <p className="type-small mt-lg mb-2xl" style={{ color: 'var(--color-ink-3)' }}>
          This notice is maintained by the chapter and is not a substitute for advice from a
          Nigerian data-protection practitioner.
        </p>
      </div>
    </article>
  )
}
