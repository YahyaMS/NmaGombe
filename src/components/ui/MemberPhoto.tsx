/**
 * Circular photo-or-initials, reused everywhere a member's profile photo can
 * appear (directory list/detail, /doctors, /portal/profile's own preview) —
 * same visual language as /executives' ExecPhoto, not a new pattern. Src is
 * always /api/profile-photo/{uid} — never a Storage URL — so an
 * out-of-consent photo simply 404s and callers fall back to initials.
 */

function initialsOf(name: string): string {
  const words = name.replace(/^dr\.?\s+/i, '').trim().split(/\s+/)
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

export function MemberPhoto({
  uid,
  hasPhoto,
  displayName,
  size,
}: {
  uid: string
  hasPhoto?: boolean
  displayName: string
  size: number
}) {
  if (hasPhoto) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- served by our own Route Handler, not optimizable/cacheable the way next/image expects (visibility can change request to request) */}
        <img
          src={`/api/profile-photo/${uid}`}
          alt=""
          width={size}
          height={size}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: 'var(--color-green-deep)',
        color: 'rgba(255,255,255,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: `${Math.round(size * 0.32)}px`,
        fontWeight: 500,
        letterSpacing: '0.04em',
      }}
    >
      {initialsOf(displayName)}
    </div>
  )
}
