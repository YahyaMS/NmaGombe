import type { Metadata } from 'next'
import { listVerificationQueueAdmin } from '@/lib/data/verificationAdmin'
import { VerificationQueue } from './VerificationQueue'

export const metadata: Metadata = {
  title: 'Verification queue — NMA Gombe',
  robots: { index: false, follow: false },
}

export default async function VerificationPage() {
  const requests = await listVerificationQueueAdmin()
  return <VerificationQueue initialRequests={requests} />
}
