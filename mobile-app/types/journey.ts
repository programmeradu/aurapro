/**
 * 🧭 Journey Planning Types
 * Ghana-specific journey planning and route optimization models
 */

import { GeoPoint, TransportStop, VehicleType, TransportRoute } from './transport'

export interface JourneyRequest {
  origin: GeoPoint | string // coordinates or stop ID
  destination: GeoPoint | string
  departureTime?: Date
  arrivalTime?: Date
  preferences: JourneyPreferences
  accessibility?: AccessibilityNeeds
}

export interface JourneyPreferences {
  maxWalkingDistance: number // meters
  maxWaitTime: number // minutes
  maxTransfers: number
  preferredVehicleTypes: VehicleType[]
  avoidVehicleTypes: VehicleType[]
  prioritizeBy: 'time' | 'cost' | 'comfort' | 'reliability'
  maxFare?: number // Ghana Cedis
  includeWalking: boolean
  includeSharedTaxis: boolean
  includePrivateHire: boolean
}

export interface AccessibilityNeeds {
  wheelchairAccess: boolean
  audioAnnouncements: boolean
  visualAids: boolean
  lowFloorVehicles: boolean
  assistanceRequired: boolean
}

export interface JourneyLeg {
  id: string
  mode: TransportMode
  
  // Route details
  route?: TransportRoute
  vehicleType: VehicleType
  operator?: string
  
  // Stops and timing
  origin: TransportStop
  destination: TransportStop
  departureTime: Date
  arrivalTime: Date
  duration: number // minutes
  
  // Walking segments
  walkingDistance?: number // meters
  walkingDuration?: number // minutes
  walkingInstructions?: string[]
  
  // Cost and payment
  fare: number // Ghana Cedis
  paymentMethods: PaymentMethod[]
  
  // Real-time data
  isRealTime: boolean
  confidence: number // 0-1
  delay?: number // minutes
  vehicleId?: string
  
  // Accessibility
  isAccessible: boolean
  accessibilityFeatures: string[]
  
  // Additional info
  notes?: string
  alerts?: string[]
  crowdingLevel: 'low' | 'medium' | 'high'
}

export type TransportMode = 
  | 'walking'
  | 'trotro'
  | 'metro_mass'
  | 'stc'
  | 'bus'
  | 'taxi'
  | 'shared_taxi'
  | 'uber'
  | 'bolt'
  | 'okada'
  | 'bicycle'

export type PaymentMethod = 
  | 'cash'
  | 'mobile_money'
  | 'card'
  | 'contactless'
  | 'app_payment'

export interface JourneyOption {
  id: string
  legs: JourneyLeg[]
  
  // Summary
  totalDuration: number // minutes
  totalFare: number // Ghana Cedis
  totalWalkingDistance: number // meters
  totalWalkingTime: number // minutes
  transferCount: number
  
  // Timing
  departureTime: Date
  arrivalTime: Date
  
  // Quality metrics
  reliability: number // 0-1
  comfort: number // 0-1
  convenience: number // 0-1
  overallScore: number // 0-1

  // ML and Optimization
  ml_confidence?: number // 0-1, ML model confidence
  algorithm_used?: string // e.g., "OR-Tools VRP + ML Prediction"
  co2Emissions?: number // kg CO2

  // Real-time factors
  currentDelay: number // minutes
  trafficImpact: 'none' | 'minor' | 'moderate' | 'severe'
  weatherImpact: 'none' | 'minor' | 'moderate' | 'severe'
  
  // Accessibility
  isFullyAccessible: boolean
  accessibilityIssues: string[]
  
  // Environmental
  carbonFootprint: number // kg CO2
  
  // Recommendations
  recommendationReason?: string
  alternatives?: string[]
}

export interface JourneyPlan {
  id: string
  request: JourneyRequest
  options: JourneyOption[]
  
  // Metadata
  planningTime: Date
  validUntil: Date
  dataFreshness: number // minutes since last update
  
  // Context
  currentTraffic: TrafficCondition
  weatherCondition: WeatherCondition
  specialEvents: SpecialEvent[]
  
  // Recommendations
  recommendedOption: string // journey option ID
  quickestOption: string
  cheapestOption: string
  mostComfortableOption: string
}

export interface TrafficCondition {
  level: 'light' | 'moderate' | 'heavy' | 'severe'
  affectedRoutes: string[]
  estimatedDelay: number // minutes
  source: 'google' | 'mapbox' | 'crowdsourced' | 'estimated'
  lastUpdated: Date
}

export interface WeatherCondition {
  condition: 'clear' | 'cloudy' | 'rain' | 'heavy_rain' | 'storm'
  temperature: number // Celsius
  humidity: number // percentage
  windSpeed: number // km/h
  visibility: number // km
  impact: 'none' | 'minor' | 'moderate' | 'severe'
  lastUpdated: Date
}

export interface SpecialEvent {
  id: string
  name: string
  type: 'festival' | 'sports' | 'political' | 'religious' | 'market' | 'construction'
  location: GeoPoint
  radius: number // meters affected
  startTime: Date
  endTime: Date
  impact: 'none' | 'minor' | 'moderate' | 'severe'
  affectedRoutes: string[]
  recommendations: string[]
}

export interface RouteSegment {
  id: string
  startPoint: GeoPoint
  endPoint: GeoPoint
  distance: number // meters
  estimatedTime: number // minutes
  roadType: 'highway' | 'main_road' | 'local_road' | 'dirt_road'
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  trafficLevel: 'light' | 'moderate' | 'heavy'
  safetyRating: number // 1-5
}

export interface FareCalculation {
  baseFare: number
  distanceFare: number
  timeFare: number
  surcharges: {
    name: string
    amount: number
    reason: string
  }[]
  discounts: {
    name: string
    amount: number
    reason: string
  }[]
  totalFare: number
  currency: 'GHS'
  lastUpdated: Date
}

export interface JourneyAlert {
  id: string
  type: 'delay' | 'cancellation' | 'route_change' | 'fare_change' | 'weather' | 'traffic'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  affectedLegs: string[] // journey leg IDs
  startTime: Date
  endTime?: Date
  actionRequired: boolean
  alternatives?: JourneyOption[]
}

export interface SavedJourney {
  id: string
  userId: string
  name: string
  origin: TransportStop
  destination: TransportStop
  
  // Preferences
  preferredDepartureTime?: string // HH:MM format
  preferredDays: string[] // ['monday', 'tuesday', ...]
  preferences: JourneyPreferences
  
  // Usage stats
  timesUsed: number
  lastUsed: Date
  averageRating: number
  
  // Notifications
  enableAlerts: boolean
  alertTypes: string[]
  
  isActive: boolean
  createdAt: Date
}

export interface JourneyHistory {
  id: string
  userId: string
  journeyPlan: JourneyPlan
  selectedOption: JourneyOption
  
  // Actual journey data
  actualDepartureTime?: Date
  actualArrivalTime?: Date
  actualFare?: number
  actualDuration?: number
  
  // Feedback
  rating?: number // 1-5
  feedback?: string
  issues?: string[]
  
  // Completion status
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  completedLegs: string[]
  
  createdAt: Date
  updatedAt: Date
}

export interface PopularDestination {
  stop: TransportStop
  category: 'market' | 'mall' | 'hospital' | 'school' | 'office' | 'residential' | 'transport_hub'
  popularity: number // 0-1
  peakHours: string[]
  averageFare: number
  averageTravelTime: number
  accessibilityRating: number
  safetyRating: number
}

export interface RouteOptimization {
  originalRoute: JourneyOption
  optimizedRoute: JourneyOption
  improvements: {
    timeSaved: number // minutes
    costSaved: number // Ghana Cedis
    comfortImproved: boolean
    reliabilityImproved: boolean
  }
  optimizationFactors: string[]
  confidence: number // 0-1
}

// Ghana-specific constants
export const GHANA_TRANSPORT_HUBS = [
  {
    name: 'Kwame Nkrumah Circle',
    location: { latitude: 5.5719, longitude: -0.2061 },
    type: 'major_interchange',
    region: 'GAR'
  },
  {
    name: 'Kaneshie Market',
    location: { latitude: 5.5564, longitude: -0.2367 },
    type: 'market_terminal',
    region: 'GAR'
  },
  {
    name: 'Tema Station',
    location: { latitude: 5.5502, longitude: -0.2049 },
    type: 'intercity_terminal',
    region: 'GAR'
  },
  {
    name: 'Kejetia Market (Kumasi)',
    location: { latitude: 6.6885, longitude: -1.6244 },
    type: 'major_terminal',
    region: 'ASH'
  }
] as const

export const FARE_ZONES = {
  'zone_1': { name: 'City Center', baseFare: 2.0, maxFare: 5.0 },
  'zone_2': { name: 'Suburbs', baseFare: 3.0, maxFare: 8.0 },
  'zone_3': { name: 'Outer Areas', baseFare: 5.0, maxFare: 15.0 },
  'intercity': { name: 'Between Cities', baseFare: 10.0, maxFare: 50.0 }
} as const

export const PEAK_HOURS = {
  morning: { start: '06:00', end: '09:00' },
  evening: { start: '17:00', end: '20:00' },
  weekend: { start: '10:00', end: '14:00' }
} as const

export const WALKING_SPEEDS = {
  slow: 3, // km/h
  normal: 4,
  fast: 5,
  accessibility: 2
} as const

// API Response types
export interface JourneyPlanResponse {
  success: boolean
  data?: JourneyPlan
  error?: string
  timestamp: Date
  processingTime: number // milliseconds
}

export interface PopularDestinationsResponse {
  success: boolean
  data?: {
    destinations: PopularDestination[]
    categories: string[]
    lastUpdated: Date
  }
  error?: string
}

export interface FareEstimateResponse {
  success: boolean
  data?: {
    estimate: FareCalculation
    alternatives: FareCalculation[]
    factors: string[]
  }
  error?: string
}
