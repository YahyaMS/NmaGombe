'use client'

/**
 * /portal/cpd — CPD/CME self-log. See docs/03-DATA-MODEL.md's cpdEntries section and
 * docs/09-DECISIONS.md for the shape decisions (dateAttended as a plain date string,
 * export as a print view rather than a CSV, no cross-member admin query).
 *
 * Every entry here is self-reported — we record what the member tells us, we do not
 * certify it. That label is shown on the entry itself (not just in the database) and
 * repeated on the printable export, which also carries its own provenance (name, folio
 * number, generation date, total) since a printed page leaves the system and can end up
 * in front of a regulator.
 */

import { useEffect, useState, type FormEvent } from 'react'
import { useVerifiedMemberGuard } from '@/lib/auth/useVerifiedMemberGuard'
import { getOwnMemberProfile } from '@/lib/data/members'
import {
  addCpdEntry,
  attachCpdCertificate,
  deleteCpdEntry,
  subscribeToOwnCpdEntries,
  type CpdEntryRecord,
} from '@/lib/data/cpd'
import { cpdEntryInputSchema, type CpdEntryInput } from '@/lib/data/schemas'
import { Field, inputStyle, labelStyle } from '@/components/ui/Field'

type Stage = 'loading' | 'ready' | 'offline'
type SaveStage = 'idle' | 'saving'

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: 'pointer',
} as const

const secondaryButtonStyle = {
  backgroundColor: 'transparent',
  color: 'var(--color-green)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--color-rule-strong)',
  cursor: 'pointer',
} as const

const emptyForm: CpdEntryInput = {
  title: '',
  provider: '',
  creditUnits: 0,
  dateAttended: '',
}

function todayLagos(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date())
}

export function CpdLog() {
  const { state: guardState, uid } = useVerifiedMemberGuard()
  const [stage, setStage] = useState<Stage>('loading')
  const [entries, setEntries] = useState<CpdEntryRecord[]>([])
  const [memberName, setMemberName] = useState('')
  const [folioNumber, setFolioNumber] = useState('')

  const [form, setForm] = useState<CpdEntryInput>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [saveStage, setSaveStage] = useState<SaveStage>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  useEffect(() => {
    if (guardState !== 'ready' || !uid) return
    // Non-blocking: only feeds the print header's provenance line, so a failure here
    // shouldn't stop the log itself from loading.
    void getOwnMemberProfile(uid).then((profile) => {
      setMemberName(profile?.displayName ?? '')
      setFolioNumber(profile?.folioNumber ?? '')
    })
    return subscribeToOwnCpdEntries(
      uid,
      (ownEntries) => {
        setEntries(ownEntries)
        setStage('ready')
      },
      () => setStage('offline')
    )
  }, [guardState, uid])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = cpdEntryInputSchema.safeParse(form)
    if (!parsed.success) {
      const errors: Partial<Record<string, string>> = {}
      for (const issue of parsed.error.issues) {
        errors[String(issue.path[0])] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    if (!uid) return
    setFieldErrors({})
    setSaveStage('saving')
    setErrorMessage(null)
    try {
      await addCpdEntry(uid, parsed.data)
      setForm(emptyForm)
    } catch {
      setErrorMessage("Couldn't save that entry — try again.")
    } finally {
      setSaveStage('idle')
    }
  }

  async function handleDelete(id: string) {
    if (!uid) return
    try {
      await deleteCpdEntry(uid, id)
    } catch {
      setErrorMessage("Couldn't remove that entry — reload and try again.")
    }
  }

  async function handleAttach(id: string, file: File) {
    if (!uid) return
    setUploadingId(id)
    try {
      await attachCpdCertificate(uid, id, file)
    } catch {
      setErrorMessage("Couldn't attach that certificate — check your connection and try again.")
    } finally {
      setUploadingId(null)
    }
  }

  if (guardState !== 'ready' || stage === 'loading') {
    return <div className="mx-auto px-md py-2xl" style={{ maxWidth: '640px' }} aria-live="polite" />
  }

  if (stage === 'offline') {
    return (
      <div className="mx-auto px-md py-2xl" style={{ maxWidth: '640px' }}>
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Offline</p>
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>You&rsquo;re offline</h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Your CPD log hasn&rsquo;t synced to this device yet, so there&rsquo;s nothing cached to
          show. Connect once and it&rsquo;ll be available offline after that.
        </p>
      </div>
    )
  }

  const totalCreditUnits = entries.reduce((sum, entry) => sum + entry.creditUnits, 0)

  return (
    <div className="mx-auto px-md py-2xl print:px-0 print:py-0" style={{ maxWidth: '640px' }}>
      {/* The file input is visually hidden (.sr-only), not display:none, so it stays
          keyboard-focusable — :focus-within puts a visible ring on the label around it,
          since the browser's native focus ring on the off-screen input itself wouldn't
          be visible. */}
      <style>{`.cpd-attach-label:focus-within {
        outline: 2px solid var(--color-green);
        outline-offset: 2px;
      }`}</style>
      <div className="print:hidden">
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>
          Your record
        </p>
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
          CPD / CME log
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Log CME activity as you complete it. Every entry here is self-reported — we record what
          you tell us, we don&rsquo;t certify it.
        </p>

        {errorMessage && (
          <p className="type-small mt-md" style={{ color: 'var(--color-danger)' }}>
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-md mt-lg" noValidate>
          <Field
            label="Title"
            name="title"
            value={form.title}
            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            error={fieldErrors.title}
          />
          <Field
            label="Provider / organiser"
            name="provider"
            value={form.provider}
            onChange={(v) => setForm((f) => ({ ...f, provider: v }))}
            error={fieldErrors.provider}
          />
          <div className="flex gap-md">
            <div style={{ flex: 1 }}>
              <label htmlFor="creditUnits" className="type-small font-semibold" style={labelStyle}>
                Credit units
              </label>
              <input
                id="creditUnits"
                type="number"
                min="0"
                step="0.5"
                value={form.creditUnits || ''}
                onChange={(e) => setForm((f) => ({ ...f, creditUnits: Number(e.target.value) }))}
                style={inputStyle}
                aria-invalid={fieldErrors.creditUnits ? 'true' : undefined}
              />
              {fieldErrors.creditUnits && (
                <p className="type-small mt-xs" style={{ color: 'var(--color-danger)' }}>
                  {fieldErrors.creditUnits}
                </p>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="dateAttended" className="type-small font-semibold" style={labelStyle}>
                Date attended
              </label>
              <input
                id="dateAttended"
                type="date"
                max={todayLagos()}
                value={form.dateAttended}
                onChange={(e) => setForm((f) => ({ ...f, dateAttended: e.target.value }))}
                style={inputStyle}
                aria-invalid={fieldErrors.dateAttended ? 'true' : undefined}
              />
              {fieldErrors.dateAttended && (
                <p className="type-small mt-xs" style={{ color: 'var(--color-danger)' }}>
                  {fieldErrors.dateAttended}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saveStage === 'saving'}
            className="type-body font-semibold px-lg py-sm mt-sm"
            style={{ ...primaryButtonStyle, opacity: saveStage === 'saving' ? 0.6 : 1 }}
          >
            {saveStage === 'saving' ? 'Adding…' : 'Add entry'}
          </button>
        </form>

        {entries.length > 0 && (
          <div className="flex items-center justify-between mt-xl" style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--spacing-md)' }}>
            <p className="type-small" style={{ color: 'var(--color-ink-2)' }}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} · {totalCreditUnits} credit
              units total
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="type-small font-semibold px-md py-xs"
              style={secondaryButtonStyle}
            >
              Export summary
            </button>
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="mt-xl px-md py-xl print:hidden" style={{ textAlign: 'center', border: '1px dashed var(--color-rule-strong)', borderRadius: 'var(--radius)' }}>
          <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
            Nothing logged yet. Add the CME you&rsquo;ve already completed this year — it&rsquo;s
            ready to show at renewal season.
          </p>
        </div>
      ) : (
        <div className="mt-lg print:mt-0">
          <div className="hidden print:block" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h1 className="type-h2" style={{ color: 'var(--color-ink)' }}>
              CPD / CME summary
            </h1>
            <p className="type-body mt-xs">{memberName}</p>
            <p className="type-small" style={{ color: 'var(--color-ink-3)' }}>
              Folio {folioNumber} · Generated {todayLagos()} · {entries.length}{' '}
              {entries.length === 1 ? 'entry' : 'entries'} · {totalCreditUnits} credit units total
            </p>
            <p className="type-small mt-sm" style={{ color: 'var(--color-ink-3)' }}>
              Every entry below is self-reported by the member. The chapter records what the
              member tells us; it does not certify or independently verify this record.
            </p>
          </div>

          <ul className="flex flex-col gap-md m-0 p-0" style={{ listStyle: 'none' }}>
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="break-inside-avoid px-md py-md"
                style={{ border: '1px solid var(--color-rule)', borderRadius: 'var(--radius)' }}
              >
                <div className="flex items-start justify-between gap-md">
                  <div>
                    <p className="type-body font-semibold" style={{ color: 'var(--color-ink)' }}>
                      {entry.title}
                    </p>
                    <p className="type-small" style={{ color: 'var(--color-ink-2)' }}>
                      {entry.provider}
                    </p>
                    <p className="type-small mt-xs" style={{ color: 'var(--color-ink-3)' }}>
                      {entry.dateAttended} · {entry.creditUnits} credit units · Self-reported
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-xs print:hidden">
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="type-small"
                      style={{ color: 'var(--color-danger)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="print:hidden mt-sm">
                  {entry.certificateUrl ? (
                    <a
                      href={entry.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="type-small"
                      style={{ color: 'var(--color-green)' }}
                    >
                      View certificate
                    </a>
                  ) : (
                    <label
                      className="type-small cpd-attach-label"
                      style={{ color: 'var(--color-green)', cursor: 'pointer' }}
                    >
                      {uploadingId === entry.id ? 'Uploading…' : 'Attach certificate'}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="sr-only"
                        disabled={uploadingId === entry.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) void handleAttach(entry.id, file)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
