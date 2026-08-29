'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { memberSignupSchema, type MemberSignupInput } from '@/lib/data/schemas'
import { registerNewMember, getOwnMemberProfile } from '@/lib/data/members'
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

/**
 * 'complete-profile' is the recovery stage for a signup whose details never
 * reached Firestore. The draft (name, department, folio) lives in localStorage
 * on the browser the form was filled in, but the sign-in link arrives by email
 * — tap it in Gmail and re-open it in Chrome, and the draft is on the other
 * side of a browser boundary. This used to fall through to the returning-member
 * path, which signs the account in, writes nothing, and drops the member on
 * /pending: they believe they applied, no admin ever sees a request, and their
 * folio number is gone. Now a signed-in account with no member profile is asked
 * for those details again instead.
 */
type Stage =
  | 'form'
  | 'sending'
  | 'sent'
  | 'completing'
  | 'need-email'
  | 'complete-profile'
  | 'error'

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
  const [signedInUid, setSignedInUid] = useState<string | null>(null)
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)

  const [form, setForm] = useState<MemberSignupInput>({
    displayName: '',
    department: '',
    facility: '',
    folioNumber: '',
    email: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof MemberSignupInput, string>>>({})

  /**
   * Switches to the recovery stage when the signed-in account has no member
   * profile. Returns true if it took over, so callers know not to navigate.
   */
  async function offerProfileCompletion(uid: string, email: string): Promise<boolean> {
    const profile = await getOwnMemberProfile(uid)
    if (profile) return false
    setSignedInUid(uid)
    setSignedInEmail(email)
    setStage('complete-profile')
    return true
  }

  // No synchronous setState here — every branch is after an await, so this is safe
  // to call directly from the mount effect below without triggering cascading renders.
  async function completeSignIn(email: string) {
    try {
      const draft = readSignupDraft()
      if (draft) {
        // Fresh signup — the draft only exists if this device just submitted the form.
        const user = await completeEmailLinkSignIn(window.location.href, email)
        await registerNewMember(user.uid, { ...draft, email })
        const idToken = await user.getIdToken(true)
        await establishServerSession(idToken)
        clearSignupDraft()
        router.replace('/pending')
        return
      }
      // Returning sign-in (email-link auth doubles as both — Firebase signs into
      // the existing account by email rather than creating a duplicate).
      const { destination, uid } = await completeReturningSignIn(window.location.href, email)
      // 'pending' covers two different people: a member genuinely waiting on a
      // decision, and one whose signup details never got written at all. Only a
      // missing profile tells them apart.
      if (destination === 'pending' && (await offerProfileCompletion(uid, email))) return
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

  // The other way into recovery: someone already signed in — via /signin, or by
  // reopening the site later — whose profile was never written. /pending sends
  // them here. Only runs when this isn't an email-link return, so it never races
  // the sign-in completion above.
  useEffect(() => {
    if (stage !== 'form') return
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user?.email) return
      void offerProfileCompletion(user.uid, user.email)
    })
    return unsub
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

  // Recovery submit: the account already exists and is signed in, so there is no
  // email round trip — the details go straight to Firestore under the signed-in
  // address, which is the one Firestore rules check the profile against.
  async function handleCompleteProfile(e: FormEvent) {
    e.preventDefault()
    if (!signedInUid || !signedInEmail) return
    const parsed = memberSignupSchema.safeParse({ ...form, email: signedInEmail })
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
    setErrorMessage(null)
    try {
      await registerNewMember(signedInUid, parsed.data)
      clearSignupDraft()
      router.replace('/pending')
    } catch {
      setErrorMessage("We couldn't save your details. Check your connection and try again.")
    }
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

  const recovering = stage === 'complete-profile'

  return (
    <div className="mx-auto px-md py-2xl" style={shellStyle}>
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
            This happens when the email link opens in a different browser from the one you filled
            the form in. Enter them once more and your application goes to an admin.
          </>
        ) : (
          <>
            An admin reviews your folio number against the membership list before you get access to
            the directory and folio card.
          </>
        )}
      </p>

      {errorMessage && (
        <p className="type-small mt-md" style={{ color: 'var(--color-danger)' }}>
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
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            error={fieldErrors.email}
            autoComplete="email"
          />
        )}

        <button
          type="submit"
          disabled={stage === 'sending'}
          className="type-body font-semibold px-lg py-sm mt-sm"
          style={{ ...primaryButtonStyle, opacity: stage === 'sending' ? 0.6 : 1 }}
        >
          {stage === 'sending' ? 'Sending…' : recovering ? 'Send my application' : 'Continue'}
        </button>
      </form>

      {!recovering && (
        <p className="type-small mt-lg" style={{ color: 'var(--color-ink-3)' }}>
          Already verified?{' '}
          <Link href="/signin" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>
            Sign in
          </Link>
        </p>
      )}
    </div>
  )
}
