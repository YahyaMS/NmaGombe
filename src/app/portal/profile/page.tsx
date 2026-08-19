import type { Metadata } from 'next'
import { ProfileForm } from './ProfileForm'

export const metadata: Metadata = {
  title: 'Your profile — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function ProfilePage() {
  return <ProfileForm />
}
