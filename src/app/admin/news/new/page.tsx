import type { Metadata } from 'next'
import { NewsForm } from './NewsForm'

export const metadata: Metadata = {
  title: 'New communiqué — Admin — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function NewNewsPage() {
  return <NewsForm />
}
