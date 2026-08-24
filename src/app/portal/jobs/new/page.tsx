import type { Metadata } from 'next'
import { JobForm } from './JobForm'

export const metadata: Metadata = {
  title: 'Post a listing — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function NewJobPage() {
  return <JobForm />
}
