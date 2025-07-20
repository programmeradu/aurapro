import { apiService } from './apiService'
import type { Location, JourneyPlan } from './apiService'

export interface UserPreferences {
  preferredTransportModes: string[]
  maxWalkingDistance: number
  budgetConstraints: {
    daily: number
    weekly: number
    monthly: number
  }
  timePreferences: {
    departureFlexibility: number // minutes
    preferredDepartureTime: string
    avoidRushHour: boolean
  }
  comfortPreferences: {
    minComfortRating: number
    preferAirConditioned: boolean
    preferDirectRoutes: boolean
  }
  accessibilityNeeds: string[]
  frequentLocations: Array<{
    name: string
    location: Location
    frequency: number
  }>
}

export interface Recommendation {
  id: string
  type: 'route' | 'budget' | 'time' | 'community' | 'general'
  title: string
  description: string
  confidence: number
  priority: 'low' | 'medium' | 'high'
  actionable: boolean
  action?: {
    type: string
    data: any
  }
  validUntil?: Date
  tags: string[]
}

export interface RouteRecommendation extends Recommendation {
  route: JourneyPlan
  savings: {
    time: number
    cost: number
    co2: number
  }
  reason: string
}

export interface BudgetRecommendation extends Recommendation {
  currentSpending: number
  suggestedBudget: number
  potentialSavings: number
  strategies: string[]
}

class RecommendationService {
  private userPreferences: UserPreferences | null = null
  private userHistory: any[] = []
  private mlRecommendations: Recommendation[] = []

  constructor() {
    this.loadUserPreferences()
  }

  private loadUserPreferences() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userPreferences')
      if (stored) {
        this.userPreferences = JSON.parse(stored)
      }
    }
  }

  private saveUserPreferences() {
    if (typeof window !== 'undefined' && this.userPreferences) {
      localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences))
    }
  }

  // Set user preferences
  setUserPreferences(preferences: Partial<UserPreferences>) {
    this.userPreferences = {
      ...this.getDefaultPreferences(),
      ...this.userPreferences,
      ...preferences
    }
    this.saveUserPreferences()
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      preferredTransportModes: ['public', 'walking'],
      maxWalkingDistance: 1000, // meters
      budgetConstraints: {
        daily: 20,
        weekly: 100,
        monthly: 400
      },
      timePreferences: {
        departureFlexibility: 15,
        preferredDepartureTime: '08:00',
        avoidRushHour: false
      },
      comfortPreferences: {
        minComfortRating: 3,
        preferAirConditioned: false,
        preferDirectRoutes: true
      },
      accessibilityNeeds: [],
      frequentLocations: []
    }
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(location?: Location): Promise<Recommendation[]> {
    try {
      // Get ML-powered recommendations from backend
      const mlResponse = await apiService.getPredictiveAnalytics({
        user_preferences: this.userPreferences,
        current_location: location,
        historical_data: this.userHistory
      })

      if (mlResponse.success && mlResponse.data) {
        this.mlRecommendations = this.transformMLRecommendations(mlResponse.data)
      }

      // Combine ML recommendations with rule-based recommendations
      const ruleBasedRecommendations = this.generateRuleBasedRecommendations(location)
      
      const allRecommendations = [
        ...this.mlRecommendations,
        ...ruleBasedRecommendations
      ]

      // Sort by priority and confidence
      return allRecommendations
        .sort((a, b) => {
          const priorityWeight = { high: 3, medium: 2, low: 1 }
          const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority]
          if (priorityDiff !== 0) return priorityDiff
          return b.confidence - a.confidence
        })
        .slice(0, 10) // Return top 10 recommendations

    } catch (error) {
      console.error('Failed to get ML recommendations:', error)
      return this.generateRuleBasedRecommendations(location)
    }
  }

  private transformMLRecommendations(mlData: any): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Transform route recommendations
    if (mlData.route_suggestions) {
      mlData.route_suggestions.forEach((suggestion: any, index: number) => {
        recommendations.push({
          id: `ml_route_${index}`,
          type: 'route',
          title: `Optimized Route: ${suggestion.title}`,
          description: suggestion.description,
          confidence: suggestion.confidence || 0.8,
          priority: suggestion.priority || 'medium',
          actionable: true,
          action: {
            type: 'navigate_route',
            data: suggestion.route_data
          },
          tags: ['ml', 'route', 'optimization']
        })
      })
    }

    // Transform budget recommendations
    if (mlData.budget_insights) {
      mlData.budget_insights.forEach((insight: any, index: number) => {
        recommendations.push({
          id: `ml_budget_${index}`,
          type: 'budget',
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence || 0.7,
          priority: insight.priority || 'medium',
          actionable: true,
          action: {
            type: 'adjust_budget',
            data: insight.budget_data
          },
          tags: ['ml', 'budget', 'savings']
        })
      })
    }

    // Transform time-based recommendations
    if (mlData.time_recommendations) {
      mlData.time_recommendations.forEach((rec: any, index: number) => {
        recommendations.push({
          id: `ml_time_${index}`,
          type: 'time',
          title: rec.title,
          description: rec.description,
          confidence: rec.confidence || 0.75,
          priority: rec.priority || 'medium',
          actionable: true,
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          tags: ['ml', 'time', 'scheduling']
        })
      })
    }

    return recommendations
  }

  private generateRuleBasedRecommendations(location?: Location): Recommendation[] {
    const recommendations: Recommendation[] = []
    const prefs = this.userPreferences || this.getDefaultPreferences()

    // Budget-based recommendations
    if (this.shouldRecommendBudgetOptimization()) {
      recommendations.push({
        id: 'budget_optimization',
        type: 'budget',
        title: 'Optimize Your Transport Budget',
        description: 'Switch to public transport for 3 days this week to save ₵25',
        confidence: 0.85,
        priority: 'high',
        actionable: true,
        action: {
          type: 'view_budget_tips',
          data: { savings: 25, period: 'week' }
        },
        tags: ['budget', 'savings', 'public_transport']
      })
    }

    // Route optimization recommendations
    if (location && prefs.frequentLocations.length > 0) {
      const nearbyFrequentLocation = this.findNearbyFrequentLocation(location)
      if (nearbyFrequentLocation) {
        recommendations.push({
          id: 'frequent_route',
          type: 'route',
          title: `Quick Route to ${nearbyFrequentLocation.name}`,
          description: 'Based on your travel patterns, here\'s the fastest route',
          confidence: 0.9,
          priority: 'high',
          actionable: true,
          action: {
            type: 'plan_journey',
            data: { destination: nearbyFrequentLocation.location }
          },
          tags: ['route', 'frequent', 'optimization']
        })
      }
    }

    // Time-based recommendations
    const currentHour = new Date().getHours()
    if (currentHour >= 7 && currentHour <= 9) {
      recommendations.push({
        id: 'rush_hour_alternative',
        type: 'time',
        title: 'Beat Rush Hour Traffic',
        description: 'Leave 15 minutes earlier to avoid peak traffic and save 20 minutes',
        confidence: 0.8,
        priority: 'medium',
        actionable: true,
        validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        tags: ['time', 'rush_hour', 'traffic']
      })
    }

    // Community-based recommendations
    recommendations.push({
      id: 'community_engagement',
      type: 'community',
      title: 'Share Your Experience',
      description: 'Help other commuters by reporting current traffic conditions',
      confidence: 0.6,
      priority: 'low',
      actionable: true,
      action: {
        type: 'open_community',
        data: {}
      },
      tags: ['community', 'sharing', 'traffic']
    })

    // Weather-based recommendations
    if (this.isRainyWeather()) {
      recommendations.push({
        id: 'weather_adjustment',
        type: 'general',
        title: 'Rainy Weather Alert',
        description: 'Consider covered transport options and allow extra travel time',
        confidence: 0.95,
        priority: 'high',
        actionable: true,
        validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
        tags: ['weather', 'rain', 'planning']
      })
    }

    return recommendations
  }

  // Route-specific recommendations
  async getRouteRecommendations(origin: Location, destination: Location): Promise<RouteRecommendation[]> {
    try {
      const response = await apiService.planJourney({
        origin,
        destination,
        preferences: this.userPreferences
      })

      if (response.success && response.data) {
        return this.generateRouteRecommendations(response.data)
      }
    } catch (error) {
      console.error('Failed to get route recommendations:', error)
    }

    return []
  }

  private generateRouteRecommendations(journeyData: any): RouteRecommendation[] {
    const recommendations: RouteRecommendation[] = []

    // Analyze different route options and create recommendations
    if (journeyData.alternatives) {
      journeyData.alternatives.forEach((route: any, index: number) => {
        if (route.savings && route.savings.time > 300) { // 5+ minutes savings
          recommendations.push({
            id: `route_rec_${index}`,
            type: 'route',
            title: `Faster Route Available`,
            description: `Save ${Math.round(route.savings.time / 60)} minutes with this alternative route`,
            confidence: 0.85,
            priority: 'high',
            actionable: true,
            route: route,
            savings: route.savings,
            reason: 'time_optimization',
            action: {
              type: 'select_route',
              data: route
            },
            tags: ['route', 'time_savings', 'optimization']
          })
        }
      })
    }

    return recommendations
  }

  // Budget recommendations
  async getBudgetRecommendations(currentSpending: number, period: 'daily' | 'weekly' | 'monthly'): Promise<BudgetRecommendation[]> {
    const prefs = this.userPreferences || this.getDefaultPreferences()
    const budgetLimit = prefs.budgetConstraints[period]
    
    const recommendations: BudgetRecommendation[] = []

    if (currentSpending > budgetLimit * 0.8) {
      recommendations.push({
        id: 'budget_warning',
        type: 'budget',
        title: 'Budget Alert',
        description: `You're approaching your ${period} budget limit`,
        confidence: 0.95,
        priority: 'high',
        actionable: true,
        currentSpending,
        suggestedBudget: budgetLimit,
        potentialSavings: currentSpending - budgetLimit,
        strategies: [
          'Use public transport instead of ride-sharing',
          'Walk for short distances under 1km',
          'Plan trips to combine multiple errands'
        ],
        tags: ['budget', 'warning', 'savings']
      })
    }

    return recommendations
  }

  // Helper methods
  private shouldRecommendBudgetOptimization(): boolean {
    // Logic to determine if budget optimization should be recommended
    return Math.random() > 0.7 // Simplified for demo
  }

  private findNearbyFrequentLocation(location: Location) {
    const prefs = this.userPreferences
    if (!prefs || prefs.frequentLocations.length === 0) return null

    // Find frequent locations within 5km
    return prefs.frequentLocations.find(freq => {
      const distance = this.calculateDistance(location, freq.location)
      return distance < 5000 // 5km
    })
  }

  private calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = loc1.latitude * Math.PI/180
    const φ2 = loc2.latitude * Math.PI/180
    const Δφ = (loc2.latitude-loc1.latitude) * Math.PI/180
    const Δλ = (loc2.longitude-loc1.longitude) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  private isRainyWeather(): boolean {
    // In a real implementation, check weather data
    return Math.random() > 0.8 // Simplified for demo
  }

  // Update user behavior for better recommendations
  updateUserBehavior(action: string, data: any) {
    this.userHistory.push({
      action,
      data,
      timestamp: new Date()
    })

    // Keep only last 100 actions
    if (this.userHistory.length > 100) {
      this.userHistory = this.userHistory.slice(-100)
    }
  }

  // Get recommendation statistics
  getRecommendationStats() {
    return {
      totalRecommendations: this.mlRecommendations.length,
      highPriorityCount: this.mlRecommendations.filter(r => r.priority === 'high').length,
      averageConfidence: this.mlRecommendations.reduce((sum, r) => sum + r.confidence, 0) / this.mlRecommendations.length || 0,
      actionableCount: this.mlRecommendations.filter(r => r.actionable).length
    }
  }
}

export const recommendationService = new RecommendationService()