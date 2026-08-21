import type { Metadata } from 'next'
import { EventsAdminList } from './EventsAdminList'

export const metadata: Metadata = {
  title: 'Events — Admin — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function AdminEventsPage() {
  return <EventsAdminList />
}
