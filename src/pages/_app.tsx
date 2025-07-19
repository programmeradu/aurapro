import ErrorBoundary from '@/components/ErrorBoundary'
import GTFSDataLoader from '@/components/GTFSDataLoader'
import { WebSocketProvider } from '@/components/WebSocketProvider'
import type { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import '../app/globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function App({ Component, pageProps }: AppProps) {
  // Initialize memory leak prevention
  useEffect(() => {
    initializeMemoryLeakPrevention()
  }, [])

  return (
    <ErrorBoundary>
      <div className={`${inter.variable} ${inter.className} antialiased`}>
        <GTFSDataLoader>
          <WebSocketProvider>
            <div id="root">
              <Component {...pageProps} />
            </div>
            <div id="portal-root" />
          </WebSocketProvider>
        </GTFSDataLoader>
      </div>
    </ErrorBoundary>
  )
}
