/**
 * 📱 Offline Service
 * Advanced offline data management for Ghana's mobile networks
 */

import { GeoPoint } from '@/types/transport'
import { CommunityReport, ServiceRating } from '@/types/community'
import { JourneyPlan } from '@/types/journey'

interface OfflineData {
  id: string
  type: 'report' | 'rating' | 'tracking' | 'journey'
  data: any
  timestamp: Date
  retryCount: number
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface NetworkStatus {
  isOnline: boolean
  connectionType: 'wifi' | '4g' | '3g' | '2g' | 'slow-2g' | 'unknown'
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
  downlink: number
  rtt: number
}

class OfflineService {
  private dbName = 'aura-offline-db'
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private syncQueue: OfflineData[] = []
  private isInitialized = false
  private networkStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: '4g',
    downlink: 0,
    rtt: 0
  }

  constructor() {
    this.initializeOfflineService()
    this.setupNetworkMonitoring()
    this.setupBackgroundSync()
  }

  /**
   * 🚀 Initialize offline service
   */
  private async initializeOfflineService() {
    try {
      await this.initializeIndexedDB()
      await this.loadSyncQueue()
      this.isInitialized = true
      console.log('[Offline] Service initialized successfully')
    } catch (error) {
      console.error('[Offline] Failed to initialize service:', error)
    }
  }

  /**
   * 💾 Initialize IndexedDB for offline storage
   */
  private initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('offlineData')) {
          const offlineStore = db.createObjectStore('offlineData', { keyPath: 'id' })
          offlineStore.createIndex('type', 'type', { unique: false })
          offlineStore.createIndex('timestamp', 'timestamp', { unique: false })
          offlineStore.createIndex('priority', 'priority', { unique: false })
        }

        if (!db.objectStoreNames.contains('cachedRoutes')) {
          const routesStore = db.createObjectStore('cachedRoutes', { keyPath: 'id' })
          routesStore.createIndex('lastUsed', 'lastUsed', { unique: false })
        }

        if (!db.objectStoreNames.contains('offlineReports')) {
          const reportsStore = db.createObjectStore('offlineReports', { keyPath: 'id' })
          reportsStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains('userPreferences')) {
          db.createObjectStore('userPreferences', { keyPath: 'key' })
        }
      }
    })
  }

  /**
   * 📡 Setup network monitoring
   */
  private setupNetworkMonitoring() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.networkStatus.isOnline = true
      this.handleNetworkChange()
    })

    window.addEventListener('offline', () => {
      this.networkStatus.isOnline = false
      this.handleNetworkChange()
    })

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      const updateConnectionInfo = () => {
        this.networkStatus.connectionType = connection.type || 'unknown'
        this.networkStatus.effectiveType = connection.effectiveType || '4g'
        this.networkStatus.downlink = connection.downlink || 0
        this.networkStatus.rtt = connection.rtt || 0
      }

      updateConnectionInfo()
      connection.addEventListener('change', updateConnectionInfo)
    }
  }

  /**
   * 🔄 Setup background sync
   */
  private setupBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register sync events if available
        if ('sync' in registration) {
          (registration as any).sync.register('sync-reports')
          .catch((error: any) => console.log('Sync registration failed:', error))

          (registration as any).sync.register('sync-ratings')
          .catch((error: any) => console.log('Sync registration failed:', error))

          (registration as any).sync.register('sync-tracking')
          .catch((error: any) => console.log('Sync registration failed:', error))
        }
      })
    }

    // Fallback: periodic sync when online
    setInterval(() => {
      if (this.networkStatus.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue()
      }
    }, 30000) // Every 30 seconds
  }

  /**
   * 📱 Store data for offline use
   */
  async storeOfflineData(
    type: 'report' | 'rating' | 'tracking' | 'journey',
    data: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    if (!this.db) {
      throw new Error('Offline service not initialized')
    }

    const offlineData: OfflineData = {
      id: this.generateId(),
      type,
      data,
      timestamp: new Date(),
      retryCount: 0,
      priority
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite')
      const store = transaction.objectStore('offlineData')
      const request = store.add(offlineData)

      request.onsuccess = () => {
        this.syncQueue.push(offlineData)
        resolve(offlineData.id)
      }

      request.onerror = () => {
        reject(new Error('Failed to store offline data'))
      }
    })
  }

  /**
   * 📤 Queue report for offline submission
   */
  async queueOfflineReport(report: Partial<CommunityReport>): Promise<string> {
    const reportData = {
      ...report,
      id: this.generateId(),
      timestamp: new Date(),
      offline: true
    }

    return this.storeOfflineData('report', reportData, 'high')
  }

  /**
   * ⭐ Queue rating for offline submission
   */
  async queueOfflineRating(rating: Partial<ServiceRating>): Promise<string> {
    const ratingData = {
      ...rating,
      id: this.generateId(),
      timestamp: new Date(),
      offline: true
    }

    return this.storeOfflineData('rating', ratingData, 'medium')
  }

  /**
   * 📍 Queue location tracking for offline sync
   */
  async queueOfflineTracking(trackingData: {
    journeyId: string
    location: GeoPoint
    timestamp: Date
  }): Promise<string> {
    return this.storeOfflineData('tracking', trackingData, 'high')
  }

  /**
   * 💾 Cache journey plan for offline use
   */
  async cacheJourneyPlan(journeyPlan: JourneyPlan): Promise<void> {
    if (!this.db) return

    const cacheData = {
      id: journeyPlan.id,
      data: journeyPlan,
      lastUsed: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedRoutes'], 'readwrite')
      const store = transaction.objectStore('cachedRoutes')
      const request = store.put(cacheData)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to cache journey plan'))
    })
  }

  /**
   * 📖 Get cached journey plans
   */
  async getCachedJourneyPlans(): Promise<JourneyPlan[]> {
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedRoutes'], 'readonly')
      const store = transaction.objectStore('cachedRoutes')
      const request = store.getAll()

      request.onsuccess = () => {
        const cached = request.result
          .filter((item: any) => new Date(item.expiresAt) > new Date())
          .map((item: any) => item.data)
        resolve(cached)
      }

      request.onerror = () => {
        reject(new Error('Failed to get cached journey plans'))
      }
    })
  }

  /**
   * 🔄 Process sync queue
   */
  private async processSyncQueue() {
    if (!this.networkStatus.isOnline || this.syncQueue.length === 0) {
      return
    }

    // Sort by priority and timestamp
    this.syncQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      
      if (priorityDiff !== 0) return priorityDiff
      return a.timestamp.getTime() - b.timestamp.getTime()
    })

    const batchSize = this.getBatchSizeForConnection()
    const batch = this.syncQueue.splice(0, batchSize)

    for (const item of batch) {
      try {
        await this.syncOfflineItem(item)
        await this.removeOfflineData(item.id)
      } catch (error) {
        console.error('[Offline] Failed to sync item:', error)
        
        // Increment retry count and re-queue if not exceeded
        item.retryCount++
        if (item.retryCount < 3) {
          this.syncQueue.push(item)
        } else {
          console.warn('[Offline] Max retries exceeded for item:', item.id)
          await this.removeOfflineData(item.id)
        }
      }
    }
  }

  /**
   * 📤 Sync individual offline item
   */
  private async syncOfflineItem(item: OfflineData): Promise<void> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const authToken = localStorage.getItem('auth_token')

    let endpoint = ''
    let method = 'POST'

    switch (item.type) {
      case 'report':
        endpoint = '/api/v1/community/reports'
        break
      case 'rating':
        endpoint = '/api/v1/community/ratings'
        break
      case 'tracking':
        endpoint = '/api/v1/tracking/location'
        break
      default:
        throw new Error(`Unknown sync type: ${item.type}`)
    }

    const response = await fetch(`${apiUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(item.data)
    })

    if (!response.ok) {
      throw new Error(`Sync failed with status: ${response.status}`)
    }
  }

  /**
   * 🗑️ Remove offline data
   */
  private async removeOfflineData(id: string): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite')
      const store = transaction.objectStore('offlineData')
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to remove offline data'))
    })
  }

  /**
   * 📊 Get offline statistics
   */
  async getOfflineStats(): Promise<{
    queuedItems: number
    cachedRoutes: number
    storageUsed: number
    lastSync: Date | null
  }> {
    if (!this.db) {
      return { queuedItems: 0, cachedRoutes: 0, storageUsed: 0, lastSync: null }
    }

    const queuedItems = this.syncQueue.length
    const cachedRoutes = await this.getCachedJourneyPlans()
    
    // Estimate storage usage
    const storageUsed = await this.estimateStorageUsage()
    
    return {
      queuedItems,
      cachedRoutes: cachedRoutes.length,
      storageUsed,
      lastSync: this.getLastSyncTime()
    }
  }

  /**
   * 🌐 Get network status
   */
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus }
  }

  /**
   * 🔄 Handle network change
   */
  private handleNetworkChange() {
    if (this.networkStatus.isOnline) {
      console.log('[Offline] Network restored, processing sync queue')
      this.processSyncQueue()
    } else {
      console.log('[Offline] Network lost, enabling offline mode')
    }

    // Dispatch custom event for components to listen
    window.dispatchEvent(new CustomEvent('networkStatusChange', {
      detail: this.networkStatus
    }))
  }

  /**
   * 📦 Get batch size based on connection quality
   */
  private getBatchSizeForConnection(): number {
    switch (this.networkStatus.effectiveType) {
      case 'slow-2g': return 1
      case '2g': return 2
      case '3g': return 5
      case '4g': return 10
      default: return 5
    }
  }

  /**
   * 📊 Estimate storage usage
   */
  private async estimateStorageUsage(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return estimate.usage || 0
      } catch (error) {
        console.error('[Offline] Failed to estimate storage:', error)
      }
    }
    return 0
  }

  /**
   * ⏰ Get last sync time
   */
  private getLastSyncTime(): Date | null {
    const lastSync = localStorage.getItem('last_sync_time')
    return lastSync ? new Date(lastSync) : null
  }

  /**
   * 🔄 Load sync queue from storage
   */
  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readonly')
      const store = transaction.objectStore('offlineData')
      const request = store.getAll()

      request.onsuccess = () => {
        this.syncQueue = request.result
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to load sync queue'))
      }
    })
  }

  /**
   * 🆔 Generate unique ID
   */
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 🧹 Clean up expired data
   */
  async cleanupExpiredData(): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(['cachedRoutes'], 'readwrite')
    const store = transaction.objectStore('cachedRoutes')
    const request = store.getAll()

    request.onsuccess = () => {
      const now = new Date()
      request.result.forEach((item: any) => {
        if (new Date(item.expiresAt) < now) {
          store.delete(item.id)
        }
      })
    }
  }
}

// Export singleton instance
export const offlineService = new OfflineService()
export default offlineService
