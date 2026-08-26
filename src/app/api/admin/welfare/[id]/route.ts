/**
 * Updates a welfare case's status and/or recorded amount. Same authorisation
 * shape as /api/admin/events/[slug] — re-checks the session itself
 * (CLAUDE.md rule 2), since the admin layout gates the page, not this Route
 * Handler, which is a separate request.
 */

import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { welfareCaseStatusSchema } from '@/lib/data/schemas'
import { updateWelfareCaseAdmin } from '@/lib/data/welfareAdmin'
import { z } from 'zod'

const updateInputSchema = z
  .object({
    status: welfareCaseStatusSchema.optional(),
    amount: z.number().int().nonnegative().optional(),
  })
  .refine((data) => data.status !== undefined || data.amount !== undefined, {
    message: 'Nothing to update',
  })

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const sessionCookie = cookieHeader.match(/(?:^|; )__session=([^;]+)/)?.[1]
  const session = await verifySession(sessionCookie, { checkRevoked: true })
  if (!session) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (session.role !== 'exec' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = updateInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  await updateWelfareCaseAdmin(id, parsed.data)
  return NextResponse.json({ id })
}
