/** Shared text-input field for forms — signup, profile, anywhere a labeled input is needed. */

export const inputStyle = {
  width: '100%',
  padding: 'var(--spacing-sm) var(--spacing-md)',
  border: '1px solid var(--color-rule-strong)',
  borderRadius: 'var(--radius)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-ink)',
  fontFamily: 'var(--font-sans)',
  fontSize: '16px',
} as const

export const labelStyle = {
  display: 'block',
  marginBottom: 'var(--spacing-xs)',
  color: 'var(--color-ink-2)',
} as const

export function Field({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
}: {
  label: string
  name: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  autoComplete?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="type-small font-semibold" style={labelStyle}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="type-small" style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-xs)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
