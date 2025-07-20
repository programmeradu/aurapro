export interface WebSocketMessage {
  type: string
  data: any
  timestamp: Date
}

export interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
}

class WebSocketService {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private reconnectAttempts = 0
  private isConnecting = false
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = {
      url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001/socket.io/',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        reject(new Error('Already connecting'))
        return
      }

      this.isConnecting = true
      this.connectionState = 'connecting'

      try {
        this.ws = new WebSocket(this.config.url)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.connectionState = 'connected'
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.connectionState = 'disconnected'
          this.isConnecting = false
          this.stopHeartbeat()
          
          if (!event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.connectionState = 'error'
          this.isConnecting = false
          reject(error)
        }

      } catch (error) {
        this.isConnecting = false
        this.connectionState = 'error'
        reject(error)
      }
    })
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.connectionState = 'disconnected'
    this.reconnectAttempts = 0
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectAttempts++
    const delay = Math.min(this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000)

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnect failed:', error)
      })
    }, delay)
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: new Date().toISOString() })
      }
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const { type, data } = message

    // Handle system messages
    if (type === 'pong') {
      // Heartbeat response
      return
    }

    // Notify listeners
    const typeListeners = this.listeners.get(type)
    if (typeListeners) {
      typeListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in WebSocket listener:', error)
        }
      })
    }

    // Notify wildcard listeners
    const wildcardListeners = this.listeners.get('*')
    if (wildcardListeners) {
      wildcardListeners.forEach(callback => {
        try {
          callback({ type, data })
        } catch (error) {
          console.error('Error in WebSocket wildcard listener:', error)
        }
      })
    }
  }

  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: new Date()
      }
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, message not sent:', type, data)
    }
  }

  subscribe(type: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }

    const typeListeners = this.listeners.get(type)!
    typeListeners.add(callback)

    // Return unsubscribe function
    return () => {
      typeListeners.delete(callback)
      if (typeListeners.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  // Convenience methods for common subscriptions
  subscribeToVehicleUpdates(callback: (vehicles: any[]) => void) {
    return this.subscribe('vehicle_positions', callback)
  }

  subscribeToTrafficUpdates(callback: (traffic: any) => void) {
    return this.subscribe('traffic_update', callback)
  }

  subscribeToRouteUpdates(callback: (routes: any[]) => void) {
    return this.subscribe('route_update', callback)
  }

  subscribeToAlerts(callback: (alert: any) => void) {
    return this.subscribe('alert', callback)
  }

  subscribeToWeatherUpdates(callback: (weather: any) => void) {
    return this.subscribe('weather_update', callback)
  }

  subscribeToCommunityUpdates(callback: (update: any) => void) {
    return this.subscribe('community_update', callback)
  }

  // Request specific data
  requestVehiclePositions(routeId?: string) {
    this.send('request_vehicles', { routeId })
  }

  requestTrafficData(area?: { lat: number, lng: number, radius: number }) {
    this.send('request_traffic', { area })
  }

  requestRouteUpdates(routeIds: string[]) {
    this.send('request_routes', { routeIds })
  }

  // Join/leave rooms for targeted updates
  joinRoom(room: string) {
    this.send('join_room', { room })
  }

  leaveRoom(room: string) {
    this.send('leave_room', { room })
  }

  // Get connection status
  getConnectionState() {
    return this.connectionState
  }

  isConnected() {
    return this.connectionState === 'connected' && this.ws?.readyState === WebSocket.OPEN
  }

  // Get connection statistics
  getStats() {
    return {
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      listenersCount: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0),
      activeSubscriptions: Array.from(this.listeners.keys())
    }
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService()

// Auto-connect in browser environment
if (typeof window !== 'undefined') {
  // Connect when the service is imported
  webSocketService.connect().catch(error => {
    console.warn('Initial WebSocket connection failed:', error)
  })

  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (!webSocketService.isConnected()) {
        webSocketService.connect().catch(error => {
          console.warn('WebSocket reconnection failed:', error)
        })
      }
    }
  })

  // Handle online/offline events
  window.addEventListener('online', () => {
    if (!webSocketService.isConnected()) {
      webSocketService.connect().catch(error => {
        console.warn('WebSocket reconnection on online event failed:', error)
      })
    }
  })

  window.addEventListener('offline', () => {
    webSocketService.disconnect()
  })
}