/**
 * NMA Gombe service worker.
 *
 * Phase 0: caches the public shell so the site loads on a dead connection.
 * Phase 1 adds: directory cache, membership card, clinical guidelines.
 *
 * Cache strategy:
 *  - Shell (HTML/CSS/fonts): Cache-first with network fallback
 *  - API routes / dynamic data: Network-first with stale fallback
 *  - Personal data routes: Never cached (portal, admin)
 */

const CACHE_VERSION = 'v1'
const SHELL_CACHE   = `nma-shell-${CACHE_VERSION}`
const DATA_CACHE    = `nma-data-${CACHE_VERSION}`

// Routes that must never be served from cache — they contain personal data
const NEVER_CACHE = ['/portal', '/admin', '/api/']

// Static shell assets to pre-cache
const SHELL_ASSETS = [
  '/',
  '/about',
  '/manifest.json',
]

// ── Install ───────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  // Take control immediately; don't wait for old tabs to close
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Same-origin only; never intercept cross-origin requests
  if (url.origin !== self.location.origin) return

  // Never cache personal-data routes
  if (NEVER_CACHE.some((path) => url.pathname.startsWith(path))) return

  // Navigation requests: cache-first, network fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(SHELL_CACHE).then((c) => c.put(request, clone))
            }
            return response
          })
      )
    )
    return
  }

  // Static assets (JS, CSS, fonts, images): cache-first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(SHELL_CACHE).then((c) => c.put(request, clone))
            }
            return response
          })
      )
    )
  }
})
