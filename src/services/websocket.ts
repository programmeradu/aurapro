import { MemoryLeakDetector } from '@/lib/memoryLeakFixes'
import { useStore } from '@/store/useStore'
import io from 'socket.io-client'

interface Vehicle {
  id: string
  route: string
  lat: number
  lng: number
  speed: number
  passengers: number
  capacity: number
  status: string
  lastUpdate: string
}

interface Route {
  id: string
  name: string
  status: string
}

interface KPI {
  id: string
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

interface Alert {
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  read: boolean
}

interface Scenario {
  id: string
  name: string
  description: string
}

interface Weather {
  is_rainy: boolean
  rain_intensity: string
}

interface Holiday {
  name: string
}

class WebSocketService {
  private socket: any = null
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10 // Increased for better reliability
  private reconnectDelay = 1000 // Start with 1 second
  private reconnectTimeout: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private connectionUrl: string = ''
  private memoryDetector = MemoryLeakDetector.getInstance()
  private isManualDisconnect = false

  // Auto-detect WebSocket URL based on current environment
  private getWebSocketUrl(): string {
    // Check if we're in development or production
    const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'

    if (isDev) {
      // In development, always use localhost:8002
      return 'http://localhost:8002'
    } else {
      // In production, use the same host but port 8002
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
      const hostname = window.location.hostname
      return `${protocol}//${hostname}:8002`
    }
  }

  connect(url?: string) {
    try {
      // Auto-detect WebSocket URL based on current environment
      const defaultUrl = this.getWebSocketUrl()
      const targetUrl = url || defaultUrl
      this.connectionUrl = targetUrl
      this.isManualDisconnect = false

      console.log('🔌 Attempting WebSocket connection to:', targetUrl)
      console.log('🌐 Current frontend URL:', window.location.href)
      console.log('🔍 Auto-detected WebSocket URL:', defaultUrl)

      // Clear any existing reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = null
      }

      this.connectionStatus = 'connecting'

      // Disconnect existing connection if any
      if (this.socket) {
        console.log('🔄 Disconnecting existing socket...')
        this.socket.disconnect()
        this.socket = null
      }

      this.socket = io(targetUrl, {
        transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
        reconnectionDelayMax: 15000,
        randomizationFactor: 0.3,
        upgrade: true,
        rememberUpgrade: false,
        // Additional options for better compatibility
        withCredentials: false, // Disable credentials for CORS
        extraHeaders: {
          'Access-Control-Allow-Origin': '*'
        }
      })

      this.setupEventListeners()
      useStore.getState().setConnectionStatus('connecting')
      console.log('🔄 WebSocket status set to connecting')

      // Connection will happen automatically due to autoConnect: true
      console.log('🚀 WebSocket connection will establish automatically')
    } catch (error) {
      console.error('❌ WebSocket connection initialization error:', error)
      useStore.getState().setConnectionStatus('disconnected')
    }
  }

  private setupEventListeners() {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully!')
      console.log('✅ Socket ID:', this.socket?.id)
      console.log('✅ Transport:', this.socket?.io.engine.transport.name)
      this.connectionStatus = 'connected'
      this.reconnectAttempts = 0 // Reset reconnect attempts on successful connection
      useStore.getState().setConnectionStatus('connected')
      useStore.getState().updateLastUpdate()

      // Start heartbeat to maintain connection
      this.startHeartbeat()
    })

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason)
      this.connectionStatus = 'disconnected'
      useStore.getState().setConnectionStatus('disconnected')

      // Clear heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
        this.heartbeatInterval = null
      }

      // Only try to reconnect for specific reasons, not all disconnects
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'transport error') {
        console.log('🔄 Server initiated disconnect, scheduling reconnect')
        this.scheduleReconnect()
      } else {
        console.log('🔄 Client initiated disconnect, no reconnect needed')
      }
    })

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ WebSocket connection error:', error)
      console.error('❌ Error details:', {
        message: error.message,
        type: error.constructor.name,
        stack: error.stack
      })
      console.error('❌ Socket state:', {
        connected: this.socket?.connected,
        disconnected: this.socket?.disconnected,
        transport: this.socket?.io?.engine?.transport?.name || 'unknown'
      })
      this.connectionStatus = 'error'
      useStore.getState().setConnectionStatus('error')

      // Schedule reconnect on connection error
      this.scheduleReconnect()
    })

    // Data events
    this.socket.on('vehicles_update', (vehicles: any[]) => {
      useStore.getState().setVehicles(vehicles as any)
      useStore.getState().updateLastUpdate()
    })

    this.socket.on('vehicle_update', ({ id, updates }: { id: string, updates: any }) => {
      useStore.getState().updateVehicle(id, updates as any)
      useStore.getState().updateLastUpdate()
    })

    this.socket.on('routes_update', (routes: any[]) => {
      useStore.getState().setRoutes(routes as any)
      useStore.getState().updateLastUpdate()
    })

    this.socket.on('route_update', ({ id, updates }: { id: string, updates: any }) => {
      useStore.getState().updateRoute(id, updates as any)
      useStore.getState().updateLastUpdate()
    })

    this.socket.on('kpis_update', (kpis: any[]) => {
      useStore.getState().setKPIs(kpis as any)
      useStore.getState().updateLastUpdate()
    })

    this.socket.on('trips_update', (trips: any[]) => {
      console.log('🚗 Received trips update:', trips?.length || 0, 'trips')
      useStore.getState().setTrips(trips as any)
      useStore.getState().updateLastUpdate()
    })

    this.socket.on('kpi_update', ({ id, updates }: { id: string, updates: any }) => {
      if (typeof updates.value === 'string') {
        updates.value = parseFloat(updates.value)
      }
      useStore.getState().updateKPI(id, updates as any)
      useStore.getState().updateLastUpdate()
    })

    this.socket.on('alert', (alert: any) => {
      useStore.getState().addAlert(alert as any)
      
      // Show browser notification if enabled
      if (useStore.getState().notifications && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(alert.title, {
            body: alert.message,
            icon: '/favicon.svg',
            tag: alert.type,
          })
        }
      }
    })

    this.socket.on('scenarios_update', (scenarios: any[]) => {
      useStore.getState().setScenarios(scenarios as any)
      useStore.getState().updateLastUpdate()
    })

    // Ghana-specific events
    this.socket.on('ghana_weather_update', (weather: any) => {
      // Handle weather updates that might affect transport
      if (weather.is_rainy && weather.rain_intensity === 'high') {
        useStore.getState().addAlert({
          type: 'warning',
          title: 'Heavy Rain Alert',
          message: 'Heavy rainfall detected in Accra. Expect traffic delays and potential flooding.',
          read: false,
        } as any)
      }
    })

    this.socket.on('ghana_holiday_alert', (holiday: any) => {
      useStore.getState().addAlert({
        type: 'info',
        title: 'Ghana Public Holiday',
        message: `Today is ${holiday.name}. Expect reduced transport services.`,
        read: false,
      } as any)
    })

    this.socket.on('crisis_scenario', (scenario: any) => {
      useStore.getState().addAlert({
        type: 'error',
        title: 'Crisis Alert',
        message: `${scenario.name}: ${scenario.description}`,
        read: false,
      } as any)
    })

    // ML/AI events (Phase 3)
    this.socket.on('ml_prediction', (prediction: any) => {
      const mlPrediction = {
        ...prediction,
        timestamp: new Date(prediction.timestamp)
      }
      useStore.getState().addMLPrediction(mlPrediction)
      useStore.getState().updateLastUpdate()
    })

    this.socket.on('anomaly_detected', (anomaly: any) => {
      const anomalyEvent = {
        ...anomaly,
        detected_at: new Date(anomaly.detected_at)
      }
      useStore.getState().addAnomaly(anomalyEvent)

      // Create alert for high severity anomalies
      if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
        useStore.getState().addAlert({
          type: anomaly.severity === 'critical' ? 'error' : 'warning',
          title: `Anomaly Detected: ${anomaly.title}`,
          message: anomaly.description,
          read: false,
        } as any)
      }

      useStore.getState().updateLastUpdate()
    })

    this.socket.on('ai_insights', (insights: any) => {
      // Add individual insights
      if (insights.insights) {
        Object.values(insights.insights).flat().forEach((insight: any) => {
          const aiInsight = {
            ...insight,
            timestamp: new Date(insight.timestamp || Date.now())
          }
          useStore.getState().addAIInsight(aiInsight)
        })
      }

      useStore.getState().updateLastUpdate()
    })

    this.socket.on('scenario_analysis', (analysis: any) => {
      const scenarioAnalysis = {
        ...analysis,
        timestamp: new Date()
      }
      useStore.getState().addScenarioAnalysis(scenarioAnalysis)
      useStore.getState().updateLastUpdate()
    })

    this.socket.on('cultural_insights', (insights: any) => {
      useStore.getState().setCulturalInsights(insights)
      useStore.getState().updateLastUpdate()
    })

    this.socket.on('economic_analysis', (analysis: any) => {
      useStore.getState().setEconomicAnalysis(analysis)
      useStore.getState().updateLastUpdate()
    })
  }

  // Removed handleReconnect - Socket.IO handles reconnection automatically

  // Emit events to server
  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event)
    }
  }

  // Scenario control
  activateScenario(scenarioId: string, parameters?: any) {
    this.emit('activate_scenario', { scenarioId, parameters })
  }

  deactivateScenario(scenarioId: string) {
    this.emit('deactivate_scenario', { scenarioId })
  }

  // Request data updates
  requestVehicleUpdate() {
    this.emit('request_vehicles')
  }

  requestRouteUpdate() {
    this.emit('request_routes')
  }

  requestKPIUpdate() {
    this.emit('request_kpis')
  }

  // Send user preferences
  updateUserPreferences(preferences: any) {
    this.emit('user_preferences', preferences)
  }

  disconnect() {
    this.isManualDisconnect = true
    this.connectionStatus = 'disconnected'

    console.log('🧹 WebSocket: Starting comprehensive cleanup...')

    // Clear all timers with memory leak prevention
    if (this.reconnectTimeout) {
      this.memoryDetector.clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.heartbeatInterval) {
      this.memoryDetector.clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...')

      // Remove all event listeners to prevent memory leaks
      this.socket.removeAllListeners()

      // Disconnect the socket
      this.socket.disconnect()
      this.socket = null

      useStore.getState().setConnectionStatus('disconnected')
      console.log('✅ WebSocket cleanup completed')
    }
  }

  private scheduleReconnect() {
    if (this.isManualDisconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('🚫 Not scheduling reconnect - manual disconnect or max attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000) // Max 30 seconds

    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isManualDisconnect) {
        console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
        this.connect(this.connectionUrl)
      }
    }, delay)
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping')
      }
    }, 30000) // Ping every 30 seconds
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getConnectionStatus(): string {
    if (!this.socket) return 'disconnected'
    if (this.socket.connected) return 'connected'
    if (this.socket.connecting) return 'connecting'
    return 'disconnected'
  }

  getSocket(): any {
    return this.socket
  }
}

// Singleton instance
export const websocketService = new WebSocketService()

// Hook for easy access in components
export const useWebSocket = () => {
  const connected = useStore((state) => state.connected)
  const connectionStatus = useStore((state) => state.connectionStatus)
  const lastUpdate = useStore((state) => state.lastUpdate)

  return {
    connected,
    connectionStatus,
    lastUpdate,
    connect: websocketService.connect.bind(websocketService),
    disconnect: websocketService.disconnect.bind(websocketService),
    emit: websocketService.emit.bind(websocketService),
    activateScenario: websocketService.activateScenario.bind(websocketService),
    deactivateScenario: websocketService.deactivateScenario.bind(websocketService),
    requestVehicleUpdate: websocketService.requestVehicleUpdate.bind(websocketService),
    requestRouteUpdate: websocketService.requestRouteUpdate.bind(websocketService),
    requestKPIUpdate: websocketService.requestKPIUpdate.bind(websocketService),
  }
}

// Export the service without auto-connecting
// Components will connect manually when needed
