import type { Metadata } from 'next'
import { BroadcastView } from './BroadcastView'

export const metadata: Metadata = {
  title: 'Broadcast — Admin — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function AdminBroadcastPage() {
  return <BroadcastView />
}
