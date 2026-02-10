import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { AuthProvider } from '@/lib/contexts/auth-context'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Tracker Dashboard - Real-time Device Monitoring',
  description: 'Professional device tracking and monitoring dashboard with real-time MQTT updates, location tracking, and comprehensive device management.',
  keywords: ['tracker', 'dashboard', 'IoT', 'device monitoring', 'real-time', 'MQTT', 'GPS tracking'],
  authors: [{ name: 'Tracker Dashboard Team' }],
  creator: 'Tracker Dashboard',
  publisher: 'Tracker Dashboard',
  robots: 'index, follow',
  openGraph: {
    title: 'Tracker Dashboard',
    description: 'Real-time device monitoring and tracking',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={GeistSans.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
