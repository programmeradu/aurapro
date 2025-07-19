import { WebSocketProvider } from '@/components/WebSocketProvider'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'AURA Command - Transport Intelligence Center',
  description: 'AI-Powered Command Center for Accra\'s Transport Network',
  keywords: ['transport', 'AI', 'Ghana', 'Accra', 'optimization', 'real-time'],
  authors: [{ name: 'AURA Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AURA Command" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <WebSocketProvider>
          <div id="root">
            {children}
          </div>
          <div id="portal-root" />
        </WebSocketProvider>
      </body>
    </html>
  )
}
