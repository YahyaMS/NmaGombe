'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { memberSignupSchema, type MemberSignupInput } from '@/lib/data/schemas'
import { createMemberProfile, submitVerificationRequest } from '@/lib/data/members'
import { Field } from '@/components/ui/Field'
import {
  requestSignInLink,
  saveSignupDraft,
  readSignupDraft,
  clearSignupDraft,
  isEmailLinkReturn,
  readStoredEmail,
  completeEmailLinkSignIn,
  completeReturningSignIn,
  describeSignInError,
} from '@/lib/firebase/auth-email-link'
import { establishServerSession } from '@/lib/firebase/session-bridge'

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

export function SignupForm() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>(initialStage)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmEmail, setConfirmEmail] = useState('')

  const [form, setForm] = useState<MemberSignupInput>({
    displayName: '',
    department: '',
    facility: '',
    folioNumber: '',
    email: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof MemberSignupInput, string>>>({})

  // No synchronous setState here — every branch is after an await, so this is safe
  // to call directly from the mount effect below without triggering cascading renders.
  async function completeSignIn(email: string) {
    try {
      const draft = readSignupDraft()
      if (draft) {
        // Fresh signup — the draft only exists if this device just submitted the form.
        const user = await completeEmailLinkSignIn(window.location.href, email)
        await createMemberProfile(user.uid, { ...draft, email })
        await submitVerificationRequest(user.uid, draft.folioNumber)
        const idToken = await user.getIdToken(true)
        await establishServerSession(idToken)
        clearSignupDraft()
        router.replace('/pending')
        return
      }
      // Returning sign-in (email-link auth doubles as both — Firebase signs into
      // the existing account by email rather than creating a duplicate).
      const destination = await completeReturningSignIn(window.location.href, email)
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
    const parsed = memberSignupSchema.safeParse(form)
    if (!parsed.success) {
      const errors: Partial<Record<keyof MemberSignupInput, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof MemberSignupInput
        errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setStage('sending')
    setErrorMessage(null)
    try {
      saveSignupDraft({
        displayName: parsed.data.displayName,
        department: parsed.data.department,
        facility: parsed.data.facility,
        folioNumber: parsed.data.folioNumber,
      })
      await requestSignInLink(parsed.data.email, '/signup')
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
          We sent a sign-in link to {form.email}
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Open it on this device to finish creating your account. If it doesn&rsquo;t arrive in a
          few minutes, check spam — or{' '}
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
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Join the chapter</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
        Create your account
      </h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        An admin reviews your folio number against the membership list before you get access to
        the directory, folio card and dues payment.
      </p>

      {errorMessage && (
        <p className="type-small mt-md" style={{ color: 'var(--color-danger)' }}>
          {errorMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-md mt-lg" noValidate>
        <Field
          label="Full name"
          name="displayName"
          value={form.displayName}
          onChange={(v) => setForm((f) => ({ ...f, displayName: v }))}
          error={fieldErrors.displayName}
          autoComplete="name"
        />
        <Field
          label="Department (specialty)"
          name="department"
          value={form.department}
          onChange={(v) => setForm((f) => ({ ...f, department: v }))}
          error={fieldErrors.department}
        />
        <Field
          label="Facility (optional)"
          name="facility"
          value={form.facility ?? ''}
          onChange={(v) => setForm((f) => ({ ...f, facility: v }))}
          error={fieldErrors.facility}
        />
        <Field
          label="Folio number"
          name="folioNumber"
          value={form.folioNumber}
          onChange={(v) => setForm((f) => ({ ...f, folioNumber: v }))}
          error={fieldErrors.folioNumber}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          error={fieldErrors.email}
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={stage === 'sending'}
          className="type-body font-semibold px-lg py-sm mt-sm"
          style={{ ...primaryButtonStyle, opacity: stage === 'sending' ? 0.6 : 1 }}
        >
          {stage === 'sending' ? 'Sending…' : 'Continue'}
        </button>
      </form>

      <p className="type-small mt-lg" style={{ color: 'var(--color-ink-3)' }}>
        Already verified?{' '}
        <Link href="/signin" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}
