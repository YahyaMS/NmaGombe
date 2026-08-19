import { SiteHeader } from '@/components/layout/SiteHeader'

/** Shared layout for /portal/*. Requires verified:true — each page guards itself client-side. */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-dvh">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  )
}
