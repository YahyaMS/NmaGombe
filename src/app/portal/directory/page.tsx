import type { Metadata } from 'next'
import { DirectoryView } from './DirectoryView'

export const metadata: Metadata = {
  title: 'Directory — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function DirectoryPage() {
  return <DirectoryView />
}
