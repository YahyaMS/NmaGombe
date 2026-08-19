import type { Metadata } from 'next'
import { PendingStatus } from './PendingStatus'

export const metadata: Metadata = {
  title: 'Verification pending — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function PendingPage() {
  return <PendingStatus />
}
