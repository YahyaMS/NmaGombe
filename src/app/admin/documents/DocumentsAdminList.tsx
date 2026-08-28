'use client'

/**
 * Upload form + list, one component. Posts multipart form data to
 * /api/admin/documents (not JSON — this carries the file itself), then
 * router.refresh() re-fetches the server-rendered list (page.tsx,
 * lib/data/documentsAdmin.ts). No Firebase SDK at all, same as
 * NewsAdminList/EventsAdminList — the upload goes through the Route
 * Handler, which writes to Storage via the Admin SDK.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminDocumentItem } from '@/lib/data/documentsAdmin'
import {
  documentCategorySchema,
  documentCategoryLabels,
  DOCUMENT_MAX_SIZE_BYTES,
  type DocumentCategory,
} from '@/lib/data/schemas'
import { inputStyle, labelStyle } from '@/components/ui/Field'
import { RegisterRow } from '@/components/ui/RegisterRow'

type UploadStage = 'ready' | 'uploading'
type RowAction = 'idle' | 'busy'

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: 'pointer',
} as const

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', timeZone: 'Africa/Lagos' })
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function DocumentsAdminList({ documents }: { documents: AdminDocumentItem[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<DocumentCategory>('guideline')
  const [file, setFile] = useState<File | null>(null)
  const [uploadStage, setUploadStage] = useState<UploadStage>('ready')
  const [uploadError, setUploadError] = useState('')
  const [rowAction, setRowAction] = useState<Record<string, RowAction>>({})

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setUploadError('')

    if (!title.trim()) {
      setUploadError('Enter a title.')
      return
    }
    if (!file) {
      setUploadError('Choose a PDF file.')
      return
    }
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are accepted.')
      return
    }
    if (file.size > DOCUMENT_MAX_SIZE_BYTES) {
      setUploadError(`That file is larger than the ${formatSize(DOCUMENT_MAX_SIZE_BYTES)} limit.`)
      return
    }

    setUploadStage('uploading')
    try {
      const body = new FormData()
      body.set('title', title.trim())
      body.set('category', category)
      body.set('file', file)

      const res = await fetch('/api/admin/documents', { method: 'POST', body })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Upload failed')
      }
      setTitle('')
      setFile(null)
      router.refresh()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed — try again.')
    } finally {
      setUploadStage('ready')
    }
  }

  async function handleDelete(id: string) {
    setRowAction((s) => ({ ...s, [id]: 'busy' }))
    try {
      const res = await fetch(`/api/admin/documents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      setRowAction((s) => ({ ...s, [id]: 'idle' }))
    }
  }

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '760px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>Guidelines &amp; documents</h1>

      <form onSubmit={handleUpload} className="mt-lg flex flex-col gap-sm" style={{ maxWidth: '440px' }}>
        <div>
          <label htmlFor="doc-title" className="type-small font-semibold" style={labelStyle}>Title</label>
          <input
            id="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="doc-category" className="type-small font-semibold" style={labelStyle}>Category</label>
          <select
            id="doc-category"
            value={category}
            onChange={(e) => setCategory(documentCategorySchema.parse(e.target.value))}
            style={inputStyle}
          >
            {documentCategorySchema.options.map((opt) => (
              <option key={opt} value={opt}>{documentCategoryLabels[opt]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="doc-file" className="type-small font-semibold" style={labelStyle}>
            PDF file (max {formatSize(DOCUMENT_MAX_SIZE_BYTES)})
          </label>
          <input
            id="doc-file"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={inputStyle}
          />
        </div>
        {uploadError && (
          <p className="type-small" style={{ color: 'var(--color-danger)' }}>{uploadError}</p>
        )}
        <button
          type="submit"
          disabled={uploadStage === 'uploading'}
          className="type-small font-semibold px-md py-sm"
          style={{ ...primaryButtonStyle, opacity: uploadStage === 'uploading' ? 0.6 : 1, alignSelf: 'flex-start' }}
        >
          {uploadStage === 'uploading' ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      <div className="mt-2xl" style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--spacing-md)' }}>
        {documents.length === 0 ? (
          <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
            Nothing uploaded yet.
          </p>
        ) : (
          documents.map((d, i) => (
            <RegisterRow
              key={d.id}
              index={formatDate(d.uploadedAt)}
              primary={d.title}
              secondary={`${documentCategoryLabels[d.category]} · ${formatSize(d.fileSize)}`}
              last={i === documents.length - 1}
              action={
                <button
                  type="button"
                  disabled={(rowAction[d.id] ?? 'idle') === 'busy'}
                  onClick={() => handleDelete(d.id)}
                  className="type-small"
                  style={{ color: 'var(--color-danger)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Remove
                </button>
              }
            />
          ))
        )}
      </div>
    </div>
  )
}
