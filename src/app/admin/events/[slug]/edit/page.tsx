import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventByIdAdmin } from '@/lib/data/eventsAdmin'
import { EventForm } from '@/components/admin/EventForm'

export const metadata: Metadata = {
  title: 'Edit event — Admin — NMA Gombe',
  robots: { index: false, follow: false },
}

export default async function EditEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventByIdAdmin(slug)
  if (!event) notFound()

  return (
    <EventForm
      initial={{
        slug: event.slug,
        title: event.title,
        location: event.location,
        startAt: event.startAt,
        description: event.description,
        cpdCreditUnits: event.cpdCreditUnits,
      }}
    />
  )
}
