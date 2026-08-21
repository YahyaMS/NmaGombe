'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useVerifiedMemberGuard } from '@/lib/auth/useVerifiedMemberGuard'
import { getOwnMemberProfile, updateOwnProfile } from '@/lib/data/members'
import { profileUpdateSchema, gradeLabels, type ProfileUpdateInput, type Grade } from '@/lib/data/schemas'
import { Field, inputStyle, labelStyle } from '@/components/ui/Field'

type Stage = 'loading' | 'ready' | 'saving' | 'saved' | 'error'

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: 'pointer',
} as const

const emptyForm: ProfileUpdateInput = {
  department: '',
  grade: 'consultant',
  facility: '',
  subspecialty: '',
  town: '',
  phone: '',
  whatsapp: '',
  visibility: { phone: false, whatsapp: false, email: false, facility: false },
  publicListingConsent: false,
  mdcnRenewalMonth: undefined,
}

const monthLabels = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-sm type-small" style={{ color: 'var(--color-ink-2)', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: '18px', height: '18px', accentColor: 'var(--color-green)' }}
      />
      {label}
    </label>
  )
}

export function ProfileForm() {
  const { state: guardState, uid } = useVerifiedMemberGuard()
  const [stage, setStage] = useState<Stage>('loading')
  const [form, setForm] = useState<ProfileUpdateInput>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (guardState !== 'ready' || !uid) return
    void getOwnMemberProfile(uid).then((profile) => {
      if (profile) {
        setForm({
          department: profile.department ?? '',
          grade: (profile.grade as Grade) ?? 'consultant',
          facility: profile.facility ?? '',
          subspecialty: profile.subspecialty ?? '',
          town: profile.town ?? '',
          phone: profile.phone ?? '',
          whatsapp: profile.whatsapp ?? '',
          visibility: profile.visibility ?? emptyForm.visibility,
          publicListingConsent: profile.publicListingConsent ?? false,
          mdcnRenewalMonth: profile.mdcnRenewalMonth,
        })
      }
      setStage('ready')
    })
  }, [guardState, uid])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = profileUpdateSchema.safeParse(form)
    if (!parsed.success) {
      const errors: Partial<Record<string, string>> = {}
      for (const issue of parsed.error.issues) {
        errors[String(issue.path[0])] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    if (!uid) return
    setFieldErrors({})
    setStage('saving')
    setErrorMessage(null)
    try {
      await updateOwnProfile(uid, parsed.data)
      setStage('saved')
    } catch {
      setErrorMessage("Couldn't save — try again.")
      setStage('ready')
    }
  }

  if (guardState !== 'ready' || stage === 'loading') {
    return <div className="mx-auto px-md py-2xl" style={{ maxWidth: '480px' }} aria-live="polite" />
  }

  const shellStyle = { maxWidth: '480px' } as const

  if (stage === 'saved') {
    return (
      <div className="mx-auto px-md py-2xl" style={shellStyle}>
        <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Saved</p>
        <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
          Profile updated
        </h1>
        <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
          Your folio card reflects these details now.
        </p>
        <Link
          href="/portal/card"
          className="type-body font-semibold px-lg py-sm mt-lg inline-block"
          style={primaryButtonStyle}
        >
          View your folio card
        </Link>
        <p className="type-small mt-lg">
          <button
            type="button"
            onClick={() => setStage('ready')}
            style={{ color: 'var(--color-green)', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            Keep editing
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto px-md py-2xl" style={shellStyle}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Your profile</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>
        Complete your details
      </h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        Grade and specialty appear on your folio card. Phone and WhatsApp are only ever shown to
        other members, and only if you switch them on below.
      </p>

      {errorMessage && (
        <p className="type-small mt-md" style={{ color: 'var(--color-danger)' }}>
          {errorMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-md mt-lg" noValidate>
        <Field
          label="Department (specialty)"
          name="department"
          value={form.department}
          onChange={(v) => setForm((f) => ({ ...f, department: v }))}
          error={fieldErrors.department}
        />

        <div>
          <label htmlFor="grade" className="type-small font-semibold" style={labelStyle}>
            Grade
          </label>
          <select
            id="grade"
            value={form.grade}
            onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value as Grade }))}
            style={inputStyle}
          >
            {Object.entries(gradeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Facility"
          name="facility"
          value={form.facility ?? ''}
          onChange={(v) => setForm((f) => ({ ...f, facility: v }))}
          error={fieldErrors.facility}
        />
        <Field
          label="Subspecialty (optional)"
          name="subspecialty"
          value={form.subspecialty ?? ''}
          onChange={(v) => setForm((f) => ({ ...f, subspecialty: v }))}
        />
        <Field
          label="Town"
          name="town"
          value={form.town ?? ''}
          onChange={(v) => setForm((f) => ({ ...f, town: v }))}
        />
        <Field
          label="Phone (optional)"
          name="phone"
          type="tel"
          value={form.phone ?? ''}
          onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
        />
        <Field
          label="WhatsApp (optional)"
          name="whatsapp"
          type="tel"
          value={form.whatsapp ?? ''}
          onChange={(v) => setForm((f) => ({ ...f, whatsapp: v }))}
        />

        <div>
          <label htmlFor="mdcnRenewalMonth" className="type-small font-semibold" style={labelStyle}>
            MDCN licence renewal month (optional)
          </label>
          <select
            id="mdcnRenewalMonth"
            value={form.mdcnRenewalMonth ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                mdcnRenewalMonth: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            style={inputStyle}
          >
            <option value="">Not set</option>
            {monthLabels.map((label, i) => (
              <option key={label} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
          <p className="type-small mt-xs" style={{ color: 'var(--color-ink-3)' }}>
            We remind you when it&rsquo;s close, and link out to the MDCN portal. We never handle
            the renewal itself.
          </p>
        </div>

        <div>
          <p className="type-small font-semibold" style={{ ...labelStyle, marginBottom: 'var(--spacing-sm)' }}>
            Visible to other verified members
          </p>
          <div className="flex flex-col gap-sm">
            <Checkbox
              label="Phone"
              checked={form.visibility.phone}
              onChange={(v) => setForm((f) => ({ ...f, visibility: { ...f.visibility, phone: v } }))}
            />
            <Checkbox
              label="WhatsApp"
              checked={form.visibility.whatsapp}
              onChange={(v) => setForm((f) => ({ ...f, visibility: { ...f.visibility, whatsapp: v } }))}
            />
            <Checkbox
              label="Email"
              checked={form.visibility.email}
              onChange={(v) => setForm((f) => ({ ...f, visibility: { ...f.visibility, email: v } }))}
            />
            <Checkbox
              label="Facility"
              checked={form.visibility.facility}
              onChange={(v) => setForm((f) => ({ ...f, visibility: { ...f.visibility, facility: v } }))}
            />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--spacing-md)' }}>
          <Checkbox
            label="List me on the public find-a-doctor page"
            checked={form.publicListingConsent}
            onChange={(v) => setForm((f) => ({ ...f, publicListingConsent: v }))}
          />
          <p className="type-small mt-xs" style={{ color: 'var(--color-ink-3)' }}>
            Off by default. Shows only your name, grade, specialty and facility to the public —
            never phone, WhatsApp or email.
          </p>
        </div>

        <button
          type="submit"
          disabled={stage === 'saving'}
          className="type-body font-semibold px-lg py-sm mt-sm"
          style={{ ...primaryButtonStyle, opacity: stage === 'saving' ? 0.6 : 1 }}
        >
          {stage === 'saving' ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  )
}
