import type { Metadata } from 'next'
import { WelfarePage } from './WelfarePage'

export const metadata: Metadata = {
  title: 'Welfare fund — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function PortalWelfarePage() {
  return <WelfarePage />
}
