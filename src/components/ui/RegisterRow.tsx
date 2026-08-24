/**
 * RegisterRow — the primary structural component.
 *
 * Every list on this site is register rows: directory, news, events, executives,
 * payments, jobs, verification queue, admin tables. One component, one rhythm.
 *
 * No box, no shadow, no background fill. The hairline is on the bottom edge only.
 * The last row in a group must set `last` to suppress the rule.
 *
 * Design: design.md §5.
 */

import type { ReactNode } from 'react'
import Link from 'next/link'

interface RegisterRowProps {
  /** Mono index — folio for a doctor, date for a communiqué. Omit if the content
   *  type has no natural identifier. Never invent one. */
  index?: string
  /** Overrides the index's colour. Default `--color-ink-3`. The one sanctioned
   *  use elsewhere is `--color-harmattan` for a time-critical index (an
   *  expiring listing) — see design.md §2. Never decorative. */
  indexColor?: string
  /** Primary content (title / name) */
  primary: ReactNode
  /** Supporting detail (specialty, date, role) */
  secondary?: ReactNode
  /** Right-aligned action(s) */
  action?: ReactNode
  /** Href makes the whole row a link */
  href?: string
  /** Suppress the bottom hairline on the last row in a group */
  last?: boolean
  /** Additional className for the outer element */
  className?: string
}

const rowStyle = {
  paddingTop: 'var(--spacing-md)',
  paddingBottom: 'var(--spacing-md)',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'start',
  gap: 'var(--spacing-md)',
  minHeight: '48px', // minimum tap target
  transition: `background-color var(--motion-fast)`,
} as const

function RowContent({
  index,
  indexColor,
  primary,
  secondary,
  action,
}: Pick<RegisterRowProps, 'index' | 'indexColor' | 'primary' | 'secondary' | 'action'>) {
  return (
    <>
      {/* Mono index — hangs optically outside text block. aria-hidden: every
          caller either duplicates this in accessible text elsewhere in the
          row or treats it as purely decorative — a caller with substantive
          index content the row's own text doesn't otherwise carry (e.g. an
          expiry countdown) must also fold it into `secondary`. */}
      {index != null ? (
        <span
          className="type-eyebrow"
          style={{ color: indexColor ?? 'var(--color-ink-3)', minWidth: '6ch', flexShrink: 0 }}
          aria-hidden="true"
        >
          {index}
        </span>
      ) : (
        <span aria-hidden="true" style={{ minWidth: '6ch' }} />
      )}

      {/* Main content */}
      <div style={{ minWidth: 0 }}>
        <div className="type-h3" style={{ color: 'var(--color-ink)' }}>
          {primary}
        </div>
        {secondary != null && (
          <div
            className="type-small mt-xs"
            style={{ color: 'var(--color-ink-3)', marginTop: 'var(--spacing-xs)' }}
          >
            {secondary}
          </div>
        )}
      </div>

      {/* Action(s) */}
      {action != null && (
        <div className="flex items-center gap-sm flex-shrink-0">{action}</div>
      )}
    </>
  )
}

export function RegisterRow({
  index,
  indexColor,
  primary,
  secondary,
  action,
  href,
  last = false,
  className,
}: RegisterRowProps) {
  const border = last
    ? undefined
    : { borderBottom: '1px solid var(--color-rule)' }

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        style={{ ...rowStyle, ...border, textDecoration: 'none' }}
        // Hover handled via CSS — inline style can't express :hover
      >
        <RowContent
          index={index}
          indexColor={indexColor}
          primary={primary}
          secondary={secondary}
          action={action}
        />
      </Link>
    )
  }

  return (
    <div className={className} style={{ ...rowStyle, ...border }}>
      <RowContent
        index={index}
        indexColor={indexColor}
        primary={primary}
        secondary={secondary}
        action={action}
      />
    </div>
  )
}

// Hover is expressed via a CSS class so :hover works without JS
// Add this to globals.css @layer, not inline
