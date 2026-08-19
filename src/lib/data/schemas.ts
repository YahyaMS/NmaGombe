/**
 * Zod schemas for Firestore documents and Function inputs.
 * One schema per document shape — see CLAUDE.md conventions.
 */

import { z } from 'zod'

export const memberSignupSchema = z.object({
  displayName: z.string().trim().min(2, 'Enter your full name').max(120),
  department: z.string().trim().min(2, 'Enter your specialty or department').max(120),
  folioNumber: z.string().trim().min(2, 'Enter your folio number').max(40),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
})
export type MemberSignupInput = z.infer<typeof memberSignupSchema>

export const memberStatusSchema = z.enum(['pending', 'verified', 'rejected', 'suspended'])
export type MemberStatus = z.infer<typeof memberStatusSchema>

export const memberProfileSchema = z.object({
  displayName: z.string(),
  department: z.string(),
  folioNumber: z.string(),
  email: z.string(),
  status: memberStatusSchema,
  role: z.enum(['member', 'exec', 'admin']),
})
export type MemberProfile = z.infer<typeof memberProfileSchema>

export const verificationRequestSchema = z.object({
  uid: z.string(),
  folioNumber: z.string(),
  decision: z.enum(['approve', 'reject']).optional(),
  decidedBy: z.string().optional(),
  note: z.string().nullable().optional(),
})
export type VerificationRequestData = z.infer<typeof verificationRequestSchema>
