/**
 * Publishes an event. Same conversion and reasoning as /api/admin/news.
 */

import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { eventPublishInputSchema } from '@/lib/data/schemas'
import { publishEventAdmin } from '@/lib/data/eventsAdmin'

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const sessionCookie = cookieHeader.match(/(?:^|; )__session=([^;]+)/)?.[1]
  const session = await verifySession(sessionCookie, { checkRevoked: true })
  if (!session) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (session.role !== 'exec' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = eventPublishInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const slug = await publishEventAdmin(parsed.data)
  return NextResponse.json({ slug })
}
