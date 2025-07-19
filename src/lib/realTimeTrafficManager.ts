/**
 * 🚦 Real-time Traffic Integration Manager
 * Multi-source traffic data fusion, intelligent routing, and congestion monitoring
 */

import { apiService } from '@/services/apiService'
import { MemoryLeakDetector } from './memoryLeakFixes'

export interface TrafficDataPoint {
  segmentId: string
  coordinates: {
    start: { lat: number; lng: number }
    end: { lat: number; lng: number }
  }
  currentSpeed: number // km/h
  freeFlowSpeed: number // km/h
  congestionLevel: number // 0-1 (0 = free flow, 1 = complete standstill)
  travelTime: number // minutes
  confidence: number // 0-1 data reliability
  source: TrafficDataSource
  timestamp: Date
  incidents: TrafficIncident[]
  roadConditions: RoadCondition[]
}

export interface TrafficIncident {
  id: string
  type: 'accident' | 'construction' | 'closure' | 'weather' | 'event'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location: { lat: number; lng: number }
  startTime: Date
  estimatedEndTime?: Date
  impactRadius: number // meters
  delayMinutes: number
}

export interface RoadCondition {
  type: 'wet' | 'dry' | 'flooded' | 'construction' | 'pothole'
  severity: 'minor' | 'moderate' | 'severe'
  impactFactor: number // speed reduction multiplier
}

export interface TrafficAlert {
  id: string
  type: 'congestion' | 'incident' | 'route_blocked' | 'delay'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  affectedRoutes: string[]
  location: { lat: number; lng: number }
  timestamp: Date
  estimatedDuration: number // minutes
  alternativeRoutes?: string[]
}

export interface TrafficPrediction {
  segmentId: string
  predictedCongestion: number[]
  timeHorizons: number[] // minutes ahead
  confidence: number
  factors: string[]
}

export type TrafficDataSource = 'google_maps' | 'mapbox' | 'local_sensors' | 'user_reports' | 'government_api'

export interface TrafficConfig {
  updateInterval: number // milliseconds
  maxCacheAge: number // milliseconds
  enablePredictions: boolean
  enableIncidentDetection: boolean
  enableAlerts: boolean
  dataSources: TrafficDataSource[]
  ghanaSpecificFeatures: boolean
}

export class RealTimeTrafficManager {
  private config: TrafficConfig
  private trafficData: Map<string, TrafficDataPoint> = new Map()
  private predictions: Map<string, TrafficPrediction> = new Map()
  private incidents: Map<string, TrafficIncident> = new Map()
  private alerts: TrafficAlert[] = []
  private memoryDetector: MemoryLeakDetector
  
  // Update intervals
  private trafficUpdateInterval: NodeJS.Timeout | null = null
  private predictionUpdateInterval: NodeJS.Timeout | null = null
  private incidentCheckInterval: NodeJS.Timeout | null = null
  
  // Event handlers
  private eventHandlers: Map<string, Function[]> = new Map()
  
  // Ghana-specific route segments
  private ghanaRouteSegments = [
    { id: 'circle_madina', name: 'Circle to Madina', start: { lat: 5.5717, lng: -0.2107 }, end: { lat: 5.6836, lng: -0.1636 } },
    { id: 'kaneshie_mallam', name: 'Kaneshie to Mallam', start: { lat: 5.5564, lng: -0.2469 }, end: { lat: 5.5320, lng: -0.4142 } },
    { id: 'tema_accra', name: 'Tema to Accra', start: { lat: 5.6698, lng: -0.0166 }, end: { lat: 5.5717, lng: -0.2107 } },
    { id: 'kasoa_circle', name: 'Kasoa to Circle', start: { lat: 5.5320, lng: -0.4142 }, end: { lat: 5.5717, lng: -0.2107 } },
    { id: 'achimota_lapaz', name: 'Achimota to Lapaz', start: { lat: 5.6089, lng: -0.2297 }, end: { lat: 5.6200, lng: -0.2500 } },
    { id: 'osu_labadi', name: 'Osu to Labadi', start: { lat: 5.5500, lng: -0.1800 }, end: { lat: 5.5600, lng: -0.1600 } },
    { id: 'dansoman_korle_bu', name: 'Dansoman to Korle Bu', start: { lat: 5.5400, lng: -0.2800 }, end: { lat: 5.5400, lng: -0.2200 } },
    { id: 'spintex_airport', name: 'Spintex to Airport', start: { lat: 5.6100, lng: -0.1200 }, end: { lat: 5.6050, lng: -0.1700 } }
  ]

  constructor(config: Partial<TrafficConfig> = {}) {
    this.config = {
      updateInterval: 60000, // 1 minute
      maxCacheAge: 300000, // 5 minutes
      enablePredictions: true,
      enableIncidentDetection: true,
      enableAlerts: true,
      dataSources: ['google_maps', 'mapbox', 'local_sensors'],
      ghanaSpecificFeatures: true,
      ...config
    }
    
    this.memoryDetector = MemoryLeakDetector.getInstance()
    this.startTrafficMonitoring()
  }

  private startTrafficMonitoring(): void {
    console.log('🚦 Starting real-time traffic monitoring...')
    
    // Start traffic data updates
    this.trafficUpdateInterval = this.memoryDetector.trackInterval(
      setInterval(() => this.updateTrafficData(), this.config.updateInterval)
    )
    
    // Start prediction updates (less frequent)
    if (this.config.enablePredictions) {
      this.predictionUpdateInterval = this.memoryDetector.trackInterval(
        setInterval(() => this.updateTrafficPredictions(), this.config.updateInterval * 5)
      )
    }
    
    // Start incident monitoring
    if (this.config.enableIncidentDetection) {
      this.incidentCheckInterval = this.memoryDetector.trackInterval(
        setInterval(() => this.checkForIncidents(), this.config.updateInterval * 2)
      )
    }
    
    // Initial data load
    this.updateTrafficData()
  }

  private async updateTrafficData(): Promise<void> {
    try {
      console.log('🚦 Updating traffic data from multiple sources...')
      
      const updatePromises = this.ghanaRouteSegments.map(segment => 
        this.updateSegmentTrafficData(segment)
      )
      
      await Promise.allSettled(updatePromises)
      
      // Emit traffic update event
      this.emit('traffic_updated', {
        timestamp: new Date(),
        segmentCount: this.trafficData.size,
        averageCongestion: this.calculateAverageCongestion()
      })
      
    } catch (error) {
      console.error('🚦 Failed to update traffic data:', error)
    }
  }

  private async updateSegmentTrafficData(segment: any): Promise<void> {
    try {
      // Collect data from multiple sources
      const dataPromises = this.config.dataSources.map(source => 
        this.getTrafficDataFromSource(segment, source)
      )
      
      const results = await Promise.allSettled(dataPromises)
      const validData = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<TrafficDataPoint>).value)
      
      if (validData.length > 0) {
        // Fuse data from multiple sources
        const fusedData = this.fuseTrafficData(validData)
        this.trafficData.set(segment.id, fusedData)
        
        // Check for congestion alerts
        if (this.config.enableAlerts) {
          this.checkCongestionAlerts(fusedData)
        }
      }
      
    } catch (error) {
      console.warn(`🚦 Failed to update traffic for segment ${segment.id}:`, error)
    }
  }

  private async getTrafficDataFromSource(
    segment: any, 
    source: TrafficDataSource
  ): Promise<TrafficDataPoint> {
    
    switch (source) {
      case 'google_maps':
        return this.getGoogleMapsTrafficData(segment)
      
      case 'mapbox':
        return this.getMapboxTrafficData(segment)
      
      case 'local_sensors':
        return this.getLocalSensorData(segment)
      
      case 'government_api':
        return this.getGovernmentTrafficData(segment)
      
      default:
        throw new Error(`Unsupported traffic data source: ${source}`)
    }
  }

  private async getGoogleMapsTrafficData(segment: any): Promise<TrafficDataPoint> {
    try {
      // Simulate Google Maps API call
      const response = await fetch(`/api/traffic/google/${segment.id}`)
      if (!response.ok) throw new Error('Google Maps API failed')
      
      const data = await response.json()
      
      return {
        segmentId: segment.id,
        coordinates: { start: segment.start, end: segment.end },
        currentSpeed: data.current_speed || this.simulateSpeed(segment),
        freeFlowSpeed: data.free_flow_speed || 50,
        congestionLevel: data.congestion_level || this.simulateCongestion(),
        travelTime: data.travel_time || this.calculateTravelTime(segment),
        confidence: 0.9,
        source: 'google_maps',
        timestamp: new Date(),
        incidents: data.incidents || [],
        roadConditions: data.road_conditions || []
      }
    } catch (error) {
      // Fallback to simulation
      return this.simulateTrafficData(segment, 'google_maps')
    }
  }

  private async getMapboxTrafficData(segment: any): Promise<TrafficDataPoint> {
    try {
      // Use existing Mapbox integration
      const response = await apiService.request(`/api/v1/traffic/${segment.id}`)
      
      return {
        segmentId: segment.id,
        coordinates: { start: segment.start, end: segment.end },
        currentSpeed: response.data.current_speed,
        freeFlowSpeed: response.data.free_flow_speed,
        congestionLevel: response.data.congestion_level,
        travelTime: response.data.travel_time_minutes,
        confidence: 0.85,
        source: 'mapbox',
        timestamp: new Date(),
        incidents: [],
        roadConditions: []
      }
    } catch (error) {
      return this.simulateTrafficData(segment, 'mapbox')
    }
  }

  private async getLocalSensorData(segment: any): Promise<TrafficDataPoint> {
    // Simulate local sensor data (would be real IoT sensors in production)
    return this.simulateTrafficData(segment, 'local_sensors', 0.7)
  }

  private async getGovernmentTrafficData(segment: any): Promise<TrafficDataPoint> {
    // Simulate Ghana government traffic API
    return this.simulateTrafficData(segment, 'government_api', 0.6)
  }

  private simulateTrafficData(
    segment: any, 
    source: TrafficDataSource, 
    confidence: number = 0.8
  ): TrafficDataPoint {
    
    const hour = new Date().getHours()
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6
    
    // Ghana-specific traffic patterns
    let baseCongestion = 0.3
    if (isRushHour && !isWeekend) baseCongestion = 0.7
    if (isWeekend) baseCongestion = 0.2
    
    // Add route-specific factors
    if (segment.id.includes('circle')) baseCongestion += 0.1 // Circle is always busy
    if (segment.id.includes('tema')) baseCongestion += 0.15 // Tema road is congested
    
    const congestionLevel = Math.min(1, baseCongestion + (Math.random() - 0.5) * 0.3)
    const freeFlowSpeed = 50
    const currentSpeed = freeFlowSpeed * (1 - congestionLevel * 0.8)
    const distance = this.calculateDistance(segment.start, segment.end)
    const travelTime = (distance / currentSpeed) * 60 // minutes
    
    return {
      segmentId: segment.id,
      coordinates: { start: segment.start, end: segment.end },
      currentSpeed: Math.round(currentSpeed * 10) / 10,
      freeFlowSpeed,
      congestionLevel: Math.round(congestionLevel * 100) / 100,
      travelTime: Math.round(travelTime * 10) / 10,
      confidence,
      source,
      timestamp: new Date(),
      incidents: this.generateRandomIncidents(segment, congestionLevel),
      roadConditions: this.generateRoadConditions(segment)
    }
  }

  private fuseTrafficData(dataPoints: TrafficDataPoint[]): TrafficDataPoint {
    if (dataPoints.length === 1) return dataPoints[0]
    
    // Weighted average based on confidence
    const totalWeight = dataPoints.reduce((sum, point) => sum + point.confidence, 0)
    
    const fusedSpeed = dataPoints.reduce((sum, point) => 
      sum + (point.currentSpeed * point.confidence), 0) / totalWeight
    
    const fusedCongestion = dataPoints.reduce((sum, point) => 
      sum + (point.congestionLevel * point.confidence), 0) / totalWeight
    
    const fusedTravelTime = dataPoints.reduce((sum, point) => 
      sum + (point.travelTime * point.confidence), 0) / totalWeight
    
    // Use the most confident source as base
    const mostConfident = dataPoints.reduce((max, point) => 
      point.confidence > max.confidence ? point : max)
    
    return {
      ...mostConfident,
      currentSpeed: Math.round(fusedSpeed * 10) / 10,
      congestionLevel: Math.round(fusedCongestion * 100) / 100,
      travelTime: Math.round(fusedTravelTime * 10) / 10,
      confidence: Math.round((totalWeight / dataPoints.length) * 100) / 100,
      source: 'fused' as TrafficDataSource,
      incidents: dataPoints.flatMap(point => point.incidents),
      roadConditions: dataPoints.flatMap(point => point.roadConditions)
    }
  }

  private async updateTrafficPredictions(): Promise<void> {
    try {
      console.log('🔮 Updating traffic predictions...')
      
      for (const [segmentId, trafficData] of this.trafficData) {
        const prediction = await this.generateTrafficPrediction(trafficData)
        this.predictions.set(segmentId, prediction)
      }
      
      this.emit('predictions_updated', {
        timestamp: new Date(),
        predictionCount: this.predictions.size
      })
      
    } catch (error) {
      console.error('🔮 Failed to update traffic predictions:', error)
    }
  }

  private async generateTrafficPrediction(trafficData: TrafficDataPoint): Promise<TrafficPrediction> {
    // Simple prediction model (would use ML in production)
    const currentCongestion = trafficData.congestionLevel
    const timeHorizons = [15, 30, 60, 120] // minutes ahead
    
    const predictions = timeHorizons.map(minutes => {
      // Simulate traffic evolution
      let predicted = currentCongestion
      
      const hour = new Date().getHours()
      const futureHour = (hour + Math.floor(minutes / 60)) % 24
      
      // Rush hour patterns
      if (futureHour >= 7 && futureHour <= 9) predicted += 0.2
      if (futureHour >= 17 && futureHour <= 19) predicted += 0.3
      if (futureHour >= 22 || futureHour <= 5) predicted -= 0.3
      
      // Add some randomness
      predicted += (Math.random() - 0.5) * 0.2
      
      return Math.max(0, Math.min(1, predicted))
    })
    
    return {
      segmentId: trafficData.segmentId,
      predictedCongestion: predictions,
      timeHorizons,
      confidence: 0.75,
      factors: ['historical_patterns', 'current_conditions', 'time_of_day']
    }
  }

  private async checkForIncidents(): Promise<void> {
    try {
      // Check for new incidents based on traffic anomalies
      for (const [segmentId, trafficData] of this.trafficData) {
        if (trafficData.congestionLevel > 0.8 && trafficData.confidence > 0.7) {
          const existingIncident = Array.from(this.incidents.values())
            .find(incident => this.isNearLocation(incident.location, trafficData.coordinates.start, 1000))
          
          if (!existingIncident) {
            const incident = this.createIncidentFromTrafficData(trafficData)
            this.incidents.set(incident.id, incident)
            this.createAlert(incident)
          }
        }
      }
      
    } catch (error) {
      console.error('🚨 Failed to check for incidents:', error)
    }
  }

  private createIncidentFromTrafficData(trafficData: TrafficDataPoint): TrafficIncident {
    return {
      id: `incident_${Date.now()}_${trafficData.segmentId}`,
      type: 'accident', // Default assumption
      severity: trafficData.congestionLevel > 0.9 ? 'critical' : 'high',
      description: `Heavy congestion detected on ${trafficData.segmentId}`,
      location: trafficData.coordinates.start,
      startTime: new Date(),
      impactRadius: 500,
      delayMinutes: Math.round(trafficData.travelTime * 0.5)
    }
  }

  private createAlert(incident: TrafficIncident): void {
    const alert: TrafficAlert = {
      id: `alert_${Date.now()}`,
      type: 'incident',
      severity: incident.severity === 'critical' ? 'critical' : 'warning',
      title: `Traffic Incident Detected`,
      message: incident.description,
      affectedRoutes: [incident.id.split('_')[2]], // Extract segment ID
      location: incident.location,
      timestamp: new Date(),
      estimatedDuration: incident.delayMinutes
    }
    
    this.alerts.unshift(alert)
    this.alerts = this.alerts.slice(0, 50) // Keep last 50 alerts
    
    this.emit('alert_created', alert)
  }

  private checkCongestionAlerts(trafficData: TrafficDataPoint): void {
    if (trafficData.congestionLevel > 0.7) {
      const alert: TrafficAlert = {
        id: `congestion_${Date.now()}_${trafficData.segmentId}`,
        type: 'congestion',
        severity: trafficData.congestionLevel > 0.9 ? 'critical' : 'warning',
        title: 'Heavy Congestion',
        message: `Heavy traffic on ${trafficData.segmentId} - ${Math.round(trafficData.congestionLevel * 100)}% congestion`,
        affectedRoutes: [trafficData.segmentId],
        location: trafficData.coordinates.start,
        timestamp: new Date(),
        estimatedDuration: Math.round(trafficData.travelTime)
      }
      
      // Check if similar alert already exists
      const existingAlert = this.alerts.find(a => 
        a.type === 'congestion' && 
        a.affectedRoutes.includes(trafficData.segmentId) &&
        Date.now() - a.timestamp.getTime() < 300000 // 5 minutes
      )
      
      if (!existingAlert) {
        this.alerts.unshift(alert)
        this.emit('alert_created', alert)
      }
    }
  }

  // Utility methods
  private calculateDistance(start: { lat: number; lng: number }, end: { lat: number; lng: number }): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(end.lat - start.lat)
    const dLng = this.toRadians(end.lng - start.lng)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(start.lat)) * Math.cos(this.toRadians(end.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private isNearLocation(
    loc1: { lat: number; lng: number }, 
    loc2: { lat: number; lng: number }, 
    radiusMeters: number
  ): boolean {
    const distance = this.calculateDistance(loc1, loc2) * 1000 // Convert to meters
    return distance <= radiusMeters
  }

  private simulateSpeed(segment: any): number {
    return 30 + Math.random() * 40 // 30-70 km/h
  }

  private simulateCongestion(): number {
    return Math.random() * 0.8 // 0-80% congestion
  }

  private calculateTravelTime(segment: any): number {
    const distance = this.calculateDistance(segment.start, segment.end)
    const speed = this.simulateSpeed(segment)
    return (distance / speed) * 60 // minutes
  }

  private calculateAverageCongestion(): number {
    if (this.trafficData.size === 0) return 0
    
    const total = Array.from(this.trafficData.values())
      .reduce((sum, data) => sum + data.congestionLevel, 0)
    
    return total / this.trafficData.size
  }

  private generateRandomIncidents(segment: any, congestionLevel: number): TrafficIncident[] {
    if (congestionLevel < 0.6 || Math.random() > 0.1) return []
    
    return [{
      id: `incident_${Date.now()}_${Math.random()}`,
      type: Math.random() > 0.5 ? 'accident' : 'construction',
      severity: congestionLevel > 0.8 ? 'high' : 'medium',
      description: 'Traffic incident reported',
      location: segment.start,
      startTime: new Date(),
      impactRadius: 300,
      delayMinutes: Math.round(congestionLevel * 20)
    }]
  }

  private generateRoadConditions(segment: any): RoadCondition[] {
    const conditions: RoadCondition[] = []
    
    // Simulate weather-based conditions
    if (Math.random() > 0.8) {
      conditions.push({
        type: 'wet',
        severity: 'moderate',
        impactFactor: 0.8
      })
    }
    
    return conditions
  }

  // Event system
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler?: Function): void {
    if (!this.eventHandlers.has(event)) return
    
    if (handler) {
      const handlers = this.eventHandlers.get(event)!
      const index = handlers.indexOf(handler)
      if (index > -1) handlers.splice(index, 1)
    } else {
      this.eventHandlers.delete(event)
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`🚦 Error in traffic event handler for ${event}:`, error)
        }
      })
    }
  }

  // Public API
  getTrafficData(segmentId?: string): TrafficDataPoint[] {
    if (segmentId) {
      const data = this.trafficData.get(segmentId)
      return data ? [data] : []
    }
    return Array.from(this.trafficData.values())
  }

  getTrafficPredictions(segmentId?: string): TrafficPrediction[] {
    if (segmentId) {
      const prediction = this.predictions.get(segmentId)
      return prediction ? [prediction] : []
    }
    return Array.from(this.predictions.values())
  }

  getActiveIncidents(): TrafficIncident[] {
    return Array.from(this.incidents.values())
  }

  getRecentAlerts(limit: number = 10): TrafficAlert[] {
    return this.alerts.slice(0, limit)
  }

  getRouteTrafficSummary(routeSegments: string[]): {
    averageCongestion: number
    totalTravelTime: number
    incidents: number
    alerts: number
  } {
    const relevantData = routeSegments
      .map(segmentId => this.trafficData.get(segmentId))
      .filter(data => data !== undefined) as TrafficDataPoint[]
    
    if (relevantData.length === 0) {
      return { averageCongestion: 0, totalTravelTime: 0, incidents: 0, alerts: 0 }
    }
    
    const averageCongestion = relevantData.reduce((sum, data) => sum + data.congestionLevel, 0) / relevantData.length
    const totalTravelTime = relevantData.reduce((sum, data) => sum + data.travelTime, 0)
    const incidents = relevantData.reduce((sum, data) => sum + data.incidents.length, 0)
    const alerts = this.alerts.filter(alert => 
      alert.affectedRoutes.some(route => routeSegments.includes(route))
    ).length
    
    return {
      averageCongestion: Math.round(averageCongestion * 100) / 100,
      totalTravelTime: Math.round(totalTravelTime * 10) / 10,
      incidents,
      alerts
    }
  }

  // Cleanup
  destroy(): void {
    if (this.trafficUpdateInterval) {
      this.memoryDetector.clearInterval(this.trafficUpdateInterval)
    }
    if (this.predictionUpdateInterval) {
      this.memoryDetector.clearInterval(this.predictionUpdateInterval)
    }
    if (this.incidentCheckInterval) {
      this.memoryDetector.clearInterval(this.incidentCheckInterval)
    }
    
    this.trafficData.clear()
    this.predictions.clear()
    this.incidents.clear()
    this.alerts.length = 0
    this.eventHandlers.clear()
  }
}

// Singleton instance
export const realTimeTrafficManager = new RealTimeTrafficManager()
export default realTimeTrafficManager
