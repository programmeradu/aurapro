/**
 * 🧭 Journey Planning Service
 * Intelligent route planning and optimization for Ghana's transport system
 */

import {
  JourneyRequest,
  JourneyPlan,
  JourneyOption,
  JourneyPlanResponse,
  PopularDestinationsResponse,
  FareEstimateResponse,
  SavedJourney,
  JourneyHistory,
  JourneyPreferences,
  PopularDestination
} from '@/types/journey'
import { GeoPoint, TransportStop } from '@/types/transport'

class JourneyPlanningService {
  private apiUrl: string
  private cache: Map<string, any> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }

  /**
   * 🗺️ Plan a journey with multiple options
   */
  async planJourney(request: JourneyRequest): Promise<JourneyPlan> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey('journey', request)
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await fetch(`${this.apiUrl}/api/v1/journey/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: {
            name: request.origin.name || 'Origin',
            lat: request.origin.latitude,
            lng: request.origin.longitude
          },
          to: {
            name: request.destination.name || 'Destination',
            lat: request.destination.latitude,
            lng: request.destination.longitude
          },
          departure_time: request.departureTime || new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to plan journey')
      }

      const result = await response.json()

      // Handle both old and new response formats
      if (result.status === 'success' && result.data) {
        // New backend format: {"status":"success","data":{...}}
        this.setCache(cacheKey, result.data)
        return result.data
      } else if (result.success && result.data) {
        // Old format: {"success":true,"data":{...}}
        this.setCache(cacheKey, result.data)
        return result.data
      } else {
        throw new Error(result.error || result.message || 'Journey planning failed')
      }
    } catch (error) {
      console.error('Error planning journey:', error)
      throw error
    }
  }

  /**
   * 💰 Get fare estimate for a route
   */
  async getFareEstimate(
    origin: GeoPoint | string,
    destination: GeoPoint | string,
    vehicleTypes?: string[]
  ): Promise<FareEstimateResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (typeof origin === 'string') {
        queryParams.append('origin_stop', origin)
      } else {
        queryParams.append('origin_lat', origin.latitude.toString())
        queryParams.append('origin_lng', origin.longitude.toString())
      }
      
      if (typeof destination === 'string') {
        queryParams.append('destination_stop', destination)
      } else {
        queryParams.append('destination_lat', destination.latitude.toString())
        queryParams.append('destination_lng', destination.longitude.toString())
      }
      
      if (vehicleTypes?.length) {
        queryParams.append('vehicle_types', vehicleTypes.join(','))
      }

      const response = await fetch(
        `${this.apiUrl}/api/v1/journey/fare-estimate?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get fare estimate')
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting fare estimate:', error)
      throw error
    }
  }

  /**
   * 🏆 Get popular destinations
   */
  async getPopularDestinations(
    userLocation?: GeoPoint,
    category?: string,
    limit: number = 20
  ): Promise<PopularDestination[]> {
    try {
      const cacheKey = `popular_destinations_${category || 'all'}_${limit}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const queryParams = new URLSearchParams({
        limit: limit.toString()
      })

      if (userLocation) {
        queryParams.append('lat', userLocation.latitude.toString())
        queryParams.append('lng', userLocation.longitude.toString())
      }

      if (category) {
        queryParams.append('category', category)
      }

      const response = await fetch(
        `${this.apiUrl}/api/v1/journey/popular-destinations?${queryParams}`
      )

      if (!response.ok) {
        throw new Error('Failed to get popular destinations')
      }

      const result = await response.json()

      // Handle both old and new response formats
      if (result.status === 'success' && result.data) {
        // New backend format: {"status":"success","data":[...]}
        const destinations = Array.isArray(result.data) ? result.data : result.data.destinations || []
        this.setCache(cacheKey, destinations, 30 * 60 * 1000) // 30 minutes
        return destinations
      } else if (result.success && result.data) {
        // Old format: {"success":true,"data":{"destinations":[...]}}
        this.setCache(cacheKey, result.data.destinations, 30 * 60 * 1000) // 30 minutes
        return result.data.destinations
      } else {
        throw new Error(result.error || result.message || 'Failed to load destinations')
      }
    } catch (error) {
      console.error('Error getting popular destinations:', error)
      throw error
    }
  }

  /**
   * 🔍 Search for stops and places
   */
  async searchPlaces(
    query: string,
    userLocation?: GeoPoint,
    limit: number = 10
  ): Promise<TransportStop[]> {
    try {
      if (query.length < 2) return []

      const queryParams = new URLSearchParams({
        q: query,
        limit: limit.toString()
      })

      if (userLocation) {
        queryParams.append('lat', userLocation.latitude.toString())
        queryParams.append('lng', userLocation.longitude.toString())
      }

      const response = await fetch(
        `${this.apiUrl}/api/v1/journey/search-places?${queryParams}`
      )

      if (!response.ok) {
        throw new Error('Failed to search places')
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error searching places:', error)
      return []
    }
  }

  /**
   * 💾 Save a journey for future use
   */
  async saveJourney(journey: Omit<SavedJourney, 'id' | 'userId' | 'createdAt'>): Promise<SavedJourney> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/journey/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(journey)
      })

      if (!response.ok) {
        throw new Error('Failed to save journey')
      }

      const result = await response.json()
      
      // Clear saved journeys cache
      this.clearCachePattern('saved_journeys')
      
      return result.data
    } catch (error) {
      console.error('Error saving journey:', error)
      throw error
    }
  }

  /**
   * 📚 Get saved journeys
   */
  async getSavedJourneys(): Promise<SavedJourney[]> {
    try {
      const cacheKey = 'saved_journeys'
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await fetch(`${this.apiUrl}/api/v1/journey/saved`)

      if (!response.ok) {
        throw new Error('Failed to get saved journeys')
      }

      const result = await response.json()
      const journeys = result.data || []
      
      this.setCache(cacheKey, journeys)
      return journeys
    } catch (error) {
      console.error('Error getting saved journeys:', error)
      return []
    }
  }

  /**
   * 🗑️ Delete a saved journey
   */
  async deleteSavedJourney(journeyId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/journey/saved/${journeyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete journey')
      }

      // Clear cache
      this.clearCachePattern('saved_journeys')
    } catch (error) {
      console.error('Error deleting saved journey:', error)
      throw error
    }
  }

  /**
   * 📊 Get journey history
   */
  async getJourneyHistory(limit: number = 50): Promise<JourneyHistory[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/v1/journey/history?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get journey history')
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error getting journey history:', error)
      return []
    }
  }

  /**
   * ⭐ Rate a completed journey
   */
  async rateJourney(
    historyId: string,
    rating: number,
    feedback?: string,
    issues?: string[]
  ): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/journey/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          historyId,
          rating,
          feedback,
          issues,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to rate journey')
      }
    } catch (error) {
      console.error('Error rating journey:', error)
      throw error
    }
  }

  /**
   * 🚨 Get real-time journey alerts
   */
  async getJourneyAlerts(journeyPlanId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/v1/journey/alerts/${journeyPlanId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get journey alerts')
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error getting journey alerts:', error)
      return []
    }
  }

  /**
   * 🔄 Optimize an existing journey
   */
  async optimizeJourney(
    journeyOption: JourneyOption,
    currentLocation?: GeoPoint
  ): Promise<JourneyOption> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/journey/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          journeyOption,
          currentLocation,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to optimize journey')
      }

      const result = await response.json()
      return result.data || journeyOption
    } catch (error) {
      console.error('Error optimizing journey:', error)
      return journeyOption
    }
  }

  /**
   * 📍 Get nearby stops
   */
  async getNearbyStops(
    location: GeoPoint,
    radius: number = 500,
    limit: number = 10
  ): Promise<TransportStop[]> {
    try {
      const cacheKey = `nearby_stops_${location.latitude}_${location.longitude}_${radius}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const queryParams = new URLSearchParams({
        lat: location.latitude.toString(),
        lng: location.longitude.toString(),
        radius: radius.toString(),
        limit: limit.toString()
      })

      const response = await fetch(
        `${this.apiUrl}/api/v1/journey/nearby-stops?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get nearby stops')
      }

      const result = await response.json()
      const stops = result.data || []
      
      this.setCache(cacheKey, stops, 10 * 60 * 1000) // 10 minutes
      return stops
    } catch (error) {
      console.error('Error getting nearby stops:', error)
      return []
    }
  }

  /**
   * 🎯 Get default journey preferences
   */
  getDefaultPreferences(): JourneyPreferences {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('journey_preferences')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (error) {
          console.error('Error parsing saved preferences:', error)
        }
      }
    }

    return {
      maxWalkingDistance: 800, // 800 meters
      maxWaitTime: 15, // 15 minutes
      maxTransfers: 2,
      preferredVehicleTypes: ['trotro', 'metro_mass', 'bus'],
      avoidVehicleTypes: [],
      prioritizeBy: 'time',
      includeWalking: true,
      includeSharedTaxis: true,
      includePrivateHire: false
    }
  }

  /**
   * 💾 Save journey preferences
   */
  savePreferences(preferences: JourneyPreferences): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('journey_preferences', JSON.stringify(preferences))
      } catch (error) {
        console.error('Error saving preferences:', error)
      }
    }
  }

  // Private helper methods
  private generateCacheKey(type: string, data: any): string {
    const hash = JSON.stringify(data)
    return `${type}_${btoa(hash).slice(0, 16)}`
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && cached.expiry > Date.now()) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any, timeout?: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (timeout || this.cacheTimeout)
    })
  }

  private clearCachePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  private getAuthToken(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('auth_token') || ''
    }
    return ''
  }
}

// Export singleton instance
export const journeyService = new JourneyPlanningService()
export default journeyService
