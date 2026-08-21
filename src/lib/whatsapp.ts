/**
 * wa.me / tel: link construction for the directory's one-tap contact actions.
 *
 * `phone`/`whatsapp` are freeform text in ProfileForm (no format enforcement),
 * so a raw Nigerian local number ("0803...") would produce a broken wa.me
 * link. Best-effort normalise to E.164; if that can't be done confidently,
 * return null so the caller omits the action rather than ship a dead link.
 *
 * WhatsApp's rolling out contact-by-username (no phone number needed) — see
 * PR discussion. Not adopted here: Nigeria isn't in the rollout yet (wave
 * covering the rest of the world starts September 2026), phone-based wa.me
 * links keep working regardless, and there's no confirmed username deep-link
 * format in WhatsApp's own docs to build against without guessing.
 */

export function whatsAppLink(rawPhone: string): string | null {
  const digits = normaliseNigerianPhone(rawPhone)
  return digits ? `https://wa.me/${digits}` : null
}

export function telLink(rawPhone: string): string | null {
  const digits = normaliseNigerianPhone(rawPhone)
  return digits ? `tel:+${digits}` : null
}

function normaliseNigerianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')

  if (digits.startsWith('234') && digits.length === 13) return digits
  if (digits.startsWith('0') && digits.length === 11) return `234${digits.slice(1)}`
  if (digits.length === 10) return `234${digits}`

  return null
}
