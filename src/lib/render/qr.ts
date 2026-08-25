/**
 * Real QR generation, shared by the folio card (on-screen, in
 * components/ui/FolioCard.tsx) and its downloadable PNG / the verify OG
 * image (lib/render/folioCardImage.tsx) — one implementation, so there's a
 * single place to be right about what the QR actually encodes.
 *
 * The `qrcode` package has a browser build (its package.json's "browser"
 * field maps the entry point to lib/browser.js), so this file works
 * unmodified from either a Server Component/Route Handler or a Client
 * Component — no server-only guard here on purpose.
 */

import QRCode from 'qrcode'
import { env } from '@/lib/firebase/env'

/** design.md §6: "QR quiet zone is a minimum of 4 modules on white. Never place the QR on green." */
export async function verifyQrDataUrl(verifyUrl: string): Promise<string> {
  return QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 256,
    color: { dark: '#013A1F', light: '#FFFFFF' },
  })
}

/**
 * Absolute /verify/[folio] URL, built from NEXT_PUBLIC_SITE_URL — never a
 * hardcoded host. A QR that's technically real but encodes a domain that
 * doesn't resolve is the same practical failure as no QR at all.
 *
 * NEXT_PUBLIC_SITE_URL is currently Vercel's own stable alias
 * (nma-gombe-tau.vercel.app), not yet the chapter's real domain (still open
 * — docs/00-INTAKE.md item 19) — see docs/09-DECISIONS.md ADR-019 for why
 * that's an accepted, deliberate state for the on-screen/downloadable card
 * specifically, and why it would NOT be acceptable for a physically printed
 * one.
 */
export function verifyUrlFor(folioNumber: string): string {
  return new URL(`/verify/${folioNumber.replace(/\//g, '-')}`, env.NEXT_PUBLIC_SITE_URL).toString()
}
