'use client'

/**
 * See page.tsx — this is the client half of the smoke-test sign-in harness.
 * Reads ?token= (an Auth-emulator custom token) and ?redirect= from the URL
 * (window.location, not useSearchParams — avoids the Suspense boundary that
 * requires and keeps this a plain client component), signs in with it, then
 * calls the same establishServerSession() every real sign-in path uses.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithCustomToken } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { establishServerSession } from '@/lib/firebase/auth-email-link'

export function TestSignIn() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const redirectTo = params.get('redirect') ?? '/portal'
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('Missing token')
      return
    }
    void (async () => {
      try {
        const { user } = await signInWithCustomToken(auth, token)
        const idToken = await user.getIdToken(true)
        await establishServerSession(idToken)
        router.replace(redirectTo)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign-in failed')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <p data-testid="test-signin-status">{error ?? 'Signing in…'}</p>
}
