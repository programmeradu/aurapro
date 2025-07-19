/**
 * 🚌 Transport Tracking Types
 * Ghana-specific transport data models for crowdsourced tracking
 */

export interface GeoPoint {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: Date
}

export interface GhanaRegion {
  id: string
  name: string
  code: string // e.g., 'GAR' for Greater Accra Region
}

export interface TransportStop {
  id: string
  name: string
  nameLocal?: string // Local language name
  location: GeoPoint
  type: 'terminal' | 'station' | 'stop' | 'junction'
  region: GhanaRegion
  facilities: string[] // ['shelter', 'toilet', 'food', 'atm']
  accessibility: boolean
  isActive: boolean
}

export interface TransportRoute {
  id: string
  name: string
  nameLocal?: string
  routeNumber?: string
  origin: TransportStop
  destination: TransportStop
  stops: TransportStop[]
  distance: number // in kilometers
  estimatedDuration: number // in minutes
  operatingHours: {
    start: string // '05:00'
    end: string   // '22:00'
  }
  frequency: number // average minutes between vehicles
  fareRange: {
    min: number // in Ghana Cedis
    max: number
  }
  vehicleTypes: VehicleType[]
  isActive: boolean
}

export type VehicleType = 
  | 'trotro'      // Shared minibus
  | 'metro_mass'  // Government buses
  | 'stc'         // State Transport Corporation
  | 'bus'         // Private buses
  | 'taxi'        // Shared taxi
  | 'uber'        // Ride-hailing
  | 'okada'       // Motorcycle taxi

export interface Vehicle {
  id: string
  licensePlate: string
  type: VehicleType
  capacity: number
  currentRoute?: TransportRoute
  operator: {
    name: string
    phone?: string
    union?: string // e.g., 'GPRTU'
  }
  features: string[] // ['ac', 'music', 'wifi', 'charging']
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  isActive: boolean
  lastSeen: Date
}

export interface JourneyTracking {
  id: string
  userId: string
  vehicleId: string
  routeId: string
  
  // Journey details
  boardingStop: TransportStop
  boardingTime: Date
  boardingLocation: GeoPoint
  
  destinationStop?: TransportStop
  alightingTime?: Date
  alightingLocation?: GeoPoint
  
  // Real-time tracking
  currentLocation?: GeoPoint
  isActive: boolean
  
  // Crowdsourced data
  passengerCount: number
  vehicleCondition: 'excellent' | 'good' | 'fair' | 'poor'
  driverRating?: number // 1-5 stars
  comfort: 'comfortable' | 'crowded' | 'very_crowded'
  
  // Cost and payment
  fareAmount?: number
  paymentMethod?: 'cash' | 'mobile_money' | 'card'
  
  // Additional info
  notes?: string
  issues?: string[] // ['breakdown', 'delay', 'rude_driver', 'overcharging']
  
  // Privacy and consent
  shareLocation: boolean
  shareData: boolean
}

export interface VehicleLocation {
  vehicleId: string
  location: GeoPoint
  heading?: number // degrees from north
  speed?: number   // km/h
  accuracy: number // meters
  timestamp: Date
  
  // Crowdsourced data
  passengerCount: number
  capacity: number
  status: 'moving' | 'stopped' | 'boarding' | 'breakdown'
  
  // Data source
  source: 'commuter' | 'driver' | 'estimated'
  reportedBy: string // user ID
  confidence: number // 0-1 confidence score
}

export interface RouteAnalytics {
  routeId: string
  date: Date
  
  // Performance metrics
  averageSpeed: number
  averageDelay: number
  onTimePerformance: number // percentage
  
  // Demand metrics
  totalPassengers: number
  peakHours: string[]
  occupancyRate: number // percentage
  
  // Service quality
  averageRating: number
  commonIssues: string[]
  
  // Predictions
  nextVehicleETA?: Date
  recommendedDeparture?: Date
}

export interface CrowdsourcedUpdate {
  id: string
  userId: string
  type: 'location' | 'boarding' | 'alighting' | 'issue' | 'rating'
  
  // Location data
  location: GeoPoint
  vehicleId?: string
  routeId?: string
  
  // Update content
  message?: string
  rating?: number
  issues?: string[]
  photos?: string[] // URLs
  
  // Verification
  verified: boolean
  verificationScore: number // 0-1
  reportCount: number // how many users reported similar
  
  // Metadata
  timestamp: Date
  deviceInfo: {
    platform: string
    version: string
    connectivity: 'wifi' | '4g' | '3g' | '2g'
  }
}

export interface TransportAlert {
  id: string
  type: 'delay' | 'breakdown' | 'route_change' | 'strike' | 'weather' | 'accident'
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  title: string
  message: string
  messageLocal?: string // Local language
  
  // Affected areas
  routes: string[]
  regions: string[]
  stops: string[]
  
  // Timing
  startTime: Date
  endTime?: Date
  estimatedDuration?: number // minutes
  
  // Source
  source: 'official' | 'crowdsourced' | 'automated'
  reportedBy?: string
  verificationCount: number
  
  // Actions
  alternativeRoutes?: string[]
  recommendations?: string[]
  
  isActive: boolean
}

export interface UserPreferences {
  userId: string
  
  // Privacy settings
  shareLocation: boolean
  shareJourneyData: boolean
  allowTracking: boolean
  
  // Notification preferences
  routeAlerts: boolean
  delayNotifications: boolean
  newRouteUpdates: boolean
  
  // Preferred routes and stops
  homeLocation?: GeoPoint
  workLocation?: GeoPoint
  favoriteRoutes: string[]
  frequentStops: string[]
  
  // Accessibility needs
  wheelchairAccess: boolean
  audioAnnouncements: boolean
  visualAids: boolean
  
  // Language and region
  language: 'en' | 'tw' | 'ga' | 'ee' // English, Twi, Ga, Ewe
  region: string
  currency: 'GHS' // Ghana Cedis
  
  // Incentive participation
  participateInRewards: boolean
  dataRewardsOptIn: boolean
}

export interface DataReward {
  id: string
  userId: string
  type: 'data_bundle' | 'fare_discount' | 'loyalty_points' | 'mobile_money'
  
  amount: number
  currency: 'GHS' | 'MB' | 'points'
  
  // Earning criteria
  earnedFor: 'journey_tracking' | 'location_sharing' | 'feedback' | 'referral'
  journeyCount?: number
  dataPointsShared?: number
  
  // Redemption
  isRedeemed: boolean
  redeemedAt?: Date
  redemptionMethod?: string
  
  // Validity
  expiresAt: Date
  isActive: boolean
  
  // Partner integration
  partnerId?: string // MTN, Vodafone, etc.
  partnerReference?: string
}

// API Response types
export interface TrackingResponse {
  success: boolean
  data?: any
  error?: string
  timestamp: Date
}

export interface NearbyVehiclesResponse extends TrackingResponse {
  data?: {
    vehicles: VehicleLocation[]
    routes: TransportRoute[]
    estimatedArrivals: {
      vehicleId: string
      eta: Date
      confidence: number
    }[]
  }
}

export interface JourneyPrediction {
  routeId: string
  origin: TransportStop
  destination: TransportStop
  
  // Predictions
  nextVehicleETA: Date
  estimatedJourneyTime: number
  estimatedFare: number
  
  // Confidence and alternatives
  confidence: number
  alternatives: {
    routeId: string
    eta: Date
    duration: number
    fare: number
  }[]
  
  // Real-time factors
  currentTraffic: 'light' | 'moderate' | 'heavy'
  weatherImpact: 'none' | 'minor' | 'major'
  specialEvents?: string[]
}

// Ghana-specific constants
export const GHANA_REGIONS = [
  { id: 'GAR', name: 'Greater Accra Region', code: 'GAR' },
  { id: 'ASH', name: 'Ashanti Region', code: 'ASH' },
  { id: 'WR', name: 'Western Region', code: 'WR' },
  { id: 'CR', name: 'Central Region', code: 'CR' },
  { id: 'VR', name: 'Volta Region', code: 'VR' },
  { id: 'ER', name: 'Eastern Region', code: 'ER' },
  { id: 'NR', name: 'Northern Region', code: 'NR' },
  { id: 'UER', name: 'Upper East Region', code: 'UER' },
  { id: 'UWR', name: 'Upper West Region', code: 'UWR' },
  { id: 'BR', name: 'Brong-Ahafo Region', code: 'BR' },
] as const

export const VEHICLE_TYPE_COLORS = {
  trotro: '#F59E0B',      // Amber
  metro_mass: '#3B82F6',  // Blue
  stc: '#10B981',         // Green
  bus: '#8B5CF6',         // Purple
  taxi: '#EF4444',        // Red
  uber: '#000000',        // Black
  okada: '#F97316',       // Orange
} as const

export const TRANSPORT_UNIONS = [
  'GPRTU', // Ghana Private Road Transport Union
  'PROTOA', // Progressive Transport Owners Association
  'GTUC', // Ghana Transport Union Congress
  'Independent'
] as const

// Additional GTFS-related types
export interface TransportAgency {
  id: string
  name: string
  url?: string
  timezone: string
  lang?: string
  phone?: string
  fareUrl?: string
  email?: string
}

export interface Trip {
  id: string
  routeId: string
  serviceId: string
  headsign?: string
  shortName?: string
  directionId?: number
  blockId?: string
  shapeId?: string
  wheelchairAccessible?: boolean
  bikesAllowed?: boolean
}

export interface StopTime {
  tripId: string
  arrivalTime: string
  departureTime: string
  stopId: string
  stopSequence: number
  headsign?: string
  pickupType?: number
  dropOffType?: number
  shapeDistTraveled?: number
  timepoint?: boolean
}
