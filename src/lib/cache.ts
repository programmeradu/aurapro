// Advanced caching system for AURA Command Center

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  memoryUsage: number
}

export class AdvancedCache<T = any> {
  protected cache = new Map<string, CacheItem<T>>()
  protected stats: CacheStats = { hits: 0, misses: 0, size: 0, memoryUsage: 0 }
  protected maxSize: number
  protected defaultTTL: number
  protected cleanupInterval: NodeJS.Timeout | null = null

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) { // 5 minutes default
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
    this.startCleanup()
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: now
    }

    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, item)
    this.stats.size = this.cache.size
    this.updateMemoryUsage()
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      this.stats.misses++
      return null
    }

    const now = Date.now()
    
    // Check if item has expired
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.size = this.cache.size
      return null
    }

    // Update access statistics
    item.accessCount++
    item.lastAccessed = now
    this.stats.hits++
    
    return item.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.size = this.cache.size
      this.updateMemoryUsage()
    }
    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, size: 0, memoryUsage: 0 }
  }

  getStats(): CacheStats {
    return { ...this.stats }
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses
    return total === 0 ? 0 : this.stats.hits / total
  }

  private evictLRU(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000) // Cleanup every minute
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    this.stats.size = this.cache.size
    this.updateMemoryUsage()
  }

  protected updateMemoryUsage(): void {
    // Rough estimation of memory usage
    let size = 0
    for (const [key, item] of this.cache.entries()) {
      size += key.length * 2 // UTF-16 characters
      size += JSON.stringify(item.data).length * 2
      size += 64 // Overhead for CacheItem structure
    }
    this.stats.memoryUsage = size
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
  }
}

// Specialized caches for different data types
export const vehicleCache = new AdvancedCache(500, 30000) // 30 seconds TTL
export const routeCache = new AdvancedCache(100, 300000) // 5 minutes TTL
export const kpiCache = new AdvancedCache(50, 60000) // 1 minute TTL
export const mapDataCache = new AdvancedCache(200, 600000) // 10 minutes TTL
export const analyticsCache = new AdvancedCache(100, 180000) // 3 minutes TTL

// Memory-aware cache that adjusts based on available memory
export class MemoryAwareCache<T = any> extends AdvancedCache<T> {
  private memoryThreshold: number = 50 * 1024 * 1024 // 50MB

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) {
    super(maxSize, defaultTTL)
    this.monitorMemory()
  }

  private memoryMonitorInterval: NodeJS.Timeout | null = null

  private monitorMemory(): void {
    // Clear any existing interval to prevent duplicates
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval)
    }

    this.memoryMonitorInterval = setInterval(() => {
      if (this.stats.memoryUsage > this.memoryThreshold) {
        console.warn('🧠 Cache memory usage high, performing aggressive cleanup')
        this.aggressiveCleanup()
      }
    }, 30000) // Check every 30 seconds
  }

  destroy(): void {
    // Clean up memory monitor interval
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval)
      this.memoryMonitorInterval = null
    }

    // Call parent destroy method
    super.destroy()
  }

  private aggressiveCleanup(): void {
    // Remove least frequently used items
    const items = Array.from(this.cache.entries())
    items.sort((a, b) => a[1].accessCount - b[1].accessCount)
    
    const itemsToRemove = Math.floor(items.length * 0.3) // Remove 30%
    for (let i = 0; i < itemsToRemove; i++) {
      this.cache.delete(items[i][0])
    }
    
    this.stats.size = this.cache.size
    this.updateMemoryUsage()
  }
}

// React hook for cached data
export const useCachedData = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  cache: AdvancedCache<T> = new AdvancedCache(),
  dependencies: any[] = []
) => {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const loadData = async () => {
      // Check cache first
      const cachedData = cache.get(key)
      if (cachedData) {
        setData(cachedData)
        return
      }

      // Fetch new data
      setLoading(true)
      setError(null)
      
      try {
        const newData = await fetchFn()
        cache.set(key, newData)
        setData(newData)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [key, ...dependencies])

  return { data, loading, error, refetch: () => {
    cache.delete(key)
    setData(null)
  }}
}

// Cache warming strategies
export const warmCache = async () => {
  console.log('🔥 Warming up caches...')
  
  try {
    // Pre-load critical data
    const criticalEndpoints = [
      '/api/vehicles',
      '/api/routes',
      '/api/kpis',
      '/api/gtfs/stops'
    ]

    const promises = criticalEndpoints.map(async (endpoint) => {
      try {
        const response = await fetch(`http://localhost:8002${endpoint}`)
        if (response.ok) {
          const data = await response.json()
          
          // Cache based on endpoint
          if (endpoint.includes('vehicles')) {
            vehicleCache.set('current-vehicles', data.vehicles || [])
          } else if (endpoint.includes('routes')) {
            routeCache.set('current-routes', data.routes || [])
          } else if (endpoint.includes('kpis')) {
            kpiCache.set('current-kpis', data.kpis || [])
          } else if (endpoint.includes('gtfs')) {
            mapDataCache.set('gtfs-stops', data.stops || [])
          }
        }
      } catch (error) {
        console.warn(`Failed to warm cache for ${endpoint}:`, error)
      }
    })

    await Promise.allSettled(promises)
    console.log('✅ Cache warming completed')
  } catch (error) {
    console.error('❌ Cache warming failed:', error)
  }
}

// Cache performance monitoring
export const getCachePerformanceReport = () => {
  const caches = {
    vehicle: vehicleCache,
    route: routeCache,
    kpi: kpiCache,
    mapData: mapDataCache,
    analytics: analyticsCache
  }

  const report = Object.entries(caches).map(([name, cache]) => ({
    name,
    stats: cache.getStats(),
    hitRate: cache.getHitRate()
  }))

  return {
    caches: report,
    totalMemoryUsage: report.reduce((sum, cache) => sum + cache.stats.memoryUsage, 0),
    averageHitRate: report.reduce((sum, cache) => sum + cache.hitRate, 0) / report.length
  }
}

// Automatic cache optimization
export const optimizeCaches = () => {
  const report = getCachePerformanceReport()
  
  console.group('📊 Cache Performance Report')
  report.caches.forEach(cache => {
    console.log(`${cache.name}: ${(cache.hitRate * 100).toFixed(1)}% hit rate, ${cache.stats.size} items, ${(cache.stats.memoryUsage / 1024).toFixed(1)}KB`)
    
    // Optimize based on performance
    if (cache.hitRate < 0.5) {
      console.warn(`⚠️ Low hit rate for ${cache.name} cache - consider adjusting TTL`)
    }
  })
  console.log(`Total memory usage: ${(report.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB`)
  console.log(`Average hit rate: ${(report.averageHitRate * 100).toFixed(1)}%`)
  console.groupEnd()
}

// Global interval reference for cleanup
let cacheOptimizationInterval: NodeJS.Timeout | null = null

// Initialize caching system
export const initializeCaching = () => {
  // Warm up caches
  warmCache()

  // Clear any existing interval
  if (cacheOptimizationInterval) {
    clearInterval(cacheOptimizationInterval)
  }

  // Set up periodic optimization
  cacheOptimizationInterval = setInterval(optimizeCaches, 300000) // Every 5 minutes

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (cacheOptimizationInterval) {
      clearInterval(cacheOptimizationInterval)
    }
    vehicleCache.destroy()
    routeCache.destroy()
    kpiCache.destroy()
    mapDataCache.destroy()
    analyticsCache.destroy()
  })

  console.log('💾 Advanced caching system initialized')
}

// Removed duplicate React declaration
