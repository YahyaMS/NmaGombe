/**
 * Server Component — no client Firebase SDK. Read-only, no mutation, so
 * there's no fork to consider here (unlike verification/members/broadcast) —
 * see docs/09-DECISIONS.md.
 */

import Link from 'next/link'
import { getVerificationDashboardSummary } from '@/lib/data/verificationAdmin'
import { RecentSignupsList } from './RecentSignupsList'

const quickLinks = [
  { href: '/admin/verification', label: 'Verification queue' },
  { href: '/admin/members', label: 'Members' },
  { href: '/admin/news', label: 'News' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/broadcast', label: 'Broadcast' },
  { href: '/admin/welfare', label: 'Welfare cases' },
  { href: '/admin/documents', label: 'Guidelines & documents' },
]

export async function AdminDashboard() {
  const { pendingCount, recent } = await getVerificationDashboardSummary()

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>Dashboard</h1>

      <Link
        href="/admin/verification"
        className="block mt-lg"
        style={{
          textDecoration: 'none',
          padding: 'var(--spacing-md) 0',
          borderTop: '1px solid var(--color-rule)',
          borderBottom: '1px solid var(--color-rule)',
        }}
      >
        <p className="type-eyebrow" style={{ color: 'var(--color-ink-3)' }}>Pending verification</p>
        <p className="type-display mt-xs" style={{ color: pendingCount > 0 ? 'var(--color-harmattan)' : 'var(--color-ink)' }}>
          {pendingCount}
        </p>
      </Link>

      <div className="mt-lg">
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Recent signups</p>
        <div className="mt-md">
          {recent.length === 0 ? (
            <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
              No signups yet.
            </p>
          ) : (
            <RecentSignupsList recent={recent} />
          )}
        </div>
      </div>

      <div className="mt-2xl" style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--spacing-md)' }}>
        {quickLinks.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            className="type-body block"
            style={{
              padding: 'var(--spacing-sm) 0',
              borderBottom: i < quickLinks.length - 1 ? '1px solid var(--color-rule)' : undefined,
              color: 'var(--color-ink)',
              textDecoration: 'none',
            }}
          >
            {link.label} →
          </Link>
        ))}
      </div>
    </div>
  )
}
