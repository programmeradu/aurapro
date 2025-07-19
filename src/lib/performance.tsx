// Performance optimization utilities for AURA Command Center

// Debounce function for reducing API calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Throttle function for limiting function calls
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Memoization utility
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map()
  return ((...args: any[]) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

// Virtual scrolling for large lists
export class VirtualScroller {
  private container: HTMLElement
  private itemHeight: number
  private visibleCount: number
  private totalCount: number
  private scrollTop: number = 0

  constructor(
    container: HTMLElement,
    itemHeight: number,
    totalCount: number
  ) {
    this.container = container
    this.itemHeight = itemHeight
    this.totalCount = totalCount
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2
  }

  getVisibleRange() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight)
    const endIndex = Math.min(startIndex + this.visibleCount, this.totalCount)
    return { startIndex, endIndex }
  }

  updateScrollTop(scrollTop: number) {
    this.scrollTop = scrollTop
  }
}

// Image lazy loading
export const lazyLoadImage = (img: HTMLImageElement, src: string) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src
          img.classList.remove('lazy')
          observer.unobserve(img)
        }
      })
    },
    { threshold: 0.1 }
  )
  observer.observe(img)
}

// Component lazy loading with error boundary
export const createLazyComponent = (importFn: () => Promise<any>) => {
  const LazyComponent = React.lazy(importFn)
  
  return (props: any) => (
    <React.Suspense 
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      }
    >
      <LazyComponent {...props} />
    </React.Suspense>
  )
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  startTiming(label: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
    }
  }

  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(value)
    
    // Keep only last 100 measurements
    const values = this.metrics.get(label)!
    if (values.length > 100) {
      values.shift()
    }
  }

  getAverageMetric(label: string): number {
    const values = this.metrics.get(label) || []
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  getAllMetrics() {
    const result: Record<string, { average: number; count: number }> = {}
    this.metrics.forEach((values, label) => {
      result[label] = {
        average: this.getAverageMetric(label),
        count: values.length
      }
    })
    return result
  }

  logMetrics() {
    console.group('🚀 Performance Metrics')
    const metrics = this.getAllMetrics()
    Object.entries(metrics).forEach(([label, data]) => {
      console.log(`${label}: ${data.average.toFixed(2)}ms (${data.count} samples)`)
    })
    console.groupEnd()
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
    }
  }
  return null
}

// Bundle size analyzer
export const analyzeBundleSize = () => {
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

// Network performance monitoring
export const monitorNetworkRequests = () => {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'navigation') {
        const nav = entry as PerformanceNavigationTiming
        console.log('Navigation timing:', {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          totalTime: nav.loadEventEnd - nav.navigationStart
        })
      }
      
      if (entry.entryType === 'resource') {
        const resource = entry as PerformanceResourceTiming
        if (resource.duration > 1000) { // Log slow requests (>1s)
          console.warn('Slow resource:', {
            name: resource.name,
            duration: resource.duration,
            size: resource.transferSize
          })
        }
      }
    })
  })
  
  observer.observe({ entryTypes: ['navigation', 'resource'] })
  return observer
}

// Removed withPerformanceMonitoring - unused utility

// Removed shallowEqual - unused utility

// Removed useOptimizedState - unused utility

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  // Monitor Core Web Vitals
  if ('web-vitals' in window) {
    // This would require installing web-vitals package
    console.log('📊 Core Web Vitals monitoring enabled')
  }
  
  // Monitor memory usage with cleanup
  let memoryMonitorInterval: NodeJS.Timeout | null = null
  if (getMemoryUsage()) {
    memoryMonitorInterval = setInterval(() => {
      const memory = getMemoryUsage()
      if (memory && memory.used > memory.limit * 0.8) {
        console.warn('⚠️ High memory usage detected:', memory)
      }
    }, 30000) // Check every 30 seconds

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      if (memoryMonitorInterval) {
        clearInterval(memoryMonitorInterval)
      }
    })
  }
  
  // Monitor network requests
  monitorNetworkRequests()
  
  console.log('🚀 Performance monitoring initialized')
}

// Export React for lazy loading
declare global {
  var React: typeof import('react')
}

if (typeof window !== 'undefined') {
  (window as any).React = React
}
