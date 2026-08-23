'use client'

/**
 * No Firebase import at all — posts to /api/admin/events (create) or
 * /api/admin/events/[slug] (edit). See NewsForm.tsx's comment; same
 * conversion, same reasoning. Shared between /admin/events/new and
 * /admin/events/[slug]/edit — same fields, same validation, only the
 * submit target, button copy and initial values differ.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { eventPublishInputSchema, type EventPublishInput } from '@/lib/data/schemas'
import { Field, inputStyle, labelStyle } from '@/components/ui/Field'

type Stage = 'ready' | 'saving'

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: 'pointer',
} as const

/**
 * The create path does `new Date(datetimeLocalString)`, which JS parses as
 * browser-local time (execs are assumed to be in Nigeria — see
 * docs/09-DECISIONS.md ADR-017). Prefilling the same input on edit has to
 * invert that exact assumption, not introduce an explicit Africa/Lagos
 * conversion that would then disagree with create — so this uses the
 * browser's own offset, the same implicit assumption, not a hardcoded one.
 */
function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  const localMs = d.getTime() - d.getTimezoneOffset() * 60000
  return new Date(localMs).toISOString().slice(0, 16)
}

export interface EventFormInitial {
  slug: string
  title: string
  location: string
  startAt: string | null
  description: string
  cpdCreditUnits?: number
}

export function EventForm({ initial }: { initial?: EventFormInitial }) {
  const router = useRouter()
  const editing = Boolean(initial)
  const [stage, setStage] = useState<Stage>('ready')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [startAt, setStartAt] = useState(initial?.startAt ? toDatetimeLocalValue(initial.startAt) : '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [cpdCreditUnits, setCpdCreditUnits] = useState(
    initial?.cpdCreditUnits !== undefined ? String(initial.cpdCreditUnits) : ''
  )
  const [errors, setErrors] = useState<{ title?: string; location?: string; startAt?: string; description?: string; cpdCreditUnits?: string }>({})
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = eventPublishInputSchema.safeParse({
      title,
      location,
      startAt,
      description,
      cpdCreditUnits: cpdCreditUnits.trim() ? Number(cpdCreditUnits) : undefined,
    } satisfies EventPublishInput)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({
        title: fieldErrors.title?.[0],
        location: fieldErrors.location?.[0],
        startAt: fieldErrors.startAt?.[0],
        description: fieldErrors.description?.[0],
        cpdCreditUnits: fieldErrors.cpdCreditUnits?.[0],
      })
      return
    }
    setErrors({})
    setErrorMessage('')
    setStage('saving')

    try {
      const res = await fetch(editing ? `/api/admin/events/${initial!.slug}` : '/api/admin/events', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) throw new Error('save failed')
      if (editing) {
        router.push('/admin/events')
      } else {
        const { slug } = await res.json()
        router.push(`/events/${slug}`)
      }
    } catch {
      setErrorMessage(`Couldn't ${editing ? 'save' : 'publish'} — try again.`)
      setStage('ready')
    }
  }

  const saving = stage === 'saving'

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '640px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
        {editing ? 'Edit event' : 'New event'}
      </h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        {editing
          ? "Changes apply immediately. Registrants aren't notified — for a material change, send a broadcast too."
          : "Publishes immediately — there's no draft step."}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-md mt-lg">
        <Field label="Title" name="title" value={title} onChange={setTitle} error={errors.title} />
        <Field label="Location" name="location" value={location} onChange={setLocation} error={errors.location} />

        <div>
          <label htmlFor="startAt" className="type-small font-semibold" style={labelStyle}>
            Date and time
          </label>
          <input
            id="startAt"
            name="startAt"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            style={inputStyle}
            aria-invalid={errors.startAt ? 'true' : undefined}
          />
          {errors.startAt && (
            <p className="type-small mt-xs" style={{ color: 'var(--color-danger)' }}>{errors.startAt}</p>
          )}
        </div>

        <div>
          <label htmlFor="cpdCreditUnits" className="type-small font-semibold" style={labelStyle}>
            CPD credit units (optional)
          </label>
          <input
            id="cpdCreditUnits"
            type="number"
            min="0"
            step="0.5"
            value={cpdCreditUnits}
            onChange={(e) => setCpdCreditUnits(e.target.value)}
            style={inputStyle}
            aria-invalid={errors.cpdCreditUnits ? 'true' : undefined}
          />
          {errors.cpdCreditUnits && (
            <p className="type-small mt-xs" style={{ color: 'var(--color-danger)' }}>{errors.cpdCreditUnits}</p>
          )}
          <p className="type-small mt-xs" style={{ color: 'var(--color-ink-3)' }}>
            {editing
              ? "Leave blank if this event doesn't earn CPD credit. Changing this only affects members marked attended from now on — it never rewrites credit already recorded."
              : "Leave blank if this event doesn't earn CPD credit. Can be corrected later from the events list if needed."}
          </p>
        </div>

        <div>
          <label htmlFor="description" className="type-small font-semibold" style={labelStyle}>
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={12}
            style={{ ...inputStyle, fontSize: '16px' }}
            aria-invalid={errors.description ? 'true' : undefined}
          />
          {errors.description && (
            <p className="type-small mt-xs" style={{ color: 'var(--color-danger)' }}>{errors.description}</p>
          )}
        </div>

        {errorMessage && (
          <p className="type-small" style={{ color: 'var(--color-danger)' }}>{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="type-body font-semibold px-lg py-sm mt-sm"
          style={{ ...primaryButtonStyle, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish'}
        </button>
      </form>
    </div>
  )
}
