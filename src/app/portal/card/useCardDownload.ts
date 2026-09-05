'use client'

/**
 * Shared by CardView.tsx and the /portal landing page (PortalDashboard.tsx) —
 * the download action lives in both places, so the fetch/blob/anchor-click
 * dance is written once here rather than duplicated.
 */

import { useState } from 'react'
import { auth } from '@/lib/firebase/client'

export type DownloadState = 'idle' | 'working' | 'error'

export function useCardDownload() {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle')

  async function downloadCard(displayName: string) {
    if (!navigator.onLine) {
      setDownloadState('error')
      return
    }
    setDownloadState('working')
    try {
      const user = auth.currentUser
      if (!user) throw new Error('signed-out')
      const idToken = await user.getIdToken()
      const res = await fetch('/portal/card/download', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (!res.ok) throw new Error('download-failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `NMA-Gombe-${displayName.replace(/^dr\.?\s+/i, '').trim().replace(/[^a-zA-Z0-9]+/g, '-')}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setDownloadState('idle')
    } catch {
      setDownloadState('error')
    }
  }

  return { downloadState, downloadCard }
}
