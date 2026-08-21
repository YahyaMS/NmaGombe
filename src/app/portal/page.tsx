import type { Metadata } from 'next'
import { PortalDashboard } from './PortalDashboard'

export const metadata: Metadata = {
  title: 'Portal — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function PortalPage() {
  return <PortalDashboard />
}
