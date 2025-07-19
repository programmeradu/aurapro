/**
 * 📦 Lazy-loaded Components for Bundle Optimization
 * Implements code splitting for heavy components to reduce initial bundle size
 */

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Loading component for lazy-loaded components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
)

// Error boundary for lazy components
const LazyErrorBoundary = ({ error }: { error: Error }) => (
  <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg">
    <div className="text-center">
      <div className="text-red-500 text-lg font-semibold mb-2">Component Failed to Load</div>
      <div className="text-red-600 text-sm">{error.message}</div>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Reload Page
      </button>
    </div>
  </div>
)

// Lazy-loaded dashboard components
export const LazyMapboxMap = dynamic(
  () => import('./MapboxMap'),
  {
    loading: LoadingSpinner,
    ssr: false // Disable SSR for map component
  }
)

export const LazyFinancialAnalytics = dynamic(
  () => import('./FinancialAnalytics'),
  {
    loading: LoadingSpinner,
    ssr: false
  }
)

export const LazyRouteOptimization = dynamic(
  () => import('./RouteOptimization'),
  {
    loading: LoadingSpinner,
    ssr: false
  }
)

export const LazyMLPerformanceDashboard = dynamic(
  () => import('./MLPerformanceDashboard'),
  {
    loading: LoadingSpinner,
    ssr: false
  }
)

export const LazyEnhancedLiveTracking = dynamic(
  () => import('./EnhancedLiveTracking'),
  {
    loading: LoadingSpinner,
    ssr: false
  }
)

export const LazyAIInsightsPanelNew = dynamic(
  () => import('./AIInsightsPanelNew'),
  {
    loading: LoadingSpinner,
    ssr: false
  }
)

export const LazyEconomicsAnalyzer = dynamic(
  () => import('./EconomicsAnalyzer'),
  {
    loading: LoadingSpinner,
    ssr: false
  }
)

// Lazy-loaded chart components (heavy recharts library)
export const LazyAreaChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.AreaChart })),
  {
    loading: LoadingSpinner,
    ssr: false
  }
)

export const LazyBarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  {
    loading: LoadingSpinner,
    ssr: false
  }
)

export const LazyLineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  {
    loading: LoadingSpinner,
    ssr: false
  }
)

export const LazyPieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  {
    loading: LoadingSpinner,
    ssr: false
  }
)

// Lazy-loaded PDF generation (heavy jsPDF library)
export const LazyPDFGenerator = dynamic(
  () => import('../lib/pdfGenerator'),
  {
    loading: LoadingSpinner,
    ssr: false
  }
)

// Higher-order component for lazy loading with error boundary
export function withLazyLoading<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: {
    fallback?: ComponentType
    errorBoundary?: boolean
    ssr?: boolean
  } = {}
) {
  const {
    fallback = LoadingSpinner,
    errorBoundary = true,
    ssr = false
  } = options

  const LazyComponent = dynamic(importFn, {
    loading: fallback,
    ssr
  })

  if (errorBoundary) {
    return (props: T) => (
      <LazyComponent {...props} />
    )
  }

  return LazyComponent
}

// Preload functions for critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be needed soon
  import('./MapboxMap')
  import('./EnhancedLiveTracking')
}

// Prefetch functions for non-critical components
export const prefetchAnalyticsComponents = () => {
  // Prefetch analytics components when user hovers over analytics menu
  import('./FinancialAnalytics')
  import('./RouteOptimization')
  import('./MLPerformanceDashboard')
}

export const prefetchAIComponents = () => {
  // Prefetch AI components when user navigates to AI section
  import('./AIInsightsPanelNew')
  import('./EconomicsAnalyzer')
}

// Bundle size monitoring
export const getBundleInfo = () => {
  if (typeof window !== 'undefined') {
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    
    return {
      scriptCount: scripts.length,
      styleCount: styles.length,
      scripts: scripts.map(script => ({
        src: (script as HTMLScriptElement).src,
        async: (script as HTMLScriptElement).async,
        defer: (script as HTMLScriptElement).defer
      })),
      styles: styles.map(style => ({
        href: (style as HTMLLinkElement).href
      }))
    }
  }
  
  return null
}

// Performance monitoring for lazy components
export const monitorLazyComponentPerformance = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('📊 Navigation Performance:', {
            loadTime: entry.loadEventEnd - entry.loadEventStart,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            firstContentfulPaint: entry.responseEnd - entry.requestStart
          })
        }
      })
    })
    
    observer.observe({ entryTypes: ['navigation'] })
  }
}

// Initialize lazy loading optimizations
export const initializeLazyLoading = () => {
  // Preload critical components
  preloadCriticalComponents()
  
  // Monitor performance
  monitorLazyComponentPerformance()
  
  // Set up intersection observer for prefetching
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement
          
          // Prefetch based on data attributes
          if (target.dataset.prefetch === 'analytics') {
            prefetchAnalyticsComponents()
          } else if (target.dataset.prefetch === 'ai') {
            prefetchAIComponents()
          }
        }
      })
    })
    
    // Observe elements with prefetch data attributes
    document.querySelectorAll('[data-prefetch]').forEach((el) => {
      observer.observe(el)
    })
  }
}

// Export all lazy components
export default {
  LazyMapboxMap,
  LazyFinancialAnalytics,
  LazyRouteOptimization,
  LazyMLPerformanceDashboard,
  LazyEnhancedLiveTracking,
  LazyAIInsightsPanelNew,
  LazyEconomicsAnalyzer,
  LazyAreaChart,
  LazyBarChart,
  LazyLineChart,
  LazyPieChart,
  LazyPDFGenerator,
  withLazyLoading,
  preloadCriticalComponents,
  prefetchAnalyticsComponents,
  prefetchAIComponents,
  getBundleInfo,
  monitorLazyComponentPerformance,
  initializeLazyLoading
}
