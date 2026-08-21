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
  publicListingConsent: z.boolean().optional(),
  duesPaidThrough: z.number().optional(),
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
  publicListingConsent: z.boolean(),
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
 * while publicListingConsent === true. Never phone, whatsapp, or email — no
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

/** news/{slug} — doc ID is the slug. Write: exec only (firestore.rules). */
export const newsSchema = z.object({
  title: z.string(),
  slug: z.string(),
  body: z.string(),
  excerpt: z.string(),
  author: z.string(),
  category: newsCategorySchema,
  status: z.enum(['draft', 'published']),
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
})
export type EventItem = z.infer<typeof eventSchema>

/** What /admin/events/new submits. */
export const eventPublishInputSchema = z.object({
  title: z.string().trim().min(4, 'Enter a title').max(160),
  location: z.string().trim().min(2, 'Enter a location').max(160),
  startAt: z.string().trim().min(1, 'Enter a date and time'),
  description: z.string().trim().min(10, 'Enter a description').max(20000),
})
export type EventPublishInput = z.infer<typeof eventPublishInputSchema>

export const verificationRequestSchema = z.object({
  uid: z.string(),
  folioNumber: z.string(),
  decision: z.enum(['approve', 'reject']).optional(),
  decidedBy: z.string().optional(),
  note: z.string().nullable().optional(),
})
export type VerificationRequestData = z.infer<typeof verificationRequestSchema>
