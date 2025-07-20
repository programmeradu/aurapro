/**
 * AURA Services - Centralized API Integration
 * Exports all services for easy importing throughout the app
 */

// Core API Service
export { apiService, default as defaultApiService } from './apiService'
export type {
  ApiResponse,
  Location,
  GTFSStop,
  WeatherData,
  VehiclePosition,
  JourneyPlan,
  JourneyRoute,
  JourneyStep,
  PopularDestination,
  MLPrediction,
  TrafficData,
  SystemMetrics,
  LiveEvent,
  UberEstimate,
  GTFSRoute,
  GTFSAgency,
  AnalyticsEvent
} from './apiService'

// Real-time Data Service
export { realTimeDataService, default as defaultRealTimeDataService } from './realTimeDataService'
export type {
  RealTimeTransportData,
  RouteData,
  StopData,
  TrafficData as RealTimeTrafficData,
  TrafficIncident,
  TrafficPrediction,
  ArrivalPrediction,
  MLPredictions,
  TravelTimePrediction,
  DemandForecast,
  RouteOptimization,
  PricingSuggestion,
  AlternativeRoute
} from './realTimeDataService'

// Community Service (if exists)
export { communityService } from './communityService'

// Analytics Service
export { analyticsService } from './analyticsService'

// Recommendation Service
export { recommendationService } from './recommendationService'

// WebSocket Service
export { webSocketService } from './webSocketService'

// Import services for default export
import { apiService, APIError } from './apiService'
import { realTimeDataService } from './realTimeDataService'

/**
 * Unified Data Fetcher
 * Provides a single interface for fetching all types of data
 */
class UnifiedDataService {
  /**
   * Get all data needed for the home screen
   */
  async getHomeScreenData(location?: Location) {
    try {
      const [
        transportData,
        weatherData,
        systemMetrics,
        liveEvents,
        recommendations
      ] = await Promise.all([
        realTimeDataService.getTransportData(location),
        apiService.getWeatherData(),
        apiService.getSystemMetrics(),
        apiService.getLiveEvents(),
        location ? realTimeDataService.getJourneyRecommendations(
          location,
          { latitude: 5.6037, longitude: -0.1870 } // Default destination
        ) : Promise.resolve([])
      ])

      return {
        transport: transportData,
        weather: weatherData.success ? weatherData.data : null,
        metrics: systemMetrics.success ? systemMetrics.data : null,
        events: liveEvents.success ? liveEvents.data : [],
        recommendations
      }
    } catch (error) {
      console.error('Failed to fetch home screen data:', error)
      throw error
    }
  }

  /**
   * Get all data needed for the map screen
   */
  async getMapScreenData(location?: Location) {
    try {
      const [
        vehicles,
        stops,
        routes,
        traffic,
        events
      ] = await Promise.all([
        realTimeDataService.getVehicleTracking(undefined, location),
        apiService.getGTFSStops(),
        apiService.getOptimizedRoutes(),
        realTimeDataService.getTrafficData(),
        apiService.getLiveEvents()
      ])

      return {
        vehicles,
        stops: stops.success ? stops.data : [],
        routes: routes.success ? routes.data : [],
        traffic,
        events: events.success ? events.data : []
      }
    } catch (error) {
      console.error('Failed to fetch map screen data:', error)
      throw error
    }
  }

  /**
   * Get all data needed for analytics
   */
  async getAnalyticsData(timeRange: string = '24h') {
    try {
      const [
        systemMetrics,
        mlPerformance,
        predictiveAnalytics,
        trafficData
      ] = await Promise.all([
        apiService.getSystemMetrics(),
        apiService.getMLPerformanceMetrics(),
        apiService.getPredictiveAnalytics({
          location: { latitude: 5.6037, longitude: -0.1870 },
          time_range: timeRange,
          metrics: ['all']
        }),
        apiService.getLiveTrafficData()
      ])

      return {
        system: systemMetrics.success ? systemMetrics.data : null,
        ml: mlPerformance.success ? mlPerformance.data : null,
        predictions: predictiveAnalytics.success ? predictiveAnalytics.data : null,
        traffic: trafficData.success ? trafficData.data : []
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
      throw error
    }
  }

  /**
   * Get comprehensive journey planning data
   */
  async getJourneyPlanningData(origin: Location, destination: Location) {
    try {
      const [
        journeyPlan,
        uberEstimates,
        dynamicPricing,
        trafficData,
        weatherData
      ] = await Promise.all([
        apiService.planJourney({ origin, destination }),
        apiService.getUberEstimate({
          start_latitude: origin.latitude,
          start_longitude: origin.longitude,
          end_latitude: destination.latitude,
          end_longitude: destination.longitude
        }),
        realTimeDataService.getDynamicPricing(origin, destination),
        realTimeDataService.getTrafficData(),
        apiService.getWeatherData()
      ])

      return {
        plan: journeyPlan.success ? journeyPlan.data : null,
        uber: uberEstimates.success ? uberEstimates.data : [],
        pricing: dynamicPricing,
        traffic: trafficData,
        weather: weatherData.success ? weatherData.data : null
      }
    } catch (error) {
      console.error('Failed to fetch journey planning data:', error)
      throw error
    }
  }

  /**
   * Get budget and spending analytics
   */
  async getBudgetData(timeRange: string = 'month') {
    try {
      const [
        predictiveAnalytics,
        systemMetrics,
        economicsData
      ] = await Promise.all([
        apiService.getPredictiveAnalytics({
          location: { latitude: 5.6037, longitude: -0.1870 },
          time_range: timeRange,
          metrics: ['spending', 'routes', 'savings']
        }),
        apiService.getSystemMetrics(),
        apiService.getGhanaEconomics({
          analysis_type: 'transport_spending',
          time_range: timeRange
        })
      ])

      return {
        analytics: predictiveAnalytics.success ? predictiveAnalytics.data : null,
        metrics: systemMetrics.success ? systemMetrics.data : null,
        economics: economicsData.success ? economicsData.data : null
      }
    } catch (error) {
      console.error('Failed to fetch budget data:', error)
      throw error
    }
  }

  /**
   * Get community and social data
   */
  async getCommunityData() {
    try {
      const [
        liveEvents,
        systemMetrics,
        networkAnalysis
      ] = await Promise.all([
        apiService.getLiveEvents(),
        apiService.getSystemMetrics(),
        apiService.getNetworkAnalysis()
      ])

      return {
        events: liveEvents.success ? liveEvents.data : [],
        metrics: systemMetrics.success ? systemMetrics.data : null,
        network: networkAnalysis.success ? networkAnalysis.data : null
      }
    } catch (error) {
      console.error('Failed to fetch community data:', error)
      throw error
    }
  }
}

// Export unified service instance
export const unifiedDataService = new UnifiedDataService()

/**
 * Data Refresh Manager
 * Manages automatic data refreshing across the app
 */
class DataRefreshManager {
  private intervals = new Map<string, NodeJS.Timeout>()
  private callbacks = new Map<string, Function[]>()

  /**
   * Start auto-refresh for a data type
   */
  startAutoRefresh(
    dataType: string,
    refreshFunction: () => Promise<any>,
    intervalMs: number = 30000
  ) {
    // Clear existing interval if any
    this.stopAutoRefresh(dataType)

    // Set up new interval
    const interval = setInterval(async () => {
      try {
        const data = await refreshFunction()
        this.notifyCallbacks(dataType, data)
      } catch (error) {
        console.error(`Failed to refresh ${dataType}:`, error)
      }
    }, intervalMs)

    this.intervals.set(dataType, interval)
  }

  /**
   * Stop auto-refresh for a data type
   */
  stopAutoRefresh(dataType: string) {
    const interval = this.intervals.get(dataType)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(dataType)
    }
  }

  /**
   * Subscribe to data updates
   */
  subscribe(dataType: string, callback: Function) {
    if (!this.callbacks.has(dataType)) {
      this.callbacks.set(dataType, [])
    }
    this.callbacks.get(dataType)!.push(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(dataType)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Notify all subscribers of data updates
   */
  private notifyCallbacks(dataType: string, data: any) {
    const callbacks = this.callbacks.get(dataType)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in data refresh callback:', error)
        }
      })
    }
  }

  /**
   * Clean up all intervals and callbacks
   */
  cleanup() {
    this.intervals.forEach((interval) => clearInterval(interval))
    this.intervals.clear()
    this.callbacks.clear()
  }
}

// Export data refresh manager
export const dataRefreshManager = new DataRefreshManager()

/**
 * Error Handler for API calls
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Retry mechanism for failed API calls
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (i === maxRetries) {
        throw lastError
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  
  throw lastError!
}

/**
 * Cache manager for API responses
 */
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttlMs: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  clear(pattern?: string) {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }
}

export const cacheManager = new CacheManager()

// Default export - moved to end to ensure all dependencies are defined
export default {
  api: apiService,
  realTime: realTimeDataService,
  unified: unifiedDataService,
  refreshManager: dataRefreshManager,
  cache: cacheManager,
  withRetry,
  APIError
}