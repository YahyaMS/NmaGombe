#!/usr/bin/env node
/**
 * Enforces the three JS budget tiers from CLAUDE.md / docs/09-DECISIONS.md
 * ADR-016, per route, against a production build.
 *
 * Deliberately does NOT use `next experimental-analyze`'s interactive UI —
 * ADR-016 documents why its per-route totals aren't reliable (it showed a
 * dependency, re2js, on every route that direct grep proved isn't actually
 * shipped anywhere). This instead gzips the exact chunk files Next's own
 * .next/diagnostics/route-bundle-stats.json lists as each route's first
 * load — the same method used to arrive at every number in ADR-016, so the
 * budget is checked the same way it was measured.
 *
 * Unclassified dynamic routes default to the strictest tier (public/SSR,
 * 200KB) rather than being skipped — "deny by default, widen narrowly,"
 * same principle as firestore.rules. A new authenticated or admin route
 * must be deliberately added to one of the lists below to get a looser
 * budget; forgetting to classify it fails closed, not open.
 *
 * Run after `npm run build`. Exits 1 if any route exceeds its tier.
 */

import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const STATS_PATH = path.join(ROOT, '.next/diagnostics/route-bundle-stats.json')

const KB = 1024

// ── Tier thresholds — see CLAUDE.md "Non-negotiable constraints" ───────────
const TIERS = {
  publicSsr: { maxBytes: 200 * KB, label: 'public / SSR-authenticated (≤200KB)' },
  adminCallable: { maxBytes: 250 * KB, label: 'admin, still httpsCallable (≤250KB)' },
  offline: { maxBytes: 400 * KB, label: 'offline-capable member routes (≤400KB)' },
}

// Offline tier: genuinely needs the Firestore client SDK for real offline
// capability (ADR-016). /pending is here for the same reason ADR-011 gives —
// it's the honest number; /signup's is hidden behind a dynamic import.
const OFFLINE_ROUTES = new Set([
  '/portal',
  '/portal/card',
  '/portal/card/download',
  '/portal/cpd',
  '/portal/directory',
  '/portal/directory/[uid]',
  '/portal/profile',
  '/pending',
])

// Admin routes deliberately kept on httpsCallable rather than converted to a
// Route Handler — ADR-016's asymmetry: weight accepted here to keep a single
// privileged write path, not doubled for a byte saving nobody on this route
// (a handful of exec members) would notice.
const ADMIN_CALLABLE_ROUTES = new Set([
  '/admin/verification',
  '/admin/members',
  '/admin/broadcast',
  // markAttendance/unmarkAttendance — same shape as the three above (Auth +
  // Functions via httpsCallable, not converted to a Route Handler). Classified
  // by architecture, not by current measurement: it happens to land under
  // 200KB today, but belongs in this tier regardless, or a few KB of growth
  // would fail with a confusing "public tier violated" message instead of
  // the real story.
  '/admin/events/[slug]/attendance',
])

// Not real pages, or not representative of production (see each comment) —
// excluded rather than force-fit into a tier that would misreport them.
const EXCLUDED_ROUTES = new Set([
  '/test-signin', // 404s statically in any real deploy (NEXT_PUBLIC_USE_EMULATORS is never
  // true there) — this build's measurement reflects the emulator-testing
  // config CI itself uses, not production.
])

function tierFor(route) {
  if (OFFLINE_ROUTES.has(route)) return TIERS.offline
  if (ADMIN_CALLABLE_ROUTES.has(route)) return TIERS.adminCallable
  return TIERS.publicSsr
}

function gzipBytesForRoute(chunkPaths) {
  let total = 0
  for (const chunkPath of chunkPaths) {
    const full = path.isAbsolute(chunkPath) ? chunkPath : path.join(ROOT, chunkPath)
    if (!fs.existsSync(full)) continue
    total += zlib.gzipSync(fs.readFileSync(full)).length
  }
  return total
}

function main() {
  if (!fs.existsSync(STATS_PATH)) {
    console.error(
      `Missing ${path.relative(ROOT, STATS_PATH)} — run "npm run build" first (this reads its ` +
        `diagnostics output, not a fresh build itself).`
    )
    process.exit(1)
  }

  const stats = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'))
  const failures = []
  const results = []

  for (const route of stats) {
    if (route.route.startsWith('/api/')) continue // Route Handlers ship no client JS
    if (EXCLUDED_ROUTES.has(route.route)) continue

    const tier = tierFor(route.route)
    const bytes = gzipBytesForRoute(route.firstLoadChunkPaths)
    const overBudget = bytes > tier.maxBytes
    results.push({ route: route.route, bytes, tier, overBudget })
    if (overBudget) failures.push({ route: route.route, bytes, tier })
  }

  results.sort((a, b) => b.bytes - a.bytes)
  console.log('Route'.padEnd(34) + 'Gzip KB'.padStart(10) + '  Tier')
  for (const r of results) {
    const flag = r.overBudget ? ' ✗ OVER BUDGET' : ''
    console.log(r.route.padEnd(34) + (r.bytes / KB).toFixed(1).padStart(10) + '  ' + r.tier.label + flag)
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} route(s) exceeded their tier's budget:`)
    for (const f of failures) {
      console.error(
        `  ${f.route}: ${(f.bytes / KB).toFixed(1)}KB > ${(f.tier.maxBytes / KB).toFixed(0)}KB (${f.tier.label})`
      )
    }
    console.error(
      '\nIf this route genuinely needs the Firestore client SDK for offline capability, or is an ' +
        'admin route deliberately kept on httpsCallable, add it to the matching list in this script ' +
        '— and record the reasoning in docs/09-DECISIONS.md ADR-016, the same way every existing ' +
        'entry is. Otherwise, this is a real regression: find what grew (npm run analyze) before ' +
        'widening a budget to make it pass.'
    )
    process.exit(1)
  }

  console.log('\nAll routes within their tier budget.')
}

main()
