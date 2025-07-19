/**
 * 🛣️ Advanced Route Optimization Service
 * Sophisticated routing with real-time traffic, capacity, and dynamic pricing
 */

import { GeoPoint } from '@/types/transport'
import { gtfsService } from './gtfsService'
import { budgetService } from './budgetService'

export interface RouteOptimizationRequest {
  origin: GeoPoint
  destination: GeoPoint
  departureTime?: Date
  arrivalTime?: Date
  preferences: RoutePreferences
  constraints: RouteConstraints
}

export interface RoutePreferences {
  prioritizeTime: boolean
  prioritizeCost: boolean
  prioritizeComfort: boolean
  avoidTransfers: boolean
  maxWalkingDistance: number // in meters
  preferredTransportModes: TransportMode[]
  accessibilityNeeds: AccessibilityRequirement[]
}

export interface RouteConstraints {
  maxBudget?: number
  maxTravelTime?: number // in minutes
  maxTransfers?: number
  departureTimeWindow?: TimeWindow
  arrivalTimeWindow?: TimeWindow
}

export interface TimeWindow {
  earliest: Date
  latest: Date
}

export interface TransportMode {
  type: 'bus' | 'trotro' | 'taxi' | 'walking' | 'motorcycle'
  preference: 'preferred' | 'acceptable' | 'avoid'
}

export interface AccessibilityRequirement {
  type: 'wheelchair' | 'visual_impairment' | 'hearing_impairment' | 'mobility_aid'
  required: boolean
}

export interface OptimizedRoute {
  id: string
  segments: RouteSegment[]
  totalDuration: number
  totalCost: number
  totalWalkingDistance: number
  transferCount: number
  comfortScore: number
  reliabilityScore: number
  carbonFootprint: number
  optimizationFactors: OptimizationFactor[]
  realTimeUpdates: RealTimeUpdate[]
}

export interface RouteSegment {
  id: string
  mode: string
  startLocation: GeoPoint & { name: string }
  endLocation: GeoPoint & { name: string }
  startTime: Date
  endTime: Date
  duration: number
  cost: number
  route?: string
  vehicle?: VehicleInfo
  walkingInstructions?: WalkingInstruction[]
  realTimeDelay?: number
  crowdLevel?: 'low' | 'medium' | 'high'
  reliability?: number
}

export interface VehicleInfo {
  id: string
  type: string
  capacity: number
  currentOccupancy: number
  amenities: string[]
  accessibilityFeatures: string[]
}

export interface WalkingInstruction {
  instruction: string
  distance: number
  duration: number
  direction: string
}

export interface OptimizationFactor {
  factor: string
  impact: number
  description: string
}

export interface RealTimeUpdate {
  type: 'delay' | 'cancellation' | 'route_change' | 'capacity_update'
  message: string
  impact: 'low' | 'medium' | 'high'
  timestamp: Date
}

class RouteOptimizationService {
  private apiUrl: string
  private cache: Map<string, OptimizedRoute[]> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }

  /**
   * 🎯 Optimize routes with advanced algorithms
   */
  async optimizeRoutes(request: RouteOptimizationRequest): Promise<OptimizedRoute[]> {
    const cacheKey = this.generateCacheKey(request)
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      // Call backend optimization service
      const response = await fetch(`${this.apiUrl}/api/v1/optimize/routes/enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Backend optimization failed')
      }

      const result = await response.json()
      const optimizedRoutes = result.routes || []

      this.setCache(cacheKey, optimizedRoutes)
      return optimizedRoutes
    } catch (error) {
      console.error('Route optimization error:', error)
      // Fallback to local optimization
      return this.fallbackOptimization(request)
    }
  }

  /**
   * 🚦 Get real-time traffic conditions
   */
  async getTrafficConditions(route: OptimizedRoute): Promise<RealTimeUpdate[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/traffic/live`)
      if (!response.ok) throw new Error('Traffic API failed')
      
      const trafficData = await response.json()
      return this.processTrafficData(trafficData, route)
    } catch (error) {
      console.error('Traffic data error:', error)
      return this.getMockTrafficUpdates()
    }
  }

  /**
   * 💰 Calculate dynamic pricing
   */
  async calculateDynamicPricing(
    segment: RouteSegment, 
    timeOfDay: Date, 
    demand: number
  ): Promise<number> {
    const baseFare = segment.cost
    
    // Time-based multiplier
    const hour = timeOfDay.getHours()
    let timeMultiplier = 1.0
    
    // Rush hour pricing (7-9 AM, 5-7 PM)
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      timeMultiplier = 1.3
    }
    // Off-peak discount (10 PM - 6 AM)
    else if (hour >= 22 || hour <= 6) {
      timeMultiplier = 0.8
    }

    // Demand-based multiplier
    const demandMultiplier = 1 + (demand * 0.5) // Up to 50% increase

    // Weather impact (would integrate with weather service)
    const weatherMultiplier = 1.0 // Placeholder

    return baseFare * timeMultiplier * demandMultiplier * weatherMultiplier
  }

  /**
   * 🎯 Score routes based on user preferences
   */
  scoreRoute(route: OptimizedRoute, preferences: RoutePreferences): number {
    let score = 0
    const weights = this.calculateWeights(preferences)

    // Time score (lower is better)
    const timeScore = Math.max(0, 100 - (route.totalDuration / 60) * 2)
    score += timeScore * weights.time

    // Cost score (lower is better)
    const costScore = Math.max(0, 100 - route.totalCost * 5)
    score += costScore * weights.cost

    // Comfort score
    score += route.comfortScore * weights.comfort

    // Transfer penalty
    const transferPenalty = route.transferCount * 10
    score -= transferPenalty * weights.transfers

    // Walking distance penalty
    const walkingPenalty = (route.totalWalkingDistance / 1000) * 5
    score -= walkingPenalty

    return Math.max(0, Math.min(100, score))
  }

  /**
   * 🔄 Update routes with real-time data
   */
  async updateRoutesRealTime(routes: OptimizedRoute[]): Promise<OptimizedRoute[]> {
    const updatedRoutes = await Promise.all(
      routes.map(async (route) => {
        const trafficUpdates = await this.getTrafficConditions(route)
        const updatedSegments = await this.updateSegmentsRealTime(route.segments)
        
        return {
          ...route,
          segments: updatedSegments,
          realTimeUpdates: trafficUpdates,
          totalDuration: this.recalculateTotalDuration(updatedSegments),
          reliabilityScore: this.calculateReliabilityScore(updatedSegments, trafficUpdates)
        }
      })
    )

    return updatedRoutes.sort((a, b) => b.reliabilityScore - a.reliabilityScore)
  }

  // Private helper methods
  private async fallbackOptimization(request: RouteOptimizationRequest): Promise<OptimizedRoute[]> {
    // Simple fallback optimization using GTFS data
    const nearbyOriginStops = await gtfsService.getNearbyStops(
      request.origin.latitude, 
      request.origin.longitude, 
      0.5
    )
    
    const nearbyDestStops = await gtfsService.getNearbyStops(
      request.destination.latitude, 
      request.destination.longitude, 
      0.5
    )

    const routes: OptimizedRoute[] = []

    // Generate simple routes between nearby stops
    for (const originStop of nearbyOriginStops.slice(0, 3)) {
      for (const destStop of nearbyDestStops.slice(0, 3)) {
        const route = this.createSimpleRoute(originStop, destStop, request)
        routes.push(route)
      }
    }

    return routes.sort((a, b) => a.totalDuration - b.totalDuration)
  }

  private createSimpleRoute(originStop: any, destStop: any, request: RouteOptimizationRequest): OptimizedRoute {
    const walkToStop = this.calculateWalkingTime(request.origin, {
      latitude: originStop.stop_lat,
      longitude: originStop.stop_lon
    })
    
    const walkFromStop = this.calculateWalkingTime({
      latitude: destStop.stop_lat,
      longitude: destStop.stop_lon
    }, request.destination)

    const transitTime = 30 // Estimated transit time
    const totalDuration = walkToStop + transitTime + walkFromStop

    return {
      id: `route_${originStop.stop_id}_${destStop.stop_id}`,
      segments: [
        {
          id: 'walk_to_stop',
          mode: 'walking',
          startLocation: { ...request.origin, name: 'Origin' },
          endLocation: { 
            latitude: originStop.stop_lat, 
            longitude: originStop.stop_lon, 
            name: originStop.stop_name 
          },
          startTime: request.departureTime || new Date(),
          endTime: new Date((request.departureTime || new Date()).getTime() + walkToStop * 60000),
          duration: walkToStop,
          cost: 0,
          walkingInstructions: [
            {
              instruction: `Walk to ${originStop.stop_name}`,
              distance: this.calculateDistance(
                request.origin.latitude,
                request.origin.longitude,
                originStop.stop_lat,
                originStop.stop_lon
              ) * 1000,
              duration: walkToStop,
              direction: 'northeast'
            }
          ]
        }
      ],
      totalDuration,
      totalCost: 3.5, // Estimated fare
      totalWalkingDistance: this.calculateDistance(
        request.origin.latitude,
        request.origin.longitude,
        request.destination.latitude,
        request.destination.longitude
      ) * 1000,
      transferCount: 0,
      comfortScore: 70,
      reliabilityScore: 80,
      carbonFootprint: 2.5,
      optimizationFactors: [
        {
          factor: 'shortest_path',
          impact: 0.8,
          description: 'Route optimized for shortest travel time'
        }
      ],
      realTimeUpdates: []
    }
  }

  private calculateWeights(preferences: RoutePreferences) {
    const total = Number(preferences.prioritizeTime) + 
                  Number(preferences.prioritizeCost) + 
                  Number(preferences.prioritizeComfort)
    
    return {
      time: preferences.prioritizeTime ? 0.4 : 0.2,
      cost: preferences.prioritizeCost ? 0.4 : 0.2,
      comfort: preferences.prioritizeComfort ? 0.4 : 0.2,
      transfers: preferences.avoidTransfers ? 0.3 : 0.1
    }
  }

  private calculateWalkingTime(from: GeoPoint, to: GeoPoint): number {
    const distance = this.calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude)
    return Math.round(distance * 1000 / 80) // 80 meters per minute walking speed
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private async updateSegmentsRealTime(segments: RouteSegment[]): Promise<RouteSegment[]> {
    // Mock real-time updates
    return segments.map(segment => ({
      ...segment,
      realTimeDelay: Math.random() > 0.8 ? Math.floor(Math.random() * 10) : 0,
      crowdLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any
    }))
  }

  private recalculateTotalDuration(segments: RouteSegment[]): number {
    return segments.reduce((total, segment) => total + segment.duration + (segment.realTimeDelay || 0), 0)
  }

  private calculateReliabilityScore(segments: RouteSegment[], updates: RealTimeUpdate[]): number {
    const baseScore = 90
    const delayPenalty = segments.reduce((penalty, segment) => 
      penalty + (segment.realTimeDelay || 0) * 2, 0)
    const updatePenalty = updates.filter(u => u.impact === 'high').length * 10
    
    return Math.max(0, baseScore - delayPenalty - updatePenalty)
  }

  private processTrafficData(trafficData: any, route: OptimizedRoute): RealTimeUpdate[] {
    // Mock processing of traffic data
    return [
      {
        type: 'delay',
        message: 'Minor delays on Circle-Kaneshie route due to traffic',
        impact: 'low',
        timestamp: new Date()
      }
    ]
  }

  private getMockTrafficUpdates(): RealTimeUpdate[] {
    return [
      {
        type: 'delay',
        message: 'Normal traffic conditions',
        impact: 'low',
        timestamp: new Date()
      }
    ]
  }

  private generateCacheKey(request: RouteOptimizationRequest): string {
    return `route_${request.origin.latitude}_${request.origin.longitude}_${request.destination.latitude}_${request.destination.longitude}_${request.departureTime?.getTime()}`
  }

  private getFromCache(key: string): OptimizedRoute[] | null {
    const cached = this.cache.get(key)
    if (cached && cached.timestamp && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: OptimizedRoute[]): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }
}

// Export singleton instance
export const routeOptimizationService = new RouteOptimizationService()
export default routeOptimizationService
