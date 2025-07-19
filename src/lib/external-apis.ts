// Ghana External APIs Manager with Backend Proxy Integration
// Fixes CORS issues by routing through backend

class ExternalAPIsManager {
  private circuitBreakers: Map<string, { failures: number; lastFailure: number; isOpen: boolean }> = new Map()
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  
  // Backend API base URL
  private readonly backendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-backend-url.com' 
    : 'http://localhost:8000'

  constructor() {
    console.log('🌐 External APIs Manager initialized with backend proxy')
    this.initializeCircuitBreakers()
  }

  private initializeCircuitBreakers() {
    const apis = ['weather', 'traffic', 'holidays', 'emissions', 'isochrone']
    apis.forEach(api => {
      this.circuitBreakers.set(api, {
        failures: 0,
        lastFailure: 0,
        isOpen: false
      })
    })
  }

  private isCircuitBreakerOpen(api: string): boolean {
    const breaker = this.circuitBreakers.get(api)
    if (!breaker) return false
    
    if (breaker.isOpen) {
      // Check if circuit should be half-open (5 minutes cooldown)
      if (Date.now() - breaker.lastFailure > 5 * 60 * 1000) {
        breaker.isOpen = false
        breaker.failures = 0
      }
    }
    
    return breaker.isOpen
  }

  private recordCircuitBreakerFailure(api: string) {
    const breaker = this.circuitBreakers.get(api)
    if (!breaker) return
    
    breaker.failures++
    breaker.lastFailure = Date.now()
    
    // Open circuit after 3 failures
    if (breaker.failures >= 3) {
      breaker.isOpen = true
      console.log(`🚨 Circuit breaker opened for ${api} API`)
    }
  }

  private recordCircuitBreakerSuccess(api: string) {
    const breaker = this.circuitBreakers.get(api)
    if (breaker) {
      breaker.failures = 0
      breaker.isOpen = false
    }
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  private setCachedData(key: string, data: any, ttlMinutes: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }

  // Backend proxy endpoints instead of direct API calls
  async getWeatherData(): Promise<any> {
    const cacheKey = 'weather-accra'
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    if (this.isCircuitBreakerOpen('weather')) {
      return this.getWeatherFallback()
    }

    try {
      // Use backend proxy instead of direct API call
      const response = await fetch(`${this.backendUrl}/api/weather/accra`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
      }

      const data = await response.json()
      this.recordCircuitBreakerSuccess('weather')
      this.setCachedData(cacheKey, data, 10) // Cache for 10 minutes
      return data

    } catch (error) {
      console.error('Weather API failed:', error)
      this.recordCircuitBreakerFailure('weather')
      return this.getWeatherFallback()
    }
  }

  async getTrafficData(): Promise<any> {
    const cacheKey = 'traffic-accra'
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    if (this.isCircuitBreakerOpen('traffic')) {
      return this.getTrafficFallback()
    }

    try {
      // Use backend proxy instead of direct API call
      const response = await fetch(`${this.backendUrl}/api/traffic/accra`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Traffic API error: ${response.status}`)
      }

      const data = await response.json()
      this.recordCircuitBreakerSuccess('traffic')
      this.setCachedData(cacheKey, data, 5) // Cache for 5 minutes
      return data

    } catch (error) {
      console.error('Traffic API failed:', error)
      this.recordCircuitBreakerFailure('traffic')
      return this.getTrafficFallback()
    }
  }

  async getHolidayData(): Promise<any> {
    const cacheKey = 'holidays-ghana-2025'
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    if (this.isCircuitBreakerOpen('holidays')) {
      return this.getHolidayFallback()
    }

    try {
      // Use backend proxy instead of direct API call
      const response = await fetch(`${this.backendUrl}/api/holidays/ghana`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Holidays API error: ${response.status}`)
      }

      const data = await response.json()
      this.recordCircuitBreakerSuccess('holidays')
      this.setCachedData(cacheKey, data, 24 * 60) // Cache for 24 hours
      return data

    } catch (error) {
      console.error('Holidays API failed:', error)
      this.recordCircuitBreakerFailure('holidays')
      return this.getHolidayFallback()
    }
  }

  async getEmissionsData(distance: number, vehicle_type: string = 'bus'): Promise<any> {
    const cacheKey = `emissions-${distance}-${vehicle_type}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    if (this.isCircuitBreakerOpen('emissions')) {
      return this.getEmissionsFallback(distance, vehicle_type)
    }

    try {
      // Use backend proxy instead of direct API call
      const response = await fetch(`${this.backendUrl}/api/emissions/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distance_km: distance,
          vehicle_type,
        }),
      })

      if (!response.ok) {
        throw new Error(`Emissions API error: ${response.status}`)
      }

      const data = await response.json()
      this.recordCircuitBreakerSuccess('emissions')
      this.setCachedData(cacheKey, data, 60) // Cache for 1 hour
      return data

    } catch (error) {
      console.error('Emissions API failed:', error)
      this.recordCircuitBreakerFailure('emissions')
      return this.getEmissionsFallback(distance, vehicle_type)
    }
  }

  async getIsochroneData(coordinates: [number, number], time: number = 30): Promise<any> {
    const cacheKey = `isochrone-${coordinates.join(',')}-${time}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    if (this.isCircuitBreakerOpen('isochrone')) {
      return this.getIsochroneFallback(coordinates, time)
    }

    try {
      // Use backend proxy instead of direct API call
      const response = await fetch(`${this.backendUrl}/api/isochrone/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates,
          time_minutes: time,
        }),
      })

      if (!response.ok) {
        throw new Error(`Isochrone API error: ${response.status}`)
      }

      const data = await response.json()
      this.recordCircuitBreakerSuccess('isochrone')
      this.setCachedData(cacheKey, data, 30) // Cache for 30 minutes
      return data

    } catch (error) {
      console.error('Isochrone API failed:', error)
      this.recordCircuitBreakerFailure('isochrone')
      return this.getIsochroneFallback(coordinates, time)
    }
  }

  // Fallback methods with realistic Ghana data
  private getWeatherFallback(): any {
    return {
      temperature: 28 + Math.random() * 4, // 28-32°C typical for Accra
      humidity: 70 + Math.random() * 20,   // 70-90% typical
      condition: 'partly_cloudy',
      wind_speed: 15 + Math.random() * 10,
      pressure: 1013 + Math.random() * 10,
      visibility: 8 + Math.random() * 2,
      description: 'Partly cloudy with moderate humidity',
      source: 'fallback'
    }
  }

  private getTrafficFallback(): any {
    return {
      congestion_level: 'moderate',
      average_speed: 25 + Math.random() * 15, // km/h
      incidents: Math.floor(Math.random() * 3),
      flow_rate: 0.6 + Math.random() * 0.3,
      estimated_delay: Math.floor(Math.random() * 15), // minutes
      description: 'Moderate traffic conditions',
      source: 'fallback'
    }
  }

  private getHolidayFallback(): any {
    return {
      holidays: [
        { name: 'Independence Day', date: '2025-03-06' },
        { name: 'Good Friday', date: '2025-04-18' },
        { name: 'Easter Monday', date: '2025-04-21' },
        { name: 'Labour Day', date: '2025-05-01' },
        { name: 'Eid al-Fitr', date: '2025-05-01' }
      ],
      source: 'fallback'
    }
  }

  private getEmissionsFallback(distance: number, vehicle_type: string): any {
    // Emission factors (kg CO2 per km)
    const factors = {
      bus: 0.089,
      car: 0.12,
      motorcycle: 0.06,
      tro_tro: 0.095
    }
    
    const factor = factors[vehicle_type as keyof typeof factors] || factors.bus
    
    return {
      carbon_kg: distance * factor,
      vehicle_type,
      distance_km: distance,
      source: 'fallback'
    }
  }

  private getIsochroneFallback(coordinates: [number, number], time: number): any {
    // Generate a simple circular isochrone around the point
    const radius = time * 0.8 / 60 // Approximate radius in degrees (assuming ~50 km/h average speed)
    
    return {
      type: 'Feature',
      properties: {
        time_minutes: time,
        center: coordinates
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [coordinates[0] - radius, coordinates[1] - radius],
          [coordinates[0] + radius, coordinates[1] - radius],
          [coordinates[0] + radius, coordinates[1] + radius],
          [coordinates[0] - radius, coordinates[1] + radius],
          [coordinates[0] - radius, coordinates[1] - radius]
        ]]
      },
      source: 'fallback'
    }
  }

  async getComprehensiveData(): Promise<any> {
    console.log('🚀 Fetching comprehensive external data...')
    
    const [weather, traffic, holidays, emissions, isochrone] = await Promise.allSettled([
      this.getWeatherData(),
      this.getTrafficData(),
      this.getHolidayData(),
      this.getEmissionsData(25, 'bus'),
      this.getIsochroneData([-0.1870, 5.6037], 30)
    ])

    const operational = [weather, traffic, holidays, emissions, isochrone]
      .filter(result => result.status === 'fulfilled').length

    console.log(`✅ External data fetch completed. ${operational}/5 APIs operational`)

    return {
      weather: weather.status === 'fulfilled' ? weather.value : null,
      traffic: traffic.status === 'fulfilled' ? traffic.value : null,
      holidays: holidays.status === 'fulfilled' ? holidays.value : null,
      emissions: emissions.status === 'fulfilled' ? emissions.value : null,
      isochrone: isochrone.status === 'fulfilled' ? isochrone.value : null,
      operational_apis: operational,
      total_apis: 5,
      timestamp: new Date().toISOString()
    }
  }

  // Health check for all APIs
  async healthCheck(): Promise<any> {
    const results = await Promise.allSettled([
      fetch(`${this.backendUrl}/api/health/weather`),
      fetch(`${this.backendUrl}/api/health/traffic`),
      fetch(`${this.backendUrl}/api/health/holidays`),
      fetch(`${this.backendUrl}/api/health/emissions`),
      fetch(`${this.backendUrl}/api/health/isochrone`)
    ])

    return {
      weather: results[0].status === 'fulfilled',
      traffic: results[1].status === 'fulfilled',
      holidays: results[2].status === 'fulfilled',
      emissions: results[3].status === 'fulfilled',
      isochrone: results[4].status === 'fulfilled',
      backend_available: results.some(r => r.status === 'fulfilled')
    }
  }
}

export default ExternalAPIsManager 