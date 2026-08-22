import type { Metadata } from 'next'
import { CpdLog } from './CpdLog'

export const metadata: Metadata = {
  title: 'CPD log — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function CpdPage() {
  return <CpdLog />
}
