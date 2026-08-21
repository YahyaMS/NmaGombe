import type { Metadata } from 'next'
import { SigninFormLoader } from './SigninFormLoader'

export const metadata: Metadata = {
  title: 'Sign in — NMA Gombe',
  description: 'Sign in to your NMA Gombe member account.',
}

export default function SigninPage() {
  return <SigninFormLoader />
}
