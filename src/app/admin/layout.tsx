import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { verifySession } from '@/lib/auth/session'

/**
 * Layer 2 of 2 for /admin (see src/proxy.ts for layer 1). Authoritative,
 * server-side re-check — checkRevoked: true, so a revoked/demoted admin
 * loses access immediately rather than waiting for the session cookie to expire.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const session = await verifySession(cookieStore.get('__session')?.value, { checkRevoked: true })

  if (!session) redirect('/signin')
  if (session.role !== 'admin' && session.role !== 'exec') redirect('/portal')

  return (
    <div className="flex flex-col min-h-dvh">
      <SiteHeader />
      <main id="main-content" className="flex-1">{children}</main>
    </div>
  )
}
