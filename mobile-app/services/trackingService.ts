/**
 * 🚌 Real-time Transport Tracking Service
 * Crowdsourced vehicle tracking for Ghana's transport system
 */

import { 
  GeoPoint, 
  JourneyTracking, 
  VehicleLocation, 
  CrowdsourcedUpdate,
  NearbyVehiclesResponse,
  JourneyPrediction,
  TransportRoute,
  Vehicle
} from '@/types/transport'

class TransportTrackingService {
  private apiUrl: string
  private wsConnection: WebSocket | null = null
  private currentJourney: JourneyTracking | null = null
  private locationWatchId: number | null = null
  private isTracking: boolean = false

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }

  /**
   * 📍 Start tracking user's journey
   */
  async startJourneyTracking(params: {
    vehicleId: string
    routeId: string
    boardingStopId: string
    shareLocation: boolean
  }): Promise<JourneyTracking> {
    try {
      // Get current location
      const location = await this.getCurrentLocation()
      
      const journeyData = {
        vehicleId: params.vehicleId,
        routeId: params.routeId,
        boardingStopId: params.boardingStopId,
        boardingLocation: location,
        shareLocation: params.shareLocation,
        timestamp: new Date().toISOString()
      }

      const response = await fetch(`${this.apiUrl}/api/v1/tracking/journey/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(journeyData)
      })

      if (!response.ok) {
        throw new Error('Failed to start journey tracking')
      }

      const journey: JourneyTracking = await response.json()
      this.currentJourney = journey

      // Start location tracking if user consented
      if (params.shareLocation) {
        this.startLocationTracking()
      }

      // Connect to real-time updates
      this.connectWebSocket()

      return journey
    } catch (error) {
      console.error('Error starting journey tracking:', error)
      throw error
    }
  }

  /**
   * 📍 Update current location during journey
   */
  private startLocationTracking() {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported')
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // 30 seconds
    }

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: GeoPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        }

        this.updateLocation(location)
      },
      (error) => {
        console.error('Location tracking error:', error)
        // Continue tracking with reduced accuracy
      },
      options
    )

    this.isTracking = true
  }

  /**
   * 📍 Send location update to server
   */
  private async updateLocation(location: GeoPoint) {
    if (!this.currentJourney) return

    try {
      const updateData = {
        journeyId: this.currentJourney.id,
        location,
        timestamp: new Date().toISOString()
      }

      // Send via WebSocket for real-time updates
      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          type: 'location_update',
          data: updateData
        }))
      } else {
        // Fallback to HTTP API
        await fetch(`${this.apiUrl}/api/v1/tracking/location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify(updateData)
        })
      }
    } catch (error) {
      console.error('Error updating location:', error)
      // Store locally for retry
      this.storeLocationOffline(location)
    }
  }

  /**
   * 🚌 End journey tracking
   */
  async endJourneyTracking(params: {
    alightingStopId: string
    fareAmount?: number
    rating?: number
    feedback?: string
  }): Promise<void> {
    if (!this.currentJourney) {
      throw new Error('No active journey to end')
    }

    try {
      const location = await this.getCurrentLocation()
      
      const endData = {
        journeyId: this.currentJourney.id,
        alightingStopId: params.alightingStopId,
        alightingLocation: location,
        fareAmount: params.fareAmount,
        rating: params.rating,
        feedback: params.feedback,
        timestamp: new Date().toISOString()
      }

      await fetch(`${this.apiUrl}/api/v1/tracking/journey/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(endData)
      })

      // Stop location tracking
      this.stopLocationTracking()
      
      // Disconnect WebSocket
      this.disconnectWebSocket()
      
      this.currentJourney = null
    } catch (error) {
      console.error('Error ending journey:', error)
      throw error
    }
  }

  /**
   * 🚌 Get nearby vehicles
   */
  async getNearbyVehicles(params: {
    location: GeoPoint
    radius?: number // meters, default 1000
    routeIds?: string[]
  }): Promise<NearbyVehiclesResponse> {
    try {
      const queryParams = new URLSearchParams({
        lat: params.location.latitude.toString(),
        lng: params.location.longitude.toString(),
        radius: (params.radius || 1000).toString()
      })

      if (params.routeIds?.length) {
        queryParams.append('routes', params.routeIds.join(','))
      }

      const response = await fetch(
        `${this.apiUrl}/api/v1/tracking/nearby?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch nearby vehicles')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching nearby vehicles:', error)
      throw error
    }
  }

  /**
   * 🔮 Get journey predictions
   */
  async getJourneyPrediction(params: {
    originStopId: string
    destinationStopId: string
    departureTime?: Date
  }): Promise<JourneyPrediction> {
    try {
      const queryParams = new URLSearchParams({
        origin: params.originStopId,
        destination: params.destinationStopId
      })

      if (params.departureTime) {
        queryParams.append('departure', params.departureTime.toISOString())
      }

      const response = await fetch(
        `${this.apiUrl}/api/v1/tracking/predict?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get journey prediction')
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting journey prediction:', error)
      throw error
    }
  }

  /**
   * 📝 Submit crowdsourced update
   */
  async submitUpdate(update: Omit<CrowdsourcedUpdate, 'id' | 'timestamp' | 'deviceInfo'>): Promise<void> {
    try {
      const updateData = {
        ...update,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          platform: navigator.platform,
          version: navigator.userAgent,
          connectivity: this.getConnectionType()
        }
      }

      await fetch(`${this.apiUrl}/api/v1/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(updateData)
      })
    } catch (error) {
      console.error('Error submitting update:', error)
      // Store offline for retry
      this.storeUpdateOffline(update)
    }
  }

  /**
   * 🌐 WebSocket connection for real-time updates
   */
  private connectWebSocket() {
    try {
      const wsUrl = this.apiUrl.replace('http', 'ws') + '/ws/tracking'
      this.wsConnection = new WebSocket(wsUrl)

      this.wsConnection.onopen = () => {
        console.log('WebSocket connected')
        // Send authentication
        this.wsConnection?.send(JSON.stringify({
          type: 'auth',
          token: this.getAuthToken()
        }))
      }

      this.wsConnection.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleWebSocketMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.wsConnection.onclose = () => {
        console.log('WebSocket disconnected')
        // Attempt to reconnect after delay
        setTimeout(() => {
          if (this.currentJourney) {
            this.connectWebSocket()
          }
        }, 5000)
      }

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Error connecting WebSocket:', error)
    }
  }

  private handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'vehicle_update':
        // Handle real-time vehicle location updates
        this.onVehicleUpdate?.(message.data)
        break
      case 'route_alert':
        // Handle route alerts and notifications
        this.onRouteAlert?.(message.data)
        break
      case 'journey_update':
        // Handle journey-specific updates
        this.onJourneyUpdate?.(message.data)
        break
    }
  }

  private disconnectWebSocket() {
    if (this.wsConnection) {
      this.wsConnection.close()
      this.wsConnection = null
    }
  }

  /**
   * 📍 Get current location
   */
  private getCurrentLocation(): Promise<GeoPoint> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          })
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  private stopLocationTracking() {
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId)
      this.locationWatchId = null
    }
    this.isTracking = false
  }

  private getAuthToken(): string {
    // Get from localStorage or cookie
    return localStorage.getItem('auth_token') || ''
  }

  private getConnectionType(): string {
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    return connection?.effectiveType || 'unknown'
  }

  private storeLocationOffline(location: GeoPoint) {
    const offlineData = JSON.parse(localStorage.getItem('offline_locations') || '[]')
    offlineData.push({
      journeyId: this.currentJourney?.id,
      location,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('offline_locations', JSON.stringify(offlineData))
  }

  private storeUpdateOffline(update: any) {
    const offlineData = JSON.parse(localStorage.getItem('offline_updates') || '[]')
    offlineData.push({
      ...update,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('offline_updates', JSON.stringify(offlineData))
  }

  /**
   * 📡 Sync offline data when connection restored
   */
  async syncOfflineData() {
    try {
      // Sync offline locations
      const offlineLocations = JSON.parse(localStorage.getItem('offline_locations') || '[]')
      for (const locationData of offlineLocations) {
        await this.updateLocation(locationData.location)
      }
      localStorage.removeItem('offline_locations')

      // Sync offline updates
      const offlineUpdates = JSON.parse(localStorage.getItem('offline_updates') || '[]')
      for (const update of offlineUpdates) {
        await this.submitUpdate(update)
      }
      localStorage.removeItem('offline_updates')
    } catch (error) {
      console.error('Error syncing offline data:', error)
    }
  }

  // Event handlers (can be overridden)
  onVehicleUpdate?: (data: VehicleLocation) => void
  onRouteAlert?: (data: any) => void
  onJourneyUpdate?: (data: any) => void

  // Getters
  get isCurrentlyTracking(): boolean {
    return this.isTracking
  }

  get activeJourney(): JourneyTracking | null {
    return this.currentJourney
  }
}

// Export singleton instance
export const trackingService = new TransportTrackingService()
export default trackingService
