'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useExecGuard } from '@/lib/auth/useExecGuard'
import { publishEvent } from '@/lib/data/eventsAdmin'
import { eventPublishInputSchema } from '@/lib/data/schemas'
import { Field, inputStyle, labelStyle } from '@/components/ui/Field'

type Stage = 'ready' | 'publishing'

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: 'pointer',
} as const

export function EventForm() {
  const router = useRouter()
  const { state: guardState } = useExecGuard()
  const [stage, setStage] = useState<Stage>('ready')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startAt, setStartAt] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<{ title?: string; location?: string; startAt?: string; description?: string }>({})
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = eventPublishInputSchema.safeParse({ title, location, startAt, description })
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({
        title: fieldErrors.title?.[0],
        location: fieldErrors.location?.[0],
        startAt: fieldErrors.startAt?.[0],
        description: fieldErrors.description?.[0],
      })
      return
    }
    setErrors({})
    setErrorMessage('')
    setStage('publishing')

    try {
      const slug = await publishEvent(parsed.data)
      router.push(`/events/${slug}`)
    } catch {
      setErrorMessage("Couldn't publish — try again.")
      setStage('ready')
    }
  }

  if (guardState !== 'ready') {
    return <div className="mx-auto px-md py-2xl" style={{ maxWidth: '640px' }} aria-live="polite" />
  }

  const publishing = stage === 'publishing'

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '640px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>New event</h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        Publishes immediately — there&rsquo;s no draft step.
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
          disabled={publishing}
          className="type-body font-semibold px-lg py-sm mt-sm"
          style={{ ...primaryButtonStyle, opacity: publishing ? 0.6 : 1 }}
        >
          {publishing ? 'Publishing…' : 'Publish'}
        </button>
      </form>
    </div>
  )
}
