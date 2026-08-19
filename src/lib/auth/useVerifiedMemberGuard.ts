'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'

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
        router.replace('/signup')
        return
      }
      void user.getIdTokenResult(true).then((token) => {
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
