/**
 * Enhanced WebSocket Service for AURA Mobile App
 * Connects to our unified backend with Socket.IO
 * Handles real-time vehicle tracking, ML insights, and KPI updates
 */

import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'

export interface VehicleUpdate {
  id: string
  updates: {
    lat: number
    lng: number
    speed: number
    passengers: number
    status: string
    lastUpdate: string
    ml_confidence?: number
    model_used?: string
  }
}

export interface KPIUpdate {
  id: string
  name: string
  value: number
  change: number
  trend: string
  unit: string
  category: string
}

export interface MLInsight {
  travel_time_accuracy: string
  traffic_prediction_accuracy: string
  models_active: number
  predictions_generated: number
  optimization_suggestions: number
  timestamp: string
}

export interface AnomalyAlert {
  id: string
  type: 'traffic' | 'vehicle' | 'route' | 'weather'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  location?: { lat: number; lng: number }
  timestamp: string
  recommendations?: string[]
}

class EnhancedWebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectInterval = 5000
  private isConnecting = false
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'

  constructor() {
    this.setupEventListeners()
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve()
    }

    if (this.isConnecting) {
      return Promise.reject(new Error('Already connecting'))
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true
        this.connectionState = 'connecting'

        // Connect to our unified backend Socket.IO server
        const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        
        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectInterval,
          forceNew: true
        })

        this.socket.on('connect', () => {
          console.log('✅ Connected to AURA backend WebSocket')
          this.connectionState = 'connected'
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.emit('connection_status', { status: 'connected' })
          resolve()
        })

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Disconnected from AURA backend:', reason)
          this.connectionState = 'disconnected'
          this.emit('connection_status', { status: 'disconnected', reason })
        })

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error)
          this.connectionState = 'error'
          this.isConnecting = false
          this.emit('connection_status', { status: 'error', error: error.message })
          reject(error)
        })

        // Set up real-time event handlers
        this.setupRealTimeHandlers()

      } catch (error) {
        this.isConnecting = false
        this.connectionState = 'error'
        reject(error)
      }
    })
  }

  private setupRealTimeHandlers(): void {
    if (!this.socket) return

    // Vehicle updates from our backend
    this.socket.on('vehicle_update', (data: VehicleUpdate) => {
      this.emit('vehicle_update', data)
    })

    // Bulk vehicle updates
    this.socket.on('vehicles_update', (vehicles: any[]) => {
      this.emit('vehicles_update', vehicles)
    })

    // KPI updates from our ML models
    this.socket.on('kpis_update', (kpis: KPIUpdate[]) => {
      this.emit('kpis_update', kpis)
    })

    // ML insights from our advanced models
    this.socket.on('ml_insights', (insights: MLInsight) => {
      this.emit('ml_insights', insights)
    })

    // Anomaly detection alerts
    this.socket.on('anomaly_detected', (alert: AnomalyAlert) => {
      this.emit('anomaly_detected', alert)
    })

    // Route optimization updates
    this.socket.on('route_optimized', (optimization: any) => {
      this.emit('route_optimized', optimization)
    })

    // Traffic prediction updates
    this.socket.on('traffic_update', (traffic: any) => {
      this.emit('traffic_update', traffic)
    })

    // Weather impact alerts
    this.socket.on('weather_alert', (weather: any) => {
      this.emit('weather_alert', weather)
    })
  }

  private setupEventListeners(): void {
    // Handle page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.connectionState === 'disconnected') {
          this.reconnect()
        }
      })
    }

    // Handle online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.connectionState === 'disconnected') {
          this.reconnect()
        }
      })

      window.addEventListener('offline', () => {
        this.disconnect()
      })
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.connectionState = 'disconnected'
    this.isConnecting = false
    this.emit('connection_status', { status: 'disconnected' })
  }

  private async reconnect(): Promise<void> {
    if (this.isConnecting || this.connectionState === 'connected') {
      return
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached')
      this.emit('connection_status', { status: 'error', error: 'Max reconnection attempts reached' })
      return
    }

    this.reconnectAttempts++
    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

    try {
      await this.connect()
    } catch (error) {
      console.error('Reconnection failed:', error)
      setTimeout(() => this.reconnect(), this.reconnectInterval)
    }
  }

  // Event listener management
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  // Request specific data from backend
  requestVehicles(): void {
    if (this.socket?.connected) {
      this.socket.emit('request_vehicles')
    }
  }

  requestKPIs(): void {
    if (this.socket?.connected) {
      this.socket.emit('request_kpis')
    }
  }

  requestMLInsights(): void {
    if (this.socket?.connected) {
      this.socket.emit('request_ml_insights')
    }
  }

  // Send commands to backend
  optimizeRoute(routeData: any): void {
    if (this.socket?.connected) {
      this.socket.emit('optimize_route', routeData)
    }
  }

  reportIssue(issue: any): void {
    if (this.socket?.connected) {
      this.socket.emit('report_issue', issue)
    }
  }

  // Getters
  get isConnected(): boolean {
    return this.socket?.connected || false
  }

  get status(): string {
    return this.connectionState
  }

  get connectedClients(): number {
    return this.socket?.connected ? 1 : 0
  }
}

// Export singleton instance
export const enhancedWebSocketService = new EnhancedWebSocketService()
export default enhancedWebSocketService
