'use client'

import { useEffect, useState } from 'react'
import { useExecGuard } from '@/lib/auth/useExecGuard'
import { logBroadcast, listBroadcasts, type BroadcastRow } from '@/lib/data/broadcast'
import { broadcastComposeInputSchema } from '@/lib/data/schemas'
import { Field, inputStyle, labelStyle } from '@/components/ui/Field'
import { RegisterRow } from '@/components/ui/RegisterRow'

type FormStage = 'ready' | 'logging' | 'logged'
type HistoryStage = 'checking' | 'ready' | 'error'

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: 'pointer',
} as const

const secondaryButtonStyle = {
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-green)',
  border: '1px solid var(--color-rule-strong)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
} as const

function formatDate(ts: BroadcastRow['sentAt']): string {
  if (!ts) return '—'
  return ts.toDate().toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })
}

export function BroadcastView() {
  const { state: guardState } = useExecGuard()
  const [formStage, setFormStage] = useState<FormStage>('ready')
  const [audience, setAudience] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{ audience?: string; message?: string }>({})
  const [errorMessage, setErrorMessage] = useState('')
  const [loggedMessage, setLoggedMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const [historyStage, setHistoryStage] = useState<HistoryStage>('checking')
  const [history, setHistory] = useState<BroadcastRow[]>([])

  function fetchHistory() {
    return listBroadcasts()
      .then((rows) => {
        setHistory(rows)
        setHistoryStage('ready')
      })
      .catch(() => setHistoryStage('error'))
  }

  // Re-fetches after a successful log — resets to 'checking' first, unlike
  // the mount effect below where the state already starts at 'checking'.
  function reloadHistory() {
    setHistoryStage('checking')
    void fetchHistory()
  }

  useEffect(() => {
    if (guardState !== 'ready') return
    void fetchHistory()
  }, [guardState])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = broadcastComposeInputSchema.safeParse({ audience, message })
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({ audience: fieldErrors.audience?.[0], message: fieldErrors.message?.[0] })
      return
    }
    setErrors({})
    setErrorMessage('')
    setFormStage('logging')

    try {
      await logBroadcast(parsed.data)
      setLoggedMessage(parsed.data.message)
      setFormStage('logged')
      setAudience('')
      setMessage('')
      reloadHistory()
    } catch {
      setErrorMessage("Couldn't log this broadcast — try again.")
      setFormStage('ready')
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(loggedMessage)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  if (guardState !== 'ready') {
    return <div className="mx-auto px-md py-2xl" style={{ maxWidth: '640px' }} aria-live="polite" />
  }

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '640px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>Broadcast</h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        This logs a record that a message went out — it doesn&rsquo;t send anything. Write the
        message here, then paste it into your WhatsApp broadcast list or chapter groups yourself.
      </p>

      {formStage === 'logged' ? (
        <div className="mt-lg" style={{ padding: 'var(--spacing-md) 0', borderTop: '1px solid var(--color-rule)' }}>
          <p className="type-small font-semibold" style={{ color: 'var(--color-ink)' }}>Logged.</p>
          <p className="type-small mt-xs" style={{ color: 'var(--color-ink-3)' }}>
            Paste this into your WhatsApp broadcast list or chapter groups — logging it here
            doesn&rsquo;t send it.
          </p>
          <div
            className="type-body mt-md"
            style={{
              ...inputStyle,
              whiteSpace: 'pre-wrap',
              minHeight: '80px',
              color: 'var(--color-ink)',
            }}
          >
            {loggedMessage}
          </div>
          <div className="flex gap-sm mt-md">
            <button
              type="button"
              onClick={handleCopy}
              className="type-small font-semibold px-lg py-sm"
              style={primaryButtonStyle}
            >
              {copied ? 'Copied' : 'Copy message'}
            </button>
            <button
              type="button"
              onClick={() => { setFormStage('ready'); setCopied(false) }}
              className="type-small font-semibold px-lg py-sm"
              style={secondaryButtonStyle}
            >
              Log another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-md mt-lg">
          <Field
            label="Audience"
            name="audience"
            value={audience}
            onChange={setAudience}
            error={errors.audience}
          />
          <div>
            <label htmlFor="message" className="type-small font-semibold" style={labelStyle}>
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              style={{ ...inputStyle, fontSize: '16px' }}
              aria-invalid={errors.message ? 'true' : undefined}
            />
            {errors.message && (
              <p className="type-small mt-xs" style={{ color: 'var(--color-danger)' }}>{errors.message}</p>
            )}
          </div>

          {errorMessage && (
            <p className="type-small" style={{ color: 'var(--color-danger)' }}>{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={formStage === 'logging'}
            className="type-body font-semibold px-lg py-sm mt-sm"
            style={{ ...primaryButtonStyle, opacity: formStage === 'logging' ? 0.6 : 1 }}
          >
            {formStage === 'logging' ? 'Logging…' : 'Log broadcast'}
          </button>
        </form>
      )}

      <div className="mt-2xl" style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--spacing-lg)' }}>
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>History</p>

        <div className="mt-md">
          {historyStage === 'error' && (
            <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
              Couldn&rsquo;t load the history. Reload the page.
            </p>
          )}

          {historyStage === 'ready' && history.length === 0 && (
            <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
              No broadcasts logged yet.
            </p>
          )}

          {historyStage === 'ready' &&
            history.map((row, i) => (
              <RegisterRow
                key={row.id}
                index={formatDate(row.sentAt)}
                primary={row.audience}
                secondary={row.message}
                last={i === history.length - 1}
              />
            ))}
        </div>
      </div>
    </div>
  )
}
