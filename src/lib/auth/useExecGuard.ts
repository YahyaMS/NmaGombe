'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'

type GuardState = 'checking' | 'ready' | 'redirecting'

/** Shared guard for admin screens open to exec or admin — matches firestore.rules' isExec(). */
export function useExecGuard(): { state: GuardState; uid: string | null } {
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
      void user.getIdTokenResult(true).then((token) => {
        if (token.claims.role !== 'exec' && token.claims.role !== 'admin') {
          setState('redirecting')
          router.replace('/')
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
