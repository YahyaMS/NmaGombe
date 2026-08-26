'use client'

/**
 * The case list is server-rendered (see page.tsx, lib/data/welfareAdmin.ts).
 * router.refresh() re-fetches it after a status/amount update, same pattern
 * as AttendanceList.tsx — but this updates via a plain Route Handler
 * (/api/admin/welfare/[id], session-cookie authenticated), not an
 * httpsCallable Function, so no useExecGuard/client Firebase SDK is needed
 * here at all: the admin layout's server-side gate is enough.
 *
 * Money is integer kobo everywhere except this one display/input boundary
 * (CLAUDE.md: never floats for money) — amountNaira below is a per-row
 * string the exec types into, converted to kobo only at submit time.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminWelfareCase } from '@/lib/data/welfareAdmin'
import { welfareCaseStatusLabels, welfareCaseStatusSchema, type WelfareCaseStatus } from '@/lib/data/schemas'
import { RegisterRow } from '@/components/ui/RegisterRow'

type RowAction = 'idle' | 'busy'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', timeZone: 'Africa/Lagos' })
}

function formatNaira(amountKobo: number | undefined): string {
  if (amountKobo === undefined) return 'No amount recorded'
  return `₦${(amountKobo / 100).toLocaleString('en-NG')}`
}

const selectStyle = {
  border: '1px solid var(--color-rule-strong)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-ink)',
  backgroundColor: 'var(--color-surface)',
  padding: 'var(--spacing-xs) var(--spacing-sm)',
} as const

const inputStyle = {
  ...selectStyle,
  width: '9ch',
} as const

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: 'pointer',
} as const

export function WelfareAdminList({ cases }: { cases: AdminWelfareCase[] }) {
  const router = useRouter()
  const [rowAction, setRowAction] = useState<Record<string, RowAction>>({})
  const [rowError, setRowError] = useState<Record<string, string>>({})
  const [statusDraft, setStatusDraft] = useState<Record<string, WelfareCaseStatus>>({})
  const [amountDraft, setAmountDraft] = useState<Record<string, string>>({})

  async function handleSave(caseId: string) {
    setRowAction((s) => ({ ...s, [caseId]: 'busy' }))
    setRowError((s) => ({ ...s, [caseId]: '' }))

    const status = statusDraft[caseId]
    const amountNaira = amountDraft[caseId]
    const body: { status?: WelfareCaseStatus; amount?: number } = {}
    if (status) body.status = status
    if (amountNaira && amountNaira.trim() !== '') {
      const naira = Number(amountNaira)
      if (!Number.isFinite(naira) || naira < 0) {
        setRowError((s) => ({ ...s, [caseId]: 'Enter a valid amount.' }))
        setRowAction((s) => ({ ...s, [caseId]: 'idle' }))
        return
      }
      body.amount = Math.round(naira * 100)
    }

    try {
      const res = await fetch(`/api/admin/welfare/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Update failed')
      router.refresh()
    } catch {
      setRowError((s) => ({ ...s, [caseId]: "Couldn't save — try again." }))
    } finally {
      setRowAction((s) => ({ ...s, [caseId]: 'idle' }))
    }
  }

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>Welfare cases</h1>

      <div className="mt-lg">
        {cases.length === 0 ? (
          <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
            No welfare cases open right now.
          </p>
        ) : (
          cases.map((c, i) => {
            const action = rowAction[c.id] ?? 'idle'
            const busy = action === 'busy'
            const currentStatus = statusDraft[c.id] ?? c.status

            return (
              <div key={c.id}>
                <RegisterRow
                  index={formatDate(c.createdAt)}
                  primary={c.requesterName}
                  secondary={formatNaira(c.amount)}
                  last={i === cases.length - 1}
                  action={
                    <div className="flex items-center gap-sm flex-wrap justify-end">
                      <select
                        value={currentStatus}
                        onChange={(e) =>
                          setStatusDraft((s) => ({ ...s, [c.id]: welfareCaseStatusSchema.parse(e.target.value) }))
                        }
                        className="type-small"
                        style={selectStyle}
                      >
                        {welfareCaseStatusSchema.options.map((opt) => (
                          <option key={opt} value={opt}>{welfareCaseStatusLabels[opt]}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="Amount ₦"
                        value={amountDraft[c.id] ?? ''}
                        onChange={(e) => setAmountDraft((s) => ({ ...s, [c.id]: e.target.value }))}
                        className="type-small"
                        style={inputStyle}
                        aria-label={`Amount for ${c.requesterName}'s case`}
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleSave(c.id)}
                        className="type-small font-semibold px-md py-xs"
                        style={{ ...primaryButtonStyle, opacity: busy ? 0.6 : 1 }}
                      >
                        {busy ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  }
                />
                {rowError[c.id] && (
                  <p className="type-small" style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-xs)' }}>
                    {rowError[c.id]}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
