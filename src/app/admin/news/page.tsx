import type { Metadata } from 'next'
import { NewsAdminList } from './NewsAdminList'

export const metadata: Metadata = {
  title: 'News — Admin — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function AdminNewsPage() {
  return <NewsAdminList />
}
