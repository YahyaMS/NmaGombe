'use client'

/**
 * Form only, not a case viewer — firestore.rules enforces this, not just the
 * UI: a member can create their own case but never read it back, so there
 * is no way to show "you already have an open case" here, on this load or
 * any later one. submitState === 'done' is necessarily session-only.
 */

import { useState } from 'react'
import { useVerifiedMemberGuard } from '@/lib/auth/useVerifiedMemberGuard'
import { openWelfareCase } from '@/lib/data/welfare'

type SubmitState = 'idle' | 'busy' | 'done' | 'error'

export function WelfarePage() {
  const { state: guardState, uid } = useVerifiedMemberGuard()
  const [submitState, setSubmitState] = useState<SubmitState>('idle')

  async function handleRequest() {
    if (!uid) return
    setSubmitState('busy')
    try {
      await openWelfareCase(uid)
      setSubmitState('done')
    } catch {
      setSubmitState('error')
    }
  }

  const shellStyle = { maxWidth: '560px' } as const

  if (guardState !== 'ready') {
    return <div className="mx-auto px-md py-2xl" style={shellStyle} aria-live="polite" />
  }

  return (
    <div className="mx-auto px-md py-2xl" style={shellStyle}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Portal</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>Welfare fund</h1>

      {/* Placeholder — real eligibility/coverage copy from the Welfare
          Committee hasn't been supplied yet (docs/00-INTAKE.md item 24). */}
      <div
        className="mt-lg"
        style={{
          padding: 'var(--spacing-md)',
          border: '1px dashed var(--color-rule-strong)',
          borderRadius: 'var(--radius)',
        }}
      >
        <p className="type-small" style={{ color: 'var(--color-ink-3)' }}>
          The chapter hasn&rsquo;t supplied welfare fund eligibility and coverage details yet.
          This panel will describe what the fund covers once that&rsquo;s written.
        </p>
      </div>

      <div className="mt-lg" style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--spacing-md)' }}>
        {submitState === 'done' ? (
          <p className="type-body" style={{ color: 'var(--color-ink)' }}>
            Request received. A member of the Welfare Committee will reach out.
          </p>
        ) : (
          <>
            <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
              Opening a request lets the Welfare Committee know you&rsquo;d like to talk — no
              details are collected here beyond that.
            </p>
            <button
              type="button"
              disabled={submitState === 'busy'}
              onClick={handleRequest}
              className="type-small font-semibold px-lg py-sm mt-md"
              style={{
                backgroundColor: 'var(--color-green)',
                color: 'var(--color-surface)',
                borderRadius: 'var(--radius)',
                border: 'none',
                cursor: 'pointer',
                opacity: submitState === 'busy' ? 0.6 : 1,
              }}
            >
              {submitState === 'busy' ? 'Sending…' : 'Request welfare assistance'}
            </button>
            {submitState === 'error' && (
              <p className="type-small mt-sm" style={{ color: 'var(--color-danger)' }}>
                Couldn&rsquo;t send — check your connection and try again.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
