/**
 * Uploads a clinical guideline/form/circular — multipart form data (title,
 * category, file), not JSON, since this carries the actual file bytes.
 * Same session-cookie authorisation shape as /api/admin/events, re-checked
 * here regardless of the admin layout's own gate (CLAUDE.md rule 2).
 */

import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { documentCategorySchema } from '@/lib/data/schemas'
import { createDocumentAdmin } from '@/lib/data/documentsAdmin'

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

  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const title = formData.get('title')
  const category = documentCategorySchema.safeParse(formData.get('category'))
  const file = formData.get('file')

  if (typeof title !== 'string' || title.trim().length === 0 || title.length > 160) {
    return NextResponse.json({ error: 'Enter a title' }, { status: 400 })
  }
  if (!category.success) {
    return NextResponse.json({ error: 'Choose a category' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Choose a file' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const id = await createDocumentAdmin(
      { title: title.trim(), category: category.data },
      { name: file.name, type: file.type, size: file.size, buffer },
      session.uid
    )
    return NextResponse.json({ id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
