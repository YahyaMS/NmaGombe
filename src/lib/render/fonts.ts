/**
 * Font buffers for satori-rendered images (folio card PNG, verify OG image).
 *
 * next/font/google self-hosts fonts into .next/ build output for the browser but
 * doesn't expose loadable buffers — ImageResponse needs raw ttf/otf/woff bytes
 * (see docs/09-DECISIONS.md-adjacent note: confirmed against
 * node_modules/next/dist/docs/01-app/03-api-reference/04-functions/image-response.md).
 * These are static (non-variable) instances of the same three design.md §3 faces,
 * subset to Latin + Latin-1 Supplement to stay well under the 500KB ImageResponse
 * bundle limit. Read once at module scope per Next's "Predictable values" guidance.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const dir = join(process.cwd(), 'src/lib/render/fonts')

const plexSansRegular = readFile(join(dir, 'IBMPlexSans-Regular.ttf'))
const plexSansSemiBold = readFile(join(dir, 'IBMPlexSans-SemiBold.ttf'))
const plexMonoMedium = readFile(join(dir, 'IBMPlexMono-Medium.ttf'))
const newsreaderSemiBold = readFile(join(dir, 'Newsreader-SemiBold.ttf'))

export const fontFamily = {
  sans: 'IBM Plex Sans',
  mono: 'IBM Plex Mono',
  display: 'Newsreader',
} as const

/** ImageResponse's `fonts[].data` wants a real ArrayBuffer, not a Node Buffer view. */
function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

export async function cardFonts(): Promise<
  { name: string; data: ArrayBuffer; weight: 400 | 500 | 600; style: 'normal' }[]
> {
  const [sansRegular, sansSemiBold, monoMedium, displaySemiBold] = await Promise.all([
    plexSansRegular,
    plexSansSemiBold,
    plexMonoMedium,
    newsreaderSemiBold,
  ])

  return [
    { name: fontFamily.sans, data: toArrayBuffer(sansRegular), weight: 400, style: 'normal' },
    { name: fontFamily.sans, data: toArrayBuffer(sansSemiBold), weight: 600, style: 'normal' },
    { name: fontFamily.mono, data: toArrayBuffer(monoMedium), weight: 500, style: 'normal' },
    { name: fontFamily.display, data: toArrayBuffer(displaySemiBold), weight: 600, style: 'normal' },
  ]
}
