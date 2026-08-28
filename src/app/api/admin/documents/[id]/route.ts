/**
 * Deletes a document — removes both the Storage object and the Firestore
 * metadata doc (lib/data/documentsAdmin.ts). Same authorisation shape as
 * /api/admin/documents' POST.
 */

import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { deleteDocumentAdmin } from '@/lib/data/documentsAdmin'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  await deleteDocumentAdmin(id)
  return NextResponse.json({ id })
}
