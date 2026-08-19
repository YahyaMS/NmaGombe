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

export const verificationRequestSchema = z.object({
  uid: z.string(),
  folioNumber: z.string(),
  decision: z.enum(['approve', 'reject']).optional(),
  decidedBy: z.string().optional(),
  note: z.string().nullable().optional(),
})
export type VerificationRequestData = z.infer<typeof verificationRequestSchema>
