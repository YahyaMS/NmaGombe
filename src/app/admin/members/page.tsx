import type { Metadata } from 'next'
import { MembersAdminList } from './MembersAdminList'

export const metadata: Metadata = {
  title: 'Members — Admin — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function AdminMembersPage() {
  return <MembersAdminList />
}
