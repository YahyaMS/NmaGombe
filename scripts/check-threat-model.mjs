#!/usr/bin/env node
/**
 * Checks the one direction docs/03-DATA-MODEL.md's threat-model table can
 * drift silently: a control tagged exactly "Implemented" with no real test
 * file behind it. Doesn't judge whether "Intended" vs "Implemented
 * (architectural)" is the right call for a given row — that's human
 * judgement, not something a file listing can verify. Same principle as
 * check-routes-built.mjs for 05-ROUTES.md's [Built] tags.
 *
 * This exists because an audit found this exact section asserting controls
 * (App Check enforcement, rate-limited search) that were never built, and
 * named it the project's most reliable source of error — see
 * docs/09-DECISIONS.md ADR-031.
 *
 * Run standalone (no build required — reads source files, not build output).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_MODEL_DOC = path.join(ROOT, 'docs', '03-DATA-MODEL.md')

/** One markdown table row's cells, trimmed. Null if the line isn't a table row. */
function parseTableRow(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null
  const cells = trimmed
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim())
  if (cells.every((c) => /^:?-+:?$/.test(c))) return null // the |---|---|---| separator row
  return cells
}

/** Every backtick-quoted path in a cell, e.g. "`a.ts`, `b.ts`" -> ['a.ts', 'b.ts']. */
function extractPaths(cell) {
  const matches = [...cell.matchAll(/`([^`]+)`/g)]
  return matches.map((m) => m[1])
}

function main() {
  const doc = fs.readFileSync(DATA_MODEL_DOC, 'utf8')
  const lines = doc.split('\n')

  let header = null
  const rows = []
  for (const line of lines) {
    const cells = parseTableRow(line)
    if (!cells) continue
    if (!header && cells[0] === 'Control') {
      header = cells
      continue
    }
    if (header) rows.push(cells)
  }

  if (!header) {
    console.error("docs/03-DATA-MODEL.md: no threat-model table found (expected a header row starting with 'Control').")
    process.exit(1)
  }

  const statusCol = header.indexOf('Status')
  const proofCol = header.indexOf('Proof')
  if (statusCol === -1 || proofCol === -1) {
    console.error("docs/03-DATA-MODEL.md: threat-model table is missing a 'Status' or 'Proof' column.")
    process.exit(1)
  }

  const failures = []
  for (const row of rows) {
    const control = row[0]
    const status = row[statusCol]
    if (status !== 'Implemented') continue // "Implemented (architectural)" and "Intended" are not checked here

    const paths = extractPaths(row[proofCol] ?? '')
    if (paths.length === 0) {
      failures.push(`"${control}" is tagged Implemented with no test file named in Proof.`)
      continue
    }
    for (const p of paths) {
      if (!fs.existsSync(path.join(ROOT, p))) {
        failures.push(`"${control}" is tagged Implemented but its named proof \`${p}\` does not exist.`)
      }
    }
  }

  if (failures.length > 0) {
    console.error(`docs/03-DATA-MODEL.md's threat-model table has ${failures.length} unproven "Implemented" claim(s):`)
    for (const f of failures) console.error(`  ${f}`)
    console.error(
      '\nEither the test exists under a different path (fix the Proof cell), or the control isn\'t ' +
        "actually built yet (retag as Intended). Don't retag to make this pass without checking which it is."
    )
    process.exit(1)
  }

  console.log(`All ${rows.filter((r) => r[statusCol] === 'Implemented').length} "Implemented" threat-model controls have a real test file behind them.`)
}

main()
