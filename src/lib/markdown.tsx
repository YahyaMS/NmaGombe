/**
 * Minimal markdown-subset renderer for news bodies — paragraphs, **bold**,
 * [links](url), and `- ` lists. Not a general markdown parser: communiqués
 * don't need tables, code blocks or footnotes, and this is ~40 lines instead
 * of a dependency (CLAUDE.md: "prefer 30 lines of our own code over a 40KB
 * package"). Renders server-side only (news pages are Server Components), so
 * it never touches the client bundle either way.
 */

import type { ReactNode } from 'react'

const INLINE_PATTERN = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0

  INLINE_PATTERN.lastIndex = 0
  while ((match = INLINE_PATTERN.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${i++}`}>{match[1]}</strong>)
    } else {
      nodes.push(
        <a
          key={`${keyPrefix}-${i++}`}
          href={match[3]}
          style={{ color: 'var(--color-green)', textDecoration: 'underline' }}
        >
          {match[2]}
        </a>
      )
    }
    lastIndex = INLINE_PATTERN.lastIndex
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

export function renderMarkdown(body: string): ReactNode {
  const blocks = body.trim().split(/\n\s*\n/)

  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
        const isList = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l))

        if (isList) {
          return (
            <ul key={i} className="type-body mt-md" style={{ paddingLeft: '1.5em' }}>
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.replace(/^[-*]\s+/, ''), `${i}-${j}`)}</li>
              ))}
            </ul>
          )
        }

        return (
          <p key={i} className="type-body mt-md">
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {renderInline(line, `${i}-${j}`)}
              </span>
            ))}
          </p>
        )
      })}
    </>
  )
}
