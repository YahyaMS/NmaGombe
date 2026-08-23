import type { Metadata } from 'next'
import { listAllMembersAdmin } from '@/lib/data/membersAdminServer'
import { MembersAdminList } from './MembersAdminList'

export const metadata: Metadata = {
  title: 'Members — Admin — NMA Gombe',
  robots: { index: false, follow: false },
}

export default async function AdminMembersPage() {
  const members = await listAllMembersAdmin()
  return <MembersAdminList initialMembers={members} />
}
