'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { Field } from '@/components/ui/Field'
import { requestPasswordReset, describeAuthError } from '@/lib/firebase/auth-password'

const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address')

/**
 * Asks Firebase to send a reset link. Firebase hosts the page that actually
 * sets the new password, so there is no second screen here.
 *
 * The confirmation never says whether the address has an account — doing so
 * would turn this form into a way to test whether any given doctor is a member.
 * A genuine send and an unknown address are indistinguishable from the outside,
 * which is also how Firebase behaves with email enumeration protection on.
 */
export function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message)
      return
    }
    setFieldError(undefined)
    setErrorMessage(null)
    setBusy(true)
    try {
      await requestPasswordReset(parsed.data)
      setSent(true)
    } catch (err) {
      // Only genuine failures surface — an unknown address is not one of them,
      // and Firebase doesn't report it as one either.
      setErrorMessage(describeAuthError(err))
      setBusy(false)
    }
  }

  const shellStyle = { maxWidth: '440px' } as const

  if (sent) {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Check your email</p>
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
          If that address has an account, a reset link is on its way
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Open it and choose a new password. If nothing arrives in a few minutes, check spam and
          promotions — mail from us lands there more often than it should.
        </p>
        <Link
          href="/signin"
          className="type-body font-semibold px-lg py-sm mt-lg inline-block"
          style={{
            backgroundColor: 'var(--color-green)',
            color: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            textDecoration: 'none',
          }}
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto px-md py-2xl" style={shellStyle}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Members</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
        Reset your password
      </h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        Enter the email you signed up with and we&rsquo;ll send you a link to choose a new password.
      </p>

      {errorMessage && (
        <p className="type-small mt-md" style={{ color: 'var(--color-danger)' }} role="alert">
          {errorMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-md mt-lg" noValidate>
        <Field
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          error={fieldError}
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={busy}
          className="type-body font-semibold px-lg py-sm mt-sm"
          style={{
            backgroundColor: 'var(--color-green)',
            color: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            transitionDuration: 'var(--motion-fast)',
            border: 'none',
            cursor: 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="type-small mt-lg" style={{ color: 'var(--color-ink-3)' }}>
        <Link href="/signin" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
