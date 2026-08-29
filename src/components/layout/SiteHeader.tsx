import Link from 'next/link'
import Image from 'next/image'
import { existsSync } from 'fs'
import path from 'path'
import { HeaderAccountLink } from './HeaderAccountLink'

// Crest is optional at build time; drop public/brand/crest.svg to enable.
// Check happens server-side so there is no client-side flash.
function hasCrest(): boolean {
  try {
    return existsSync(path.join(process.cwd(), 'public/brand/crest.svg'))
  } catch {
    return false
  }
}

export function SiteHeader() {
  const crestReady = hasCrest()

  return (
    <header
      style={{
        backgroundColor: 'var(--color-green-deep)',
        color: 'var(--color-surface)',
        // Stays put while the page scrolls. Safe as plain `sticky` with no
        // scroll listener and no layout shift: the background is fully opaque,
        // so nothing shows through and no backdrop blur is needed — blur is
        // expensive on the cheap Android hardware this site is built for.
        // Below BottomSheet's z-index 50, so a sheet still covers it.
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        className="mx-auto flex items-center justify-between gap-md px-md py-md"
        style={{ maxWidth: 'var(--width-shell)' }}
      >
        {/* Wordmark / logo — no aria-label: the visible "NMA · Gombe" text below
            already gives this link an accessible name, and an aria-label that
            doesn't match the visible text fails WCAG 2.5.3 (Label in Name). */}
        <Link
          href="/"
          className="flex items-center gap-sm"
        >
          {crestReady && (
            <Image
              src="/brand/crest.svg"
              alt=""
              width={32}
              height={32}
              aria-hidden="true"
              priority
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          )}
          <span
            className="type-eyebrow"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            NMA · Gombe
          </span>
        </Link>

        {/* Navigation */}
        <nav aria-label="Site navigation">
          <ul className="flex items-center gap-lg list-none m-0 p-0">
            <li className="hidden sm:block">
              <Link
                href="/doctors"
                className="type-small transition-colors"
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  transitionDuration: 'var(--motion-fast)',
                }}
              >
                Find a doctor
              </Link>
            </li>
            <li className="hidden sm:block">
              <Link
                href="/news"
                className="type-small transition-colors"
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  transitionDuration: 'var(--motion-fast)',
                }}
              >
                News
              </Link>
            </li>
            <li className="hidden sm:block">
              <Link
                href="/about"
                className="type-small transition-colors"
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  transitionDuration: 'var(--motion-fast)',
                }}
              >
                About
              </Link>
            </li>
            <li className="hidden sm:block">
              <Link
                href="/executives"
                className="type-small transition-colors"
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  transitionDuration: 'var(--motion-fast)',
                }}
              >
                Executives
              </Link>
            </li>
            <HeaderAccountLink />
          </ul>
        </nav>
      </div>
    </header>
  )
}
