'use client'

/**
 * Owns the homepage's folio-card section end to end: reads nma_display to
 * decide what to show, and — for a verified member/admin — fetches
 * /api/portal/own-card for the real card fields. One component instance, one
 * fetch, driving both the card and the link below the static copy (passed in
 * as `copy` so that heading/paragraph stay authored and server-rendered in
 * page.tsx rather than duplicated here).
 *
 * States:
 *  - checking / signed-out: the demo card (Dr. Yahya's), "Get verified →"
 *  - pending: no card — a short "under review" note, "Check your status →"
 *  - member / admin: the visitor's own real card, "Go to your portal →".
 *    A fetch failure (including offline) falls back to the demo card
 *    silently — this is a first impression, not a place for an error state.
 *    The link still reflects nma_display's own claim of being signed in,
 *    independent of whether the card fetch succeeded.
 *
 * Replaces FolioCtaLink.tsx, which only ever swapped the link text/href and
 * left the demo card showing to everyone — the gap this file's previous
 * version (see docs/09-DECISIONS.md ADR-018) flagged as never built.
 */

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { FolioCard } from '@/components/ui/FolioCard'
import { readDisplayCookie, resolveDisplayState, type DisplayAccountState } from '@/lib/auth/displayCookie'

interface OwnCard {
  displayName: string
  gradeLine: string
  folioNumber: string
  verificationToken: string | null
}

// Obvious specimen data, not a real member's card — a signed-out visitor gets
// this to see what the feature looks like. Never a real person's details and
// never a real verificationToken: this card is embedded in statically-served
// public HTML, so a real token here would be permanently public with no way
// to un-publish it. No verificationToken prop passed at all → FolioCard
// renders its existing "nothing to scan" blank QR placeholder. See ADR-027.
const DEMO_CARD = {
  name: 'Dr. Sample Doctor',
  grade: 'Specimen card — not a real member',
  folioNumber: 'NMA/GM/0000',
}

function destinationFor(state: DisplayAccountState): { label: string; href: string } {
  switch (state) {
    case 'admin':
      return { label: 'Go to your portal →', href: '/admin' }
    case 'member':
      return { label: 'Go to your portal →', href: '/portal' }
    case 'pending':
      return { label: 'Check your status →', href: '/pending' }
    default:
      return { label: 'Get verified →', href: '/membership' }
  }
}

export function HomeFolioCard({ copy }: { copy: ReactNode }) {
  const [state, setState] = useState<DisplayAccountState>('checking')
  const [ownCard, setOwnCard] = useState<OwnCard | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(resolveDisplayState(readDisplayCookie()))
  }, [])

  useEffect(() => {
    if (state !== 'member' && state !== 'admin') return
    let cancelled = false
    fetch('/api/portal/own-card')
      .then((res) => (res.ok ? (res.json() as Promise<OwnCard>) : null))
      .then((data) => {
        if (!cancelled && data) setOwnCard(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [state])

  const isPending = state === 'pending'
  const showingOwnCard = (state === 'member' || state === 'admin') && ownCard !== null
  const card = showingOwnCard
    ? {
        name: ownCard!.displayName,
        grade: ownCard!.gradeLine,
        folioNumber: ownCard!.folioNumber,
        verificationToken: ownCard!.verificationToken ?? undefined,
      }
    : { ...DEMO_CARD, verificationToken: undefined }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 'var(--spacing-xl)',
        alignItems: 'center',
      }}
      className="sm:grid-cols-2"
    >
      <div>
        {copy}
        {state === 'checking' ? (
          <span aria-hidden="true" style={{ display: 'block', marginTop: 'var(--spacing-lg)', height: '1.25em' }} />
        ) : (
          <Link
            href={destinationFor(state).href}
            className="type-small font-semibold"
            style={{ color: 'var(--color-green)', display: 'block', marginTop: 'var(--spacing-lg)' }}
          >
            {destinationFor(state).label}
          </Link>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {isPending ? (
          <p className="type-body" style={{ color: 'var(--color-ink-3)', maxWidth: '32ch', textAlign: 'center' }}>
            Your folio card appears here once an executive confirms your membership.
          </p>
        ) : (
          <FolioCard
            name={card.name}
            grade={card.grade}
            folioNumber={card.folioNumber}
            verificationToken={card.verificationToken}
            status="dues-not-recorded"
          />
        )}
      </div>
    </div>
  )
}
