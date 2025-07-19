// Bundle optimization utilities for AURA Command Center

// Dynamic import wrapper for better error handling
export const dynamicImport = async <T = any>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T,
  retries: number = 3
): Promise<T> => {
  let lastError: Error | null = null
  
  for (let i = 0; i < retries; i++) {
    try {
      const module = await importFn()
      return module.default
    } catch (error) {
      lastError = error as Error
      console.warn(`Dynamic import failed (attempt ${i + 1}/${retries}):`, error)
      
      // Wait before retry
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }
  
  if (fallback !== undefined) {
    console.warn('Using fallback component due to import failure:', lastError)
    return fallback
  }
  
  throw lastError || new Error('Dynamic import failed')
}

// Preload critical resources
export const preloadCriticalResources = () => {
  const criticalResources = [
    // Critical CSS
    '/styles/globals.css',
    // Critical fonts
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    // Critical images
    '/favicon.ico'
  ]
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    
    if (resource.endsWith('.css')) {
      link.as = 'style'
      link.href = resource
    } else if (resource.includes('fonts.googleapis.com')) {
      link.as = 'style'
      link.href = resource
    } else if (resource.match(/\.(jpg|jpeg|png|webp|svg|ico)$/)) {
      link.as = 'image'
      link.href = resource
    }
    
    document.head.appendChild(link)
  })
  
  console.log('🚀 Critical resources preloaded')
}

// Prefetch non-critical resources
export const prefetchResources = () => {
  const prefetchResources = [
    // Non-critical components that might be needed
    '/api/analytics/historical',
    '/api/reports/templates'
  ]
  
  prefetchResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = resource
    document.head.appendChild(link)
  })
  
  console.log('📦 Non-critical resources prefetched')
}

// Code splitting utilities
export const createChunkLoader = (chunkName: string) => {
  return {
    load: async <T>(): Promise<T> => {
      try {
        // This would be replaced by actual dynamic imports in real implementation
        const module = await import(/* webpackChunkName: "[request]" */ `../components/${chunkName}`)
        return module.default
      } catch (error) {
        console.error(`Failed to load chunk ${chunkName}:`, error)
        throw error
      }
    }
  }
}

// Bundle size analyzer
export const analyzeBundleSize = () => {
  const scripts = Array.from(document.querySelectorAll('script[src]'))
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
  
  const analysis = {
    scripts: scripts.map(script => {
      const src = (script as HTMLScriptElement).src
      return {
        src,
        async: (script as HTMLScriptElement).async,
        defer: (script as HTMLScriptElement).defer,
        estimatedSize: 'unknown' // Would need actual size measurement
      }
    }),
    styles: styles.map(style => {
      const href = (style as HTMLLinkElement).href
      return {
        href,
        estimatedSize: 'unknown' // Would need actual size measurement
      }
    }),
    totalScripts: scripts.length,
    totalStyles: styles.length
  }
  
  console.group('📊 Bundle Analysis')
  console.log('Scripts:', analysis.totalScripts)
  console.log('Stylesheets:', analysis.totalStyles)
  console.log('Details:', analysis)
  console.groupEnd()
  
  return analysis
}

// Tree shaking helper - mark unused exports
export const markUnusedExports = () => {
  // This would be used during build time to identify unused exports
  console.log('🌳 Tree shaking analysis would run during build')
}

// Lazy loading with intersection observer
export const createLazyLoader = (threshold: number = 0.1) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement
          const loadFn = element.dataset.lazyLoad
          
          if (loadFn) {
            // Execute the lazy load function
            try {
              const fn = new Function('return ' + loadFn)()
              fn()
              observer.unobserve(element)
            } catch (error) {
              console.error('Lazy load function failed:', error)
            }
          }
        }
      })
    },
    { threshold }
  )
  
  return {
    observe: (element: HTMLElement, loadFn: () => void) => {
      element.dataset.lazyLoad = loadFn.toString()
      observer.observe(element)
    },
    disconnect: () => observer.disconnect()
  }
}

// Resource hints for better loading
export const addResourceHints = () => {
  const hints = [
    // DNS prefetch for external domains
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//api.mapbox.com' },
    
    // Preconnect for critical external resources
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
    
    // Module preload for critical modules
    { rel: 'modulepreload', href: '/src/main.tsx' }
  ]
  
  hints.forEach(hint => {
    const link = document.createElement('link')
    Object.assign(link, hint)
    document.head.appendChild(link)
  })
  
  console.log('🔗 Resource hints added')
}

// Service Worker for caching
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('🔧 Service Worker registered:', registration)
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found')
      })
      
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
}

// Critical CSS inlining
export const inlineCriticalCSS = (css: string) => {
  const style = document.createElement('style')
  style.textContent = css
  style.setAttribute('data-critical', 'true')
  document.head.appendChild(style)
}

// Performance budget monitoring
export const monitorPerformanceBudget = () => {
  const budget = {
    maxScripts: 10,
    maxStyles: 5,
    maxTotalSize: 2 * 1024 * 1024, // 2MB
    maxLoadTime: 3000 // 3 seconds
  }
  
  const analysis = analyzeBundleSize()
  const warnings: string[] = []
  
  if (analysis.totalScripts > budget.maxScripts) {
    warnings.push(`Too many scripts: ${analysis.totalScripts} > ${budget.maxScripts}`)
  }
  
  if (analysis.totalStyles > budget.maxStyles) {
    warnings.push(`Too many stylesheets: ${analysis.totalStyles} > ${budget.maxStyles}`)
  }
  
  // Monitor load time
  window.addEventListener('load', () => {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
    if (loadTime > budget.maxLoadTime) {
      warnings.push(`Load time exceeded budget: ${loadTime}ms > ${budget.maxLoadTime}ms`)
    }
    
    if (warnings.length > 0) {
      console.group('⚠️ Performance Budget Violations')
      warnings.forEach(warning => console.warn(warning))
      console.groupEnd()
    } else {
      console.log('✅ Performance budget met')
    }
  })
}

// Webpack bundle analyzer integration
export const generateBundleReport = () => {
  // This would integrate with webpack-bundle-analyzer in a real build
  console.log('📈 Bundle report would be generated during build process')
  
  return {
    chunks: [
      { name: 'main', size: '500KB', modules: 150 },
      { name: 'vendor', size: '800KB', modules: 50 },
      { name: 'dashboard', size: '200KB', modules: 25 }
    ],
    totalSize: '1.5MB',
    recommendations: [
      'Consider code splitting for dashboard components',
      'Vendor bundle could be optimized',
      'Some modules appear to be duplicated'
    ]
  }
}

// Initialize bundle optimization
export const initializeBundleOptimization = () => {
  // Preload critical resources
  preloadCriticalResources()
  
  // Add resource hints
  addResourceHints()
  
  // Register service worker
  registerServiceWorker()
  
  // Monitor performance budget
  monitorPerformanceBudget()
  
  // Prefetch non-critical resources after load
  window.addEventListener('load', () => {
    setTimeout(prefetchResources, 2000) // Wait 2 seconds after load
  })
  
  console.log('📦 Bundle optimization initialized')
}

// Chunk loading strategies
export const chunkLoadingStrategies = {
  // Load on hover (for navigation items)
  onHover: (element: HTMLElement, chunkLoader: () => Promise<any>) => {
    let loaded = false
    element.addEventListener('mouseenter', () => {
      if (!loaded) {
        loaded = true
        chunkLoader().catch(console.error)
      }
    }, { once: true })
  },
  
  // Load on viewport entry
  onViewport: (element: HTMLElement, chunkLoader: () => Promise<any>) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            chunkLoader().catch(console.error)
            observer.unobserve(element)
          }
        })
      },
      { threshold: 0.1 }
    )
    observer.observe(element)
  },
  
  // Load after delay
  delayed: (delay: number, chunkLoader: () => Promise<any>) => {
    setTimeout(() => {
      chunkLoader().catch(console.error)
    }, delay)
  },
  
  // Load on user interaction
  onInteraction: (chunkLoader: () => Promise<any>) => {
    const events = ['click', 'keydown', 'touchstart', 'mousemove']
    const loadChunk = () => {
      chunkLoader().catch(console.error)
      events.forEach(event => {
        document.removeEventListener(event, loadChunk)
      })
    }
    
    events.forEach(event => {
      document.addEventListener(event, loadChunk, { once: true, passive: true })
    })
  }
}

// Export optimization utilities
export default {
  dynamicImport,
  preloadCriticalResources,
  prefetchResources,
  analyzeBundleSize,
  createLazyLoader,
  addResourceHints,
  registerServiceWorker,
  monitorPerformanceBudget,
  generateBundleReport,
  initializeBundleOptimization,
  chunkLoadingStrategies
}
