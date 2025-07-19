/**
 * 🧠 Memory Leak Prevention and Fixes
 * Comprehensive memory management for AURA Command Center
 */

import { useEffect, useRef, useCallback } from 'react'

// Memory leak detection and prevention utilities
export class MemoryLeakDetector {
  private static instance: MemoryLeakDetector
  private intervals: Set<NodeJS.Timeout> = new Set()
  private timeouts: Set<NodeJS.Timeout> = new Set()
  private eventListeners: Map<EventTarget, Map<string, EventListener>> = new Map()
  private observers: Set<IntersectionObserver | MutationObserver | ResizeObserver> = new Set()
  private abortControllers: Set<AbortController> = new Set()
  private memoryMonitorInterval: NodeJS.Timeout | null = null

  static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector()
    }
    return MemoryLeakDetector.instance
  }

  // Track intervals to prevent leaks
  trackInterval(interval: NodeJS.Timeout): NodeJS.Timeout {
    this.intervals.add(interval)
    return interval
  }

  // Track timeouts to prevent leaks
  trackTimeout(timeout: NodeJS.Timeout): NodeJS.Timeout {
    this.timeouts.add(timeout)
    return timeout
  }

  // Track event listeners
  trackEventListener(target: EventTarget, event: string, listener: EventListener): void {
    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, new Map())
    }
    this.eventListeners.get(target)!.set(event, listener)
  }

  // Track observers
  trackObserver(observer: IntersectionObserver | MutationObserver | ResizeObserver): void {
    this.observers.add(observer)
  }

  // Track abort controllers
  trackAbortController(controller: AbortController): AbortController {
    this.abortControllers.add(controller)
    return controller
  }

  // Clear specific interval
  clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval)
    this.intervals.delete(interval)
  }

  // Clear specific timeout
  clearTimeout(timeout: NodeJS.Timeout): void {
    clearTimeout(timeout)
    this.timeouts.delete(timeout)
  }

  // Remove event listener
  removeEventListener(target: EventTarget, event: string): void {
    const listeners = this.eventListeners.get(target)
    if (listeners) {
      const listener = listeners.get(event)
      if (listener) {
        target.removeEventListener(event, listener)
        listeners.delete(event)
        if (listeners.size === 0) {
          this.eventListeners.delete(target)
        }
      }
    }
  }

  // Disconnect observer
  disconnectObserver(observer: IntersectionObserver | MutationObserver | ResizeObserver): void {
    observer.disconnect()
    this.observers.delete(observer)
  }

  // Abort controller
  abortController(controller: AbortController): void {
    controller.abort()
    this.abortControllers.delete(controller)
  }

  // Clean up all tracked resources
  cleanupAll(): void {
    console.log('🧹 Cleaning up all tracked resources...')

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()

    // Clear all timeouts
    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts.clear()

    // Remove all event listeners
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, event) => {
        target.removeEventListener(event, listener)
      })
    })
    this.eventListeners.clear()

    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()

    // Abort all controllers
    this.abortControllers.forEach(controller => controller.abort())
    this.abortControllers.clear()

    // Stop memory monitoring
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval)
      this.memoryMonitorInterval = null
    }

    console.log('✅ All resources cleaned up')
  }

  // Monitor memory usage
  startMemoryMonitoring(): void {
    if (this.memoryMonitorInterval) return

    this.memoryMonitorInterval = setInterval(() => {
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
        const memory = (window.performance as any).memory
        const memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        }

        // Log warning if memory usage is high
        if (memoryUsage.used > memoryUsage.limit * 0.8) {
          console.warn('⚠️ High memory usage detected:', memoryUsage)
          console.log('📊 Tracked resources:', {
            intervals: this.intervals.size,
            timeouts: this.timeouts.size,
            eventListeners: this.eventListeners.size,
            observers: this.observers.size,
            abortControllers: this.abortControllers.size
          })
        }
      }
    }, 30000) // Check every 30 seconds
  }

  // Get memory usage statistics
  getMemoryStats(): any {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        trackedResources: {
          intervals: this.intervals.size,
          timeouts: this.timeouts.size,
          eventListeners: this.eventListeners.size,
          observers: this.observers.size,
          abortControllers: this.abortControllers.size
        }
      }
    }
    return null
  }
}

// React hooks for memory leak prevention
export const useMemoryLeakPrevention = () => {
  const detector = MemoryLeakDetector.getInstance()
  const cleanupFunctions = useRef<(() => void)[]>([])

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup)
  }, [])

  const safeSetInterval = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    const interval = setInterval(callback, delay)
    detector.trackInterval(interval)
    addCleanup(() => detector.clearInterval(interval))
    return interval
  }, [detector, addCleanup])

  const safeSetTimeout = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    const timeout = setTimeout(callback, delay)
    detector.trackTimeout(timeout)
    addCleanup(() => detector.clearTimeout(timeout))
    return timeout
  }, [detector, addCleanup])

  const safeAddEventListener = useCallback((
    target: EventTarget,
    event: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    target.addEventListener(event, listener, options)
    detector.trackEventListener(target, event, listener)
    addCleanup(() => detector.removeEventListener(target, event))
  }, [detector, addCleanup])

  const safeCreateObserver = useCallback(<T extends IntersectionObserver | MutationObserver | ResizeObserver>(
    observer: T
  ): T => {
    detector.trackObserver(observer)
    addCleanup(() => detector.disconnectObserver(observer))
    return observer
  }, [detector, addCleanup])

  const safeCreateAbortController = useCallback((): AbortController => {
    const controller = new AbortController()
    detector.trackAbortController(controller)
    addCleanup(() => detector.abortController(controller))
    return controller
  }, [detector, addCleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.warn('Error during cleanup:', error)
        }
      })
      cleanupFunctions.current = []
    }
  }, [])

  return {
    safeSetInterval,
    safeSetTimeout,
    safeAddEventListener,
    safeCreateObserver,
    safeCreateAbortController,
    addCleanup
  }
}

// Vehicle data accumulation fix
export class VehicleDataManager {
  private static instance: VehicleDataManager
  private vehicleData: Map<string, any> = new Map()
  private maxVehicles: number = 1000
  private cleanupInterval: NodeJS.Timeout | null = null

  static getInstance(): VehicleDataManager {
    if (!VehicleDataManager.instance) {
      VehicleDataManager.instance = new VehicleDataManager()
    }
    return VehicleDataManager.instance
  }

  constructor() {
    this.startCleanup()
  }

  addVehicle(id: string, data: any): void {
    // Add timestamp for cleanup
    this.vehicleData.set(id, {
      ...data,
      lastUpdate: Date.now()
    })

    // Prevent unlimited growth
    if (this.vehicleData.size > this.maxVehicles) {
      this.cleanupOldVehicles()
    }
  }

  getVehicle(id: string): any {
    return this.vehicleData.get(id)
  }

  getAllVehicles(): any[] {
    return Array.from(this.vehicleData.values())
  }

  removeVehicle(id: string): void {
    this.vehicleData.delete(id)
  }

  private cleanupOldVehicles(): void {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes

    for (const [id, data] of this.vehicleData.entries()) {
      if (now - data.lastUpdate > maxAge) {
        this.vehicleData.delete(id)
      }
    }

    console.log(`🧹 Cleaned up old vehicles. Current count: ${this.vehicleData.size}`)
  }

  private startCleanup(): void {
    if (this.cleanupInterval) return

    this.cleanupInterval = setInterval(() => {
      this.cleanupOldVehicles()
    }, 60000) // Cleanup every minute
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.vehicleData.clear()
  }
}

// Initialize memory leak prevention
export const initializeMemoryLeakPrevention = (): void => {
  const detector = MemoryLeakDetector.getInstance()
  
  // Start memory monitoring
  detector.startMemoryMonitoring()

  // Clean up on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      detector.cleanupAll()
      VehicleDataManager.getInstance().destroy()
    })

    // Clean up on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Perform cleanup when tab becomes hidden
        detector.cleanupAll()
      }
    })
  }

  console.log('🧠 Memory leak prevention initialized')
}

// Export utilities
export default {
  MemoryLeakDetector,
  VehicleDataManager,
  useMemoryLeakPrevention,
  initializeMemoryLeakPrevention
}
