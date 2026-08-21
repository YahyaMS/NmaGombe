'use client'

/**
 * Bottom sheet — design.md §10: "Filters are a bottom sheet on mobile, an
 * inline row on desktop — never a left sidebar." Generic because the pattern
 * is named as a site-wide interaction, not something specific to one screen.
 *
 * Motion: --motion-standard (200ms) on open, respecting prefers-reduced-motion
 * (design.md §8 — the folio card flip is the only animation exempted from
 * that). Close is instant, not animated — see the comment on the effect below
 * for why that's a deliberate simplification, not an oversight.
 */

import { useEffect, useRef, useState } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const [visible, setVisible] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    // Flip a frame after mount, not synchronously, so the panel actually
    // transitions from translateY(100%) instead of snapping straight open.
    const raf = requestAnimationFrame(() => {
      setVisible(true)
      panelRef.current?.focus()
    })

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    // Runs when `open` flips back to false (or on unmount) — resets `visible`
    // for the next open, and restores focus to whatever opened the sheet.
    // Not a "close animation": the panel disappears immediately below
    // (`if (!open) return null`) rather than fading out first. A delayed
    // unmount-after-transition would need its own timer-driven state, which
    // is more moving parts than a filter sheet's close moment is worth.
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown)
      setVisible(false)
      previouslyFocused.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  const instant = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(12,26,19,0.45)',
          opacity: visible ? 1 : 0,
          transition: instant ? 'none' : 'opacity var(--motion-standard)',
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        tabIndex={-1}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '80dvh',
          overflowY: 'auto',
          backgroundColor: 'var(--color-surface)',
          borderTopLeftRadius: 'var(--radius-card)',
          borderTopRightRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: 'var(--spacing-lg) var(--spacing-md)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: instant ? 'none' : 'transform var(--motion-standard)',
          outline: 'none',
        }}
      >
        <div className="flex items-center justify-between mb-md">
          <h2 id="bottom-sheet-title" className="type-h3" style={{ color: 'var(--color-ink)' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="type-small font-semibold"
            style={{ background: 'none', border: 'none', color: 'var(--color-ink-2)', cursor: 'pointer', padding: 'var(--spacing-sm)' }}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
