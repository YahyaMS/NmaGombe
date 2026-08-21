import type { Metadata } from 'next'
import { DirectoryDetailView } from './DirectoryDetailView'

export const metadata: Metadata = {
  title: 'Colleague — NMA Gombe',
  robots: { index: false, follow: false },
}

export default async function DirectoryDetailPage({
  params,
}: {
  params: Promise<{ uid: string }>
}) {
  const { uid } = await params
  return <DirectoryDetailView uid={uid} />
}
