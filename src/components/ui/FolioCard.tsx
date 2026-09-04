'use client'

/**
 * FolioCard — the hero object of the NMA Gombe site.
 *
 * ID-1 proportions (ISO 7810, 1.586:1). Ground: --green-deep.
 * One shadow, 8px radius — the only boxed surface permitted by the design system.
 * Flips on tap (450ms, cubic-bezier(.2,.8,.2,1)) to reveal folio + QR code.
 * QR is generated client-side (lib/render/qr.ts, shared with the
 * downloadable PNG and verify OG image) — genuinely scannable, not the
 * decorative placeholder this used to be. Encodes NEXT_PUBLIC_SITE_URL,
 * currently Vercel's own alias, not the chapter's eventual real domain —
 * see docs/09-DECISIONS.md ADR-019.
 *
 * Pending-verification state: --rule-strong ground, never looks official.
 * Dues-outstanding state: --harmattan bar at foot, year struck through.
 * Dues-not-recorded state (no dues system yet): identical to active, dues line
 * simply absent — never a warning for money the chapter hasn't started collecting.
 *
 * design.md §6.
 */

import { useEffect, useId, useState } from 'react'
import Image from 'next/image'
import { verifyQrDataUrl, verifyUrlFor } from '@/lib/render/qr'

export type FolioCardStatus =
  | 'active'
  | 'pending'
  | 'dues-outstanding'
  | 'dues-not-recorded'
  | 'offline'

interface FolioCardProps {
  name: string
  grade: string        // e.g. "Consultant Paediatrician" or member grade
  folioNumber: string  // e.g. "NMA/GM/0417" — printed on the card as a label; no longer a lookup key, see ADR-027
  /** The member's opaque /verify/[token] id (ADR-027). Absent for a pending member (never
   *  yet approved, so nothing to scan) and for the homepage's specimen card — in both cases
   *  the QR position renders the blank placeholder, never a link to a real member. */
  verificationToken?: string
  /** Omit (or use status "dues-not-recorded") when there's no real dues record — the dues line is then omitted entirely, never shown as blank or zero. */
  duesYear?: string     // e.g. "2026"
  status?: FolioCardStatus
  /** ISO date string of last offline sync, shown when status === 'offline' */
  lastSynced?: string
}

/**
 * Real QR (lib/render/qr.ts) — the same generator the downloadable PNG and
 * verify OG image already used. `dataUrl` is null only for the brief window
 * before the async generation resolves; a plain white box (not a fake QR
 * pattern) fills that gap, so nothing on screen ever claims to be scannable
 * when it isn't.
 */
function FolioQr({ dataUrl, size }: { dataUrl: string | null; size: number }) {
  if (!dataUrl) {
    return (
      <div
        aria-hidden="true"
        style={{ width: size, height: size, backgroundColor: '#fff', borderRadius: '2px' }}
      />
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a generated data URL, not an optimizable remote asset
    <img
      src={dataUrl}
      alt=""
      width={size}
      height={size}
      style={{ display: 'block', borderRadius: '2px' }}
    />
  )
}

export function FolioCard({
  name,
  grade,
  folioNumber,
  verificationToken,
  duesYear,
  status = 'active',
  lastSynced,
}: FolioCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const flipHintId = useId()
  const isPending = status === 'pending'
  const isDuesOutstanding = status === 'dues-outstanding'
  const isOffline = status === 'offline'
  const showDues = Boolean(duesYear) && status !== 'dues-not-recorded'
  const verifyUrl = verificationToken ? verifyUrlFor(verificationToken) : null

  useEffect(() => {
    if (!verifyUrl) return
    let cancelled = false
    void verifyQrDataUrl(verifyUrl).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl)
    })
    return () => {
      cancelled = true
    }
  }, [verifyUrl])

  // Gated on verifyUrl here, not just on qrDataUrl being set, so a stale QR
  // from a previous verificationToken can never render for a beat if the
  // prop ever changes out from under a mounted card (it doesn't in practice
  // — see the prop's own doc comment — but this makes it impossible either way).
  const resolvedQrDataUrl = verifyUrl ? qrDataUrl : null

  const groundColor = isPending
    ? 'var(--color-rule-strong)'
    : 'var(--color-green-deep)'

  return (
    <div
      role="button"
      tabIndex={0}
      aria-describedby={flipHintId}
      onClick={() => setFlipped((f) => !f)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setFlipped((f) => !f)
      }}
      style={{
        width: '100%',
        maxWidth: '400px',
        aspectRatio: '1.586',
        perspective: '1000px',
        cursor: 'pointer',
        userSelect: 'none',
        outline: 'none',
      }}
    >
      {/*
        No aria-label: the card's visible content (name, grade, folio, dues)
        is meaningful and should BE the accessible name (WCAG 2.5.3 Label in
        Name — an aria-label here would silently replace all of that for
        screen readers with a curated string that can drift from what's
        rendered). The interaction hint is added via aria-describedby instead,
        which supplements rather than overrides.
      */}
      <span id={flipHintId} className="sr-only">
        {flipped ? 'Card back. Tap to flip.' : 'Card front. Tap to flip.'}
      </span>

      {/* ── Card container (flips) ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 450ms cubic-bezier(.2,.8,.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* ── FRONT ── */}
        <div
          aria-hidden={flipped}
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: '8px',
            backgroundColor: groundColor,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {/* Top: crest + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image
              src="/brand/crest.svg"
              alt=""
              width={28}
              height={28}
              aria-hidden="true"
              style={{ filter: isPending ? 'brightness(0.6)' : 'brightness(0) invert(1)', opacity: 0.85 }}
            />
            <div>
              <p className="type-eyebrow" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '9px', lineHeight: 1.2 }}>
                Nigerian Medical Association
              </p>
              <p className="type-eyebrow" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '9px', lineHeight: 1.2 }}>
                Gombe State Chapter
              </p>
            </div>
          </div>

          {/* Middle: name + grade */}
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(16px, 4vw, 22px)',
                fontWeight: 600,
                color: isPending ? 'rgba(0,0,0,0.55)' : '#ffffff',
                letterSpacing: '-0.014em',
                lineHeight: 1.15,
                fontVariationSettings: '"opsz" 22',
              }}
            >
              {name}
            </p>
            <p
              className="type-small"
              style={{ color: isPending ? 'rgba(0,0,0,0.70)' : 'rgba(255,255,255,0.70)', marginTop: '3px' }}
            >
              {grade}
            </p>
          </div>

          {/* Bottom: folio + dues + QR */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              {/* Folio */}
              <div>
                <p className="type-eyebrow" style={{ color: 'rgba(255,255,255,0.60)', fontSize: '9px', marginBottom: '2px' }}>
                  Folio
                </p>
                <p
                  className="type-folio"
                  style={{
                    color: isPending ? 'rgba(0,0,0,0.70)' : 'rgba(255,255,255,0.90)',
                    fontSize: '13px',
                  }}
                >
                  {folioNumber}
                </p>
              </div>
              {/* Dues — omitted entirely when there's no real record, never shown blank */}
              {showDues && (
                <div>
                  <p className="type-eyebrow" style={{ color: 'rgba(255,255,255,0.60)', fontSize: '9px', marginBottom: '2px' }}>
                    Dues
                  </p>
                  <p
                    className="type-folio tabular"
                    style={{
                      color: isDuesOutstanding ? 'var(--color-harmattan)' : 'rgba(255,255,255,0.90)',
                      fontSize: '13px',
                      textDecoration: isDuesOutstanding ? 'line-through' : 'none',
                    }}
                  >
                    {duesYear}
                  </p>
                </div>
              )}
            </div>

            {/* QR code — white background, 4-module quiet zone */}
            <div
              style={{
                backgroundColor: '#fff',
                padding: '4px',
                borderRadius: '2px',
                flexShrink: 0,
              }}
            >
              <FolioQr dataUrl={resolvedQrDataUrl} size={48} />
            </div>
          </div>

          {/* Dues-outstanding bar */}
          {isDuesOutstanding && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'var(--color-harmattan)',
                padding: '4px 20px',
              }}
            >
              <p className="type-eyebrow" style={{ color: 'var(--color-harmattan-wash)', fontSize: '9px' }}>
                Dues outstanding — renew to restore active status
              </p>
            </div>
          )}

          {/* Pending bar */}
          {isPending && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.12)',
                padding: '4px 20px',
              }}
            >
              <p className="type-eyebrow" style={{ color: 'rgba(0,0,0,0.45)', fontSize: '9px' }}>
                Pending verification — not yet active
              </p>
            </div>
          )}

          {/* Offline indicator */}
          {isOffline && lastSynced && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '12px',
              }}
            >
              <p className="type-eyebrow" style={{ color: 'rgba(255,255,255,0.60)', fontSize: '8px' }}>
                Synced {new Date(lastSynced).toLocaleDateString('en-NG', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>

        {/* ── BACK ── */}
        <div
          aria-hidden={!flipped}
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: '8px',
            backgroundColor: groundColor,
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '20px',
          }}
        >
          <Image
            src="/brand/crest.svg"
            alt=""
            width={48}
            height={48}
            aria-hidden="true"
            style={{ filter: 'brightness(0) invert(1)', opacity: 0.30 }}
          />
          <FolioQr dataUrl={qrDataUrl} size={48} />
          <p
            className="type-folio"
            style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', textAlign: 'center' }}
          >
            {folioNumber}
          </p>
          <p
            className="type-eyebrow"
            style={{ color: 'rgba(255,255,255,0.60)', fontSize: '9px', textAlign: 'center' }}
          >
            {/* Protocol stripped for display — same convention as
                folioCardImage.tsx's downloadable card. No verifyUrl (pending
                member, or the homepage's specimen card) — no scan line. */}
            {verifyUrl ? `Scan to verify membership · ${verifyUrl.replace(/^https?:\/\//, '')}` : 'Not yet verified'}
          </p>
        </div>
      </div>
    </div>
  )
}
