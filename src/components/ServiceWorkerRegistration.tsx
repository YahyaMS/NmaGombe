'use client'

/**
 * Registers the service worker. Must be a Client Component because it
 * calls browser APIs that don't exist on the server.
 *
 * Rendered once in the root layout inside a <Suspense> boundary.
 */

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => {
        // Service worker registration failure is non-fatal.
        // The site works without it; offline support is simply unavailable.
      })
  }, [])

  return null
}
