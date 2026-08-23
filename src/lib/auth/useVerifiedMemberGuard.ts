'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { establishServerSession } from '@/lib/firebase/session-bridge'

type GuardState = 'checking' | 'ready' | 'redirecting'

/** Shared guard for /portal/*: signed in and verified, or redirected. */
export function useVerifiedMemberGuard(): { state: GuardState; uid: string | null } {
  const router = useRouter()
  const [state, setState] = useState<GuardState>('checking')
  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setState('redirecting')
        router.replace('/signin')
        return
      }
      void user.getIdToken(true).then(async (idToken) => {
        // Opportunistic refresh of __session (the server-side session
        // src/proxy.ts and this route's layout check) — this is the 14-day
        // cap's refresh path: every authenticated page load quietly extends
        // it, so an active member never hits the cap mid-session. Best-effort
        // here specifically — the layout already let this page load using
        // the existing cookie, so a failed refresh just means no extension
        // this visit, not an immediate problem.
        void establishServerSession(idToken).catch(() => {})
        const token = await user.getIdTokenResult()
        if (token.claims.verified !== true) {
          setState('redirecting')
          router.replace('/pending')
          return
        }
        setUid(user.uid)
        setState('ready')
      })
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { state, uid }
}
