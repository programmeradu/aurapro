/**
 * 🔌 Enhanced WebSocket Connection Manager
 * Advanced connection handling, intelligent reconnection, and robust error recovery
 */

import { useStore } from '@/store/useStore'
import { MemoryLeakDetector } from './memoryLeakFixes'

export interface WebSocketConfig {
  maxReconnectAttempts: number
  baseReconnectDelay: number
  maxReconnectDelay: number
  heartbeatInterval: number
  connectionTimeout: number
  enableFallback: boolean
  fallbackUrls: string[]
  enableMetrics: boolean
}

export interface ConnectionMetrics {
  totalConnections: number
  successfulConnections: number
  failedConnections: number
  reconnectionAttempts: number
  averageConnectionTime: number
  lastConnectionTime: Date | null
  uptime: number
  dataTransferred: number
  messagesReceived: number
  messagesSent: number
}

export interface WebSocketState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'fallback'
  url: string | null
  lastError: Error | null
  reconnectAttempts: number
  isManualDisconnect: boolean
  connectionStartTime: Date | null
  lastHeartbeat: Date | null
}

export class EnhancedWebSocketManager {
  private socket: any = null
  private config: WebSocketConfig
  private state: WebSocketState
  private metrics: ConnectionMetrics
  private memoryDetector: MemoryLeakDetector
  
  // Timers and intervals
  private reconnectTimeout: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private connectionTimeoutTimer: NodeJS.Timeout | null = null
  private metricsInterval: NodeJS.Timeout | null = null
  
  // Event handlers
  private eventHandlers: Map<string, Function[]> = new Map()
  private messageQueue: Array<{ event: string; data: any }> = []
  
  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      maxReconnectAttempts: 10,
      baseReconnectDelay: 1000,
      maxReconnectDelay: 30000,
      heartbeatInterval: 30000,
      connectionTimeout: 15000,
      enableFallback: true,
      fallbackUrls: [
        'http://localhost:8002',
        'http://127.0.0.1:8002',
        'ws://localhost:8002',
        'ws://127.0.0.1:8002'
      ],
      enableMetrics: true,
      ...config
    }
    
    this.state = {
      status: 'disconnected',
      url: null,
      lastError: null,
      reconnectAttempts: 0,
      isManualDisconnect: false,
      connectionStartTime: null,
      lastHeartbeat: null
    }
    
    this.metrics = {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      reconnectionAttempts: 0,
      averageConnectionTime: 0,
      lastConnectionTime: null,
      uptime: 0,
      dataTransferred: 0,
      messagesReceived: 0,
      messagesSent: 0
    }
    
    this.memoryDetector = MemoryLeakDetector.getInstance()
    
    if (this.config.enableMetrics) {
      this.startMetricsCollection()
    }
  }

  async connect(url?: string): Promise<boolean> {
    try {
      this.state.isManualDisconnect = false
      this.state.connectionStartTime = new Date()
      this.metrics.totalConnections++
      
      // Determine connection URL
      const targetUrl = url || this.getOptimalUrl()
      this.state.url = targetUrl
      this.state.status = 'connecting'
      
      console.log('🔌 Enhanced WebSocket: Starting connection to', targetUrl)
      this.updateStoreStatus('connecting')
      
      // Clear existing connection
      await this.disconnect(false)
      
      // Set connection timeout
      this.setConnectionTimeout()
      
      // Attempt connection with fallback
      const connected = await this.attemptConnection(targetUrl)
      
      if (connected) {
        this.onConnectionSuccess()
        return true
      } else if (this.config.enableFallback) {
        return await this.tryFallbackConnections()
      }
      
      return false
      
    } catch (error) {
      this.onConnectionError(error as Error)
      return false
    }
  }

  private async attemptConnection(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Dynamic import to handle Socket.IO
        import('socket.io-client').then(({ io }) => {
          this.socket = io(url, {
            transports: ['polling', 'websocket'],
            timeout: this.config.connectionTimeout,
            forceNew: true,
            autoConnect: false,
            reconnection: false, // We handle reconnection manually
            upgrade: true,
            rememberUpgrade: false,
            withCredentials: false
          })
          
          // Set up one-time connection handlers
          const onConnect = () => {
            this.socket.off('connect', onConnect)
            this.socket.off('connect_error', onConnectError)
            resolve(true)
          }
          
          const onConnectError = (error: Error) => {
            this.socket.off('connect', onConnect)
            this.socket.off('connect_error', onConnectError)
            console.warn('🔌 Connection attempt failed:', error.message)
            resolve(false)
          }
          
          this.socket.on('connect', onConnect)
          this.socket.on('connect_error', onConnectError)
          
          // Start connection
          this.socket.connect()
          
        }).catch((error) => {
          console.error('🔌 Failed to import socket.io-client:', error)
          resolve(false)
        })
        
      } catch (error) {
        console.error('🔌 Connection attempt error:', error)
        resolve(false)
      }
    })
  }

  private async tryFallbackConnections(): Promise<boolean> {
    console.log('🔄 Trying fallback connections...')
    this.state.status = 'fallback'
    this.updateStoreStatus('connecting')
    
    for (const fallbackUrl of this.config.fallbackUrls) {
      if (fallbackUrl === this.state.url) continue // Skip already tried URL
      
      console.log(`🔄 Attempting fallback connection to: ${fallbackUrl}`)
      const connected = await this.attemptConnection(fallbackUrl)
      
      if (connected) {
        this.state.url = fallbackUrl
        this.onConnectionSuccess()
        return true
      }
      
      // Wait between attempts
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log('❌ All fallback connections failed')
    this.onConnectionError(new Error('All connection attempts failed'))
    return false
  }

  private onConnectionSuccess(): void {
    this.clearConnectionTimeout()
    this.state.status = 'connected'
    this.state.lastError = null
    this.state.reconnectAttempts = 0
    this.metrics.successfulConnections++
    this.metrics.lastConnectionTime = new Date()
    
    // Calculate connection time
    if (this.state.connectionStartTime) {
      const connectionTime = Date.now() - this.state.connectionStartTime.getTime()
      this.updateAverageConnectionTime(connectionTime)
    }
    
    console.log('✅ Enhanced WebSocket: Connected successfully to', this.state.url)
    this.updateStoreStatus('connected')
    
    // Set up event handlers
    this.setupEventHandlers()
    
    // Start heartbeat
    this.startHeartbeat()
    
    // Process queued messages
    this.processMessageQueue()
    
    // Emit connection event
    this.emit('connection_established', { url: this.state.url })
  }

  private onConnectionError(error: Error): void {
    this.clearConnectionTimeout()
    this.state.status = 'error'
    this.state.lastError = error
    this.metrics.failedConnections++
    
    console.error('❌ Enhanced WebSocket: Connection error:', error.message)
    this.updateStoreStatus('error')
    
    // Schedule reconnection if not manual disconnect
    if (!this.state.isManualDisconnect) {
      this.scheduleReconnection()
    }
    
    // Emit error event
    this.emit('connection_error', { error, url: this.state.url })
  }

  private setupEventHandlers(): void {
    if (!this.socket) return
    
    // Connection events
    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 WebSocket disconnected:', reason)
      this.state.status = 'disconnected'
      this.updateStoreStatus('disconnected')
      
      if (!this.state.isManualDisconnect && reason !== 'io client disconnect') {
        this.scheduleReconnection()
      }
      
      this.emit('disconnected', { reason })
    })
    
    this.socket.on('connect_error', (error: Error) => {
      this.onConnectionError(error)
    })
    
    this.socket.on('error', (error: Error) => {
      console.error('🔌 WebSocket error:', error)
      this.state.lastError = error
      this.emit('error', { error })
    })
    
    // Heartbeat response
    this.socket.on('pong', () => {
      this.state.lastHeartbeat = new Date()
    })
    
    // Data events
    this.setupDataEventHandlers()
  }

  private setupDataEventHandlers(): void {
    if (!this.socket) return
    
    // Vehicle updates
    this.socket.on('vehicles_update', (vehicles: any[]) => {
      this.metrics.messagesReceived++
      this.metrics.dataTransferred += JSON.stringify(vehicles).length
      useStore.getState().setVehicles(vehicles as any)
      useStore.getState().updateLastUpdate()
      this.emit('vehicles_update', vehicles)
    })
    
    // KPI updates
    this.socket.on('kpi_update', (kpis: any) => {
      this.metrics.messagesReceived++
      useStore.getState().setKpis(kpis)
      useStore.getState().updateLastUpdate()
      this.emit('kpi_update', kpis)
    })
    
    // Route updates
    this.socket.on('routes_update', (routes: any[]) => {
      this.metrics.messagesReceived++
      useStore.getState().setRoutes(routes)
      useStore.getState().updateLastUpdate()
      this.emit('routes_update', routes)
    })
    
    // Performance updates
    this.socket.on('performance_update', (performance: any) => {
      this.metrics.messagesReceived++
      useStore.getState().setPerformance(performance)
      useStore.getState().updateLastUpdate()
      this.emit('performance_update', performance)
    })
    
    // Economic analysis
    this.socket.on('economic_analysis', (analysis: any) => {
      this.metrics.messagesReceived++
      useStore.getState().setEconomicAnalysis(analysis)
      useStore.getState().updateLastUpdate()
      this.emit('economic_analysis', analysis)
    })
  }

  private scheduleReconnection(): void {
    if (this.state.isManualDisconnect || 
        this.state.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.log('🚫 Not scheduling reconnection - manual disconnect or max attempts reached')
      return
    }
    
    this.state.status = 'reconnecting'
    this.state.reconnectAttempts++
    this.metrics.reconnectionAttempts++
    
    // Exponential backoff with jitter
    const baseDelay = this.config.baseReconnectDelay
    const exponentialDelay = Math.min(
      baseDelay * Math.pow(2, this.state.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    )
    const jitter = Math.random() * 1000 // Add up to 1 second jitter
    const delay = exponentialDelay + jitter
    
    console.log(`🔄 Scheduling reconnection attempt ${this.state.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${Math.round(delay)}ms`)
    this.updateStoreStatus('reconnecting')
    
    this.reconnectTimeout = this.memoryDetector.trackTimeout(setTimeout(() => {
      if (!this.state.isManualDisconnect) {
        console.log(`🔄 Reconnection attempt ${this.state.reconnectAttempts}/${this.config.maxReconnectAttempts}`)
        this.connect(this.state.url || undefined)
      }
    }, delay))
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    this.heartbeatInterval = this.memoryDetector.trackInterval(setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping')
        
        // Check if heartbeat response is overdue
        if (this.state.lastHeartbeat) {
          const timeSinceLastHeartbeat = Date.now() - this.state.lastHeartbeat.getTime()
          if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 2) {
            console.warn('🔌 Heartbeat timeout detected, reconnecting...')
            this.connect(this.state.url || undefined)
          }
        }
      }
    }, this.config.heartbeatInterval))
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      this.memoryDetector.clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private setConnectionTimeout(): void {
    this.clearConnectionTimeout()
    
    this.connectionTimeoutTimer = this.memoryDetector.trackTimeout(setTimeout(() => {
      console.warn('🔌 Connection timeout reached')
      this.onConnectionError(new Error('Connection timeout'))
    }, this.config.connectionTimeout))
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeoutTimer) {
      this.memoryDetector.clearTimeout(this.connectionTimeoutTimer)
      this.connectionTimeoutTimer = null
    }
  }

  private getOptimalUrl(): string {
    // Smart URL detection based on current environment
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const hostname = window.location.hostname
      
      // Try same host first
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `${protocol}//${hostname}:8002`
      }
    }
    
    return this.config.fallbackUrls[0]
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const { event, data } = this.messageQueue.shift()!
      this.send(event, data)
    }
  }

  private updateStoreStatus(status: string): void {
    useStore.getState().setConnectionStatus(status as any)
  }

  private updateAverageConnectionTime(connectionTime: number): void {
    const totalConnections = this.metrics.successfulConnections
    const currentAverage = this.metrics.averageConnectionTime
    this.metrics.averageConnectionTime = 
      ((currentAverage * (totalConnections - 1)) + connectionTime) / totalConnections
  }

  private startMetricsCollection(): void {
    this.metricsInterval = this.memoryDetector.trackInterval(setInterval(() => {
      if (this.state.status === 'connected' && this.metrics.lastConnectionTime) {
        this.metrics.uptime = Date.now() - this.metrics.lastConnectionTime.getTime()
      }
    }, 60000)) // Update every minute
  }

  // Public API
  async disconnect(manual: boolean = true): Promise<void> {
    this.state.isManualDisconnect = manual
    this.state.status = 'disconnected'
    
    // Clear all timers
    this.clearConnectionTimeout()
    this.stopHeartbeat()
    
    if (this.reconnectTimeout) {
      this.memoryDetector.clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    // Disconnect socket
    if (this.socket) {
      try {
        this.socket.removeAllListeners()
        this.socket.disconnect()
      } catch (error) {
        console.warn('🔌 Error during socket disconnect:', error)
      }
      this.socket = null
    }
    
    this.updateStoreStatus('disconnected')
    console.log('🔌 Enhanced WebSocket: Disconnected')
  }

  send(event: string, data?: any): boolean {
    if (this.socket?.connected) {
      try {
        this.socket.emit(event, data)
        this.metrics.messagesSent++
        this.metrics.dataTransferred += JSON.stringify({ event, data }).length
        return true
      } catch (error) {
        console.error('🔌 Failed to send message:', error)
        return false
      }
    } else {
      // Queue message for later
      this.messageQueue.push({ event, data })
      console.warn('🔌 Message queued (not connected):', event)
      return false
    }
  }

  // Event system
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler?: Function): void {
    if (!this.eventHandlers.has(event)) return
    
    if (handler) {
      const handlers = this.eventHandlers.get(event)!
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    } else {
      this.eventHandlers.delete(event)
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`🔌 Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  // Getters
  getState(): WebSocketState {
    return { ...this.state }
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics }
  }

  isConnected(): boolean {
    return this.state.status === 'connected' && this.socket?.connected
  }

  // Cleanup
  destroy(): void {
    this.disconnect(true)
    
    if (this.metricsInterval) {
      this.memoryDetector.clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }
    
    this.eventHandlers.clear()
    this.messageQueue.length = 0
  }
}

// React hooks for enhanced WebSocket management
import { useCallback, useEffect, useRef, useState } from 'react'

export const useEnhancedWebSocket = (config?: Partial<WebSocketConfig>) => {
  const [connectionState, setConnectionState] = useState<WebSocketState>({
    status: 'disconnected',
    url: null,
    lastError: null,
    reconnectAttempts: 0,
    isManualDisconnect: false,
    connectionStartTime: null,
    lastHeartbeat: null
  })

  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    totalConnections: 0,
    successfulConnections: 0,
    failedConnections: 0,
    reconnectionAttempts: 0,
    averageConnectionTime: 0,
    lastConnectionTime: null,
    uptime: 0,
    dataTransferred: 0,
    messagesReceived: 0,
    messagesSent: 0
  })

  const managerRef = useRef<EnhancedWebSocketManager | null>(null)

  // Initialize manager
  useEffect(() => {
    managerRef.current = new EnhancedWebSocketManager(config)

    // Set up state listeners
    const updateState = () => {
      setConnectionState(managerRef.current!.getState())
      setMetrics(managerRef.current!.getMetrics())
    }

    // Listen to connection events
    managerRef.current.on('connection_established', updateState)
    managerRef.current.on('connection_error', updateState)
    managerRef.current.on('disconnected', updateState)

    // Update state periodically
    const stateInterval = setInterval(updateState, 1000)

    return () => {
      clearInterval(stateInterval)
      if (managerRef.current) {
        managerRef.current.destroy()
      }
    }
  }, [])

  const connect = useCallback(async (url?: string) => {
    if (managerRef.current) {
      return await managerRef.current.connect(url)
    }
    return false
  }, [])

  const disconnect = useCallback(async () => {
    if (managerRef.current) {
      await managerRef.current.disconnect(true)
    }
  }, [])

  const send = useCallback((event: string, data?: any) => {
    if (managerRef.current) {
      return managerRef.current.send(event, data)
    }
    return false
  }, [])

  const subscribe = useCallback((event: string, handler: Function) => {
    if (managerRef.current) {
      managerRef.current.on(event, handler)
    }
  }, [])

  const unsubscribe = useCallback((event: string, handler?: Function) => {
    if (managerRef.current) {
      managerRef.current.off(event, handler)
    }
  }, [])

  return {
    connectionState,
    metrics,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    isConnected: connectionState.status === 'connected'
  }
}

// Singleton instance
export const enhancedWebSocketManager = new EnhancedWebSocketManager()
export default enhancedWebSocketManager
