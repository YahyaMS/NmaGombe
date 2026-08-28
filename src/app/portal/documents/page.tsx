import type { Metadata } from 'next'
import { DocumentsPage } from './DocumentsPage'

export const metadata: Metadata = {
  title: 'Guidelines & documents — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function PortalDocumentsPage() {
  return <DocumentsPage />
}
