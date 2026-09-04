/**
 * Downloadable folio card PNG. Server-rendered so the file the member gets is
 * identical to what /portal/card shows, and so it works on every Android
 * without a client-side canvas dependency.
 *
 * Authorisation is re-checked here, not assumed from the client having reached
 * this URL — see .claude/rules/security-rules.md rule 3. The ID token in the
 * Authorization header is verified and its `verified` custom claim checked;
 * every rendered field then comes from our own Admin SDK lookup of that same
 * uid's member doc, never from the request. A client cannot make this route
 * print a name, grade or folio number that isn't actually on file.
 */

import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { gradeLabels, type Grade } from '@/lib/data/schemas'
import { buildFolioCardElement, loadCardAssets } from '@/lib/render/folioCardImage'

export const runtime = 'nodejs'

const CARD_WIDTH = 800
const CARD_HEIGHT = Math.round(CARD_WIDTH / 1.586)

function cardFilename(displayName: string): string {
  const withoutTitle = displayName.replace(/^dr\.?\s+/i, '').trim()
  const slug = withoutTitle.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `NMA-Gombe-${slug || 'member'}.png`
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) {
    return new Response('Sign in to download your card.', { status: 401 })
  }

  let uid: string
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    if (decoded.verified !== true) {
      return new Response('Your account isn’t verified yet.', { status: 403 })
    }
    uid = decoded.uid
  } catch {
    return new Response('Sign in to download your card.', { status: 401 })
  }

  // Own record only — the uid comes from the verified token, never from the request.
  const snap = await adminDb.collection('members').doc(uid).get()
  const member = snap.data()
  if (!member) {
    return new Response('We couldn’t find your profile.', { status: 404 })
  }

  const displayName = typeof member.displayName === 'string' ? member.displayName : ''
  const folioNumber = typeof member.folioNumber === 'string' ? member.folioNumber : ''
  const verificationToken = typeof member.verificationToken === 'string' ? member.verificationToken : null
  const department = typeof member.department === 'string' ? member.department : ''
  const grade: Grade | undefined =
    typeof member.grade === 'string' && member.grade in gradeLabels
      ? (member.grade as Grade)
      : undefined
  const gradeLine = [grade ? gradeLabels[grade] : null, department].filter(Boolean).join(' · ')

  // Every verified member has had a token since ADR-027 (minted on approval,
  // backfilled for anyone verified before that). Absence here means the
  // backfill hasn't run yet — fail loudly rather than print a card whose QR
  // encodes nothing.
  if (!verificationToken) {
    return new Response('Your card isn’t ready yet. Try again shortly.', { status: 503 })
  }

  const assets = await loadCardAssets(verificationToken)
  const element = buildFolioCardElement(
    {
      name: displayName,
      grade: gradeLine || null,
      folioNumber,
      // Reaching this line already required the `verified` claim, so the card
      // is always rendered in its active state — there's no pending/muted case
      // to design for here (that's CardView's screen state, not this file).
      ground: 'active',
    },
    assets,
    CARD_WIDTH
  )

  const png = new ImageResponse(element, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: assets.fonts,
  })

  const headers = new Headers(png.headers)
  headers.set('Content-Disposition', `attachment; filename="${cardFilename(displayName)}"`)
  headers.set('Cache-Control', 'no-store')

  return new Response(png.body, { status: png.status, headers })
}
