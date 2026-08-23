/**
 * Edits an already-published news item. Same authorisation shape as
 * /api/admin/news' POST — re-checks the session itself (CLAUDE.md rule 2),
 * since the admin layout gates the page, not this Route Handler, which is a
 * separate request.
 */

import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { newsPublishInputSchema } from '@/lib/data/schemas'
import { getNewsByIdAdmin, updateNewsAdmin } from '@/lib/data/newsAdmin'

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
  const existing = await getNewsByIdAdmin(slug)
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const parsed = newsPublishInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  await updateNewsAdmin(slug, parsed.data, session.uid)
  return NextResponse.json({ slug })
}
