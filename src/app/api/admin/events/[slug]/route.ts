/**
 * Edits an already-published event. Same authorisation shape as
 * /api/admin/events' POST — re-checks the session itself (CLAUDE.md rule 2),
 * since the admin layout gates the page, not this Route Handler, which is a
 * separate request.
 */

import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { eventPublishInputSchema } from '@/lib/data/schemas'
import { getEventByIdAdmin, updateEventAdmin } from '@/lib/data/eventsAdmin'

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const sessionCookie = cookieHeader.match(/(?:^|; )__session=([^;]+)/)?.[1]
  const session = await verifySession(sessionCookie, { checkRevoked: true })
  if (!session) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (session.role !== 'exec' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
  }

  const { slug } = await params
  const existing = await getEventByIdAdmin(slug)
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const parsed = eventPublishInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  await updateEventAdmin(slug, parsed.data, session.uid)
  return NextResponse.json({ slug })
}
