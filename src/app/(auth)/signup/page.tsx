import type { Metadata } from 'next'
import { SignupFormLoader } from './SignupFormLoader'

export const metadata: Metadata = {
  title: 'Join NMA Gombe',
  description: 'Create your NMA Gombe account and submit your folio number for verification.',
}

export default function SignupPage() {
  return <SignupFormLoader />
}
