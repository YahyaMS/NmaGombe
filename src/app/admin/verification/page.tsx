import type { Metadata } from 'next'
import { VerificationQueue } from './VerificationQueue'

export const metadata: Metadata = {
  title: 'Verification queue — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function VerificationPage() {
  return <VerificationQueue />
}
