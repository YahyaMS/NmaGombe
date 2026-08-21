/**
 * Client-SDK access to news/ for the admin (exec) side — creating and listing.
 * Public reads go through lib/data/news.ts (Admin SDK) instead — see that
 * file for why. firestore.rules gates writes to isExec(); this file doesn't
 * re-check that itself, the rules are the boundary (same as broadcasts, duesRates).
 */

import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { newsPublishInputSchema, newsSchema, type NewsItem, type NewsPublishInput } from './schemas'
import { slugify, uniqueSlug } from './slug'

// See lib/data/news.ts's PublicNewsItem comment — Timestamp isn't in the shared schema.
export interface AdminNewsItem extends NewsItem {
  publishedAt: Timestamp | null
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

/** Single-step create-and-publish — no separate draft workflow (docs/05-ROUTES.md: "three fields and a publish button"). */
export async function publishNews(input: NewsPublishInput, author: string): Promise<string> {
  const parsed = newsPublishInputSchema.parse(input)
  const slug = await uniqueSlug('news', slugify(parsed.title), 'communique')

  await setDoc(doc(db, 'news', slug), {
    title: parsed.title,
    slug,
    body: parsed.body,
    excerpt: excerptOf(parsed.body),
    author,
    category: parsed.category,
    status: 'published',
    publishedAt: serverTimestamp(),
  })

  return slug
}

/**
 * The exec's own view, newest first. Everything published through this file is
 * status:'published' immediately (no draft step in v1 — see publishNews), but
 * the query itself isn't filtered by status, so it won't need a change if a
 * draft workflow is added later.
 */
export async function listAllNews(): Promise<AdminNewsItem[]> {
  const snap = await getDocs(query(collection(db, 'news'), orderBy('publishedAt', 'desc')))
  const items: AdminNewsItem[] = []
  for (const d of snap.docs) {
    const data = d.data()
    const parsed = newsSchema.safeParse(data)
    if (parsed.success) items.push({ ...parsed.data, publishedAt: (data.publishedAt as Timestamp) ?? null })
  }
  return items
}
