#!/usr/bin/env node
/**
 * Runs as npm's `prebuild` hook (npm's own lifecycle convention — fires
 * automatically before `npm run build`, no wiring needed beyond the script
 * name). Substitutes public/sw.js's CACHE_VERSION constant with the
 * deploying commit's SHA, so every deploy gets a genuinely new HTML cache
 * name and the service worker's own activate-time cleanup has something to
 * do — see docs/09-DECISIONS.md ADR-018.
 *
 * Vercel sets VERCEL_GIT_COMMIT_SHA at build time. Locally (or any non-Vercel
 * build), falls back to the current git HEAD, then to a timestamp if git
 * itself isn't available. The 'dev' checked into the repo is what `next dev`
 * actually serves, since this script only ever runs as part of `next build`.
 *
 * Mutates public/sw.js in place. On Vercel this happens in an ephemeral
 * build checkout that's discarded after upload — it never touches the real
 * repo. Running `npm run build` locally does leave public/sw.js modified in
 * your working tree; that's expected, not a bug — revert it with
 * `git checkout public/sw.js` if the diff is in your way.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SW_PATH = path.resolve(__dirname, '../public/sw.js')

function resolveVersion() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12)
  try {
    return execSync('git rev-parse --short=12 HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return `ts-${Date.now()}`
  }
}

function main() {
  const version = resolveVersion()
  const src = readFileSync(SW_PATH, 'utf8')
  const pattern = /const CACHE_VERSION = '[^']*'/

  if (!pattern.test(src)) {
    console.error(`inject-sw-version: couldn't find CACHE_VERSION in ${SW_PATH} — sw.js's format changed?`)
    process.exit(1)
  }

  writeFileSync(SW_PATH, src.replace(pattern, `const CACHE_VERSION = '${version}'`))
  console.log(`inject-sw-version: public/sw.js CACHE_VERSION -> '${version}'`)
}

main()
