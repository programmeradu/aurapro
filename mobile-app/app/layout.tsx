import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'
import { BottomNavigation } from '@/components/navigation/BottomNavigation'
import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'AURA Commuter - Ghana Transport',
    template: '%s | AURA Commuter'
  },
  description: 'Real-time transport tracking, journey planning, and community features for Ghana commuters. Track tro-tros, buses, and plan your daily commute.',
  keywords: [
    'Ghana transport',
    'tro-tro tracking',
    'bus tracking',
    'commuter app',
    'journey planning',
    'real-time transport',
    'Accra transport',
    'Kumasi transport',
    'Ghana commute'
  ],
  authors: [{ name: 'AURA Transport Team' }],
  creator: 'AURA Transport',
  publisher: 'AURA Transport',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: '/',
    title: 'AURA Commuter - Ghana Transport',
    description: 'Real-time transport tracking and journey planning for Ghana commuters',
    siteName: 'AURA Commuter',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AURA Commuter App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AURA Commuter - Ghana Transport',
    description: 'Real-time transport tracking and journey planning for Ghana commuters',
    images: ['/og-image.png'],
    creator: '@AURATransport',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AURA Commuter',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'AURA Commuter',
    'application-name': 'AURA Commuter',
    'msapplication-TileColor': '#006B3F',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#006B3F',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#006B3F' },
    { media: '(prefers-color-scheme: dark)', color: '#006B3F' },
  ],
  colorScheme: 'light',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GH" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AURA Commuter" />
        <meta name="application-name" content="AURA Commuter" />
        <meta name="msapplication-TileColor" content="#006B3F" />
        <meta name="theme-color" content="#006B3F" />
        
        {/* Splash screens for iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone5_splash.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone6_splash.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphoneplus_splash.png"
          media="(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphonex_splash.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphonexr_splash.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphonexsmax_splash.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ipad_splash.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ipadpro1_splash.png"
          media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ipadpro3_splash.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ipadpro2_splash.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        />
      </head>
      <body className="font-sans antialiased bg-ui-background text-ui-text-primary overflow-x-hidden">
        <Providers>
          {/* Main app container with safe area support */}
          <div className="min-h-screen-safe flex flex-col relative">
            {/* Main content area */}
            <main className="flex-1 pb-safe-bottom md:pb-0 overflow-x-hidden">
              <div className="w-full max-w-md mx-auto md:max-w-none">
                {children}
              </div>
            </main>

            {/* Mobile navigation - only on mobile */}
            <div className="mobile-only">
              <BottomNavigation />
            </div>
          </div>
          
          {/* PWA install prompt */}
          <PWAInstallPrompt />
          
          {/* Toast notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                maxWidth: '90vw',
                wordBreak: 'break-word',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
