/**
 * 🔄 Real-time Recommendation Service
 * Handles WebSocket connections and live recommendation updates
 */

import { personalizedRecommendationService, PersonalizedRecommendation, RecommendationContext } from './personalizedRecommendationService'
import { GeoPoint } from '@/types/transport'

interface RealtimeUpdate {
  type: 'recommendation_update' | 'context_change' | 'model_update' | 'user_action'
  data: any
  timestamp: string
  userId: string
}

interface WebSocketMessage {
  event: string
  data: any
  userId: string
}

class RealtimeRecommendationService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnected = false
  private messageQueue: WebSocketMessage[] = []
  private subscribers: Map<string, Set<(data: any) => void>> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private lastHeartbeat = Date.now()

  constructor(private baseUrl: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8002') {}

  /**
   * Initialize WebSocket connection
   */
  async connect(userId: string): Promise<void> {
    if (this.ws && this.isConnected) {
      return
    }

    try {
      const wsUrl = `${this.baseUrl}/ws/recommendations/${userId}`
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('🔄 Real-time recommendations connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.flushMessageQueue()
        this.emit('connection', { status: 'connected' })
      }

      this.ws.onmessage = (event) => {
        try {
          const message: RealtimeUpdate = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('🔄 Real-time recommendations disconnected:', event.code)
        this.isConnected = false
        this.stopHeartbeat()
        this.emit('connection', { status: 'disconnected', code: event.code })
        
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(userId)
        }
      }

      this.ws.onerror = (error) => {
        console.error('🔄 WebSocket error:', error)
        this.emit('error', { error })
      }

    } catch (error) {
      console.error('Failed to connect to real-time service:', error)
      throw error
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.isConnected = false
    this.stopHeartbeat()
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: RealtimeUpdate): void {
    this.lastHeartbeat = Date.now()

    switch (message.type) {
      case 'recommendation_update':
        this.handleRecommendationUpdate(message.data)
        break
      case 'context_change':
        this.handleContextChange(message.data)
        break
      case 'model_update':
        this.handleModelUpdate(message.data)
        break
      case 'user_action':
        this.handleUserAction(message.data)
        break
      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  /**
   * Handle recommendation updates
   */
  private handleRecommendationUpdate(data: any): void {
    const { recommendations, context, reason } = data
    
    console.log(`🎯 Recommendation update: ${reason}`)
    this.emit('recommendations_updated', {
      recommendations,
      context,
      reason,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Handle context changes
   */
  private handleContextChange(data: any): void {
    const { context, changes } = data
    
    console.log('🌍 Context changed:', changes)
    this.emit('context_changed', {
      context,
      changes,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Handle model updates
   */
  private handleModelUpdate(data: any): void {
    const { modelVersion, improvements, metrics } = data
    
    console.log(`🧠 Model updated to version ${modelVersion}`)
    this.emit('model_updated', {
      modelVersion,
      improvements,
      metrics,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Handle user actions from other sessions
   */
  private handleUserAction(data: any): void {
    const { action, recommendationId, feedback } = data
    
    this.emit('user_action', {
      action,
      recommendationId,
      feedback,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Send context update to server
   */
  sendContextUpdate(userId: string, context: Partial<RecommendationContext>): void {
    const message: WebSocketMessage = {
      event: 'context_update',
      data: { context },
      userId
    }

    this.sendMessage(message)
  }

  /**
   * Send user feedback
   */
  sendFeedback(userId: string, recommendationId: string, feedback: any): void {
    const message: WebSocketMessage = {
      event: 'user_feedback',
      data: {
        recommendationId,
        feedback,
        timestamp: new Date().toISOString()
      },
      userId
    }

    this.sendMessage(message)
  }

  /**
   * Request fresh recommendations
   */
  requestRecommendations(userId: string, context?: Partial<RecommendationContext>): void {
    const message: WebSocketMessage = {
      event: 'request_recommendations',
      data: { context },
      userId
    }

    this.sendMessage(message)
  }

  /**
   * Send message via WebSocket
   */
  private sendMessage(message: WebSocketMessage): void {
    if (this.isConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(message))
      } catch (error) {
        console.error('Error sending WebSocket message:', error)
        this.messageQueue.push(message)
      }
    } else {
      this.messageQueue.push(message)
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()
      if (message) {
        this.sendMessage(message)
      }
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(userId: string): void {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      this.connect(userId).catch(error => {
        console.error('Reconnection failed:', error)
      })
    }, delay)
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        // Check if we've received a message recently
        const timeSinceLastMessage = Date.now() - this.lastHeartbeat
        if (timeSinceLastMessage > 30000) { // 30 seconds
          console.warn('🔄 No heartbeat received, connection may be stale')
        }

        // Send ping
        try {
          this.ws.send(JSON.stringify({ event: 'ping', timestamp: Date.now() }))
        } catch (error) {
          console.error('Error sending heartbeat:', error)
        }
      }
    }, 15000) // Send heartbeat every 15 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set())
    }
    
    this.subscribers.get(event)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const eventSubscribers = this.subscribers.get(event)
      if (eventSubscribers) {
        eventSubscribers.delete(callback)
        if (eventSubscribers.size === 0) {
          this.subscribers.delete(event)
        }
      }
    }
  }

  /**
   * Emit event to subscribers
   */
  private emit(event: string, data: any): void {
    const eventSubscribers = this.subscribers.get(event)
    if (eventSubscribers) {
      eventSubscribers.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  /**
   * Enable location-based recommendations
   */
  enableLocationUpdates(userId: string): void {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location: GeoPoint = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }

          this.sendContextUpdate(userId, {
            currentLocation: location,
            locationAccuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // 1 minute
        }
      )

      // Store watch ID for cleanup
      ;(this as any).locationWatchId = watchId
    }
  }

  /**
   * Disable location updates
   */
  disableLocationUpdates(): void {
    if ((this as any).locationWatchId) {
      navigator.geolocation.clearWatch((this as any).locationWatchId)
      delete (this as any).locationWatchId
    }
  }
}

// Export singleton instance
export const realtimeRecommendationService = new RealtimeRecommendationService()
export default realtimeRecommendationService