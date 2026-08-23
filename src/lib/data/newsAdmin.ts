/**
 * Server-only. Admin-SDK access to news/ for the exec admin side — listing
 * and publishing. Converted from a client-Firestore-rules-enforced write to
 * this (docs/09-DECISIONS.md ADR-0XX): no Cloud Function ever wrote here, so
 * there's no second privileged write path being created — the Route Handler
 * (src/app/api/admin/news/route.ts) is now the only way this collection is
 * written, and it re-checks isExec() itself (CLAUDE.md rule 2).
 *
 * IMPORTANT: the Admin SDK bypasses firestore.rules entirely. Every export
 * here is called only from the Route Handler, which has already verified
 * the caller is exec/admin — this file does not re-check itself.
 *
 * NEVER import this from a Client Component.
 */

import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { newsPublishInputSchema, newsSchema, type NewsItem, type NewsPublishInput } from './schemas'
import { slugify } from './slug'

export interface AdminNewsItem extends NewsItem {
  publishedAt: string | null
}

const EXCERPT_LENGTH = 160

// Strips the same markdown subset lib/markdown.tsx renders, so the excerpt
// reads as plain text instead of literal "**bold**" / "[text](url)" syntax.
function excerptOf(body: string): string {
  const plain = body
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .trim()
    .replace(/\s+/g, ' ')
  return plain.length > EXCERPT_LENGTH ? `${plain.slice(0, EXCERPT_LENGTH).trimEnd()}…` : plain
}

/** Appends -2, -3, ... until an unused doc ID is found. Mirrors lib/data/slug.ts's client version. */
async function uniqueSlugAdmin(collectionPath: string, base: string, fallback: string): Promise<string> {
  let candidate = base || fallback
  let suffix = 2
  while ((await adminDb.collection(collectionPath).doc(candidate).get()).exists) {
    candidate = `${base || fallback}-${suffix}`
    suffix += 1
  }
  return candidate
}

/** Single-step create-and-publish — no separate draft workflow (docs/05-ROUTES.md). */
export async function publishNewsAdmin(input: NewsPublishInput, author: string): Promise<string> {
  const parsed = newsPublishInputSchema.parse(input)
  const slug = await uniqueSlugAdmin('news', slugify(parsed.title), 'communique')

  await adminDb
    .collection('news')
    .doc(slug)
    .set({
      title: parsed.title,
      slug,
      body: parsed.body,
      excerpt: excerptOf(parsed.body),
      author,
      category: parsed.category,
      status: 'published',
      publishedAt: new Date(),
    })

  return slug
}

/**
 * The exec's own view, newest first. Everything published through this file is
 * status:'published' immediately (no draft step in v1 — see publishNewsAdmin),
 * but the query itself isn't filtered by status, so it won't need a change if
 * a draft workflow is added later.
 */
export async function listAllNewsAdmin(): Promise<AdminNewsItem[]> {
  const snap = await adminDb.collection('news').orderBy('publishedAt', 'desc').get()
  const items: AdminNewsItem[] = []
  for (const d of snap.docs) {
    const data = d.data()
    const parsed = newsSchema.safeParse(data)
    if (!parsed.success) continue
    const publishedAt = data.publishedAt as FirebaseFirestore.Timestamp | undefined
    items.push({ ...parsed.data, publishedAt: publishedAt ? publishedAt.toDate().toISOString() : null })
  }
  return items
}
