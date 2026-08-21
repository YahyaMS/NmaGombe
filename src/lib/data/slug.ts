/** Shared slug helpers for content collections keyed by slug (news, events). */

import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Appends -2, -3, ... until an unused doc ID is found in the given collection. */
export async function uniqueSlug(collectionPath: string, base: string, fallback: string): Promise<string> {
  let candidate = base || fallback
  let suffix = 2
  while ((await getDoc(doc(db, collectionPath, candidate))).exists()) {
    candidate = `${base || fallback}-${suffix}`
    suffix += 1
  }
  return candidate
}
