'use client'

/**
 * Password input with a show/hide toggle.
 *
 * The toggle is not decoration: this is a mobile-first site for people typing
 * on Android keyboards, where a mistyped password you cannot see is a common
 * reason a sign-in fails twice and gets abandoned. The button sits inside the
 * field, and the input reserves --spacing-xl of right padding so the text never
 * slides underneath it.
 */

import { useState } from 'react'
import { inputStyle, labelStyle } from './Field'

export function PasswordField({
  label,
  name,
  value,
  onChange,
  error,
  autoComplete,
  hint,
}: {
  label: string
  name: string
  value: string
  onChange: (v: string) => void
  error?: string
  /** "new-password" when creating one, "current-password" when signing in. */
  autoComplete: 'new-password' | 'current-password'
  hint?: string
}) {
  const [visible, setVisible] = useState(false)
  const describedBy = [error ? `${name}-error` : null, hint ? `${name}-hint` : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div>
      <label htmlFor={name} className="type-small font-semibold" style={labelStyle}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, paddingRight: 'var(--spacing-xl)' }}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy || undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={name}
          className="type-small font-semibold"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            paddingLeft: 'var(--spacing-sm)',
            paddingRight: 'var(--spacing-sm)',
            background: 'none',
            border: 'none',
            color: 'var(--color-ink-2)',
            cursor: 'pointer',
          }}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {hint && !error && (
        <p id={`${name}-hint`} className="type-small" style={{ color: 'var(--color-ink-3)', marginTop: 'var(--spacing-xs)' }}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="type-small" style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-xs)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
