import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // firebase-admin's auth module pulls in jwks-rsa -> jose, which ships
  // ESM-only. Turbopack's server bundling require()s it anyway and breaks
  // (ERR_REQUIRE_ESM) — only surfaces in Vercel's serverless bundling, not
  // local `next start`, since that runs against the real node_modules
  // directly. Excluding firebase-admin from bundling makes it resolve via
  // Node's own module loader at runtime instead.
  serverExternalPackages: ['firebase-admin'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Cache PWA assets aggressively
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      // The opposite of manifest.json, deliberately: the service worker
      // script must never be cached by the browser's own HTTP cache, or a
      // fix to it (like this one) never reaches anyone. Browsers already
      // re-check sw.js periodically regardless of headers, but "periodically"
      // isn't "now" — see docs/09-DECISIONS.md ADR-018.
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
    ]
  },

  // Never send personal-data routes to search engines — belt and middleware-braces
  async rewrites() {
    return []
  },
}

export default nextConfig
