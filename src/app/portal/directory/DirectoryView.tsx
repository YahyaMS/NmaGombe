'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useVerifiedMemberGuard } from '@/lib/auth/useVerifiedMemberGuard'
import { subscribeToDirectory, type DirectoryRow } from '@/lib/data/directory'
import { gradeLabels } from '@/lib/data/schemas'
import { whatsAppLink, telLink } from '@/lib/whatsapp'
import { RegisterRow } from '@/components/ui/RegisterRow'
import { BottomSheet } from '@/components/ui/BottomSheet'

type Stage = 'loading' | 'ready' | 'error' | 'never-synced'

const SYNCED_AT_KEY = 'nma-directory-synced-at'
const NEVER_SYNCED_TIMEOUT_MS = 6000

function readSyncedAt(): number | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(SYNCED_AT_KEY)
  return raw ? Number(raw) : null
}

function writeSyncedAt(): void {
  window.localStorage.setItem(SYNCED_AT_KEY, String(Date.now()))
}

function titleLine(row: DirectoryRow): string {
  const grade = row.grade ? gradeLabels[row.grade] : ''
  return [grade || row.department, row.facility].filter(Boolean).join(' · ')
}

function queryTokens(q: string): string[] {
  return q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}

function matchesQuery(row: DirectoryRow, tokens: string[]): boolean {
  return tokens.every((t) => row.searchTokens.some((rt) => rt.startsWith(t)))
}

function DepartmentPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="type-small font-semibold px-md py-xs"
      style={{
        borderRadius: 'var(--radius)',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: active ? 'var(--color-green)' : 'var(--color-green-wash)',
        color: active ? 'var(--color-surface)' : 'var(--color-green)',
      }}
    >
      {label}
    </button>
  )
}

export function DirectoryView() {
  const { state: guardState } = useVerifiedMemberGuard()
  const [stage, setStage] = useState<Stage>('loading')
  const [rows, setRows] = useState<DirectoryRow[]>([])
  const [syncedAt, setSyncedAt] = useState<number | null>(() => readSyncedAt())
  const [fromCache, setFromCache] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [department, setDepartment] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (guardState !== 'ready') return

    const neverSyncedTimer = window.setTimeout(() => {
      if (!navigator.onLine && readSyncedAt() === null) setStage('never-synced')
    }, NEVER_SYNCED_TIMEOUT_MS)

    const unsub = subscribeToDirectory(
      (info) => {
        window.clearTimeout(neverSyncedTimer)
        setRows(info.rows)
        setFromCache(info.fromCache)
        if (!info.fromCache) {
          writeSyncedAt()
          setSyncedAt(Date.now())
        }
        setStage('ready')
      },
      () => {
        window.clearTimeout(neverSyncedTimer)
        setStage('error')
      }
    )

    return () => {
      window.clearTimeout(neverSyncedTimer)
      unsub()
    }
  }, [guardState])

  // design.md: "focused on desktop load" — not on mobile, where it pops the keyboard.
  useEffect(() => {
    if (stage !== 'ready') return
    if (window.matchMedia('(min-width: 768px)').matches) inputRef.current?.focus()
  }, [stage])

  // Derived from whatever's actually in the roster — department is freeform
  // text in the data model, not an enum, so there's no fixed list to filter
  // by. Never invent an option nobody has (design.md §11).
  const departments = useMemo(
    () => [...new Set(rows.map((r) => r.department).filter(Boolean))].sort(),
    [rows]
  )

  // Filtering never touches Firestore — queryTokens/matchesQuery are pure
  // functions over the one snapshot already in `rows`. No import from
  // firebase/firestore in this file below the initial subscription: every
  // keystroke and every filter tap costs zero additional reads.
  const tokens = queryTokens(searchQuery)
  const filtered = useMemo(() => {
    let result = rows
    if (department) result = result.filter((r) => r.department === department)
    if (tokens.length) result = result.filter((r) => matchesQuery(r, tokens))
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, searchQuery, department])

  const hasActiveFilter = Boolean(department) || tokens.length > 0
  const shellStyle = { maxWidth: '640px' } as const

  return (
    <div className="mx-auto px-md py-2xl" style={shellStyle}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>
        Directory
      </p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
        Find a colleague
      </h1>

      <div className="flex gap-sm mt-lg">
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          placeholder="Name, specialty or facility"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="type-body w-full px-md py-sm"
          style={{
            border: '1px solid var(--color-rule-strong)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-ink)',
          }}
          aria-label="Search the directory"
        />

        {/* Mobile: filter trigger opens a bottom sheet. Desktop: hidden — the pills below are always visible instead. */}
        {departments.length > 0 && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="type-small font-semibold px-md py-sm flex md:hidden"
            style={{
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-rule-strong)',
              backgroundColor: department ? 'var(--color-green-wash)' : 'var(--color-surface)',
              color: department ? 'var(--color-green)' : 'var(--color-ink-2)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {department ? department : 'Filter'}
          </button>
        )}
      </div>

      {/* Desktop: inline row, never a sidebar (design.md). */}
      {departments.length > 0 && (
        <nav aria-label="Filter by specialty" className="hidden md:flex flex-wrap gap-sm mt-md">
          <DepartmentPill label="All specialties" active={!department} onClick={() => setDepartment(null)} />
          {departments.map((d) => (
            <DepartmentPill key={d} label={d} active={department === d} onClick={() => setDepartment(department === d ? null : d)} />
          ))}
        </nav>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filter by specialty">
        <div className="flex flex-wrap gap-sm">
          <DepartmentPill
            label="All specialties"
            active={!department}
            onClick={() => {
              setDepartment(null)
              setSheetOpen(false)
            }}
          />
          {departments.map((d) => (
            <DepartmentPill
              key={d}
              label={d}
              active={department === d}
              onClick={() => {
                setDepartment(department === d ? null : d)
                setSheetOpen(false)
              }}
            />
          ))}
        </div>
      </BottomSheet>

      {(fromCache || stage === 'never-synced') && (
        <p className="type-small mt-sm" style={{ color: 'var(--color-ink-3)' }}>
          {syncedAt
            ? `Last synced ${new Date(syncedAt).toLocaleDateString('en-NG', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`
            : 'Not yet synced'}
        </p>
      )}

      <div className="mt-lg">
        {stage === 'loading' && <div aria-live="polite" />}

        {stage === 'error' && (
          <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
            Couldn&rsquo;t load the directory. Reload the page.
          </p>
        )}

        {stage === 'never-synced' && (
          <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
            Connect once to load the directory. After that it works offline.
          </p>
        )}

        {stage === 'ready' && rows.length === 0 && (
          <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
            No colleagues have joined the directory yet.
          </p>
        )}

        {stage === 'ready' && rows.length > 0 && hasActiveFilter && filtered.length === 0 && (
          <div>
            <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
              {searchQuery
                ? `No colleagues match “${searchQuery}”.`
                : `No colleagues in ${department}.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setDepartment(null)
              }}
              className="type-small font-semibold mt-sm"
              style={{
                color: 'var(--color-green)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {stage === 'ready' && filtered.length > 0 && (
          <div>
            {filtered.map((row, i) => {
              const wa = row.whatsapp ? whatsAppLink(row.whatsapp) : null
              const call = row.phone ? telLink(row.phone) : null

              return (
                <RegisterRow
                  key={row.uid}
                  last={i === filtered.length - 1}
                  primary={
                    <Link
                      href={`/portal/directory/${row.uid}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {row.displayName}
                    </Link>
                  }
                  secondary={titleLine(row)}
                  action={
                    !wa && !call ? undefined : (
                      <>
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="type-small font-semibold px-sm py-xs"
                            style={{
                              color: 'var(--color-green)',
                              backgroundColor: 'var(--color-green-wash)',
                              borderRadius: 'var(--radius)',
                              textDecoration: 'none',
                            }}
                          >
                            WhatsApp
                          </a>
                        )}
                        {call && (
                          <a
                            href={call}
                            className="type-small font-semibold px-sm py-xs"
                            style={{
                              color: 'var(--color-green)',
                              backgroundColor: 'var(--color-green-wash)',
                              borderRadius: 'var(--radius)',
                              textDecoration: 'none',
                            }}
                          >
                            Call
                          </a>
                        )}
                      </>
                    )
                  }
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
