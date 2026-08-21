/**
 * Static image bytes for satori-rendered images (folio card PNG, verify OG image).
 * Read once at module scope — see Next's "Predictable values" guidance for
 * ImageResponse assets. Downscaled to 240×240 (from the 1024px brand originals)
 * to stay well under ImageResponse's 500KB total-bundle limit.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Each path is inlined at its call site (not passed through a helper) so
// Turbopack can statically scope the filesystem access — see the "Dynamic
// filesystem access" build warning this fixes: a parameterised path traces
// the whole project into the deployed output, which a size-sensitive Spark
// project (ADR-009) can't afford.
async function toDataUrl(bytes: Buffer): Promise<string> {
  return `data:image/png;base64,${bytes.toString('base64')}`
}

const crestWhite = readFile(
  join(process.cwd(), 'src/lib/render/assets/crest-white-240.png')
).then(toDataUrl)
const crestGreen = readFile(
  join(process.cwd(), 'src/lib/render/assets/crest-green-240.png')
).then(toDataUrl)

/** White crest — for the green-deep (active) card ground. */
export function crestWhiteDataUrl(): Promise<string> {
  return crestWhite
}

/** Green crest — for the rule-strong (muted / not-current) card ground. */
export function crestGreenDataUrl(): Promise<string> {
  return crestGreen
}
