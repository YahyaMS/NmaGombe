'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Field } from '@/components/ui/Field'
import {
  requestSignInLink,
  isEmailLinkReturn,
  readStoredEmail,
  completeReturningSignIn,
  describeSignInError,
} from '@/lib/firebase/auth-email-link'

type Stage = 'form' | 'sending' | 'sent' | 'completing' | 'need-email' | 'error'

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  transitionDuration: 'var(--motion-fast)',
  border: 'none',
  cursor: 'pointer',
} as const

function initialStage(): Stage {
  if (typeof window === 'undefined') return 'form'
  if (!isEmailLinkReturn(window.location.href)) return 'form'
  return readStoredEmail() ? 'completing' : 'need-email'
}

export function SigninForm() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>(initialStage)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')

  // No synchronous setState here — every branch is after an await, so this is safe
  // to call directly from the mount effect below without triggering cascading renders.
  async function completeSignIn(signinEmail: string) {
    try {
      const destination = await completeReturningSignIn(window.location.href, signinEmail)
      router.replace(
        destination === 'admin' ? '/admin/verification' : destination === 'member' ? '/portal' : '/pending'
      )
    } catch (err) {
      const code = (err as { code?: string } | undefined)?.code
      setErrorMessage(
        code === 'auth/network-request-failed'
          ? "You're offline. Reconnect and reopen the link from your email."
          : "That link didn't work — it may have expired or already been used. Request a new one below."
      )
      setStage('error')
    }
  }

  // Kicks off completion once, only when the page loaded straight into the
  // 'completing' stage (i.e. the email link brought us here with a stored email).
  // completeSignIn's own setState calls are all after an await, so this doesn't
  // cascade — the lint rule can't see through the async boundary.
  useEffect(() => {
    if (stage !== 'completing') return
    const stored = readStoredEmail()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) void completeSignIn(stored)
    // Intentionally mount-only: re-running on every stage/completeSignIn change
    // would re-fire the sign-in completion after it's already in flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStage('sending')
    setErrorMessage(null)
    try {
      await requestSignInLink(email.trim().toLowerCase(), '/signin')
      setStage('sent')
    } catch (err) {
      setErrorMessage(describeSignInError(err))
      setStage('form')
    }
  }

  async function handleConfirmEmail(e: FormEvent) {
    e.preventDefault()
    if (!confirmEmail.trim()) return
    setStage('completing')
    setErrorMessage(null)
    await completeSignIn(confirmEmail.trim().toLowerCase())
  }

  const shellStyle = { maxWidth: '440px' } as const

  if (stage === 'completing') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>Signing you in…</p>
      </div>
    )
  }

  if (stage === 'need-email') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Confirm it&rsquo;s you</p>
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
          Enter the email you signed up with
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          You opened this link on a different device or browser than the one you started on —
          we need to confirm it&rsquo;s the same address.
        </p>
        <form onSubmit={handleConfirmEmail} className="flex flex-col gap-md mt-lg">
          <Field label="Email" name="confirm-email" type="email" value={confirmEmail} onChange={setConfirmEmail} autoComplete="email" />
          <button type="submit" className="type-body font-semibold px-lg py-sm" style={primaryButtonStyle}>
            Continue
          </button>
        </form>
      </div>
    )
  }

  if (stage === 'sent') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Check your email</p>
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
          We sent a sign-in link to {email}
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Open it on this device to sign in. If it doesn&rsquo;t arrive in a few minutes, check
          spam — or{' '}
          <button
            type="button"
            onClick={() => setStage('form')}
            className="type-body font-semibold"
            style={{ color: 'var(--color-green)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
          >
            use a different email
          </button>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto px-md py-2xl" style={shellStyle}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Member sign in</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
        Sign in to your account
      </h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        Enter the email you signed up with — we&rsquo;ll send a link to sign in, no password
        needed.
      </p>

      {errorMessage && (
        <p className="type-small mt-md" style={{ color: 'var(--color-danger)' }}>
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
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={stage === 'sending'}
          className="type-body font-semibold px-lg py-sm mt-sm"
          style={{ ...primaryButtonStyle, opacity: stage === 'sending' ? 0.6 : 1 }}
        >
          {stage === 'sending' ? 'Sending…' : 'Send sign-in link'}
        </button>
      </form>

      <p className="type-small mt-lg" style={{ color: 'var(--color-ink-3)' }}>
        New here?{' '}
        <Link href="/signup" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>
          Create an account
        </Link>
      </p>
    </div>
  )
}
