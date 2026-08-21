import { SiteHeader } from '@/components/layout/SiteHeader'

/** Shared layout for /admin/*. Header only — these are working screens, not marketing pages. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-dvh">
      <SiteHeader authAware />
      <main className="flex-1">{children}</main>
    </div>
  )
}
