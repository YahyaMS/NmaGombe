'use client'

/**
 * No Firebase import at all — posts to /api/admin/news, which re-checks
 * authorisation itself and does the actual write via the Admin SDK. The
 * admin layout already gates the page; there's nothing left for a client
 * guard to protect here. See docs/09-DECISIONS.md for the conversion.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { newsPublishInputSchema, newsCategorySchema, newsCategoryLabels, type NewsCategory } from '@/lib/data/schemas'
import { Field, inputStyle, labelStyle } from '@/components/ui/Field'

type Stage = 'ready' | 'publishing'

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: 'pointer',
} as const

export function NewsForm() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('ready')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<NewsCategory>('communique')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({})
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = newsPublishInputSchema.safeParse({ title, category, body })
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({ title: fieldErrors.title?.[0], body: fieldErrors.body?.[0] })
      return
    }
    setErrors({})
    setErrorMessage('')
    setStage('publishing')

    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) throw new Error('publish failed')
      const { slug } = await res.json()
      router.push(`/news/${slug}`)
    } catch {
      setErrorMessage("Couldn't publish — try again.")
      setStage('ready')
    }
  }

  const publishing = stage === 'publishing'

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '640px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>New communiqué</h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        Publishes immediately — there&rsquo;s no draft step.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-md mt-lg">
        <Field label="Title" name="title" value={title} onChange={setTitle} error={errors.title} />

        <div>
          <label htmlFor="category" className="type-small font-semibold" style={labelStyle}>
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as NewsCategory)}
            style={inputStyle}
          >
            {newsCategorySchema.options.map((c) => (
              <option key={c} value={c}>
                {newsCategoryLabels[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="body" className="type-small font-semibold" style={labelStyle}>
            Body
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            style={{ ...inputStyle, fontSize: '16px' }}
            aria-invalid={errors.body ? 'true' : undefined}
          />
          {errors.body && (
            <p className="type-small mt-xs" style={{ color: 'var(--color-danger)' }}>{errors.body}</p>
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
