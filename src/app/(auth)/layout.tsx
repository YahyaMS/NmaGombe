import { SiteHeader } from '@/components/layout/SiteHeader'

/**
 * Shared layout for signup/signin/pending. Header only, no footer —
 * these are conversion-critical pages; nothing should compete for attention.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-dvh">
      <SiteHeader />
      <main id="main-content" className="flex-1">{children}</main>
    </div>
  )
}
