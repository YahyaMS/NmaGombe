import Link from 'next/link'
import Image from 'next/image'
import { existsSync } from 'fs'
import path from 'path'

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
      style={{ backgroundColor: 'var(--color-green-deep)', color: 'var(--color-surface)' }}
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
            <li>
              <Link
                href="/signin"
                className="type-small font-semibold transition-colors px-md py-xs"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-green)',
                  borderRadius: 'var(--radius)',
                  transitionDuration: 'var(--motion-fast)',
                }}
              >
                Member sign in
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
