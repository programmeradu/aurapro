/**
 * 🎯 Personalized Journey Recommendation Service
 * Hybrid collaborative filtering and contextual bandits approach
 * for intelligent transport recommendations
 */

import { mlService } from './mlService'
import { journeyService } from './journeyService'
import { budgetService } from './budgetService'
import { communityService } from './communityService'
import { trackingService } from './trackingService'
import { GeoPoint } from '@/types/transport'

// Core recommendation types
export interface UserProfile {
  id: string
  preferences: UserPreferences
  behaviorPattern: BehaviorPattern
  demographics: UserDemographics
  embedding: number[] // User embedding vector
  lastUpdated: Date
}

export interface UserPreferences {
  preferredTransportModes: string[]
  budgetConstraints: {
    dailyLimit: number
    monthlyLimit: number
    currency: string
  }
  timePreferences: {
    preferredDepartureWindows: TimeWindow[]
    maxWalkingDistance: number
    maxWaitingTime: number
  }
  routePreferences: {
    avoidHighTraffic: boolean
    preferScenicRoutes: boolean
    prioritizeSpeed: boolean
    prioritizeCost: boolean
    prioritizeComfort: boolean
  }
  accessibilityNeeds: string[]
}

export interface BehaviorPattern {
  frequentRoutes: RouteFrequency[]
  travelTimes: {
    weekdayPeaks: number[]
    weekendPeaks: number[]
  }
  seasonalPatterns: SeasonalPattern[]
  responseToRecommendations: RecommendationResponse[]
}

export interface UserDemographics {
  ageGroup: string
  occupation: string
  homeLocation?: GeoPoint
  workLocation?: GeoPoint
  frequentLocations: GeoPoint[]
}

export interface TimeWindow {
  startHour: number
  endHour: number
  days: number[] // 0-6 (Sunday-Saturday)
}

export interface RouteFrequency {
  origin: GeoPoint
  destination: GeoPoint
  frequency: number
  lastUsed: Date
  averageRating: number
}

export interface SeasonalPattern {
  season: 'dry' | 'rainy'
  preferredModes: string[]
  budgetAdjustment: number
}

export interface RecommendationResponse {
  recommendationId: string
  accepted: boolean
  rating?: number
  feedback?: string
  timestamp: Date
}

export interface PersonalizedRecommendation {
  id: string
  type: 'route' | 'mode' | 'time' | 'budget' | 'community'
  title: string
  description: string
  confidence: number
  priority: number
  context: RecommendationContext
  actionData: any
  expiresAt: Date
  createdAt: Date
}

export interface RecommendationContext {
  currentLocation?: GeoPoint
  timeOfDay: number
  dayOfWeek: number
  weather?: string
  trafficConditions?: string
  budgetStatus: 'under' | 'near' | 'over'
  recentActivity: string[]
}

export interface ContextualBandits {
  arms: RecommendationArm[]
  explorationRate: number
  lastUpdated: Date
}

export interface RecommendationArm {
  id: string
  type: string
  reward: number
  pulls: number
  confidence: number
  context: string[]
}

class PersonalizedRecommendationService {
  private apiUrl: string
  private userProfiles: Map<string, UserProfile> = new Map()
  private bandits: ContextualBandits
  private cache: Map<string, any> = new Map()
  private cacheTimeout = 10 * 60 * 1000 // 10 minutes

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    this.bandits = this.initializeBandits()
  }

  /**
   * 🎯 Get personalized journey recommendations
   */
  async getPersonalizedRecommendations(
    userId: string,
    context: Partial<RecommendationContext>,
    limit: number = 5
  ): Promise<PersonalizedRecommendation[]> {
    try {
      // Get or create user profile
      const userProfile = await this.getUserProfile(userId)
      
      // Enhance context with current data
      const enrichedContext = await this.enrichContext(context, userProfile)
      
      // Generate recommendations using hybrid approach
      const recommendations = await this.generateHybridRecommendations(
        userProfile,
        enrichedContext,
        limit
      )
      
      // Apply contextual bandits for exploration/exploitation
      const optimizedRecommendations = this.applyContextualBandits(
        recommendations,
        enrichedContext
      )
      
      // Log for learning
      this.logRecommendations(userId, optimizedRecommendations, enrichedContext)
      
      return optimizedRecommendations
    } catch (error) {
      console.error('Error getting personalized recommendations:', error)
      return this.getFallbackRecommendations(context)
    }
  }

  /**
   * 👤 Get or create user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      // Check cache first
      if (this.userProfiles.has(userId)) {
        const profile = this.userProfiles.get(userId)!
        if (Date.now() - profile.lastUpdated.getTime() < this.cacheTimeout) {
          return profile
        }
      }

      // Try to load from backend
      const response = await fetch(`${this.apiUrl}/api/v1/recommendations/profile/${userId}`)
      
      if (response.ok) {
        const profile = await response.json()
        this.userProfiles.set(userId, profile)
        return profile
      }
      
      // Create new profile if not found
      return await this.createUserProfile(userId)
    } catch (error) {
      console.error('Error getting user profile:', error)
      return await this.createUserProfile(userId)
    }
  }

  /**
   * 🆕 Create new user profile
   */
  private async createUserProfile(userId: string): Promise<UserProfile> {
    const defaultProfile: UserProfile = {
      id: userId,
      preferences: {
        preferredTransportModes: ['trotro', 'bus', 'taxi'],
        budgetConstraints: {
          dailyLimit: 20,
          monthlyLimit: 400,
          currency: 'GHS'
        },
        timePreferences: {
          preferredDepartureWindows: [
            { startHour: 7, endHour: 9, days: [1, 2, 3, 4, 5] },
            { startHour: 17, endHour: 19, days: [1, 2, 3, 4, 5] }
          ],
          maxWalkingDistance: 500,
          maxWaitingTime: 15
        },
        routePreferences: {
          avoidHighTraffic: true,
          preferScenicRoutes: false,
          prioritizeSpeed: true,
          prioritizeCost: true,
          prioritizeComfort: false
        },
        accessibilityNeeds: []
      },
      behaviorPattern: {
        frequentRoutes: [],
        travelTimes: {
          weekdayPeaks: [8, 18],
          weekendPeaks: [10, 15]
        },
        seasonalPatterns: [],
        responseToRecommendations: []
      },
      demographics: {
        ageGroup: 'unknown',
        occupation: 'unknown',
        frequentLocations: []
      },
      embedding: new Array(50).fill(0), // Initialize with zeros
      lastUpdated: new Date()
    }

    // Save to backend
    try {
      await fetch(`${this.apiUrl}/api/v1/recommendations/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultProfile)
      })
    } catch (error) {
      console.error('Error saving user profile:', error)
    }

    this.userProfiles.set(userId, defaultProfile)
    return defaultProfile
  }

  /**
   * 🔍 Enrich context with current data
   */
  private async enrichContext(
    context: Partial<RecommendationContext>,
    userProfile: UserProfile
  ): Promise<RecommendationContext> {
    const now = new Date()
    
    // Get budget status
    let budgetStatus: 'under' | 'near' | 'over' = 'under'
    try {
      const budget = await budgetService.getCurrentBudget()
      const spentPercentage = budget.currentSpent / budget.monthlyLimit
      if (spentPercentage > 0.9) budgetStatus = 'over'
      else if (spentPercentage > 0.7) budgetStatus = 'near'
    } catch (error) {
      console.error('Error getting budget status:', error)
    }

    // Get recent activity
    let recentActivity: string[] = []
    try {
      const history = await journeyService.getJourneyHistory(5)
      recentActivity = history.map(h => h.route?.name || 'unknown')
    } catch (error) {
      console.error('Error getting recent activity:', error)
    }

    return {
      currentLocation: context.currentLocation,
      timeOfDay: context.timeOfDay || now.getHours(),
      dayOfWeek: context.dayOfWeek || now.getDay(),
      weather: context.weather,
      trafficConditions: context.trafficConditions,
      budgetStatus,
      recentActivity
    }
  }

  /**
   * 🤖 Generate hybrid recommendations
   */
  private async generateHybridRecommendations(
    userProfile: UserProfile,
    context: RecommendationContext,
    limit: number
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = []

    // 1. Collaborative Filtering Recommendations
    const collaborativeRecs = await this.getCollaborativeRecommendations(
      userProfile,
      context,
      Math.ceil(limit * 0.4)
    )
    recommendations.push(...collaborativeRecs)

    // 2. Content-Based Recommendations
    const contentRecs = await this.getContentBasedRecommendations(
      userProfile,
      context,
      Math.ceil(limit * 0.3)
    )
    recommendations.push(...contentRecs)

    // 3. Contextual Recommendations
    const contextualRecs = await this.getContextualRecommendations(
      userProfile,
      context,
      Math.ceil(limit * 0.3)
    )
    recommendations.push(...contextualRecs)

    // Sort by priority and confidence
    return recommendations
      .sort((a, b) => b.priority * b.confidence - a.priority * a.confidence)
      .slice(0, limit)
  }

  /**
   * 👥 Collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    userProfile: UserProfile,
    context: RecommendationContext,
    limit: number
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = []

    try {
      // Find similar users based on behavior patterns
      const similarUsers = await this.findSimilarUsers(userProfile)
      
      // Get popular routes among similar users
      for (const similarUser of similarUsers.slice(0, 3)) {
        const popularRoutes = similarUser.behaviorPattern.frequentRoutes
          .filter(route => route.averageRating >= 4.0)
          .slice(0, 2)

        for (const route of popularRoutes) {
          recommendations.push({
            id: `collab_${Date.now()}_${Math.random()}`,
            type: 'route',
            title: 'Popular Route Nearby',
            description: `Users like you often travel this route with ${route.averageRating.toFixed(1)}★ rating`,
            confidence: 0.75,
            priority: 3,
            context,
            actionData: {
              origin: route.origin,
              destination: route.destination,
              estimatedFare: await this.estimateFare(route.origin, route.destination)
            },
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
            createdAt: new Date()
          })
        }
      }
    } catch (error) {
      console.error('Error generating collaborative recommendations:', error)
    }

    return recommendations.slice(0, limit)
  }

  /**
   * 📊 Content-based recommendations
   */
  private async getContentBasedRecommendations(
    userProfile: UserProfile,
    context: RecommendationContext,
    limit: number
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = []

    try {
      // Budget-based recommendations
      if (context.budgetStatus === 'near' || context.budgetStatus === 'over') {
        recommendations.push({
          id: `budget_${Date.now()}`,
          type: 'budget',
          title: 'Budget-Friendly Routes',
          description: `Save money with these cost-effective transport options`,
          confidence: 0.9,
          priority: 5,
          context,
          actionData: {
            maxFare: userProfile.preferences.budgetConstraints.dailyLimit * 0.3,
            suggestedModes: ['trotro', 'shared_taxi']
          },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          createdAt: new Date()
        })
      }

      // Time-based recommendations
      const isRushHour = (context.timeOfDay >= 7 && context.timeOfDay <= 9) ||
                        (context.timeOfDay >= 17 && context.timeOfDay <= 19)
      
      if (isRushHour && userProfile.preferences.routePreferences.avoidHighTraffic) {
        recommendations.push({
          id: `time_${Date.now()}`,
          type: 'time',
          title: 'Beat Rush Hour',
          description: 'Alternative routes to avoid heavy traffic',
          confidence: 0.85,
          priority: 4,
          context,
          actionData: {
            alternativeRoutes: true,
            estimatedTimeSaving: '15-20 minutes'
          },
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          createdAt: new Date()
        })
      }

      // Mode preference recommendations
      const preferredModes = userProfile.preferences.preferredTransportModes
      if (preferredModes.length > 0) {
        recommendations.push({
          id: `mode_${Date.now()}`,
          type: 'mode',
          title: `Your Preferred ${preferredModes[0].toUpperCase()}`,
          description: `${preferredModes[0]} options available nearby`,
          confidence: 0.8,
          priority: 3,
          context,
          actionData: {
            transportMode: preferredModes[0],
            nearbyOptions: 3
          },
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          createdAt: new Date()
        })
      }
    } catch (error) {
      console.error('Error generating content-based recommendations:', error)
    }

    return recommendations.slice(0, limit)
  }

  /**
   * 🌍 Contextual recommendations
   */
  private async getContextualRecommendations(
    userProfile: UserProfile,
    context: RecommendationContext,
    limit: number
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = []

    try {
      // Weather-based recommendations
      if (context.weather === 'rainy') {
        recommendations.push({
          id: `weather_${Date.now()}`,
          type: 'mode',
          title: 'Rainy Day Transport',
          description: 'Covered transport options for the weather',
          confidence: 0.9,
          priority: 5,
          context,
          actionData: {
            recommendedModes: ['bus', 'taxi'],
            weatherTip: 'Stay dry with covered transport'
          },
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
          createdAt: new Date()
        })
      }

      // Community-based recommendations
      try {
        const communityReports = await communityService.getNearbyReports(
          context.currentLocation || { latitude: 5.6037, longitude: -0.1870 },
          1000
        )
        
        if (communityReports.length > 0) {
          const activeReports = communityReports.filter(r => r.status === 'active')
          if (activeReports.length > 0) {
            recommendations.push({
              id: `community_${Date.now()}`,
              type: 'community',
              title: 'Live Community Updates',
              description: `${activeReports.length} live reports in your area`,
              confidence: 0.95,
              priority: 4,
              context,
              actionData: {
                reports: activeReports.slice(0, 3),
                totalCount: activeReports.length
              },
              expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
              createdAt: new Date()
            })
          }
        }
      } catch (error) {
        console.error('Error getting community recommendations:', error)
      }
    } catch (error) {
      console.error('Error generating contextual recommendations:', error)
    }

    return recommendations.slice(0, limit)
  }

  /**
   * 🎰 Apply contextual bandits
   */
  private applyContextualBandits(
    recommendations: PersonalizedRecommendation[],
    context: RecommendationContext
  ): PersonalizedRecommendation[] {
    // Simple epsilon-greedy strategy
    const epsilon = this.bandits.explorationRate
    
    if (Math.random() < epsilon) {
      // Exploration: shuffle recommendations
      return this.shuffleArray([...recommendations])
    } else {
      // Exploitation: use current confidence scores
      return recommendations.sort((a, b) => b.confidence - a.confidence)
    }
  }

  /**
   * 📝 Log recommendations for learning
   */
  private async logRecommendations(
    userId: string,
    recommendations: PersonalizedRecommendation[],
    context: RecommendationContext
  ): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/v1/recommendations/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          recommendations: recommendations.map(r => ({
            id: r.id,
            type: r.type,
            confidence: r.confidence,
            priority: r.priority
          })),
          context,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Error logging recommendations:', error)
    }
  }

  /**
   * 📊 Record user feedback
   */
  async recordFeedback(
    userId: string,
    recommendationId: string,
    action: 'accepted' | 'dismissed' | 'rated',
    rating?: number,
    feedback?: string
  ): Promise<void> {
    try {
      // Update user profile
      const userProfile = await this.getUserProfile(userId)
      userProfile.behaviorPattern.responseToRecommendations.push({
        recommendationId,
        accepted: action === 'accepted',
        rating,
        feedback,
        timestamp: new Date()
      })
      
      // Update bandits
      this.updateBandits(recommendationId, action === 'accepted' ? 1 : 0)
      
      // Send to backend
      await fetch(`${this.apiUrl}/api/v1/recommendations/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          recommendationId,
          action,
          rating,
          feedback,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Error recording feedback:', error)
    }
  }

  /**
   * 🔄 Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    try {
      const userProfile = await this.getUserProfile(userId)
      userProfile.preferences = { ...userProfile.preferences, ...preferences }
      userProfile.lastUpdated = new Date()
      
      // Save to backend
      await fetch(`${this.apiUrl}/api/v1/recommendations/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile)
      })
      
      this.userProfiles.set(userId, userProfile)
    } catch (error) {
      console.error('Error updating user preferences:', error)
    }
  }

  // Helper methods
  private async findSimilarUsers(userProfile: UserProfile): Promise<UserProfile[]> {
    // Simplified similarity calculation
    // In production, this would use more sophisticated ML algorithms
    return []
  }

  private async estimateFare(origin: GeoPoint, destination: GeoPoint): Promise<number> {
    try {
      const estimate = await journeyService.getFareEstimate(origin, destination)
      return estimate.estimatedFare || 5.0
    } catch (error) {
      return 5.0 // Default fare
    }
  }

  private initializeBandits(): ContextualBandits {
    return {
      arms: [],
      explorationRate: 0.1,
      lastUpdated: new Date()
    }
  }

  private updateBandits(recommendationId: string, reward: number): void {
    // Update bandit algorithm with reward
    // Simplified implementation
    this.bandits.explorationRate = Math.max(0.05, this.bandits.explorationRate * 0.99)
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private getFallbackRecommendations(context: Partial<RecommendationContext>): PersonalizedRecommendation[] {
    return [
      {
        id: `fallback_${Date.now()}`,
        type: 'route',
        title: 'Plan Your Journey',
        description: 'Get smart route recommendations',
        confidence: 0.5,
        priority: 1,
        context: context as RecommendationContext,
        actionData: { action: 'plan_journey' },
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date()
      }
    ]
  }
}

export const personalizedRecommendationService = new PersonalizedRecommendationService()
export default personalizedRecommendationService