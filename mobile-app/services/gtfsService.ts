/**
 * 🚌 GTFS Data Service
 * Comprehensive service for accessing Ghana's transport data
 */

import { TransportStop, TransportRoute, TransportAgency, Trip, StopTime } from '@/types/transport'

export interface GTFSStop {
  stop_id: string
  stop_name: string
  stop_lat: number
  stop_lon: number
  stop_desc?: string
  zone_id?: string
  stop_url?: string
  location_type?: number
  parent_station?: string
  wheelchair_boarding?: number
}

export interface GTFSRoute {
  route_id: string
  agency_id: string
  route_short_name: string
  route_long_name: string
  route_desc?: string
  route_type: number
  route_url?: string
  route_color?: string
  route_text_color?: string
}

export interface GTFSAgency {
  agency_id: string
  agency_name: string
  agency_url: string
  agency_timezone: string
  agency_lang?: string
  agency_phone?: string
  agency_fare_url?: string
}

export interface GTFSTrip {
  route_id: string
  service_id: string
  trip_id: string
  trip_headsign?: string
  trip_short_name?: string
  direction_id?: number
  block_id?: string
  shape_id?: string
  wheelchair_accessible?: number
  bikes_allowed?: number
}

export interface GTFSStopTime {
  trip_id: string
  arrival_time: string
  departure_time: string
  stop_id: string
  stop_sequence: number
  stop_headsign?: string
  pickup_type?: number
  drop_off_type?: number
  shape_dist_traveled?: number
}

class GTFSService {
  private apiUrl: string
  private cache: Map<string, any> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes
  private isOfflineMode = false
  private lastConnectionAttempt = 0
  private connectionRetryDelay = 30000 // 30 seconds between connection attempts

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    // Check if we should start in offline mode
    this.checkInitialConnectivity()
  }

  private async checkInitialConnectivity() {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      })
      this.isOfflineMode = !response.ok
    } catch (error) {
      this.isOfflineMode = true
      console.log('🔄 AURA: Starting in offline mode with mock data')
    }
  }

  private shouldAttemptConnection(): boolean {
    if (!this.isOfflineMode) return true

    const now = Date.now()
    if (now - this.lastConnectionAttempt > this.connectionRetryDelay) {
      this.lastConnectionAttempt = now
      return true
    }
    return false
  }

  public isUsingOfflineData(): boolean {
    return this.isOfflineMode
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  /**
   * 🚏 Get all stops
   */
  async getStops(): Promise<GTFSStop[]> {
    const cacheKey = 'gtfs_stops'
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    // Use mock data immediately if in offline mode
    if (this.isOfflineMode && !this.shouldAttemptConnection()) {
      const mockStops = this.getMockStops()
      this.setCache(cacheKey, mockStops)
      return mockStops
    }

    try {
      console.log('🔍 AURA: Fetching stops from backend...')
      const response = await fetch(`${this.apiUrl}/api/v1/gtfs/stops`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ AURA: Real GTFS stops response:', result)

      // Handle the real GTFS API response format
      const stops = result.data || result.stops || []

      if (result.source === 'real_trained_gtfs_database') {
        console.log(`🎯 AURA: Successfully loaded ${stops.length} REAL trained GTFS stops`)
      } else {
        console.log(`⚠️ AURA: Using fallback data (${result.source})`)
      }

      // Connection successful, exit offline mode
      this.isOfflineMode = false
      this.setCache(cacheKey, stops)
      console.log(`✅ AURA: Loaded ${stops.length} stops from backend`)
      return stops
    } catch (error) {
      // Enter offline mode on connection failure
      this.isOfflineMode = true

      console.log('🔄 AURA: Backend connection failed, using offline transport data:', error)

      const mockStops = this.getMockStops()
      this.setCache(cacheKey, mockStops)
      console.log(`🔄 AURA: Using ${mockStops.length} mock stops`)
      return mockStops
    }
  }

  /**
   * 🛣️ Get all routes
   */
  async getRoutes(): Promise<GTFSRoute[]> {
    const cacheKey = 'gtfs_routes'
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(`${this.apiUrl}/api/v1/gtfs/routes`)
      if (!response.ok) {
        throw new Error('Failed to fetch routes')
      }
      
      const result = await response.json()
      const routes = result.data?.routes || result.routes || []
      
      this.setCache(cacheKey, routes)
      return routes
    } catch (error) {
      console.error('Error fetching routes:', error)
      return this.getMockRoutes()
    }
  }

  /**
   * 🏢 Get all agencies
   */
  async getAgencies(): Promise<GTFSAgency[]> {
    const cacheKey = 'gtfs_agencies'
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(`${this.apiUrl}/api/v1/gtfs/agencies`)
      if (!response.ok) {
        throw new Error('Failed to fetch agencies')
      }
      
      const result = await response.json()
      const agencies = result.data?.agencies || result.agencies || []
      
      this.setCache(cacheKey, agencies)
      return agencies
    } catch (error) {
      console.error('Error fetching agencies:', error)
      return this.getMockAgencies()
    }
  }

  /**
   * 📍 Get nearby stops
   */
  async getNearbyStops(
    lat: number,
    lon: number,
    radiusKm: number = 1.0
  ): Promise<GTFSStop[]> {
    // Use offline calculation if in offline mode
    if (this.isOfflineMode && !this.shouldAttemptConnection()) {
      const allStops = await this.getStops()
      return this.filterStopsByDistance(allStops, lat, lon, radiusKm)
    }

    try {
      console.log(`🔍 AURA: Searching for stops near ${lat}, ${lon} within ${radiusKm}km`)
      const response = await fetch(
        `${this.apiUrl}/api/v1/gtfs/stops/near?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`,
        { signal: AbortSignal.timeout(5000) }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ AURA: Real GTFS nearby stops response:', result)

      this.isOfflineMode = false // Connection successful
      // Handle the real GTFS API response format for nearby stops
      const stops = result.data || result.stops || []
      console.log(`✅ AURA: Found ${stops.length} nearby stops`)
      return stops
    } catch (error) {
      this.isOfflineMode = true
      console.log('🔄 AURA: Nearby stops backend failed, using offline calculation:', error)

      // Fallback to calculating from all stops (which will use mock data)
      const allStops = await this.getStops()
      const nearbyStops = this.filterStopsByDistance(allStops, lat, lon, radiusKm)
      console.log(`🔄 AURA: Found ${nearbyStops.length} nearby stops offline`)
      return nearbyStops
    }
  }

  /**
   * 🚌 Get trips for a route
   */
  async getTripsForRoute(routeId: string): Promise<GTFSTrip[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/gtfs/trips/route/${routeId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch trips')
      }
      
      const result = await response.json()
      return result.trips || []
    } catch (error) {
      console.error('Error fetching trips:', error)
      return []
    }
  }

  /**
   * ⏰ Get stop times for a trip
   */
  async getStopTimesForTrip(tripId: string): Promise<GTFSStopTime[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/gtfs/stop_times/trip/${tripId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch stop times')
      }
      
      const result = await response.json()
      return result.stop_times || []
    } catch (error) {
      console.error('Error fetching stop times:', error)
      return []
    }
  }

  /**
   * 🔍 Search stops by name
   */
  async searchStops(query: string): Promise<GTFSStop[]> {
    const allStops = await this.getStops()
    return allStops.filter(stop => 
      stop.stop_name.toLowerCase().includes(query.toLowerCase()) ||
      stop.stop_desc?.toLowerCase().includes(query.toLowerCase())
    )
  }

  /**
   * 🔍 Search routes by name
   */
  async searchRoutes(query: string): Promise<GTFSRoute[]> {
    const allRoutes = await this.getRoutes()
    return allRoutes.filter(route => 
      route.route_short_name.toLowerCase().includes(query.toLowerCase()) ||
      route.route_long_name.toLowerCase().includes(query.toLowerCase()) ||
      route.route_desc?.toLowerCase().includes(query.toLowerCase())
    )
  }

  // Helper methods
  private filterStopsByDistance(
    stops: GTFSStop[], 
    lat: number, 
    lon: number, 
    radiusKm: number
  ): GTFSStop[] {
    return stops.filter(stop => {
      const distance = this.calculateDistance(lat, lon, stop.stop_lat, stop.stop_lon)
      return distance <= radiusKm
    })
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180)
  }

  // Mock data methods (fallbacks)
  private getMockStops(): GTFSStop[] {
    return [
      // Major Terminals
      {
        stop_id: "ACCRA_CENTRAL_01",
        stop_name: "Accra Central Terminal",
        stop_lat: 5.5502,
        stop_lon: -0.2174,
        stop_desc: "Main transport hub in Accra Central"
      },
      {
        stop_id: "KANESHIE_TERMINAL",
        stop_name: "Kaneshie Terminal",
        stop_lat: 5.5731,
        stop_lon: -0.2469,
        stop_desc: "Major market and transport terminal"
      },
      {
        stop_id: "TEMA_TERMINAL",
        stop_name: "Tema Station Terminal",
        stop_lat: 5.6698,
        stop_lon: -0.0166,
        stop_desc: "Tema main transport terminal"
      },
      {
        stop_id: "CIRCLE_TERMINAL",
        stop_name: "Circle Terminal",
        stop_lat: 5.5717,
        stop_lon: -0.1969,
        stop_desc: "Circle interchange and transport hub"
      },
      {
        stop_id: "MADINA_TERMINAL",
        stop_name: "Madina Terminal",
        stop_lat: 5.6837,
        stop_lon: -0.1669,
        stop_desc: "Madina transport terminal"
      },
      // Bus Stops
      {
        stop_id: "OKAISHIE_STOP",
        stop_name: "Okaishie Bus Stop",
        stop_lat: 5.5560,
        stop_lon: -0.2040,
        stop_desc: "Okaishie market area bus stop"
      },
      {
        stop_id: "LAPAZ_STOP",
        stop_name: "Lapaz Bus Stop",
        stop_lat: 5.6050,
        stop_lon: -0.2580,
        stop_desc: "Lapaz junction bus stop"
      },
      {
        stop_id: "ACHIMOTA_STOP",
        stop_name: "Achimota Bus Stop",
        stop_lat: 5.6180,
        stop_lon: -0.2370,
        stop_desc: "Achimota forest area bus stop"
      },
      {
        stop_id: "DANSOMAN_STOP",
        stop_name: "Dansoman Bus Stop",
        stop_lat: 5.5390,
        stop_lon: -0.2890,
        stop_desc: "Dansoman residential area bus stop"
      },
      {
        stop_id: "EAST_LEGON_STOP",
        stop_name: "East Legon Bus Stop",
        stop_lat: 5.6500,
        stop_lon: -0.1500,
        stop_desc: "East Legon residential area bus stop"
      },
      // Stations
      {
        stop_id: "KOTOKA_STATION",
        stop_name: "Kotoka Airport Station",
        stop_lat: 5.6052,
        stop_lon: -0.1668,
        stop_desc: "Kotoka International Airport transport station"
      },
      {
        stop_id: "UNIVERSITY_STATION",
        stop_name: "University of Ghana Station",
        stop_lat: 5.6515,
        stop_lon: -0.1870,
        stop_desc: "University of Ghana transport station"
      }
    ]
  }

  private getMockRoutes(): GTFSRoute[] {
    return [
      {
        route_id: "ACCRA_TEMA_01",
        agency_id: "STC_GHANA",
        route_short_name: "AC-TM",
        route_long_name: "Accra to Tema",
        route_type: 3,
        route_color: "FF6B35",
        route_text_color: "FFFFFF"
      },
      {
        route_id: "CIRCLE_KANESHIE_01",
        agency_id: "TROTRO_UNION",
        route_short_name: "CR-KN",
        route_long_name: "Circle to Kaneshie",
        route_type: 3,
        route_color: "2E8B57",
        route_text_color: "FFFFFF"
      }
    ]
  }

  private getMockAgencies(): GTFSAgency[] {
    return [
      {
        agency_id: "STC_GHANA",
        agency_name: "State Transport Corporation",
        agency_url: "https://stc.gov.gh",
        agency_timezone: "Africa/Accra",
        agency_lang: "en"
      },
      {
        agency_id: "TROTRO_UNION",
        agency_name: "Trotro Operators Union",
        agency_url: "https://trotro-union.gh",
        agency_timezone: "Africa/Accra",
        agency_lang: "en"
      }
    ]
  }
}

// Export singleton instance
export const gtfsService = new GTFSService()
export default gtfsService
