import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getNewsByIdAdmin } from '@/lib/data/newsAdmin'
import { NewsForm } from '@/components/admin/NewsForm'

export const metadata: Metadata = {
  title: 'Edit communiqué — Admin — NMA Gombe',
  robots: { index: false, follow: false },
}

export default async function EditNewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = await getNewsByIdAdmin(slug)
  if (!item) notFound()

  return (
    <NewsForm
      initial={{
        slug: item.slug,
        title: item.title,
        category: item.category,
        body: item.body,
      }}
    />
  )
}
