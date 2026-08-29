'use client'

import dynamic from 'next/dynamic'

// Loaded client-side only, and this is a budget decision rather than a
// rendering one: a static import would put firebase/auth in this route's
// first-load JS, and /reset-password is in the ≤200KB public tier (CLAUDE.md,
// docs/09-DECISIONS.md ADR-016). Behind dynamic(), the SDK arrives as its own
// chunk after hydration and the route's first load stays at the framework
// floor. `ssr: false` requires a Client Component boundary, hence this wrapper.
const ResetPasswordForm = dynamic(() => import('./ResetPasswordForm').then((m) => m.ResetPasswordForm), {
  ssr: false,
})

export function ResetPasswordFormLoader() {
  return <ResetPasswordForm />
}
