'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
// Direct from auth.ts, not the '@/lib/firebase/client' barrel: this hook is
// now only used by the admin routes still on httpsCallable (verification,
// members, broadcast), which need auth but not Firestore — see
// docs/09-DECISIONS.md.
import { auth } from '@/lib/firebase/auth'
import { establishServerSession } from '@/lib/firebase/session-bridge'

type GuardState = 'checking' | 'ready' | 'redirecting'
type ExecRole = 'exec' | 'admin'

/** Shared guard for admin screens open to exec or admin — matches firestore.rules' isExec(). */
export function useExecGuard(): { state: GuardState; uid: string | null; role: ExecRole | null } {
  const router = useRouter()
  const [state, setState] = useState<GuardState>('checking')
  const [uid, setUid] = useState<string | null>(null)
  const [role, setRole] = useState<ExecRole | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setState('redirecting')
        router.replace('/signin')
        return
      }
      void user.getIdToken(true).then(async (idToken) => {
        // See useVerifiedMemberGuard's identical comment — this is the
        // session cookie's 14-day-cap refresh path, best-effort.
        void establishServerSession(idToken).catch(() => {})
        const token = await user.getIdTokenResult()
        if (token.claims.role !== 'exec' && token.claims.role !== 'admin') {
          setState('redirecting')
          router.replace('/portal')
          return
        }
        setUid(user.uid)
        setRole(token.claims.role)
        setState('ready')
      })
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { state, uid, role }
}
