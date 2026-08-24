'use client'

/**
 * /portal/jobs/new — post a locum/job listing. Client Firestore SDK write
 * under firestore.rules (verified() + own uid, not privileged — same
 * reasoning as a member creating their own cpdEntries/registrations doc),
 * not a Route Handler.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVerifiedMemberGuard } from '@/lib/auth/useVerifiedMemberGuard'
import { getOwnMemberProfile } from '@/lib/data/members'
import { postJob } from '@/lib/data/jobs'
import {
  jobPostInputSchema,
  jobTypeSchema,
  jobTypeLabels,
  JOB_DEFAULT_EXPIRY_DAYS,
  JOB_MAX_EXPIRY_DAYS,
  type JobType,
} from '@/lib/data/schemas'
import { Field, inputStyle, labelStyle } from '@/components/ui/Field'

type Stage = 'ready' | 'posting'

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: 'pointer',
} as const

function dateNDaysFromToday(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(d)
}

export function JobForm() {
  const router = useRouter()
  const { state: guardState, uid } = useVerifiedMemberGuard()
  const [stage, setStage] = useState<Stage>('ready')

  const [title, setTitle] = useState('')
  const [facility, setFacility] = useState('')
  const [town, setTown] = useState('')
  const [type, setType] = useState<JobType>('locum')
  const [description, setDescription] = useState('')
  const [contactVia, setContactVia] = useState('')
  const [expiresAt, setExpiresAt] = useState(dateNDaysFromToday(JOB_DEFAULT_EXPIRY_DAYS.locum))
  const [expiresAtTouched, setExpiresAtTouched] = useState(false)

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (guardState !== 'ready' || !uid) return
    // Prefill from the member's own profile — most posts are the member's
    // own number, one less field to fill in on a phone. Editable either way.
    void getOwnMemberProfile(uid).then((profile) => {
      if (profile?.phone) setContactVia(profile.phone)
    })
  }, [guardState, uid])

  function handleTypeChange(next: JobType) {
    setType(next)
    if (!expiresAtTouched) setExpiresAt(dateNDaysFromToday(JOB_DEFAULT_EXPIRY_DAYS[next]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!uid) return

    const parsed = jobPostInputSchema.safeParse({
      title,
      facility,
      town,
      type,
      description,
      contactVia,
      expiresAt,
    })
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({
        title: fieldErrors.title?.[0],
        facility: fieldErrors.facility?.[0],
        town: fieldErrors.town?.[0],
        description: fieldErrors.description?.[0],
        contactVia: fieldErrors.contactVia?.[0],
        expiresAt: fieldErrors.expiresAt?.[0],
      })
      return
    }
    setErrors({})
    setErrorMessage('')
    setStage('posting')

    try {
      await postJob(uid, parsed.data)
      router.push('/portal/jobs')
    } catch {
      setErrorMessage("Couldn't post that listing — try again.")
      setStage('ready')
    }
  }

  if (guardState !== 'ready') {
    return <div className="mx-auto px-md py-2xl" style={{ maxWidth: '640px' }} aria-live="polite" />
  }

  const posting = stage === 'posting'

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '640px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Portal</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>Post a listing</h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        Every listing expires — a locum gap is days to weeks, not a season. Still open after that?
        Post it again.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-md mt-lg" noValidate>
        <Field label="Title" name="title" value={title} onChange={setTitle} error={errors.title} />
        <Field label="Facility" name="facility" value={facility} onChange={setFacility} error={errors.facility} />
        <Field label="Town" name="town" value={town} onChange={setTown} error={errors.town} />

        <div>
          <label htmlFor="type" className="type-small font-semibold" style={labelStyle}>
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as JobType)}
            style={inputStyle}
          >
            {jobTypeSchema.options.map((t) => (
              <option key={t} value={t}>
                {jobTypeLabels[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="type-small font-semibold" style={labelStyle}>
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            style={{ ...inputStyle, fontSize: '16px' }}
            aria-invalid={errors.description ? 'true' : undefined}
          />
          {errors.description && (
            <p className="type-small mt-xs" style={{ color: 'var(--color-danger)' }}>{errors.description}</p>
          )}
        </div>

        <Field
          label="Contact number"
          name="contactVia"
          value={contactVia}
          onChange={setContactVia}
          error={errors.contactVia}
        />

        <div>
          <label htmlFor="expiresAt" className="type-small font-semibold" style={labelStyle}>
            Listing expires
          </label>
          <input
            id="expiresAt"
            type="date"
            min={dateNDaysFromToday(1)}
            max={dateNDaysFromToday(JOB_MAX_EXPIRY_DAYS)}
            value={expiresAt}
            onChange={(e) => {
              setExpiresAt(e.target.value)
              setExpiresAtTouched(true)
            }}
            style={inputStyle}
            aria-invalid={errors.expiresAt ? 'true' : undefined}
          />
          {errors.expiresAt && (
            <p className="type-small mt-xs" style={{ color: 'var(--color-danger)' }}>{errors.expiresAt}</p>
          )}
          <p className="type-small mt-xs" style={{ color: 'var(--color-ink-3)' }}>
            Defaults to {JOB_DEFAULT_EXPIRY_DAYS[type]} days for a {jobTypeLabels[type].toLowerCase()} listing.
            Can&rsquo;t be extended later — repost if the role is still open.
          </p>
        </div>

        {errorMessage && (
          <p className="type-small" style={{ color: 'var(--color-danger)' }}>{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={posting}
          className="type-body font-semibold px-lg py-sm mt-sm"
          style={{ ...primaryButtonStyle, opacity: posting ? 0.6 : 1 }}
        >
          {posting ? 'Posting…' : 'Post listing'}
        </button>
      </form>
    </div>
  )
}
