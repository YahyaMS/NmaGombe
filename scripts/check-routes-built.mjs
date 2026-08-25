#!/usr/bin/env node
/**
 * Checks the one direction docs/05-ROUTES.md can drift silently: a route
 * tagged [Built] that has no real page file behind it. Doesn't check the
 * reverse (an undocumented real page) and doesn't judge whether [Planned] vs
 * [Not started] is the right call for a given route — both are human
 * judgement, not something a file listing can verify.
 *
 * Route paths are read straight from src/app's actual file tree (page.tsx /
 * page.ts), with Next.js route-group folders — any segment wrapped in
 * parens, e.g. (public) — stripped out, since those don't appear in the URL.
 * This mirrors the audit finding that started this file: docs describing
 * behaviour that doesn't exist, caught by checking against real files
 * instead of trusting the doc.
 *
 * Run standalone (no build required — reads source files, not build output).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const APP_DIR = path.join(ROOT, 'src', 'app')
const ROUTES_DOC = path.join(ROOT, 'docs', '05-ROUTES.md')

const PAGE_FILENAMES = new Set(['page.tsx', 'page.ts'])
const ROUTE_GROUP = /^\(.*\)$/

/** Walks src/app, returns the set of real URL paths that have a page file. */
function collectBuiltRoutes(dir, segments, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const nextSegments = ROUTE_GROUP.test(entry.name) ? segments : [...segments, entry.name]
      collectBuiltRoutes(path.join(dir, entry.name), nextSegments, out)
    } else if (PAGE_FILENAMES.has(entry.name)) {
      out.add(segments.length === 0 ? '/' : '/' + segments.join('/'))
    }
  }
  return out
}

/** Extracts { paths, status } from one docs/05-ROUTES.md route line, or null. */
function parseRouteLine(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('/')) return null // continuation/wrapped description line

  const tokens = trimmed.split(/\s+/)
  const paths = []
  for (const token of tokens) {
    if (token.startsWith('/')) paths.push(token)
    else break // first non-path token ends the path list for this line
  }

  const statusMatch = trimmed.match(/\[(Built|Planned|Not started)\]/)
  if (!statusMatch) return null // route listed with no status tag yet — not this script's job to invent one

  return { paths, status: statusMatch[1] }
}

function main() {
  const builtRoutes = collectBuiltRoutes(APP_DIR, [], new Set())
  const doc = fs.readFileSync(ROUTES_DOC, 'utf8')

  const missing = []
  for (const line of doc.split('\n')) {
    const parsed = parseRouteLine(line)
    if (!parsed || parsed.status !== 'Built') continue
    for (const routePath of parsed.paths) {
      if (!builtRoutes.has(routePath)) missing.push(routePath)
    }
  }

  if (missing.length > 0) {
    console.error(`docs/05-ROUTES.md tags ${missing.length} route(s) [Built] with no page file behind them:`)
    for (const m of missing) console.error(`  ${m}`)
    console.error(
      '\nEither the page was never finished (retag as [Not started] or [Planned]), or the file ' +
        "moved and the doc wasn't updated. Don't retag to make this pass without checking which it is."
    )
    process.exit(1)
  }

  console.log(`All [Built] routes in docs/05-ROUTES.md have a real page file (${builtRoutes.size} page files found).`)
}

main()
