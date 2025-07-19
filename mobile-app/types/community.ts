/**
 * 👥 Community & Feedback Types
 * Social features and community reporting for Ghana's transport system
 */

import { GeoPoint, TransportStop, VehicleType } from './transport'

export interface CommunityReport {
  id: string
  userId: string
  type: ReportType
  
  // Location and context
  location: GeoPoint
  stopId?: string
  routeId?: string
  vehicleId?: string
  
  // Report content
  title: string
  description: string
  category: ReportCategory
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  // Media attachments
  photos: string[]
  videos?: string[]
  audioNotes?: string[]
  
  // Verification and community response
  verificationCount: number
  verifiedBy: string[]
  disputeCount: number
  disputedBy: string[]
  
  // Status and resolution
  status: 'open' | 'investigating' | 'resolved' | 'closed' | 'duplicate'
  resolution?: string
  resolvedBy?: string
  resolvedAt?: Date
  
  // Engagement
  upvotes: number
  downvotes: number
  comments: CommunityComment[]
  shares: number
  views: number
  
  // Metadata
  isAnonymous: boolean
  language: 'en' | 'tw' | 'ga' | 'ee'
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
}

export type ReportType = 
  | 'service_issue'      // Poor service, delays, breakdowns
  | 'safety_concern'     // Safety issues, harassment, accidents
  | 'fare_dispute'       // Overcharging, fare issues
  | 'route_change'       // Route modifications, new routes
  | 'vehicle_condition'  // Vehicle maintenance issues
  | 'driver_behavior'    // Driver conduct, professionalism
  | 'infrastructure'     // Road conditions, stop facilities
  | 'positive_feedback'  // Good service, commendations
  | 'suggestion'         // Service improvements, new features
  | 'emergency'          // Urgent safety or security issues

export type ReportCategory = 
  | 'delay'
  | 'breakdown'
  | 'overcrowding'
  | 'safety'
  | 'harassment'
  | 'accident'
  | 'overcharging'
  | 'rude_behavior'
  | 'poor_driving'
  | 'vehicle_condition'
  | 'route_issue'
  | 'stop_condition'
  | 'positive'
  | 'suggestion'
  | 'other'

export interface CommunityComment {
  id: string
  reportId: string
  userId: string
  parentCommentId?: string
  
  content: string
  attachments?: string[]
  
  upvotes: number
  downvotes: number
  replies: CommunityComment[]
  
  isAnonymous: boolean
  isModerated: boolean
  isFlagged: boolean
  
  createdAt: Date
  updatedAt: Date
}

export interface ServiceRating {
  id: string
  userId: string
  
  // Rating context
  vehicleId?: string
  routeId?: string
  driverId?: string
  operatorId?: string
  stopId?: string
  
  // Rating details
  overallRating: number // 1-5 stars
  aspectRatings: {
    punctuality: number
    cleanliness: number
    safety: number
    comfort: number
    driverBehavior: number
    fareValue: number
  }
  
  // Feedback
  review: string
  pros: string[]
  cons: string[]
  recommendations: string[]
  
  // Context
  journeyDate: Date
  journeyDuration: number
  fareAmount: number
  passengerCount: number
  weatherCondition: string
  
  // Verification
  isVerified: boolean
  verificationMethod: 'gps' | 'receipt' | 'photo' | 'manual'
  
  // Engagement
  helpfulVotes: number
  totalVotes: number
  
  createdAt: Date
}

export interface CommunityAlert {
  id: string
  createdBy: string
  type: AlertType
  
  // Alert content
  title: string
  message: string
  messageLocal?: string // Local language translation
  
  // Location and scope
  location: GeoPoint
  radius: number // meters
  affectedRoutes: string[]
  affectedStops: string[]
  
  // Timing
  startTime: Date
  endTime?: Date
  estimatedDuration?: number // minutes
  
  // Severity and priority
  severity: 'info' | 'warning' | 'urgent' | 'emergency'
  priority: 'low' | 'medium' | 'high' | 'critical'
  
  // Community verification
  confirmations: number
  confirmedBy: string[]
  contradictions: number
  contradictedBy: string[]
  
  // Status
  isActive: boolean
  isVerified: boolean
  verifiedBy?: string
  verificationSource: 'community' | 'official' | 'automated'
  
  // Engagement
  views: number
  shares: number
  
  createdAt: Date
  updatedAt: Date
}

export type AlertType = 
  | 'traffic_jam'
  | 'accident'
  | 'road_closure'
  | 'breakdown'
  | 'strike'
  | 'weather'
  | 'security'
  | 'fare_change'
  | 'route_change'
  | 'service_disruption'
  | 'special_event'
  | 'construction'

export interface CommunityUser {
  id: string
  username: string
  displayName: string
  avatar?: string
  
  // Community stats
  reportsSubmitted: number
  ratingsGiven: number
  commentsPosted: number
  helpfulVotes: number
  
  // Reputation system
  reputationScore: number
  badges: UserBadge[]
  level: UserLevel
  
  // Verification status
  isVerified: boolean
  verificationMethod: 'phone' | 'email' | 'id' | 'community'
  
  // Preferences
  allowDirectMessages: boolean
  showRealName: boolean
  notificationSettings: NotificationSettings
  
  // Moderation
  isModerator: boolean
  isBanned: boolean
  warningCount: number
  
  joinedAt: Date
  lastActiveAt: Date
}

export interface UserBadge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  earnedAt: Date
  category: 'reporting' | 'rating' | 'community' | 'verification' | 'special'
}

export type UserLevel = 
  | 'newcomer'     // 0-10 points
  | 'contributor'  // 11-50 points
  | 'regular'      // 51-150 points
  | 'trusted'      // 151-500 points
  | 'expert'       // 501-1000 points
  | 'champion'     // 1000+ points

export interface NotificationSettings {
  reportUpdates: boolean
  commentReplies: boolean
  ratingResponses: boolean
  communityAlerts: boolean
  nearbyReports: boolean
  weeklyDigest: boolean
  emergencyAlerts: boolean
}

export interface CommunityStats {
  totalReports: number
  resolvedReports: number
  activeUsers: number
  averageRating: number
  
  // Recent activity
  reportsToday: number
  ratingsToday: number
  commentsToday: number
  
  // Top contributors
  topReporters: CommunityUser[]
  topRaters: CommunityUser[]
  topCommenters: CommunityUser[]
  
  // Popular content
  trendingReports: CommunityReport[]
  recentAlerts: CommunityAlert[]
  
  lastUpdated: Date
}

export interface ReportFilter {
  type?: ReportType[]
  category?: ReportCategory[]
  severity?: string[]
  status?: string[]
  location?: {
    center: GeoPoint
    radius: number
  }
  dateRange?: {
    start: Date
    end: Date
  }
  userId?: string
  routeId?: string
  verified?: boolean
  sortBy?: 'recent' | 'popular' | 'severity' | 'location'
  limit?: number
  offset?: number
}

export interface CommunityFeed {
  reports: CommunityReport[]
  alerts: CommunityAlert[]
  ratings: ServiceRating[]
  hasMore: boolean
  nextCursor?: string
  totalCount: number
}

export interface ReportSubmission {
  type: ReportType
  category: ReportCategory
  title: string
  description: string
  location: GeoPoint
  severity: 'low' | 'medium' | 'high' | 'critical'
  photos?: File[]
  videos?: File[]
  audioNotes?: Blob[]
  isAnonymous: boolean
  stopId?: string
  routeId?: string
  vehicleId?: string
  language?: 'en' | 'tw' | 'ga' | 'ee'
}

export interface RatingSubmission {
  vehicleId?: string
  routeId?: string
  driverId?: string
  overallRating: number
  aspectRatings: {
    punctuality: number
    cleanliness: number
    safety: number
    comfort: number
    driverBehavior: number
    fareValue: number
  }
  review: string
  pros: string[]
  cons: string[]
  recommendations: string[]
  journeyDate: Date
  fareAmount?: number
  photos?: File[]
}

// Ghana-specific community features
export const GHANA_REPORT_CATEGORIES = {
  'trotro_issues': {
    name: 'Tro-tro Issues',
    nameLocal: 'Tro-tro Nsɛm', // Twi
    icon: '🚐',
    color: '#F59E0B'
  },
  'metro_mass_feedback': {
    name: 'Metro Mass Feedback',
    nameLocal: 'Metro Mass Adwene',
    icon: '🚌',
    color: '#3B82F6'
  },
  'station_conditions': {
    name: 'Station Conditions',
    nameLocal: 'Gyinabea Tebea',
    icon: '🏢',
    color: '#6B7280'
  },
  'market_transport': {
    name: 'Market Transport',
    nameLocal: 'Gua Kwan',
    icon: '🏪',
    color: '#10B981'
  }
} as const

export const COMMUNITY_BADGES = {
  'first_report': {
    name: 'First Reporter',
    nameLocal: 'Amansini Amanfrɛ',
    description: 'Submitted your first community report',
    icon: '📝',
    points: 10
  },
  'helpful_citizen': {
    name: 'Helpful Citizen',
    nameLocal: 'Ɔmanfo Pa',
    description: 'Received 50+ helpful votes',
    icon: '🤝',
    points: 100
  },
  'safety_champion': {
    name: 'Safety Champion',
    nameLocal: 'Ahobammɔ Kannifo',
    description: 'Reported 10+ safety issues',
    icon: '🛡️',
    points: 200
  },
  'transport_expert': {
    name: 'Transport Expert',
    nameLocal: 'Kwan Nimdefo',
    description: 'Provided 100+ service ratings',
    icon: '⭐',
    points: 300
  }
} as const

// API Response types
export interface CommunityResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Date
}

export interface ReportResponse extends CommunityResponse<CommunityReport> {}
export interface RatingResponse extends CommunityResponse<ServiceRating> {}
export interface AlertResponse extends CommunityResponse<CommunityAlert> {}
export interface FeedResponse extends CommunityResponse<CommunityFeed> {}
export interface StatsResponse extends CommunityResponse<CommunityStats> {}
