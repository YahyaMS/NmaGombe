import type { Metadata } from 'next'
import { EventForm } from './EventForm'

export const metadata: Metadata = {
  title: 'New event — Admin — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function NewEventPage() {
  return <EventForm />
}
