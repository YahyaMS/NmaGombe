import type { Metadata } from 'next'
import { JobsBoard } from './JobsBoard'

export const metadata: Metadata = {
  title: 'Jobs & locums — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function JobsPage() {
  return <JobsBoard />
}
