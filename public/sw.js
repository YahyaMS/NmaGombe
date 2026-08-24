/**
 * NMA Gombe service worker.
 *
 * Cache strategy — see docs/09-DECISIONS.md ADR-018 for the full reasoning:
 *  - Navigation (HTML documents): network-first, cache only as an offline
 *    fallback. An HTML document is not immutable — serving it cache-first
 *    means serving stale pages by design, which is exactly the bug this
 *    version fixes. Every real network response wins over whatever's cached.
 *  - Static assets (JS/CSS/fonts/images): cache-first. Next.js content-hashes
 *    these filenames, so a changed file is a *new* URL, never a stale hit —
 *    cache-first here is correct and needs no versioning.
 *  - Personal-data routes (/portal, /admin, /api/): never touched by this
 *    worker at all — untouched by this fix, and the one thing that was
 *    already right.
 *
 * CACHE_VERSION is substituted at build time (scripts/inject-sw-version.mjs,
 * run as npm's prebuild hook) with the deploying commit's SHA, so every
 * deploy gets a genuinely new HTML cache name and the activate handler's
 * cleanup below actually has something to do. 'dev' is the checked-in
 * default for local `next dev`, where the prebuild step never runs.
 */

const CACHE_VERSION = 'dev'
const HTML_CACHE = `nma-html-${CACHE_VERSION}`
// Not versioned, and never purged on activate — content-hashed filenames
// make staleness impossible here, and purging it on every deploy risks a
// tab that's still running the previous version requesting a chunk whose
// cache entry was just deleted out from under it.
const ASSET_CACHE = 'nma-assets'

// Routes that must never be touched by this worker — they contain personal
// data. Requests here are not intercepted at all; the browser handles them
// exactly as if no service worker were installed.
const NEVER_CACHE = ['/portal', '/admin', '/api/']

// Precached at install so the app shell has something to fall back to on a
// dead connection before any online visit — used only as the network-first
// fallback below, never to mask a live response.
const SHELL_ASSETS = ['/', '/about', '/manifest.json']

// ── Install ───────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(HTML_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)))
  // Take control immediately; don't wait for old tabs to close — a phone
  // that keeps a tab open for days would otherwise sit on the old worker
  // that long. See ADR-018 for why this is safe with a network-first HTML
  // strategy: a still-running old tab keeps working off its already-loaded
  // JS, and the untouched, unversioned ASSET_CACHE means it can still
  // resolve any chunk URL that JS asks for.
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          // Only ever purges old-versioned HTML caches. ASSET_CACHE is
          // deliberately exempt — see its own comment above.
          .filter((k) => k.startsWith('nma-html-') && k !== HTML_CACHE)
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

  // Never touch personal-data routes
  if (NEVER_CACHE.some((path) => url.pathname.startsWith(path))) return

  // Navigation requests: network-first. Cache is a fallback for being
  // offline, never the primary source for a page that's reachable.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(HTML_CACHE).then((c) => c.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached ?? Response.error()))
    )
    return
  }

  // Static assets (JS, CSS, fonts, images): cache-first — safe because the
  // filename itself changes when the content does.
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
              caches.open(ASSET_CACHE).then((c) => c.put(request, clone))
            }
            return response
          })
      )
    )
  }
})
