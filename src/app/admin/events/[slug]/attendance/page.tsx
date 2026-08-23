import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventByIdAdmin } from '@/lib/data/eventsAdmin'
import { listRegistrantsAdmin } from '@/lib/data/registrationsAdmin'
import { AttendanceList } from './AttendanceList'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventByIdAdmin(slug)
  return {
    title: event ? `Attendance — ${event.title} — Admin — NMA Gombe` : 'Attendance — Admin — NMA Gombe',
    robots: { index: false, follow: false },
  }
}

export default async function EventAttendancePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getEventByIdAdmin(slug)
  if (!event) notFound()

  const registrants = await listRegistrantsAdmin(slug)

  return <AttendanceList event={event} registrants={registrants} />
}
