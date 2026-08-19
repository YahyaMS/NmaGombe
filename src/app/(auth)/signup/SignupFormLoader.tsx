'use client'

import dynamic from 'next/dynamic'

// The form reads window.location and localStorage to decide its initial stage
// (fresh signup vs. returning from an email-sign-in link) — server rendering it
// would either mismatch on hydration or need to guess, so it's client-only.
// `ssr: false` requires a Client Component boundary, hence this thin wrapper.
const SignupForm = dynamic(() => import('./SignupForm').then((m) => m.SignupForm), {
  ssr: false,
})

export function SignupFormLoader() {
  return <SignupForm />
}
