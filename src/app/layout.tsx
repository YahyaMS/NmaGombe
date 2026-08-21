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
  // || not ?? — an unset var is undefined, but Vercel/CI can also hand this an
  // empty string, which isn't nullish and would otherwise reach new URL('').
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://nmagombe.org.ng'
  ),
  title: {
    template: '%s | NMA Gombe',
    default: 'Nigerian Medical Association — Gombe State Chapter',
  },
  description:
    'The Nigerian Medical Association, Gombe State Chapter — verified member directory, chapter resources, and professional community for doctors in Gombe State.',
  manifest: '/manifest.json',
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/brand/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/icon-192.png',   sizes: '192x192', type: 'image/png' },
    ],
    apple: '/brand/apple-touch-icon.png',
    other: [{ rel: 'mask-icon', url: '/brand/crest.svg', color: '#013A1F' }],
  },
  openGraph: {
    siteName: 'NMA Gombe',
    locale: 'en_NG',
    type: 'website',
    images: [{ url: '/brand/og-default.jpg', width: 1200, height: 630 }],
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
