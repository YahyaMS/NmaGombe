'use client'

/**
 * List is Firestore metadata (lib/data/documents.ts) — offline-browsable via
 * Firestore's own persistent cache, same as the rest of /portal. The file
 * itself is a separate, explicit action per document: "Save for offline"
 * fetches it once (Bearer-token authenticated, /portal/documents/[id]/download,
 * same shape as /portal/card/download) and stores the response directly in
 * the Cache Storage API under a cache name of its own (nma-guideline-files) —
 * bypassing sw.js's fetch handler entirely, which excludes /portal outright,
 * so no service-worker change was needed. Explicit per-document, not
 * automatic: these are real PDFs on a data plan CLAUDE.md already treats as
 * expensive — a member chooses what actually sits on their device.
 */

import { useEffect, useState } from 'react'
import { useVerifiedMemberGuard } from '@/lib/auth/useVerifiedMemberGuard'
import { subscribeToDocuments, type DocumentRow } from '@/lib/data/documents'
import { classifyDisconnection } from '@/lib/data/classifyDisconnection'
import { documentCategoryLabels } from '@/lib/data/schemas'
import { RegisterRow } from '@/components/ui/RegisterRow'
import { auth } from '@/lib/firebase/client'

type Stage = 'loading' | 'ready' | 'offline' | 'error'
type RowState = 'idle' | 'busy'

const GUIDELINE_CACHE = 'nma-guideline-files'

function downloadUrlFor(id: string): string {
  return `/portal/documents/${id}/download`
}

function formatDate(ts: DocumentRow['uploadedAt']): string {
  if (!ts) return '—'
  return ts.toDate().toLocaleDateString('en-NG', { day: '2-digit', month: 'short', timeZone: 'Africa/Lagos' })
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

async function fetchWithAuth(url: string): Promise<Response> {
  const user = auth.currentUser
  if (!user) throw new Error('signed-out')
  const idToken = await user.getIdToken()
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } })
  if (!res.ok) throw new Error('fetch-failed')
  return res
}

function openBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  // Deliberately not revoked immediately — the new tab needs the blob URL to
  // stay valid while it renders the PDF. The browser reclaims it when that
  // tab closes; this module doesn't track that lifecycle.
}

export function DocumentsPage() {
  const { state: guardState } = useVerifiedMemberGuard()
  const [stage, setStage] = useState<Stage>('loading')
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [savedOffline, setSavedOffline] = useState<Record<string, boolean>>({})
  const [rowState, setRowState] = useState<Record<string, RowState>>({})
  const [rowError, setRowError] = useState<Record<string, string>>({})

  useEffect(() => {
    if (guardState !== 'ready') return
    return subscribeToDocuments(
      (rows) => {
        setDocuments(rows)
        setStage('ready')
      },
      () => setStage(classifyDisconnection())
    )
  }, [guardState])

  useEffect(() => {
    if (stage !== 'ready' || typeof caches === 'undefined') return
    void caches.open(GUIDELINE_CACHE).then(async (cache) => {
      const entries = await Promise.all(
        documents.map(async (d) => [d.id, Boolean(await cache.match(downloadUrlFor(d.id)))] as const)
      )
      setSavedOffline(Object.fromEntries(entries))
    })
  }, [stage, documents])

  async function handleOpen(id: string) {
    setRowState((s) => ({ ...s, [id]: 'busy' }))
    setRowError((s) => ({ ...s, [id]: '' }))
    try {
      if (!navigator.onLine) {
        const cache = await caches.open(GUIDELINE_CACHE)
        const cached = await cache.match(downloadUrlFor(id))
        if (!cached) throw new Error('not-saved-offline')
        openBlob(await cached.blob())
      } else {
        const res = await fetchWithAuth(downloadUrlFor(id))
        openBlob(await res.blob())
      }
    } catch {
      setRowError((s) => ({
        ...s,
        [id]: navigator.onLine ? "Couldn't open — try again." : "Not saved for offline, and you're offline.",
      }))
    } finally {
      setRowState((s) => ({ ...s, [id]: 'idle' }))
    }
  }

  async function handleSaveOffline(id: string) {
    setRowState((s) => ({ ...s, [id]: 'busy' }))
    setRowError((s) => ({ ...s, [id]: '' }))
    try {
      const res = await fetchWithAuth(downloadUrlFor(id))
      const cache = await caches.open(GUIDELINE_CACHE)
      await cache.put(downloadUrlFor(id), res)
      setSavedOffline((s) => ({ ...s, [id]: true }))
    } catch {
      setRowError((s) => ({ ...s, [id]: "Couldn't save — check your connection." }))
    } finally {
      setRowState((s) => ({ ...s, [id]: 'idle' }))
    }
  }

  const shellStyle = { maxWidth: '640px' } as const

  if (guardState !== 'ready' || stage === 'loading') {
    return <div className="mx-auto px-md py-2xl" style={shellStyle} aria-live="polite" />
  }

  return (
    <div className="mx-auto px-md py-2xl" style={shellStyle}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Portal</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>Guidelines &amp; documents</h1>

      {stage === 'offline' && documents.length === 0 && (
        <p className="type-body mt-lg" style={{ color: 'var(--color-ink-2)' }}>
          The document list hasn&rsquo;t synced to this device yet, so there&rsquo;s nothing
          cached to browse. Connect once and it&rsquo;ll be available offline after that.
        </p>
      )}

      {stage === 'error' && documents.length === 0 && (
        <p className="type-body mt-lg" style={{ color: 'var(--color-ink-2)' }}>
          Something went wrong loading the document list. Reload to try again.
        </p>
      )}

      <div className="mt-lg">
        {documents.length === 0 && stage === 'ready' ? (
          <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
            Nothing published yet.
          </p>
        ) : (
          documents.map((d, i) => {
            const busy = (rowState[d.id] ?? 'idle') === 'busy'
            return (
              <div key={d.id}>
                <RegisterRow
                  index={formatDate(d.uploadedAt)}
                  primary={d.title}
                  secondary={`${documentCategoryLabels[d.category]} · ${formatSize(d.fileSize)}`}
                  last={i === documents.length - 1}
                  action={
                    <div className="flex items-center gap-sm flex-wrap justify-end">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleOpen(d.id)}
                        className="type-small font-semibold"
                        style={{ color: 'var(--color-green)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
                      >
                        Open
                      </button>
                      {savedOffline[d.id] ? (
                        <span className="type-small" style={{ color: 'var(--color-ink-3)' }}>Saved offline</span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleSaveOffline(d.id)}
                          className="type-small"
                          style={{ color: 'var(--color-ink-2)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
                        >
                          Save for offline
                        </button>
                      )}
                    </div>
                  }
                />
                {rowError[d.id] && (
                  <p className="type-small" style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-xs)' }}>
                    {rowError[d.id]}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
