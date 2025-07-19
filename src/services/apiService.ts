// API service for backend HTTP requests
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com' 
  : 'http://localhost:8000'

// Global flags to prevent multiple simultaneous data loading
let isGloballyLoading = false
let isSystemOverloaded = false // Start in normal state
let lastSystemCheck = Date.now()
let totalRequestsBlocked = 0

class APIService {
  private baseUrl: string
  private lastRequestTime: number = 0
  private minRequestInterval: number = 1000 // Minimum 1 second between requests
  private pendingRequests: Map<string, Promise<any>> = new Map()
  private requestCount: number = 0
  private maxRequestsPerMinute: number = 30 // Allow 30 requests per minute
  private cache: Map<string, { data: any, timestamp: number }> = new Map()
  private cacheTimeout: number = 60000 // 1 minute cache for faster responses

  constructor() {
    this.baseUrl = API_BASE_URL
    console.log('🌐 API Service initialized with base URL:', this.baseUrl)
  }

  // Clear cache method
  clearCache() {
    this.cache.clear()
    console.log('🗑️ API cache cleared')
  }

  // Get cache status
  getCacheStatus() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      requestCount: this.requestCount,
      isGloballyLoading
    }
  }

  // Check if globally loading
  isGloballyLoading() {
    return isGloballyLoading
  }

  // Set global loading state
  setGlobalLoading(loading: boolean) {
    isGloballyLoading = loading
    console.log(`🌍 Global loading state set to: ${loading}`)
  }

  // Check system overload status
  isSystemOverloaded() {
    return isSystemOverloaded
  }

  // Manually reset system overload protection
  resetSystemOverload() {
    isSystemOverloaded = false
    lastSystemCheck = Date.now()
    totalRequestsBlocked = 0
    this.requestCount = 0
    console.log('🔄 System overload protection manually reset')
  }

  // Get system status
  getSystemStatus() {
    return {
      isOverloaded: isSystemOverloaded,
      requestsBlocked: totalRequestsBlocked,
      lastCheck: lastSystemCheck,
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      requestCount: this.requestCount
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const requestKey = `${options.method || 'GET'}:${endpoint}`

    // SYSTEM OVERLOAD PROTECTION
    const now = Date.now()
    if (isSystemOverloaded) {
      // Check if we should reset the overload state (after 10 seconds)
      if (now - lastSystemCheck > 10000) {
        isSystemOverloaded = false
        lastSystemCheck = now
        totalRequestsBlocked = 0
        console.log('🟢 System overload protection reset. Normal operation resumed.')
      } else {
        totalRequestsBlocked++
        console.warn(`🚫 SYSTEM OVERLOADED: Blocking request ${totalRequestsBlocked}: ${requestKey}`)
        throw new Error('Rate limit exceeded. System entering overload protection.')
      }
    }

    // Check cache first
    const cached = this.cache.get(requestKey)
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log(`💾 Using cached data for: ${requestKey}`)
      return cached.data
    }

    // Check if the same request is already pending
    if (this.pendingRequests.has(requestKey)) {
      console.log(`🔄 Reusing pending request: ${requestKey}`)
      return this.pendingRequests.get(requestKey)!
    }

    // Rate limiting: check requests per minute
    this.requestCount++
    if (this.requestCount > this.maxRequestsPerMinute) {
      console.warn(`⚠️ Rate limit exceeded (${this.requestCount}/${this.maxRequestsPerMinute}). Applying delay.`)
      // Only trigger overload protection if severely exceeded
      if (this.requestCount > this.maxRequestsPerMinute * 2) {
        isSystemOverloaded = true
        lastSystemCheck = now
        console.error('🚨 Severe rate limit violation. Entering overload protection.')
        throw new Error('Rate limit exceeded. System entering overload protection.')
      } else {
        // Just delay the request instead of blocking it
        console.log('⏳ Request delayed due to rate limiting, proceeding...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Reset request count every minute
    setTimeout(() => {
      this.requestCount = Math.max(0, this.requestCount - 1)
    }, 60000)

    // Rate limiting: ensure minimum interval between requests
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before request`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    this.lastRequestTime = Date.now()

    const url = `${this.baseUrl}${endpoint}`

    // Create the request promise
    const requestPromise = this.makeRequest<T>(url, options)

    // Store the pending request
    this.pendingRequests.set(requestKey, requestPromise)

    try {
      const result = await requestPromise
      // Cache the result
      this.cache.set(requestKey, { data: result, timestamp: Date.now() })
      return result
    } catch (error) {
      // Only trigger overload protection for server errors, not client errors
      if (error instanceof Error && error.message.includes('500')) {
        console.error(`❌ Server error, triggering brief overload protection: ${requestKey}`)
        isSystemOverloaded = true
        lastSystemCheck = now
      } else {
        console.error(`❌ Request failed (not triggering overload): ${requestKey}`, error)
      }
      throw error
    } finally {
      // Remove from pending requests when done
      this.pendingRequests.delete(requestKey)
    }
  }

  private async makeRequest<T>(url: string, options: RequestInit): Promise<T> {
    try {
      console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`)

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ API Response: ${url}`)
      return data
    } catch (error) {
      console.error(`❌ API Error: ${url}`, error)
      throw error
    }
  }

  // GTFS Data endpoints
  async getRoutes() {
    return this.request('/api/v1/gtfs/routes')
  }

  async getStops() {
    return this.request('/api/v1/gtfs/stops')
  }

  async getAgencies() {
    return this.request('/api/v1/gtfs/agencies')
  }

  async getTrips() {
    return this.request('/api/v1/gtfs/trips')
  }

  async getStopTimes() {
    return this.request('/api/v1/gtfs/stop_times')
  }

  async getStopTimesByTrip(tripId: string) {
    return this.request(`/api/v1/gtfs/stop_times/trip/${tripId}`)
  }

  async getTripsByRoute(routeId: string) {
    return this.request(`/api/v1/gtfs/trips/route/${routeId}`)
  }

  async getShapes() {
    return this.request('/api/v1/gtfs/shapes')
  }

  // ML Predictions - removed duplicate function

  async getEnsemblePrediction(data: any) {
    return this.request('/api/v1/predict/ensemble', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Route Optimization
  async optimizeRoutes(data: any) {
    return this.request('/api/v1/optimize/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Weather and External Data
  async getWeather() {
    return this.request('/api/v1/live_weather/accra')
  }

  async getHolidays() {
    return this.request('/api/v1/holidays/ghana')
  }

  // Health Check
  async healthCheck() {
    return this.request('/api/v1/health')
  }

  // Ghana Economics
  async getGhanaEconomics() {
    return this.request('/api/v1/victory/ghana_economics')
  }

  // Executive Brief
  async getExecutiveBrief() {
    return this.request('/api/v1/victory/executive_brief')
  }

  // ========================================
  // 🤖 ADVANCED ML API ENDPOINTS
  // ========================================

  // Travel Time Prediction (97.8% R² accuracy)
  async predictTravelTime(params: {
    total_stops?: number
    departure_hour?: number
    departure_minute?: number
    is_weekend?: boolean
    stops_remaining?: number
    route_type?: number
  }) {
    return this.request('/api/v1/ml/predict-travel-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
  }

  // Demand Forecasting (88.4% R² accuracy)
  async predictDemand(params: {
    route_type?: number
    hour?: number
    day_of_week?: number
    is_weekend?: boolean
    is_rush_hour?: boolean
    is_business_hours?: boolean
  }) {
    return this.request('/api/v1/ml/predict-demand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
  }

  // Traffic Congestion Prediction (99.5% accuracy)
  async predictTraffic(params: {
    corridor: string
    hour: number
    minute?: number
    day_of_week?: number
    is_weekend?: boolean
    is_raining?: boolean
  }) {
    // Use our backend traffic prediction endpoint
    const response = await fetch(`${this.baseUrl}/traffic/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    return response.json()
  }

  // ML Service Health Check
  async getMLHealth() {
    return this.request('/api/v1/ml/health')
  }

  // Route Optimization Analysis
  async getRouteOptimization(params: {
    route_id: string
    stops: Array<[number, number]>
    demands: number[]
    passengers: number
    current_time?: string
  }) {
    return this.request('/api/v1/optimization/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
  }

  // Comprehensive Route Analysis (All ML components)
  async getComprehensiveRouteAnalysis(params: {
    route_id: string
    stops: Array<[number, number]>
    demands: number[]
    passengers: number
    current_time?: string
  }) {
    return this.request('/api/v1/ml/comprehensive-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
  }

  // Real-time Model Performance Metrics
  async getModelPerformance() {
    return this.request('/api/v1/ml/performance-metrics')
  }

  // Ghana-specific Cultural Factors Analysis
  async getGhanaCulturalFactors(params: {
    hour: number
    day_of_week: number
    month: number
  }) {
    return this.request('/api/v1/ml/ghana-factors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
  }
}

// Singleton instance
export const apiService = new APIService()

// Export for easy use in components
export default apiService
