/**
 * Verify-link preview image. Before this file, every shared /verify/[token] link
 * fell back to the site-wide public/brand/og-default.jpg — every member's link
 * previewed identically. This renders that member's actual folio card instead,
 * so the WhatsApp preview is the credential, not a generic chapter logo.
 *
 * Public data only: the same fields lookupByToken already exposes on the page
 * itself (see docs/09-DECISIONS.md ADR-013, ADR-027) — nothing new is disclosed
 * here, just reformatted as an image.
 */

import { ImageResponse } from 'next/og'
import { lookupByToken } from '@/lib/data/verify'
import { gradeLabels, type Grade } from '@/lib/data/schemas'
import { buildFolioCardElement, loadCardAssets } from '@/lib/render/folioCardImage'
import { cardFonts, fontFamily } from '@/lib/render/fonts'

export const alt = 'NMA Gombe membership verification'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const GREEN_DEEP = '#013A1F'
const PAPER = '#FAFAF8'
const INK = '#0C1A13'
const INK_3 = '#5C6862'
const CARD_WIDTH = 900

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await lookupByToken(token)

  // No record at all — not a rejected/suspended member, just a token nobody
  // holds. The page itself renders this as plain "No record found" text,
  // not a card (design.md's austerity rule for this page). Rendering it as a
  // fake-looking, QR-bearing card here would claim a credibility the page
  // deliberately withholds — so this branch matches the page, not the card.
  if (!result) {
    const fonts = await cardFonts()
    return new ImageResponse(
      (
        <div
          style={{
            width: size.width,
            height: size.height,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: PAPER,
          }}
        >
          <span
            style={{
              fontFamily: fontFamily.mono,
              fontWeight: 500,
              fontSize: 20,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: INK_3,
            }}
          >
            NMA Gombe
          </span>
          <span
            style={{
              fontFamily: fontFamily.display,
              fontWeight: 600,
              fontSize: 56,
              marginTop: 20,
              color: INK,
            }}
          >
            No record found
          </span>
          <span style={{ fontFamily: fontFamily.sans, fontSize: 24, marginTop: 12, color: INK_3 }}>
            This link doesn’t match a member on file.
          </span>
        </div>
      ),
      { ...size, fonts }
    )
  }

  const isVerified = result.status === 'verified'
  const gradeLine = result.grade ? (gradeLabels[result.grade as Grade] ?? result.grade) : ''

  const assets = await loadCardAssets(token)
  const card = buildFolioCardElement(
    {
      name: result.displayName,
      grade: gradeLine || null,
      folioNumber: result.folioNumber,
      ground: isVerified ? 'active' : 'muted',
      bannerText: isVerified ? undefined : 'Not a current member',
    },
    assets,
    CARD_WIDTH
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: GREEN_DEEP,
        }}
      >
        {card}
      </div>
    ),
    { ...size, fonts: assets.fonts }
  )
}
