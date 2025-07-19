/**
 * 📱 AURA Commuter Service Worker
 * Advanced PWA capabilities optimized for Ghana's mobile networks
 */

const CACHE_NAME = 'aura-commuter-v1.0.0'
const OFFLINE_CACHE = 'aura-offline-v1.0.0'
const RUNTIME_CACHE = 'aura-runtime-v1.0.0'
const IMAGES_CACHE = 'aura-images-v1.0.0'
const API_CACHE = 'aura-api-v1.0.0'

// Ghana-optimized cache strategy
const CACHE_STRATEGIES = {
  // Critical app shell - cache first
  APP_SHELL: [
    '/',
    '/track',
    '/journey',
    '/community',
    '/profile',
    '/manifest.json',
    '/offline.html'
  ],
  
  // Static assets - cache first with fallback
  STATIC_ASSETS: [
    '/icons/',
    '/splash/',
    '/_next/static/',
    '/fonts/'
  ],
  
  // API endpoints - network first with cache fallback
  API_ENDPOINTS: [
    '/api/v1/tracking/',
    '/api/v1/journey/',
    '/api/v1/community/',
    '/api/v1/auth/'
  ],
  
  // Map tiles - cache first (important for offline maps)
  MAP_TILES: [
    'https://api.mapbox.com/styles/',
    'https://api.mapbox.com/v4/',
    'https://api.mapbox.com/fonts/'
  ]
}

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing AURA Commuter Service Worker')
  
  event.waitUntil(
    Promise.all([
      // Cache app shell
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(CACHE_STRATEGIES.APP_SHELL)
      }),
      
      // Cache offline page
      caches.open(OFFLINE_CACHE).then((cache) => {
        return cache.add('/offline.html')
      })
    ]).then(() => {
      console.log('[SW] Installation complete')
      // Skip waiting to activate immediately
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating AURA Commuter Service Worker')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== OFFLINE_CACHE && 
                cacheName !== RUNTIME_CACHE &&
                cacheName !== IMAGES_CACHE &&
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete')
    })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Handle different types of requests
  if (isAppShell(url)) {
    event.respondWith(cacheFirst(request, CACHE_NAME))
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_NAME))
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirstWithOfflineSupport(request))
  } else if (isMapTile(url)) {
    event.respondWith(cacheFirstWithNetworkFallback(request, IMAGES_CACHE))
  } else if (isImage(url)) {
    event.respondWith(cacheFirstWithNetworkFallback(request, IMAGES_CACHE))
  } else {
    event.respondWith(networkFirstWithCacheFallback(request))
  }
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncOfflineReports())
  } else if (event.tag === 'sync-ratings') {
    event.waitUntil(syncOfflineRatings())
  } else if (event.tag === 'sync-tracking') {
    event.waitUntil(syncOfflineTracking())
  }
})

// Push notifications for Ghana commuters
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  const options = {
    body: 'You have new transport updates',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Updates',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png'
      }
    ],
    requireInteraction: true,
    silent: false
  }
  
  if (event.data) {
    const data = event.data.json()
    options.body = data.message || options.body
    options.data = { ...options.data, ...data }
  }
  
  event.waitUntil(
    self.registration.showNotification('AURA Commuter', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/community')
    )
  } else if (event.action === 'close') {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus()
        }
        return clients.openWindow('/')
      })
    )
  }
})

// Caching strategies implementation

// Cache first strategy - for app shell and static assets
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // Update cache in background
      fetch(request).then((response) => {
        if (response.ok) {
          cache.put(request, response.clone())
        }
      }).catch(() => {
        // Ignore network errors in background update
      })
      
      return cachedResponse
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
    
  } catch (error) {
    console.error('[SW] Cache first strategy failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Network first with offline support - for API requests
async function networkFirstWithOfflineSupport(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error('Network response not ok')
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    
    // Try cache
    const cache = await caches.open(API_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for specific endpoints
    if (request.url.includes('/api/v1/tracking/nearby')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Offline - cached data not available',
        offline: true,
        data: { vehicles: [], routes: [] }
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response('Offline', { status: 503 })
  }
}

// Cache first with network fallback - for images and map tiles
async function cacheFirstWithNetworkFallback(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
    
  } catch (error) {
    // Return placeholder image for failed image requests
    if (isImage(new URL(request.url))) {
      return new Response(
        '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="#9ca3af">Image unavailable</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      )
    }
    
    return new Response('Resource unavailable offline', { status: 503 })
  }
}

// Network first with cache fallback - for general requests
async function networkFirstWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    const cache = await caches.open(RUNTIME_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineCache = await caches.open(OFFLINE_CACHE)
      return offlineCache.match('/offline.html')
    }
    
    return new Response('Offline', { status: 503 })
  }
}

// Helper functions to identify request types
function isAppShell(url) {
  return CACHE_STRATEGIES.APP_SHELL.some(path => url.pathname === path)
}

function isStaticAsset(url) {
  return CACHE_STRATEGIES.STATIC_ASSETS.some(path => url.pathname.startsWith(path))
}

function isAPIRequest(url) {
  return CACHE_STRATEGIES.API_ENDPOINTS.some(path => url.pathname.startsWith(path))
}

function isMapTile(url) {
  return CACHE_STRATEGIES.MAP_TILES.some(domain => url.href.startsWith(domain))
}

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname)
}

// Offline sync functions
async function syncOfflineReports() {
  try {
    const offlineReports = await getOfflineData('offline_reports')
    
    for (const report of offlineReports) {
      try {
        const response = await fetch('/api/v1/community/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`
          },
          body: JSON.stringify(report)
        })
        
        if (response.ok) {
          await removeOfflineData('offline_reports', report.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync report:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Sync offline reports failed:', error)
  }
}

async function syncOfflineRatings() {
  try {
    const offlineRatings = await getOfflineData('offline_ratings')
    
    for (const rating of offlineRatings) {
      try {
        const response = await fetch('/api/v1/community/ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`
          },
          body: JSON.stringify(rating)
        })
        
        if (response.ok) {
          await removeOfflineData('offline_ratings', rating.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync rating:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Sync offline ratings failed:', error)
  }
}

async function syncOfflineTracking() {
  try {
    const offlineTracking = await getOfflineData('offline_tracking')
    
    for (const trackingData of offlineTracking) {
      try {
        const response = await fetch('/api/v1/tracking/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`
          },
          body: JSON.stringify(trackingData)
        })
        
        if (response.ok) {
          await removeOfflineData('offline_tracking', trackingData.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync tracking data:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Sync offline tracking failed:', error)
  }
}

// Utility functions for offline data management
async function getOfflineData(key) {
  try {
    const cache = await caches.open(OFFLINE_CACHE)
    const response = await cache.match(`/offline-data/${key}`)
    
    if (response) {
      return await response.json()
    }
    
    return []
  } catch (error) {
    console.error('[SW] Failed to get offline data:', error)
    return []
  }
}

async function removeOfflineData(key, id) {
  try {
    const data = await getOfflineData(key)
    const filtered = data.filter(item => item.id !== id)
    
    const cache = await caches.open(OFFLINE_CACHE)
    await cache.put(`/offline-data/${key}`, new Response(JSON.stringify(filtered)))
  } catch (error) {
    console.error('[SW] Failed to remove offline data:', error)
  }
}

async function getAuthToken() {
  try {
    const cache = await caches.open(OFFLINE_CACHE)
    const response = await cache.match('/offline-data/auth_token')
    
    if (response) {
      const data = await response.json()
      return data.token
    }
    
    return null
  } catch (error) {
    console.error('[SW] Failed to get auth token:', error)
    return null
  }
}

console.log('[SW] AURA Commuter Service Worker loaded successfully')
