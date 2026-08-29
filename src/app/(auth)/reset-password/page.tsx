import type { Metadata } from 'next'
import { ResetPasswordFormLoader } from './ResetPasswordFormLoader'

export const metadata: Metadata = {
  title: 'Reset your password — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return <ResetPasswordFormLoader />
}
