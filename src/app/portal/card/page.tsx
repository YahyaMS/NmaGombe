import type { Metadata } from 'next'
import { CardView } from './CardView'

export const metadata: Metadata = {
  title: 'Your folio card — NMA Gombe',
  robots: { index: false, follow: false },
}

export default function CardPage() {
  return <CardView />
}
