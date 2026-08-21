/**
 * The folio card, rendered as a static image — shared by the /portal/card download
 * route and the /verify/[folio] OG image, so both are the same artefact at
 * different sizes (design.md §6: "Build it at 2x and render it as an image for
 * download").
 *
 * satori (which ImageResponse uses under the hood) only supports flexbox and a
 * CSS subset — no design tokens, no CSS custom properties, no clamp(), no
 * fontVariationSettings. Colours below are the same hex values as
 * app/globals.css's @theme block, copied because satori can't resolve
 * `var(--color-*)`.
 */

import { cardFonts, fontFamily } from './fonts'
import { crestGreenDataUrl, crestWhiteDataUrl } from './assets'
import { verifyQrDataUrl, verifyUrlFor } from './qr'

const tokens = {
  greenDeep: '#013A1F',
  ruleStrong: '#A9B2AC',
  harmattan: '#8A5312',
  harmattanWash: '#FBF1E3',
}

export interface CardFaceData {
  name: string
  grade: string | null
  folioNumber: string
  duesYear?: string
  /** 'active' = green-deep ground (verified). 'muted' = rule-strong ground — must never look official. */
  ground: 'active' | 'muted'
  /** Full-bleed bottom bar text (pending / dues-outstanding / not-current). Omit for the plain verified card. */
  bannerText?: string
  bannerTone?: 'neutral' | 'harmattan'
}

/** Resolves the shared image/QR/font assets once, for either render entry point below. */
export async function loadCardAssets(folioNumber: string) {
  const verifyUrl = verifyUrlFor(folioNumber)
  const [fonts, crestWhite, crestGreen, qr] = await Promise.all([
    cardFonts(),
    crestWhiteDataUrl(),
    crestGreenDataUrl(),
    verifyQrDataUrl(verifyUrl),
  ])
  return { fonts, crestWhite, crestGreen, qr, verifyUrl }
}

/**
 * Builds the card element at an arbitrary pixel size (native 800×504 for the
 * download; embedded smaller on the OG canvas). All font sizes below are set
 * for the 800×504 native size and passed through a single `scale` factor.
 */
export function buildFolioCardElement(
  data: CardFaceData,
  assets: Awaited<ReturnType<typeof loadCardAssets>>,
  width: number
) {
  const scale = width / 800
  const px = (n: number) => Math.round(n * scale)
  const showDues = Boolean(data.duesYear)
  const showVerifyLine = !data.bannerText
  const crest = data.ground === 'active' ? assets.crestWhite : assets.crestGreen
  const ink = data.ground === 'active' ? '#ffffff' : 'rgba(12,26,19,0.75)'
  const inkDim = data.ground === 'active' ? 'rgba(255,255,255,0.65)' : 'rgba(12,26,19,0.55)'
  const inkFaint = data.ground === 'active' ? 'rgba(255,255,255,0.45)' : 'rgba(12,26,19,0.40)'

  return (
    <div
      style={{
        width,
        height: Math.round(width / 1.586),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        borderRadius: px(16),
        backgroundColor: data.ground === 'active' ? tokens.greenDeep : tokens.ruleStrong,
        padding: px(40),
        overflow: 'hidden',
      }}
    >
      {/* Top: crest + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: px(10) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={crest} width={px(56)} height={px(56)} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: fontFamily.mono,
              fontWeight: 500,
              fontSize: px(18),
              letterSpacing: px(1.5),
              textTransform: 'uppercase',
              color: inkDim,
            }}
          >
            Nigerian Medical Association
          </span>
          <span
            style={{
              fontFamily: fontFamily.mono,
              fontWeight: 500,
              fontSize: px(18),
              letterSpacing: px(1.5),
              textTransform: 'uppercase',
              color: inkDim,
            }}
          >
            Gombe State Chapter
          </span>
        </div>
      </div>

      {/* Middle: name + grade */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: fontFamily.display,
            fontWeight: 600,
            fontSize: px(44),
            letterSpacing: px(-0.6),
            color: ink,
          }}
        >
          {data.name}
        </span>
        {data.grade && (
          <span
            style={{
              fontFamily: fontFamily.sans,
              fontWeight: 400,
              fontSize: px(28),
              color: inkDim,
              marginTop: px(6),
            }}
          >
            {data.grade}
          </span>
        )}
      </div>

      {/* Bottom: folio + dues + QR, then the verify URL line */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: px(12) }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: px(40) }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: fontFamily.mono,
                  fontWeight: 500,
                  fontSize: px(18),
                  letterSpacing: px(1.5),
                  textTransform: 'uppercase',
                  color: inkFaint,
                  marginBottom: px(4),
                }}
              >
                Folio
              </span>
              <span
                style={{
                  fontFamily: fontFamily.mono,
                  fontWeight: 500,
                  fontSize: px(26),
                  color: ink,
                }}
              >
                {data.folioNumber}
              </span>
            </div>
            {showDues && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: fontFamily.mono,
                    fontWeight: 500,
                    fontSize: px(18),
                    letterSpacing: px(1.5),
                    textTransform: 'uppercase',
                    color: inkFaint,
                    marginBottom: px(4),
                  }}
                >
                  Dues
                </span>
                <span
                  style={{
                    fontFamily: fontFamily.mono,
                    fontWeight: 500,
                    fontSize: px(26),
                    color: ink,
                  }}
                >
                  {data.duesYear}
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              backgroundColor: '#ffffff',
              padding: px(8),
              borderRadius: px(4),
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assets.qr} width={px(96)} height={px(96)} alt="" />
          </div>
        </div>

        {showVerifyLine && (
          <span
            style={{
              fontFamily: fontFamily.mono,
              fontWeight: 500,
              fontSize: px(16),
              color: inkFaint,
            }}
          >
            {assets.verifyUrl}
          </span>
        )}
      </div>

      {/* Full-bleed banner — pending / dues-outstanding / not-current */}
      {data.bannerText && (
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor:
              data.bannerTone === 'harmattan' ? tokens.harmattan : 'rgba(0,0,0,0.14)',
            padding: `${px(8)}px ${px(40)}px`,
          }}
        >
          <span
            style={{
              fontFamily: fontFamily.mono,
              fontWeight: 500,
              fontSize: px(16),
              letterSpacing: px(1),
              textTransform: 'uppercase',
              color: data.bannerTone === 'harmattan' ? tokens.harmattanWash : ink,
            }}
          >
            {data.bannerText}
          </span>
        </div>
      )}
    </div>
  )
}
