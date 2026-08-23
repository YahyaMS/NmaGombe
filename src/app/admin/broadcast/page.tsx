import type { Metadata } from 'next'
import { listBroadcastsAdmin } from '@/lib/data/broadcastAdminServer'
import { BroadcastView } from './BroadcastView'

export const metadata: Metadata = {
  title: 'Broadcast — Admin — NMA Gombe',
  robots: { index: false, follow: false },
}

export default async function AdminBroadcastPage() {
  const history = await listBroadcastsAdmin()
  return <BroadcastView initialHistory={history} />
}
