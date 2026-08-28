/**
 * Streams a guideline/form/circular's file bytes. Same authorisation shape
 * as /portal/card/download — Bearer <ID token>, re-checked here, not just
 * gated by the /portal layout. Deliberately not a Storage getDownloadURL():
 * see docs/09-DECISIONS.md ADR-022. Every request re-verifies `verified`,
 * so there is no standing link that keeps working after a member is
 * unverified or removed.
 */

import { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { getDocumentFileAdmin } from '@/lib/data/documentsAdmin'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get('authorization')
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) {
    return new Response('Sign in to download this file.', { status: 401 })
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    if (decoded.verified !== true) {
      return new Response('Your account isn’t verified yet.', { status: 403 })
    }
  } catch {
    return new Response('Sign in to download this file.', { status: 401 })
  }

  const { id } = await params
  const file = await getDocumentFileAdmin(id)
  if (!file) {
    return new Response('Not found.', { status: 404 })
  }

  return new Response(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${file.fileName}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
