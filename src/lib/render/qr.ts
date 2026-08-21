/**
 * Real QR generation for the folio card PNG and verify OG image — replaces the
 * decorative placeholder pattern in components/ui/FolioCard.tsx (that one still
 * needs its own fix; see the PR description for why it's out of scope here).
 */

import QRCode from 'qrcode'

/** design.md §6: "QR quiet zone is a minimum of 4 modules on white. Never place the QR on green." */
export async function verifyQrDataUrl(verifyUrl: string): Promise<string> {
  return QRCode.toDataURL(`https://${verifyUrl}`, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 256,
    color: { dark: '#013A1F', light: '#FFFFFF' },
  })
}

/** Same hyphen-for-slash encoding FolioCard.tsx already uses on its back face. */
export function verifyUrlFor(folioNumber: string): string {
  return `nmagombe.org.ng/verify/${folioNumber.replace(/\//g, '-')}`
}
