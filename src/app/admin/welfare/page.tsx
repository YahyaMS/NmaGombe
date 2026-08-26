import type { Metadata } from 'next'
import { listWelfareCasesAdmin } from '@/lib/data/welfareAdmin'
import { WelfareAdminList } from './WelfareAdminList'

export const metadata: Metadata = {
  title: 'Welfare — Admin — NMA Gombe',
  robots: { index: false, follow: false },
}

export default async function AdminWelfarePage() {
  const cases = await listWelfareCasesAdmin()
  return <WelfareAdminList cases={cases} />
}
