import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { env } from '@/lib/firebase/env'
import { TestSignIn } from './TestSignIn'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Test-only sign-in harness for tests/smoke — not a product route. Exchanges
 * a pre-minted Auth-emulator custom token (see tests/smoke/global-setup.ts)
 * for a real signed-in session, using the same client sign-in and
 * establishServerSession() call every real sign-in uses, so both auth layers
 * (the client SDK's own state, and the __session cookie src/proxy.ts and the
 * /portal, /admin layouts check) end up genuinely established — not faked.
 *
 * Never reachable outside the emulator: NEXT_PUBLIC_USE_EMULATORS is never
 * true in production (see .env.example), so this 404s on every real deploy.
 */
export default function TestSignInPage() {
  if (env.NEXT_PUBLIC_USE_EMULATORS !== 'true') notFound()
  return <TestSignIn />
}
