'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/auth'
import {
  memberSignupSchema,
  newPasswordSchema,
  PASSWORD_MIN_LENGTH,
  type MemberSignupInput,
} from '@/lib/data/schemas'
import { registerNewMember, getOwnMemberProfile } from '@/lib/data/members'
import { Field } from '@/components/ui/Field'
import { PasswordField } from '@/components/ui/PasswordField'
import { createAccount, establishSession, describeAuthError } from '@/lib/firebase/auth-password'

/**
 * Signup is one submit, in one browser, with no inbox in the middle: create the
 * account, write the profile and the verification request in a single batch,
 * mint the session, done. See docs/09-DECISIONS.md ADR-026.
 *
 * 'complete-profile' is the one remaining recovery path. Account creation and
 * the profile write are two operations against two different services, so the
 * account can exist with no profile if the second fails — the member would
 * otherwise be signed in, invisible to the admin queue, with no way to tell.
 * A signed-in account with no profile is therefore a recognised state that asks
 * for the details again rather than a dead end.
 */
type Stage = 'form' | 'submitting' | 'complete-profile'

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  transitionDuration: 'var(--motion-fast)',
  border: 'none',
  cursor: 'pointer',
} as const

type FieldErrors = Partial<Record<keyof MemberSignupInput | 'password', string>>

export function SignupForm() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('form')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [signedInUid, setSignedInUid] = useState<string | null>(null)
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)

  const [form, setForm] = useState<MemberSignupInput>({
    displayName: '',
    department: '',
    facility: '',
    folioNumber: '',
    email: '',
  })
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const recovering = stage === 'complete-profile'
  const busy = stage === 'submitting'

  function collectIssues(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
    const errors: FieldErrors = {}
    for (const issue of issues) {
      errors[issue.path[0] as keyof FieldErrors] = issue.message
    }
    return errors
  }

  // Someone already signed in with no member profile — either a profile write
  // that failed after the account was created, or an account from before this
  // page existed. /pending sends them here.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user?.email) return
      void (async () => {
        const profile = await getOwnMemberProfile(user.uid)
        if (profile) return
        setSignedInUid(user.uid)
        setSignedInEmail(user.email)
        setForm((f) => ({ ...f, email: user.email! }))
        setStage('complete-profile')
      })()
    })
    return unsub
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = memberSignupSchema.safeParse(form)
    const parsedPassword = newPasswordSchema.safeParse(password)
    if (!parsed.success || !parsedPassword.success) {
      setFieldErrors({
        ...(parsed.success ? {} : collectIssues(parsed.error.issues)),
        ...(parsedPassword.success ? {} : { password: parsedPassword.error.issues[0]?.message }),
      })
      return
    }
    setFieldErrors({})
    setErrorMessage(null)
    setStage('submitting')
    try {
      const user = await createAccount(parsed.data.email, parsedPassword.data)
      await registerNewMember(user.uid, parsed.data)
      await establishSession(user)
      router.replace('/pending')
    } catch (err) {
      setErrorMessage(describeAuthError(err))
      setStage('form')
    }
  }

  // Recovery submit: the account already exists and is signed in, so there is no
  // password to set and no session to mint — only the profile is missing. The
  // email is the signed-in one, which is what Firestore rules check it against.
  async function handleCompleteProfile(e: FormEvent) {
    e.preventDefault()
    if (!signedInUid || !signedInEmail) return
    const parsed = memberSignupSchema.safeParse({ ...form, email: signedInEmail })
    if (!parsed.success) {
      setFieldErrors(collectIssues(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setErrorMessage(null)
    setStage('submitting')
    try {
      await registerNewMember(signedInUid, parsed.data)
      router.replace('/pending')
    } catch {
      setErrorMessage("We couldn't save your details. Check your connection and try again.")
      setStage('complete-profile')
    }
  }

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '440px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>
        {recovering ? 'Finish your application' : 'Join the chapter'}
      </p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
        {recovering ? 'We still need your details' : 'Create your account'}
      </h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        {recovering ? (
          <>
            You&rsquo;re signed in as {signedInEmail}, but your signup details never reached us.
            Enter them once more and your application goes to an admin.
          </>
        ) : (
          <>
            An admin reviews your folio number against the membership list before you get access to
            the directory and folio card.
          </>
        )}
      </p>

      {errorMessage && (
        <p className="type-small mt-md" style={{ color: 'var(--color-danger)' }} role="alert">
          {errorMessage}
        </p>
      )}

      <form
        onSubmit={recovering ? handleCompleteProfile : handleSubmit}
        className="flex flex-col gap-md mt-lg"
        noValidate
      >
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
        {!recovering && (
          <>
            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              error={fieldErrors.email}
              autoComplete="email"
            />
            <PasswordField
              label="Password"
              name="password"
              value={password}
              onChange={setPassword}
              error={fieldErrors.password}
              autoComplete="new-password"
              hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
            />
          </>
        )}

        <button
          type="submit"
          disabled={busy}
          className="type-body font-semibold px-lg py-sm mt-sm"
          style={{ ...primaryButtonStyle, opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'Sending…' : recovering ? 'Send my application' : 'Create account'}
        </button>
      </form>

      {!recovering && (
        <p className="type-small mt-lg" style={{ color: 'var(--color-ink-3)' }}>
          Already have an account?{' '}
          <Link href="/signin" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>
            Sign in
          </Link>
        </p>
      )}
    </div>
  )
}
