import type { Metadata, Viewport } from 'next'
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Suspense } from 'react'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import './globals.css'

// ── Fonts — downloaded at build time; never loaded from Google CDN by the browser ──

const newsreader = Newsreader({
  subsets: ['latin'],
  axes: ['opsz'],    // optical size axis: set per use via font-variation-settings
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | NMA Gombe',
    default: 'Nigerian Medical Association — Gombe State Chapter',
  },
  description:
    'The Nigerian Medical Association, Gombe State Chapter — verified member directory, chapter resources, and professional community for doctors in Gombe State.',
  manifest: '/manifest.json',
  robots: { index: true, follow: true },
  openGraph: {
    siteName: 'NMA Gombe',
    locale: 'en_NG',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#013A1F',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={[
        newsreader.variable,
        ibmPlexSans.variable,
        ibmPlexMono.variable,
      ].join(' ')}
    >
      <body>
        {children}
        <Suspense fallback={null}>
          <ServiceWorkerRegistration />
        </Suspense>
      </body>
    </html>
  )
}
