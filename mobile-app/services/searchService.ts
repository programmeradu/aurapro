/**
 * 🔍 Intelligent Search Service
 * Advanced search capabilities for stops, routes, and destinations
 */

import { gtfsService, GTFSStop, GTFSRoute } from './gtfsService'
import { GeoPoint } from '@/types/transport'

export interface SearchResult {
  id: string
  type: 'stop' | 'route' | 'destination' | 'landmark'
  name: string
  description: string
  location?: GeoPoint
  relevanceScore: number
  metadata?: any
}

export interface SearchOptions {
  types?: ('stop' | 'route' | 'destination' | 'landmark')[]
  location?: GeoPoint
  radius?: number // in kilometers
  limit?: number
  includeNearby?: boolean
}

export interface TransferPoint {
  stop: GTFSStop
  routes: GTFSRoute[]
  transferTime: number // estimated transfer time in minutes
  walkingDistance: number // in meters
}

class SearchService {
  private cache: Map<string, any> = new Map()
  private cacheTimeout = 2 * 60 * 1000 // 2 minutes for search results

  /**
   * 🔍 Universal search for stops, routes, and destinations
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      types = ['stop', 'destination'], // Prioritize stops and destinations, exclude routes by default
      location,
      radius = 5,
      limit = 20,
      includeNearby = true
    } = options

    const cacheKey = `search_${query}_${JSON.stringify(options)}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const results: SearchResult[] = []

    try {
      // Search stops using GTFS service
      if (types.includes('stop')) {
        const stops = await this.searchStops(query, location, radius)
        results.push(...stops.map(stop => this.stopToSearchResult(stop, query)))
      }

      // Search routes (only if specifically requested or query looks like a route)
      if (types.includes('route') || this.isRouteQuery(query)) {
        const routes = await this.searchRoutes(query)
        results.push(...routes.map(route => this.routeToSearchResult(route, query)))
      }

      // Search landmarks and destinations
      if (types.includes('destination') || types.includes('landmark')) {
        const landmarks = await this.searchLandmarks(query, location)
        results.push(...landmarks)
      }

      // Add nearby stops if location provided and includeNearby is true
      if (includeNearby && location && !query.trim()) {
        const nearbyStops = await gtfsService.getNearbyStops(
          location.latitude,
          location.longitude,
          radius
        )
        results.push(...nearbyStops.map(stop => this.stopToSearchResult(stop, '', true)))
      }

      // If we have a query but no results from GTFS, try the backend search endpoint
      if (query.trim() && results.length === 0) {
        console.log('🔍 AURA: Trying backend search endpoint for:', query)
        const backendResults = await this.searchBackendPlaces(query, location, limit)
        results.push(...backendResults)
      }

    } catch (error) {
      console.error('Search error:', error)
      // Fallback to mock data if all else fails
      if (query.trim()) {
        const mockResults = this.getMockSearchResults(query, location)
        results.push(...mockResults)
      }
    }

    // Sort by relevance score and limit results
    const sortedResults = results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)

    this.setCache(cacheKey, sortedResults)
    return sortedResults
  }

  /**
   * 🚏 Search stops with intelligent filtering
   */
  async searchStops(query: string, location?: GeoPoint, radius: number = 5): Promise<GTFSStop[]> {
    let stops: GTFSStop[]

    if (location) {
      // Get nearby stops first, then filter by query
      stops = await gtfsService.getNearbyStops(location.latitude, location.longitude, radius)
      if (query.trim()) {
        stops = stops.filter(stop => this.matchesQuery(stop.stop_name, query))
      }
    } else {
      // Search all stops by name
      stops = await gtfsService.searchStops(query)
    }

    return stops
  }

  /**
   * 🛣️ Search routes
   */
  async searchRoutes(query: string): Promise<GTFSRoute[]> {
    return await gtfsService.searchRoutes(query)
  }

  /**
   * 🏛️ Search landmarks and popular destinations
   */
  async searchLandmarks(query: string, location?: GeoPoint): Promise<SearchResult[]> {
    const landmarks = this.getGhanaLandmarks()
    
    const filtered = landmarks.filter(landmark => 
      this.matchesQuery(landmark.name, query) ||
      landmark.aliases?.some(alias => this.matchesQuery(alias, query))
    )

    return filtered.map(landmark => ({
      id: landmark.id,
      type: 'landmark' as const,
      name: landmark.name,
      description: landmark.description,
      location: landmark.location,
      relevanceScore: this.calculateRelevanceScore(landmark.name, query, location, landmark.location),
      metadata: {
        category: landmark.category,
        aliases: landmark.aliases
      }
    }))
  }

  /**
   * 🔄 Find optimal transfer points between two locations
   */
  async findTransferPoints(
    from: GeoPoint, 
    to: GeoPoint, 
    maxTransfers: number = 2
  ): Promise<TransferPoint[]> {
    const fromStops = await gtfsService.getNearbyStops(from.latitude, from.longitude, 1)
    const toStops = await gtfsService.getNearbyStops(to.latitude, to.longitude, 1)
    
    const transferPoints: TransferPoint[] = []

    // Find intermediate stops that connect both origin and destination areas
    const intermediateStops = await this.findIntermediateStops(from, to)
    
    for (const stop of intermediateStops) {
      const routes = await this.getRoutesForStop(stop.stop_id)
      if (routes.length >= 2) { // Must have at least 2 routes for transfers
        transferPoints.push({
          stop,
          routes,
          transferTime: this.estimateTransferTime(routes.length),
          walkingDistance: this.calculateWalkingDistance(from, to, {
            latitude: stop.stop_lat,
            longitude: stop.stop_lon
          })
        })
      }
    }

    return transferPoints.sort((a, b) => a.transferTime - b.transferTime)
  }

  /**
   * 📍 Get suggestions based on user location
   */
  async getLocationBasedSuggestions(location: GeoPoint): Promise<SearchResult[]> {
    const suggestions: SearchResult[] = []

    // Nearby stops
    const nearbyStops = await gtfsService.getNearbyStops(location.latitude, location.longitude, 2)
    suggestions.push(...nearbyStops.slice(0, 5).map(stop => this.stopToSearchResult(stop, '', true)))

    // Popular destinations near user
    const nearbyLandmarks = await this.searchLandmarks('', location)
    suggestions.push(...nearbyLandmarks.slice(0, 3))

    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  // Helper methods
  private stopToSearchResult(stop: GTFSStop, query: string, isNearby: boolean = false): SearchResult {
    return {
      id: stop.stop_id,
      type: 'stop',
      name: stop.stop_name,
      description: stop.stop_desc || 'Transport stop',
      location: {
        latitude: stop.stop_lat,
        longitude: stop.stop_lon
      },
      relevanceScore: isNearby ? 0.8 : this.calculateRelevanceScore(stop.stop_name, query),
      metadata: {
        stopId: stop.stop_id,
        zoneId: stop.zone_id
      }
    }
  }

  private routeToSearchResult(route: GTFSRoute, query: string): SearchResult {
    return {
      id: route.route_id,
      type: 'route',
      name: `${route.route_short_name} - ${route.route_long_name}`,
      description: route.route_desc || 'Transport route',
      relevanceScore: this.calculateRelevanceScore(
        `${route.route_short_name} ${route.route_long_name}`, 
        query
      ),
      metadata: {
        routeId: route.route_id,
        agencyId: route.agency_id,
        routeType: route.route_type
      }
    }
  }

  private matchesQuery(text: string, query: string): boolean {
    if (!query.trim()) return true
    
    const normalizedText = text.toLowerCase()
    const normalizedQuery = query.toLowerCase()
    
    return normalizedText.includes(normalizedQuery) ||
           this.fuzzyMatch(normalizedText, normalizedQuery)
  }

  private fuzzyMatch(text: string, query: string): boolean {
    // Simple fuzzy matching - can be enhanced with more sophisticated algorithms
    const words = query.split(' ')
    return words.every(word => text.includes(word))
  }

  private calculateRelevanceScore(
    text: string, 
    query: string, 
    userLocation?: GeoPoint, 
    itemLocation?: GeoPoint
  ): number {
    if (!query.trim()) return 0.5

    let score = 0

    // Exact match gets highest score
    if (text.toLowerCase() === query.toLowerCase()) {
      score = 1.0
    }
    // Starts with query gets high score
    else if (text.toLowerCase().startsWith(query.toLowerCase())) {
      score = 0.9
    }
    // Contains query gets medium score
    else if (text.toLowerCase().includes(query.toLowerCase())) {
      score = 0.7
    }
    // Fuzzy match gets lower score
    else if (this.fuzzyMatch(text.toLowerCase(), query.toLowerCase())) {
      score = 0.5
    }

    // Boost score based on proximity if locations are available
    if (userLocation && itemLocation) {
      const distance = this.calculateDistance(
        userLocation.latitude, userLocation.longitude,
        itemLocation.latitude, itemLocation.longitude
      )
      // Closer items get higher scores
      const proximityBoost = Math.max(0, 1 - (distance / 10)) * 0.3
      score += proximityBoost
    }

    return Math.min(score, 1.0)
  }

  private async findIntermediateStops(from: GeoPoint, to: GeoPoint): Promise<GTFSStop[]> {
    // Get stops in a corridor between from and to
    const midLat = (from.latitude + to.latitude) / 2
    const midLon = (from.longitude + to.longitude) / 2
    
    return await gtfsService.getNearbyStops(midLat, midLon, 3)
  }

  private async getRoutesForStop(stopId: string): Promise<GTFSRoute[]> {
    // This would need to be implemented in the backend
    // For now, return mock data
    return []
  }

  private estimateTransferTime(routeCount: number): number {
    // Base transfer time + additional time for more route options
    return 5 + (routeCount * 2)
  }

  private calculateWalkingDistance(from: GeoPoint, to: GeoPoint, via: GeoPoint): number {
    const dist1 = this.calculateDistance(from.latitude, from.longitude, via.latitude, via.longitude)
    const dist2 = this.calculateDistance(via.latitude, via.longitude, to.latitude, to.longitude)
    return (dist1 + dist2) * 1000 // Convert to meters
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

  private isRouteQuery(query: string): boolean {
    // Check if query looks like a route identifier
    const routePatterns = [
      /^route\s+/i,           // "route 123"
      /^line\s+/i,            // "line A"
      /^\d+[A-Z]?$/,          // "123" or "123A"
      /^[A-Z]\d+$/,           // "A123"
      /trotro.*line|bus.*line/i // "trotro line" or "bus line"
    ]

    return routePatterns.some(pattern => pattern.test(query.trim()))
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
   * 🌐 Search using backend endpoint
   */
  private async searchBackendPlaces(query: string, location?: GeoPoint, limit: number = 10): Promise<SearchResult[]> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const queryParams = new URLSearchParams({
        q: query,
        limit: limit.toString()
      })

      if (location) {
        queryParams.append('lat', location.latitude.toString())
        queryParams.append('lng', location.longitude.toString())
      }

      const response = await fetch(`${apiUrl}/api/v1/journey/search-places?${queryParams}`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      const places = result.data || []

      return places.map((place: any) => ({
        id: place.id,
        type: place.type === 'terminal' ? 'stop' : place.type,
        name: place.name,
        description: place.type === 'terminal' ? 'Transport Terminal' :
                    place.type === 'station' ? 'Transport Station' : 'Bus Stop',
        location: place.location,
        relevanceScore: place.relevance || 0.7,
        metadata: {
          stopId: place.id,
          routes: place.routes || [],
          facilities: place.facilities || [],
          distance_km: place.distance_km
        }
      }))
    } catch (error) {
      console.error('Backend search failed:', error)
      return []
    }
  }

  /**
   * 🎭 Get mock search results as fallback
   */
  private getMockSearchResults(query: string, location?: GeoPoint): SearchResult[] {
    const mockPlaces = [
      {
        id: 'ACCRA_CENTRAL_01',
        name: 'Accra Central Terminal',
        type: 'stop' as const,
        description: 'Main transport hub in Accra Central',
        location: { latitude: 5.5502, longitude: -0.2174 },
        routes: ['AC-TM', 'AC-KN', 'AC-MD']
      },
      {
        id: 'KANESHIE_TERMINAL',
        name: 'Kaneshie Terminal',
        type: 'stop' as const,
        description: 'Major market and transport terminal',
        location: { latitude: 5.5731, longitude: -0.2469 },
        routes: ['KN-AC', 'KN-TM', 'KN-CR']
      },
      {
        id: 'TEMA_TERMINAL',
        name: 'Tema Station Terminal',
        type: 'stop' as const,
        description: 'Tema main transport terminal',
        location: { latitude: 5.6698, longitude: -0.0166 },
        routes: ['TM-AC', 'TM-MD']
      },
      {
        id: 'CIRCLE_TERMINAL',
        name: 'Circle Terminal',
        type: 'stop' as const,
        description: 'Circle interchange and transport hub',
        location: { latitude: 5.5717, longitude: -0.1969 },
        routes: ['CR-KN', 'CR-MD', 'CR-AC']
      },
      {
        id: 'MADINA_TERMINAL',
        name: 'Madina Terminal',
        type: 'stop' as const,
        description: 'Madina transport terminal',
        location: { latitude: 5.6837, longitude: -0.1669 },
        routes: ['MD-AC', 'MD-CR']
      }
    ]

    const filtered = mockPlaces.filter(place =>
      place.name.toLowerCase().includes(query.toLowerCase())
    )

    return filtered.map(place => ({
      id: place.id,
      type: place.type,
      name: place.name,
      description: place.description,
      location: place.location,
      relevanceScore: this.calculateRelevanceScore(place.name, query, location, place.location),
      metadata: {
        stopId: place.id,
        routes: place.routes,
        source: 'mock'
      }
    }))
  }

  private getGhanaLandmarks() {
    return [
      {
        id: 'kwame_nkrumah_mausoleum',
        name: 'Kwame Nkrumah Mausoleum',
        description: 'Memorial park and mausoleum',
        location: { latitude: 5.5502, longitude: -0.2174 },
        category: 'landmark',
        aliases: ['Nkrumah Memorial', 'Independence Square']
      },
      {
        id: 'accra_mall',
        name: 'Accra Mall',
        description: 'Major shopping center',
        location: { latitude: 5.6037, longitude: -0.1870 },
        category: 'shopping',
        aliases: ['Mall', 'Shopping Center']
      },
      {
        id: 'kotoka_airport',
        name: 'Kotoka International Airport',
        description: 'Main international airport',
        location: { latitude: 5.6052, longitude: -0.1668 },
        category: 'transport',
        aliases: ['Airport', 'Kotoka', 'International Airport']
      }
    ]
  }
}

// Export singleton instance
export const searchService = new SearchService()
export default searchService
