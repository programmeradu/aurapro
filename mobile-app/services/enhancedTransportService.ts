/**
 * 🚀 Enhanced Transport Service
 * Integration with advanced AURA APIs for comprehensive mobile app functionality
 */

export interface VehiclePosition {
  vehicle_id: string
  latitude: number
  longitude: number
  heading: number
  speed: number
  timestamp: string
  route_id?: string
  occupancy_level?: 'low' | 'medium' | 'high'
  vehicle_type: 'tro-tro' | 'bus' | 'taxi'
}

export interface WeatherData {
  temperature: number
  humidity: number
  conditions: string
  precipitation_probability: number
  wind_speed: number
  visibility: number
  is_rainy_season: boolean
}

export interface TrafficAlert {
  id: string
  type: 'accident' | 'construction' | 'flooding' | 'congestion'
  location: { latitude: number; longitude: number }
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  start_time: string
  estimated_end_time?: string
  affected_routes: string[]
}

export interface VehicleSafety {
  vehicle_id: string
  safety_score: number
  last_maintenance: string
  next_maintenance_due: string
  predicted_issues: string[]
  reliability_rating: number
}

export interface EconomicContext {
  fuel_price_trend: 'rising' | 'falling' | 'stable'
  exchange_rate_impact: number
  transport_cost_index: number
  economic_indicators: {
    inflation_rate: number
    fuel_subsidy_status: boolean
  }
}

class EnhancedTransportService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }

  /**
   * 🚗 Get real-time vehicle positions
   */
  async getVehiclePositions(bounds?: {
    north: number
    south: number
    east: number
    west: number
  }): Promise<VehiclePosition[]> {
    try {
      let url = `${this.baseUrl}/api/v1/vehicles/positions`
      
      if (bounds) {
        const params = new URLSearchParams({
          north: bounds.north.toString(),
          south: bounds.south.toString(),
          east: bounds.east.toString(),
          west: bounds.west.toString()
        })
        url += `?${params}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      return data.vehicles || []
    } catch (error) {
      console.error('Failed to get vehicle positions:', error)
      return []
    }
  }

  /**
   * 🌦️ Get current weather conditions for Accra
   */
  async getWeatherData(): Promise<WeatherData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/live_weather/accra`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      return await response.json()
    } catch (error) {
      console.error('Failed to get weather data:', error)
      return null
    }
  }

  /**
   * 🚦 Get live traffic alerts
   */
  async getTrafficAlerts(location?: {
    latitude: number
    longitude: number
    radius_km?: number
  }): Promise<TrafficAlert[]> {
    try {
      let url = `${this.baseUrl}/api/v1/traffic/alerts`
      
      if (location) {
        const params = new URLSearchParams({
          lat: location.latitude.toString(),
          lng: location.longitude.toString(),
          radius: (location.radius_km || 10).toString()
        })
        url += `?${params}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      return data.alerts || []
    } catch (error) {
      console.error('Failed to get traffic alerts:', error)
      return []
    }
  }

  /**
   * 🔧 Get vehicle safety information
   */
  async getVehicleSafety(vehicleId: string): Promise<VehicleSafety | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/maintenance/sensors/${vehicleId}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      return await response.json()
    } catch (error) {
      console.error('Failed to get vehicle safety data:', error)
      return null
    }
  }

  /**
   * 🏛️ Get Ghana economic context
   */
  async getEconomicContext(): Promise<EconomicContext | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ghana/economics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_type: 'transport_impact' })
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      return await response.json()
    } catch (error) {
      console.error('Failed to get economic context:', error)
      return null
    }
  }

  /**
   * 📅 Check if today is a Ghana holiday
   */
  async checkGhanaHoliday(): Promise<{
    is_holiday: boolean
    holiday_name?: string
    impact_on_transport?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/check_holiday/GH`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      return await response.json()
    } catch (error) {
      console.error('Failed to check Ghana holiday:', error)
      return { is_holiday: false }
    }
  }

  /**
   * 🗺️ Get isochrone (travel time zones)
   */
  async getIsochrone(params: {
    latitude: number
    longitude: number
    time_minutes: number
    transport_mode?: 'walking' | 'driving' | 'public_transport'
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/get_isochrone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      return await response.json()
    } catch (error) {
      console.error('Failed to get isochrone:', error)
      return null
    }
  }

  /**
   * 🚀 Enhanced route optimization
   */
  async getEnhancedRoutes(params: {
    origin: { latitude: number; longitude: number }
    destination: { latitude: number; longitude: number }
    departure_time?: string
    preferences?: {
      avoid_flooding: boolean
      prefer_covered_stops: boolean
      max_walking_distance: number
    }
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/optimize/routes/enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      return await response.json()
    } catch (error) {
      console.error('Failed to get enhanced routes:', error)
      return null
    }
  }

  /**
   * 💰 Calculate CO2 emissions for journey
   */
  async calculateCO2Emissions(params: {
    distance_km: number
    transport_mode: string
    vehicle_type?: string
  }): Promise<{ co2_kg: number; environmental_impact: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/calculate_co2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      return await response.json()
    } catch (error) {
      console.error('Failed to calculate CO2 emissions:', error)
      return null
    }
  }

  /**
   * 📊 Get real-time transport KPIs
   */
  async getRealtimeKPIs(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/kpis/realtime`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      return await response.json()
    } catch (error) {
      console.error('Failed to get realtime KPIs:', error)
      return null
    }
  }
}

export const enhancedTransportService = new EnhancedTransportService()
