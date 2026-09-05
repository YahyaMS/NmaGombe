'use client'

/**
 * The header's nav links (Find a doctor, Hospitals, News, About, Officers'
 * Committee) are `hidden sm:block` — gone entirely below the sm breakpoint,
 * with nothing replacing them, so a mobile visitor had no way to reach any of
 * them except the homepage. This is that replacement: a hamburger button,
 * visible only below sm, opening the same links in the site's existing
 * BottomSheet (design.md's own stated mobile pattern) rather than a new
 * interaction invented for this one case.
 */

import { useState } from 'react'
import Link from 'next/link'
import { BottomSheet } from '@/components/ui/BottomSheet'

const MOBILE_NAV_LINKS = [
  { href: '/doctors', label: 'Find a doctor' },
  { href: '/hospitals', label: 'Hospitals' },
  { href: '/news', label: 'News' },
  { href: '/about', label: 'About' },
  { href: '/executives', label: 'Officers’ Committee' },
]

export function MobileNavToggle() {
  const [open, setOpen] = useState(false)

  return (
    <li className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Menu">
        <nav aria-label="Site navigation">
          <ul className="list-none m-0 p-0 flex flex-col">
            {MOBILE_NAV_LINKS.map((link, i) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="type-body block"
                  style={{
                    padding: 'var(--spacing-sm) 0',
                    borderBottom: i < MOBILE_NAV_LINKS.length - 1 ? '1px solid var(--color-rule)' : undefined,
                    color: 'var(--color-ink)',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </BottomSheet>
    </li>
  )
}
