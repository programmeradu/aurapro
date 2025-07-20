import { apiService } from './apiService'

export interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp?: Date
  userId?: string
  sessionId?: string
}

export interface UserBehavior {
  pageViews: number
  sessionDuration: number
  interactions: number
  journeyPlans: number
  lastActive: Date
}

class AnalyticsService {
  private events: AnalyticsEvent[] = []
  private sessionId: string
  private userId?: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeSession()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeSession() {
    this.track('session_start', {
      sessionId: this.sessionId,
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    })
  }

  setUserId(userId: string) {
    this.userId = userId
    this.track('user_identified', { userId })
  }

  track(event: string, properties: Record<string, any> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined
      },
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId
    }

    this.events.push(analyticsEvent)

    // Send to backend analytics (in production)
    if (process.env.NODE_ENV === 'production') {
      this.sendToBackend(analyticsEvent)
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', analyticsEvent)
    }
  }

  private async sendToBackend(event: AnalyticsEvent) {
    try {
      // In a real implementation, send to your analytics backend
      // await apiService.post('/api/v1/analytics/events', event)
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }

  // Journey Planning Analytics
  trackJourneySearch(origin: string, destination: string, mode: string) {
    this.track('journey_search', {
      origin,
      destination,
      mode,
      category: 'journey_planning'
    })
  }

  trackJourneySelected(journeyId: string, provider: string, cost: number, duration: number) {
    this.track('journey_selected', {
      journeyId,
      provider,
      cost,
      duration,
      category: 'journey_planning'
    })
  }

  trackRouteOptimization(originalDuration: number, optimizedDuration: number, savings: number) {
    this.track('route_optimized', {
      originalDuration,
      optimizedDuration,
      timeSavings: savings,
      category: 'optimization'
    })
  }

  // Budget Analytics
  trackBudgetSet(amount: number, period: string) {
    this.track('budget_set', {
      amount,
      period,
      category: 'budget'
    })
  }

  trackExpenseLogged(amount: number, category: string, mode: string) {
    this.track('expense_logged', {
      amount,
      category,
      mode,
      category: 'budget'
    })
  }

  trackBudgetAlert(type: 'warning' | 'exceeded', percentage: number) {
    this.track('budget_alert', {
      type,
      percentage,
      category: 'budget'
    })
  }

  // Community Analytics
  trackCommunityPost(type: string, location?: string) {
    this.track('community_post_created', {
      type,
      location,
      category: 'community'
    })
  }

  trackCommunityEngagement(action: 'like' | 'comment' | 'share', postId: string) {
    this.track('community_engagement', {
      action,
      postId,
      category: 'community'
    })
  }

  // Map Analytics
  trackMapInteraction(action: string, layer?: string) {
    this.track('map_interaction', {
      action,
      layer,
      category: 'map'
    })
  }

  trackVehicleTracking(vehicleId: string, route: string) {
    this.track('vehicle_tracked', {
      vehicleId,
      route,
      category: 'tracking'
    })
  }

  // Performance Analytics
  trackPageLoad(page: string, loadTime: number) {
    this.track('page_load', {
      page,
      loadTime,
      category: 'performance'
    })
  }

  trackApiCall(endpoint: string, duration: number, success: boolean) {
    this.track('api_call', {
      endpoint,
      duration,
      success,
      category: 'performance'
    })
  }

  trackError(error: string, context: string, stack?: string) {
    this.track('error_occurred', {
      error,
      context,
      stack,
      category: 'error'
    })
  }

  // User Behavior Analytics
  async getUserBehavior(): Promise<UserBehavior> {
    const sessionEvents = this.events.filter(e => e.sessionId === this.sessionId)
    
    return {
      pageViews: sessionEvents.filter(e => e.event === 'page_view').length,
      sessionDuration: this.getSessionDuration(),
      interactions: sessionEvents.filter(e => e.event.includes('click') || e.event.includes('interaction')).length,
      journeyPlans: sessionEvents.filter(e => e.event === 'journey_search').length,
      lastActive: new Date()
    }
  }

  private getSessionDuration(): number {
    const sessionEvents = this.events.filter(e => e.sessionId === this.sessionId)
    if (sessionEvents.length < 2) return 0

    const firstEvent = sessionEvents[0].timestamp!
    const lastEvent = sessionEvents[sessionEvents.length - 1].timestamp!
    
    return lastEvent.getTime() - firstEvent.getTime()
  }

  // Get analytics summary
  getAnalyticsSummary() {
    const totalEvents = this.events.length
    const uniqueEvents = new Set(this.events.map(e => e.event)).size
    const categories = new Set(this.events.map(e => e.properties.category)).size

    return {
      totalEvents,
      uniqueEvents,
      categories,
      sessionId: this.sessionId,
      userId: this.userId,
      sessionDuration: this.getSessionDuration()
    }
  }

  // Export events for analysis
  exportEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  // Clear events (for privacy)
  clearEvents() {
    this.events = []
  }
}

export const analyticsService = new AnalyticsService()