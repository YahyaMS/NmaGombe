import type { Metadata } from 'next'
import { listDocumentsAdmin } from '@/lib/data/documentsAdmin'
import { DocumentsAdminList } from './DocumentsAdminList'

export const metadata: Metadata = {
  title: 'Guidelines & documents — Admin — NMA Gombe',
  robots: { index: false, follow: false },
}

export default async function AdminDocumentsPage() {
  const documents = await listDocumentsAdmin()
  return <DocumentsAdminList documents={documents} />
}
