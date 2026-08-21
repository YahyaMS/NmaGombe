'use client'

import dynamic from 'next/dynamic'

// The form reads window.location and localStorage to decide its initial stage
// (fresh request vs. returning from an email-sign-in link) — server rendering it
// would either mismatch on hydration or need to guess, so it's client-only.
// `ssr: false` requires a Client Component boundary, hence this thin wrapper.
const SigninForm = dynamic(() => import('./SigninForm').then((m) => m.SigninForm), {
  ssr: false,
})

export function SigninFormLoader() {
  return <SigninForm />
}
