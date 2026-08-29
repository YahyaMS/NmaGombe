/**
 * Zod schemas for Firestore documents and Function inputs.
 * One schema per document shape — see CLAUDE.md conventions.
 */

import { z } from 'zod'

export const memberSignupSchema = z.object({
  displayName: z.string().trim().min(2, 'Enter your full name').max(120),
  department: z.string().trim().min(2, 'Enter your specialty or department').max(120),
  facility: z.string().trim().max(160).optional(),
  folioNumber: z.string().trim().min(2, 'Enter your folio number').max(40),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
})
export type MemberSignupInput = z.infer<typeof memberSignupSchema>

/**
 * Credentials are deliberately NOT part of memberSignupSchema. That schema's
 * parsed output is written straight to members/{uid} by registerNewMember(),
 * so a password added to it would land in Firestore. Keeping the two schemas
 * separate makes that structural rather than something to remember.
 */
export const PASSWORD_MIN_LENGTH = 8

/**
 * Length only — no forced symbols or character classes, and no low maximum.
 * That's current NIST guidance, and it's what someone can actually type on a
 * phone keyboard. See docs/09-DECISIONS.md ADR-026.
 */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(1024)

/**
 * Signing in validates only that a password was typed. Applying the new-password
 * minimum here would tell an existing member with a shorter password to "use at
 * least 8 characters" when the real answer is that their password is wrong — or
 * right, and shorter than today's rule.
 */
export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})
export type SignInInput = z.infer<typeof signInSchema>

export const memberStatusSchema = z.enum(['pending', 'verified', 'rejected', 'suspended'])
export type MemberStatus = z.infer<typeof memberStatusSchema>

export const gradeSchema = z.enum([
  'consultant',
  'resident',
  'medical_officer',
  'house_officer',
  'retired',
])
export type Grade = z.infer<typeof gradeSchema>

export const gradeLabels: Record<Grade, string> = {
  consultant: 'Consultant',
  resident: 'Resident',
  medical_officer: 'Medical Officer',
  house_officer: 'House Officer',
  retired: 'Retired',
}

export const visibilitySchema = z.object({
  phone: z.boolean(),
  whatsapp: z.boolean(),
  email: z.boolean(),
  facility: z.boolean(),
})
export type Visibility = z.infer<typeof visibilitySchema>

/**
 * Bump whenever the consent language shown next to the public-listing
 * checkbox (ProfileForm.tsx) changes materially — this is what
 * `ConsentRecord.noticeVersion` records having been shown at save time.
 */
export const PUBLIC_LISTING_CONSENT_NOTICE_VERSION = '2026-08-25'

/**
 * A bare boolean can't demonstrate consent to a regulator — NDPA requires
 * being able to show *when* and *under what notice text* someone consented,
 * not just their current yes/no. `at`/`noticeVersion` are stamped at every
 * profile save (lib/data/members.ts's updateOwnProfile), not only the first
 * time `granted` flips true — so this always represents "the state of this
 * flag as last recorded, and when," never a stale claim about the original
 * consent moment specifically.
 */
export const consentRecordSchema = z.object({
  granted: z.boolean(),
  at: z.string(),
  noticeVersion: z.string(),
})
export type ConsentRecord = z.infer<typeof consentRecordSchema>

export const memberProfileSchema = z.object({
  displayName: z.string(),
  department: z.string(),
  folioNumber: z.string(),
  email: z.string(),
  status: memberStatusSchema,
  role: z.enum(['member', 'exec', 'admin']),
  facility: z.string().optional(),
  grade: gradeSchema.optional(),
  subspecialty: z.string().optional(),
  town: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  visibility: visibilitySchema.optional(),
  publicListingConsent: consentRecordSchema.optional(),
  duesPaidThrough: z.number().optional(),
  /** 1-12. Member-entered, for a reminder only — never fees, never payment. See ADR/CLAUDE.md. */
  mdcnRenewalMonth: z.number().int().min(1).max(12).optional(),
})
export type MemberProfile = z.infer<typeof memberProfileSchema>

/** What /portal/profile can submit. Grade required — the card's title line needs it. */
export const profileUpdateSchema = z.object({
  department: z.string().trim().min(2, 'Enter your specialty').max(120),
  grade: gradeSchema,
  facility: z.string().trim().max(160).optional(),
  subspecialty: z.string().trim().max(120).optional(),
  town: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(20).optional(),
  whatsapp: z.string().trim().max(20).optional(),
  visibility: visibilitySchema,
  // Just the checkbox's current intent — updateOwnProfile (lib/data/members.ts)
  // wraps this into a full ConsentRecord (with `at`/`noticeVersion`) at write
  // time. The form only ever needs to say yes/no, not stamp itself.
  publicListingConsent: z.boolean(),
  mdcnRenewalMonth: z.number().int().min(1).max(12).optional(),
})
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

/**
 * directoryEntries/{uid} — projected by the onMemberWrite trigger
 * (functions/src/directory-projection.ts), never written by a client. Hidden
 * fields are absent, not masked — see docs/03-DATA-MODEL.md.
 */
export const directoryEntrySchema = z.object({
  displayName: z.string(),
  department: z.string(),
  grade: gradeSchema.optional(),
  subspecialty: z.string().optional(),
  facility: z.string().optional(),
  town: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  searchTokens: z.array(z.string()),
})
export type DirectoryEntry = z.infer<typeof directoryEntrySchema>

/**
 * publicDirectory/{uid} — projected by the same onMemberWrite trigger, only
 * while publicListingConsent.granted === true. Never phone, whatsapp, or email — no
 * write path writes them here, so there's nothing to filter on read. See
 * docs/03-DATA-MODEL.md and docs/09-DECISIONS.md ADR-013/014.
 */
export const publicDirectoryEntrySchema = z.object({
  displayName: z.string(),
  department: z.string(),
  grade: gradeSchema.optional(),
  facility: z.string().optional(),
  town: z.string().optional(),
  folioNumber: z.string(),
  searchTokens: z.array(z.string()),
})
export type PublicDirectoryEntry = z.infer<typeof publicDirectoryEntrySchema>

export const newsCategorySchema = z.enum(['communique', 'news', 'advocacy', 'obituary'])
export type NewsCategory = z.infer<typeof newsCategorySchema>

export const newsCategoryLabels: Record<NewsCategory, string> = {
  communique: 'Communiqué',
  news: 'News',
  advocacy: 'Advocacy',
  obituary: 'Obituary',
}

/**
 * news/{slug} — doc ID is the slug. Write: exec only (firestore.rules).
 * lastEditedBy/lastEditedAt are set only by the edit path (PUT
 * /api/admin/news/[slug]) — absent on an item that's never been corrected
 * since it was published. Plain ISO string, not a Timestamp: written and
 * read entirely server-side via the Admin SDK, so there's no cross-SDK
 * Timestamp-class mismatch to work around by keeping it out of this schema
 * the way publishedAt is.
 */
export const newsSchema = z.object({
  title: z.string(),
  slug: z.string(),
  body: z.string(),
  excerpt: z.string(),
  author: z.string(),
  category: newsCategorySchema,
  status: z.enum(['draft', 'published']),
  lastEditedBy: z.string().optional(),
  lastEditedAt: z.string().optional(),
})
export type NewsItem = z.infer<typeof newsSchema>

/** What /admin/news/new submits — three fields, per docs/05-ROUTES.md. */
export const newsPublishInputSchema = z.object({
  title: z.string().trim().min(4, 'Enter a title').max(160),
  category: newsCategorySchema,
  body: z.string().trim().min(10, 'Enter the communiqué text').max(20000),
})
export type NewsPublishInput = z.infer<typeof newsPublishInputSchema>

/**
 * events/{slug} — doc ID is the slug. Write: exec only (firestore.rules).
 * `startAt` is the event's own date/time, not attached here — same reason
 * `publishedAt` isn't in newsSchema: Admin SDK and client SDK ship different
 * Timestamp classes, so it's attached per-file (see lib/data/events.ts).
 */
export const eventSchema = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  location: z.string(),
  status: z.enum(['draft', 'published']),
  /** Optional — unset means this event earns no CPD credit (e.g. a social
   * event). The 100 ceiling mirrors cpdEntries' own sanity bound (see
   * cpdEntryInputSchema below) — not a claimed MDCN figure. Editable after
   * publishing (PUT /api/admin/events/[slug]) — a change only affects
   * members marked attended from then on. markAttendance snapshots
   * creditUnits onto the cpdEntries doc at the moment of marking rather
   * than referencing the event live, so already-credited entries are never
   * retroactively rewritten by an edit here — see docs/03-DATA-MODEL.md. */
  cpdCreditUnits: z.number().positive().max(100).optional(),
  // See newsSchema's lastEditedBy/lastEditedAt comment — same reasoning.
  lastEditedBy: z.string().optional(),
  lastEditedAt: z.string().optional(),
})
export type EventItem = z.infer<typeof eventSchema>

/** What /admin/events/new submits. */
export const eventPublishInputSchema = z.object({
  title: z.string().trim().min(4, 'Enter a title').max(160),
  location: z.string().trim().min(2, 'Enter a location').max(160),
  startAt: z.string().trim().min(1, 'Enter a date and time'),
  description: z.string().trim().min(10, 'Enter a description').max(20000),
  cpdCreditUnits: z
    .number({ invalid_type_error: 'Enter a number' })
    .positive('Enter a positive number of credit units')
    .max(100, 'That looks too high — check the value')
    .optional(),
})
export type EventPublishInput = z.infer<typeof eventPublishInputSchema>

/**
 * broadcasts/{id} — a log, not a send queue. WhatsApp integration here is
 * free click-to-chat + the admin's own broadcast lists (docs/02-ARCHITECTURE.md);
 * there is no WhatsApp Business API in this codebase. This records that a
 * message went out and who sent it — it never transmits anything itself.
 * Write: Function only (firestore.rules — `allow write: if false`), so the
 * log can't be edited after the fact. `sentAt` isn't in this schema for the
 * same Admin-SDK-vs-client-SDK Timestamp reason as news/events.
 */
export const broadcastSchema = z.object({
  message: z.string(),
  audience: z.string(),
  sentBy: z.string(),
  channel: z.literal('whatsapp'),
})
export type Broadcast = z.infer<typeof broadcastSchema>

/** What /admin/broadcast submits to the logBroadcast Function. */
export const broadcastComposeInputSchema = z.object({
  message: z.string().trim().min(10, 'Enter the broadcast text').max(4000),
  audience: z.string().trim().min(2, 'Describe who this is for').max(120),
})
export type BroadcastComposeInput = z.infer<typeof broadcastComposeInputSchema>

/**
 * cpdEntries/{uid}/entries/{id}. dateAttended is a plain "YYYY-MM-DD" string, not a
 * Timestamp — see docs/03-DATA-MODEL.md for why. source is always "self_reported" for a
 * client-created entry; "chapter_event" entries are written only by markAttendance
 * (functions/src/registrations.ts) via the Admin SDK, and are immutable to the client
 * entirely (no update, no delete) once written — firestore.rules enforces this, not just
 * here. withdrawnAt/withdrawnBy are set only by unmarkAttendance: withdrawal never deletes
 * the entry (a member may already have printed it for MDCN — see docs/09-DECISIONS.md), it
 * marks it withdrawn instead, and only markAttendance/unmarkAttendance ever touch these.
 */
export const cpdSourceSchema = z.enum(['chapter_event', 'self_reported'])
export type CpdSource = z.infer<typeof cpdSourceSchema>

export const cpdEntrySchema = z.object({
  title: z.string(),
  provider: z.string(),
  creditUnits: z.number(),
  dateAttended: z.string(),
  certificateUrl: z.string().optional(),
  source: cpdSourceSchema,
  withdrawnAt: z.string().optional(),
  withdrawnBy: z.string().optional(),
})
export type CpdEntry = z.infer<typeof cpdEntrySchema>

/** What /portal/cpd's add-entry form submits. The 100 ceiling mirrors firestore.rules'
 * sanity bound — not a claimed MDCN figure, just an anti-fat-finger check. */
export const cpdEntryInputSchema = z.object({
  title: z.string().trim().min(2, 'Enter a title').max(160),
  provider: z.string().trim().min(2, 'Enter the provider or organiser').max(160),
  creditUnits: z
    .number({
      required_error: 'Enter the number of credit units',
      invalid_type_error: 'Enter the number of credit units',
    })
    .positive('Enter a positive number of credit units')
    .max(100, 'That looks too high — check the value'),
  dateAttended: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date'),
})
export type CpdEntryInput = z.infer<typeof cpdEntryInputSchema>

export const verificationRequestSchema = z.object({
  uid: z.string(),
  folioNumber: z.string(),
  decision: z.enum(['approve', 'reject']).optional(),
  decidedBy: z.string().optional(),
  note: z.string().nullable().optional(),
})
export type VerificationRequestData = z.infer<typeof verificationRequestSchema>

/**
 * registrations/{eventId}_{uid} — doc ID is deterministic (see
 * docs/03-DATA-MODEL.md), so double-registration is a rules-level no-op, not
 * something application code has to detect. `attended` and everything after
 * it are Function-only (markAttendance/unmarkAttendance,
 * functions/src/registrations.ts) — a client can create the initial
 * registration (verified() + own uid, firestore.rules) but every field
 * about attendance is written only by those two Functions, never a direct
 * client update, so attendance can never exist without the linked CPD entry
 * being created in the same transaction.
 */
export const registrationSchema = z.object({
  uid: z.string(),
  eventId: z.string(),
  attended: z.boolean(),
  attendanceMarkedBy: z.string().optional(),
  attendanceMarkedAt: z.string().optional(),
  attendanceUnmarkedBy: z.string().optional(),
  attendanceUnmarkedAt: z.string().optional(),
  cpdEntryId: z.string().optional(),
})
export type RegistrationData = z.infer<typeof registrationSchema>

export const jobTypeSchema = z.enum(['locum', 'permanent', 'nysc'])
export type JobType = z.infer<typeof jobTypeSchema>

export const jobTypeLabels: Record<JobType, string> = {
  locum: 'Locum',
  permanent: 'Permanent',
  nysc: 'NYSC',
}

/** Compulsory-expiry defaults (docs/06-ROADMAP.md: "a board full of dead
 * listings is worse than no board"). A locum gap is days to weeks; a
 * permanent or NYSC posting can reasonably stay up longer. `JOB_MAX_EXPIRY_DAYS`
 * is the hard cap firestore.rules enforces regardless of type — mirrored
 * here so the create form can reject an out-of-range date before the write
 * is even attempted, not just show a rules-denied error after the fact. */
export const JOB_DEFAULT_EXPIRY_DAYS: Record<JobType, number> = {
  locum: 14,
  permanent: 45,
  nysc: 45,
}
export const JOB_MAX_EXPIRY_DAYS = 60

/**
 * jobs/{id} — doc ID is auto-generated (no natural unique key). `expiresAt`
 * stays out of this schema, the same treatment events.ts gives `startAt`:
 * a Firestore Timestamp, not a string, so `firestore.rules`' and
 * `lib/data/jobs.ts`'s query-level comparisons against `request.time` /
 * `where('expiresAt', ...)` work — attached per-file instead of importing
 * the Firestore SDK's Timestamp type into this shared, SDK-free module.
 * `postedBy` and `expiresAt` are immutable once created (firestore.rules) —
 * extending a listing means reposting, not editing, which is the honest
 * signal that a role is still genuinely open, not just un-deleted
 * (docs/03-DATA-MODEL.md).
 */
export const jobSchema = z.object({
  title: z.string(),
  facility: z.string(),
  town: z.string(),
  type: jobTypeSchema,
  description: z.string(),
  contactVia: z.string(),
  postedBy: z.string(),
  status: z.enum(['active', 'filled']),
})
export type JobItem = z.infer<typeof jobSchema>

/** What /portal/jobs/new submits. `expiresAt` is a plain "YYYY-MM-DD" date
 * string here (form input), converted to a Timestamp at the point of write
 * (lib/data/jobs.ts) — same treatment as cpdEntries.dateAttended. */
export const jobPostInputSchema = z
  .object({
    title: z.string().trim().min(4, 'Enter a title').max(160),
    facility: z.string().trim().min(2, 'Enter a facility').max(160),
    town: z.string().trim().min(2, 'Enter a town').max(120),
    type: jobTypeSchema,
    description: z.string().trim().min(10, 'Enter a description').max(4000),
    contactVia: z.string().trim().min(10, 'Enter a contact number').max(20, 'That looks too long for a phone number'),
    expiresAt: z.string().trim().min(1, 'Choose an expiry date'),
  })
  .refine(
    (data) => {
      const chosen = new Date(data.expiresAt).getTime()
      const now = Date.now()
      return chosen > now && chosen <= now + JOB_MAX_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    },
    { message: `Choose a date between tomorrow and ${JOB_MAX_EXPIRY_DAYS} days out`, path: ['expiresAt'] }
  )
export type JobPostInput = z.infer<typeof jobPostInputSchema>

export const documentCategorySchema = z.enum(['guideline', 'form', 'circular'])
export type DocumentCategory = z.infer<typeof documentCategorySchema>

export const documentCategoryLabels: Record<DocumentCategory, string> = {
  guideline: 'Guideline',
  form: 'Form',
  circular: 'Circular',
}

export const DOCUMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
export const DOCUMENT_ALLOWED_CONTENT_TYPE = 'application/pdf'

/**
 * documents/{id} — metadata only, doc ID auto-generated. The file itself
 * lives in Storage at `storagePath` (guidelines/{id}/{fileName}), never
 * inline — see docs/03-DATA-MODEL.md. Written only via the Admin SDK
 * (POST /api/admin/documents); firestore.rules has no client write path for
 * this collection at all, not even isExec().
 */
export const documentSchema = z.object({
  title: z.string(),
  category: documentCategorySchema,
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  contentType: z.string(),
  storagePath: z.string(),
  uploadedBy: z.string(),
})
export type DocumentItem = z.infer<typeof documentSchema>

export const welfareCaseStatusSchema = z.enum(['open', 'in_review', 'resolved', 'declined'])
export type WelfareCaseStatus = z.infer<typeof welfareCaseStatusSchema>

export const welfareCaseStatusLabels: Record<WelfareCaseStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  resolved: 'Resolved',
  declined: 'Declined',
}

/**
 * welfareCases/{id} — doc ID is auto-generated, same reasoning as jobs/{id}.
 * `amount` is kobo, integer, absent (not zero) until an exec records a grant
 * — see docs/03-DATA-MODEL.md. `createdAt` stays out of this schema, same
 * Timestamp treatment jobs/events give theirs, attached per-file instead.
 *
 * Deliberately four fields total, including this schema's three plus
 * createdAt — no category, no free text, no clinical or family detail
 * (docs/08-NDPA-COMPLIANCE.md's "special handling: welfare data").
 */
export const welfareCaseSchema = z.object({
  requester: z.string(),
  status: welfareCaseStatusSchema,
  amount: z.number().int().nonnegative().optional(),
})
export type WelfareCase = z.infer<typeof welfareCaseSchema>
