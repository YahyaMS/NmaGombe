import type { Metadata } from 'next'
import { AdminDashboard } from './AdminDashboard'

export const metadata: Metadata = {
  title: 'Admin — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function AdminHomePage() {
  return <AdminDashboard />
}
