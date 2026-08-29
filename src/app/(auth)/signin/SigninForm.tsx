'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInSchema } from '@/lib/data/schemas'
import { Field } from '@/components/ui/Field'
import { PasswordField } from '@/components/ui/PasswordField'
import { signIn, describeAuthError } from '@/lib/firebase/auth-password'

/**
 * Email + password sign-in. No inbox round trip, no stages — one submit either
 * signs you in or tells you why not. See docs/09-DECISIONS.md ADR-026.
 *
 * Where you land is decided by custom claim, never by a Firestore field the
 * client could write: admin to the queue, verified member to the portal,
 * everyone else to the waiting room.
 */
export function SigninForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = signInSchema.safeParse({ email, password })
    if (!parsed.success) {
      const errors: { email?: string; password?: string } = {}
      for (const issue of parsed.error.issues) {
        errors[issue.path[0] as 'email' | 'password'] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setErrorMessage(null)
    setBusy(true)
    try {
      const { destination } = await signIn(parsed.data.email, parsed.data.password)
      router.replace(
        destination === 'admin' ? '/admin/verification' : destination === 'member' ? '/portal' : '/pending'
      )
    } catch (err) {
      setErrorMessage(describeAuthError(err))
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '440px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Members</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
        Sign in
      </h1>

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
          error={fieldErrors.email}
          autoComplete="email"
        />
        <PasswordField
          label="Password"
          name="password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          autoComplete="current-password"
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
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="type-small mt-lg" style={{ color: 'var(--color-ink-3)' }}>
        <Link href="/reset-password" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>
          Forgot your password?
        </Link>
      </p>
      <p className="type-small mt-sm" style={{ color: 'var(--color-ink-3)' }}>
        No account yet?{' '}
        <Link href="/signup" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>
          Join the chapter
        </Link>
      </p>
    </div>
  )
}
