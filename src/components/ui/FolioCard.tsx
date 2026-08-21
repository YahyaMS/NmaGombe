'use client'

/**
 * FolioCard — the hero object of the NMA Gombe site.
 *
 * ID-1 proportions (ISO 7810, 1.586:1). Ground: --green-deep.
 * One shadow, 8px radius — the only boxed surface permitted by the design system.
 * Flips on tap (450ms, cubic-bezier(.2,.8,.2,1)) to reveal folio + QR code.
 *
 * Pending-verification state: --rule-strong ground, never looks official.
 * Dues-outstanding state: --harmattan bar at foot, year struck through.
 * Dues-not-recorded state (no dues system yet): identical to active, dues line
 * simply absent — never a warning for money the chapter hasn't started collecting.
 *
 * design.md §6.
 */

import { useId, useState } from 'react'
import Image from 'next/image'

export type FolioCardStatus =
  | 'active'
  | 'pending'
  | 'dues-outstanding'
  | 'dues-not-recorded'
  | 'offline'

interface FolioCardProps {
  name: string
  grade: string        // e.g. "Consultant Paediatrician" or member grade
  folioNumber: string  // e.g. "NMA/GM/0417"
  /** Omit (or use status "dues-not-recorded") when there's no real dues record — the dues line is then omitted entirely, never shown as blank or zero. */
  duesYear?: string     // e.g. "2026"
  status?: FolioCardStatus
  /** ISO date string of last offline sync, shown when status === 'offline' */
  lastSynced?: string
}

// Minimal QR-pattern SVG (placeholder — Phase 1 replaces with real qrcode library)
function QrPlaceholder() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-label="QR code"
      style={{ display: 'block', borderRadius: '2px', backgroundColor: '#fff' }}
    >
      {/* Top-left finder */}
      <rect x="4" y="4" width="14" height="14" rx="1" fill="#013A1F" />
      <rect x="7" y="7" width="8" height="8" fill="#fff" />
      <rect x="9" y="9" width="4" height="4" fill="#013A1F" />
      {/* Top-right finder */}
      <rect x="30" y="4" width="14" height="14" rx="1" fill="#013A1F" />
      <rect x="33" y="7" width="8" height="8" fill="#fff" />
      <rect x="35" y="9" width="4" height="4" fill="#013A1F" />
      {/* Bottom-left finder */}
      <rect x="4" y="30" width="14" height="14" rx="1" fill="#013A1F" />
      <rect x="7" y="33" width="8" height="8" fill="#fff" />
      <rect x="9" y="35" width="4" height="4" fill="#013A1F" />
      {/* Data modules — representative pattern */}
      <rect x="20" y="4" width="4" height="4" fill="#013A1F" />
      <rect x="26" y="4" width="2" height="2" fill="#013A1F" />
      <rect x="20" y="10" width="2" height="2" fill="#013A1F" />
      <rect x="24" y="8" width="4" height="4" fill="#013A1F" />
      <rect x="20" y="20" width="8" height="2" fill="#013A1F" />
      <rect x="30" y="20" width="4" height="4" fill="#013A1F" />
      <rect x="36" y="20" width="8" height="2" fill="#013A1F" />
      <rect x="20" y="24" width="4" height="2" fill="#013A1F" />
      <rect x="26" y="24" width="2" height="4" fill="#013A1F" />
      <rect x="30" y="26" width="6" height="2" fill="#013A1F" />
      <rect x="38" y="24" width="6" height="4" fill="#013A1F" />
      <rect x="20" y="28" width="2" height="6" fill="#013A1F" />
      <rect x="24" y="30" width="4" height="2" fill="#013A1F" />
      <rect x="30" y="30" width="2" height="6" fill="#013A1F" />
      <rect x="34" y="32" width="4" height="2" fill="#013A1F" />
      <rect x="40" y="30" width="4" height="6" fill="#013A1F" />
      <rect x="24" y="34" width="4" height="4" fill="#013A1F" />
      <rect x="36" y="36" width="2" height="6" fill="#013A1F" />
      <rect x="40" y="38" width="4" height="6" fill="#013A1F" />
    </svg>
  )
}

export function FolioCard({
  name,
  grade,
  folioNumber,
  duesYear,
  status = 'active',
  lastSynced,
}: FolioCardProps) {
  const [flipped, setFlipped] = useState(false)
  const flipHintId = useId()
  const isPending = status === 'pending'
  const isDuesOutstanding = status === 'dues-outstanding'
  const isOffline = status === 'offline'
  const showDues = Boolean(duesYear) && status !== 'dues-not-recorded'

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
              <QrPlaceholder />
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
          <QrPlaceholder />
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
            Scan to verify membership · nmagombe.org.ng/verify/{folioNumber.replace(/\//g, '-')}
          </p>
        </div>
      </div>
    </div>
  )
}
