/**
 * 📊 Recommendation Analytics Service
 * Advanced analytics and performance tracking for the recommendation system
 */

import { PersonalizedRecommendation } from './personalizedRecommendationService'

interface AnalyticsEvent {
  eventType: 'impression' | 'click' | 'accept' | 'dismiss' | 'rate' | 'convert'
  recommendationId: string
  userId: string
  timestamp: string
  context: {
    position: number
    totalRecommendations: number
    screenType: string
    sessionId: string
  }
  metadata?: Record<string, any>
}

interface RecommendationMetrics {
  impressions: number
  clicks: number
  accepts: number
  dismissals: number
  ratings: number
  conversions: number
  ctr: number // Click-through rate
  acceptance_rate: number
  conversion_rate: number
  avg_rating: number
  avg_position: number
}

interface UserSegment {
  id: string
  name: string
  criteria: {
    budget_range?: [number, number]
    travel_frequency?: 'low' | 'medium' | 'high'
    preferred_modes?: string[]
    time_sensitivity?: 'flexible' | 'moderate' | 'strict'
  }
  metrics: RecommendationMetrics
}

interface ABTestVariant {
  id: string
  name: string
  description: string
  config: Record<string, any>
  traffic_allocation: number
  metrics: RecommendationMetrics
  statistical_significance?: number
}

class RecommendationAnalyticsService {
  private events: AnalyticsEvent[] = []
  private sessionId: string
  private batchSize = 50
  private flushInterval = 30000 // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startBatchFlush()
  }

  /**
   * Track recommendation impression
   */
  trackImpression(
    recommendationId: string,
    userId: string,
    position: number,
    totalRecommendations: number,
    screenType: string = 'home',
    metadata?: Record<string, any>
  ): void {
    this.trackEvent({
      eventType: 'impression',
      recommendationId,
      userId,
      timestamp: new Date().toISOString(),
      context: {
        position,
        totalRecommendations,
        screenType,
        sessionId: this.sessionId
      },
      metadata
    })
  }

  /**
   * Track recommendation click
   */
  trackClick(
    recommendationId: string,
    userId: string,
    position: number,
    totalRecommendations: number,
    screenType: string = 'home',
    metadata?: Record<string, any>
  ): void {
    this.trackEvent({
      eventType: 'click',
      recommendationId,
      userId,
      timestamp: new Date().toISOString(),
      context: {
        position,
        totalRecommendations,
        screenType,
        sessionId: this.sessionId
      },
      metadata
    })
  }

  /**
   * Track recommendation acceptance
   */
  trackAcceptance(
    recommendationId: string,
    userId: string,
    position: number,
    totalRecommendations: number,
    screenType: string = 'home',
    metadata?: Record<string, any>
  ): void {
    this.trackEvent({
      eventType: 'accept',
      recommendationId,
      userId,
      timestamp: new Date().toISOString(),
      context: {
        position,
        totalRecommendations,
        screenType,
        sessionId: this.sessionId
      },
      metadata
    })
  }

  /**
   * Track recommendation dismissal
   */
  trackDismissal(
    recommendationId: string,
    userId: string,
    position: number,
    totalRecommendations: number,
    screenType: string = 'home',
    reason?: string
  ): void {
    this.trackEvent({
      eventType: 'dismiss',
      recommendationId,
      userId,
      timestamp: new Date().toISOString(),
      context: {
        position,
        totalRecommendations,
        screenType,
        sessionId: this.sessionId
      },
      metadata: { reason }
    })
  }

  /**
   * Track recommendation rating
   */
  trackRating(
    recommendationId: string,
    userId: string,
    rating: number,
    feedback?: string,
    position?: number,
    totalRecommendations?: number
  ): void {
    this.trackEvent({
      eventType: 'rate',
      recommendationId,
      userId,
      timestamp: new Date().toISOString(),
      context: {
        position: position || 0,
        totalRecommendations: totalRecommendations || 1,
        screenType: 'rating',
        sessionId: this.sessionId
      },
      metadata: { rating, feedback }
    })
  }

  /**
   * Track recommendation conversion (user completed the recommended journey)
   */
  trackConversion(
    recommendationId: string,
    userId: string,
    journeyId: string,
    actualRoute: any,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent({
      eventType: 'convert',
      recommendationId,
      userId,
      timestamp: new Date().toISOString(),
      context: {
        position: 0,
        totalRecommendations: 1,
        screenType: 'journey',
        sessionId: this.sessionId
      },
      metadata: {
        journeyId,
        actualRoute,
        ...metadata
      }
    })
  }

  /**
   * Track generic event
   */
  private trackEvent(event: AnalyticsEvent): void {
    this.events.push(event)
    
    // Flush if batch is full
    if (this.events.length >= this.batchSize) {
      this.flushEvents()
    }
  }

  /**
   * Get recommendation metrics for a specific recommendation
   */
  async getRecommendationMetrics(recommendationId: string): Promise<RecommendationMetrics> {
    try {
      const response = await fetch(`/api/analytics/recommendations/${recommendationId}/metrics`)
      if (!response.ok) throw new Error('Failed to fetch metrics')
      return await response.json()
    } catch (error) {
      console.error('Error fetching recommendation metrics:', error)
      return this.getDefaultMetrics()
    }
  }

  /**
   * Get user segment metrics
   */
  async getUserSegmentMetrics(userId: string): Promise<UserSegment | null> {
    try {
      const response = await fetch(`/api/analytics/users/${userId}/segment`)
      if (!response.ok) throw new Error('Failed to fetch user segment')
      return await response.json()
    } catch (error) {
      console.error('Error fetching user segment:', error)
      return null
    }
  }

  /**
   * Get overall recommendation system metrics
   */
  async getSystemMetrics(timeRange: string = '7d'): Promise<{
    overall: RecommendationMetrics
    byType: Record<string, RecommendationMetrics>
    byPosition: Record<number, RecommendationMetrics>
    trends: Array<{ date: string; metrics: RecommendationMetrics }>
  }> {
    try {
      const response = await fetch(`/api/analytics/system/metrics?timeRange=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch system metrics')
      return await response.json()
    } catch (error) {
      console.error('Error fetching system metrics:', error)
      return {
        overall: this.getDefaultMetrics(),
        byType: {},
        byPosition: {},
        trends: []
      }
    }
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(testId: string): Promise<{
    test: {
      id: string
      name: string
      description: string
      status: 'running' | 'completed' | 'paused'
      start_date: string
      end_date?: string
    }
    variants: ABTestVariant[]
    winner?: string
    confidence: number
  }> {
    try {
      const response = await fetch(`/api/analytics/ab-tests/${testId}`)
      if (!response.ok) throw new Error('Failed to fetch A/B test results')
      return await response.json()
    } catch (error) {
      console.error('Error fetching A/B test results:', error)
      throw error
    }
  }

  /**
   * Generate recommendation performance report
   */
  async generatePerformanceReport(
    userId?: string,
    timeRange: string = '30d'
  ): Promise<{
    summary: RecommendationMetrics
    topPerforming: Array<{
      recommendationId: string
      type: string
      metrics: RecommendationMetrics
    }>
    underPerforming: Array<{
      recommendationId: string
      type: string
      metrics: RecommendationMetrics
      issues: string[]
    }>
    insights: Array<{
      type: 'opportunity' | 'warning' | 'success'
      title: string
      description: string
      actionable: boolean
    }>
  }> {
    try {
      const params = new URLSearchParams({ timeRange })
      if (userId) params.append('userId', userId)
      
      const response = await fetch(`/api/analytics/reports/performance?${params}`)
      if (!response.ok) throw new Error('Failed to generate performance report')
      return await response.json()
    } catch (error) {
      console.error('Error generating performance report:', error)
      throw error
    }
  }

  /**
   * Get real-time recommendation dashboard data
   */
  async getDashboardData(): Promise<{
    liveMetrics: {
      activeUsers: number
      recommendationsServed: number
      acceptanceRate: number
      avgResponseTime: number
    }
    recentActivity: Array<{
      timestamp: string
      event: string
      userId: string
      recommendationId: string
      details: any
    }>
    alerts: Array<{
      type: 'performance' | 'error' | 'anomaly'
      severity: 'low' | 'medium' | 'high'
      message: string
      timestamp: string
    }>
  }> {
    try {
      const response = await fetch('/api/analytics/dashboard')
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      return await response.json()
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw error
    }
  }

  /**
   * Flush events to server
   */
  private async flushEvents(): void {
    if (this.events.length === 0) return

    const eventsToFlush = [...this.events]
    this.events = []

    try {
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToFlush })
      })

      if (!response.ok) {
        console.error('Failed to flush analytics events:', response.statusText)
        // Re-add events to queue for retry
        this.events.unshift(...eventsToFlush)
      }
    } catch (error) {
      console.error('Error flushing analytics events:', error)
      // Re-add events to queue for retry
      this.events.unshift(...eventsToFlush)
    }
  }

  /**
   * Start batch flush timer
   */
  private startBatchFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents()
    }, this.flushInterval)
  }

  /**
   * Stop batch flush timer
   */
  stopBatchFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    // Flush remaining events
    this.flushEvents()
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get default metrics structure
   */
  private getDefaultMetrics(): RecommendationMetrics {
    return {
      impressions: 0,
      clicks: 0,
      accepts: 0,
      dismissals: 0,
      ratings: 0,
      conversions: 0,
      ctr: 0,
      acceptance_rate: 0,
      conversion_rate: 0,
      avg_rating: 0,
      avg_position: 0
    }
  }

  /**
   * Calculate metrics from events
   */
  calculateMetricsFromEvents(events: AnalyticsEvent[]): RecommendationMetrics {
    const metrics = this.getDefaultMetrics()
    
    events.forEach(event => {
      switch (event.eventType) {
        case 'impression':
          metrics.impressions++
          break
        case 'click':
          metrics.clicks++
          break
        case 'accept':
          metrics.accepts++
          break
        case 'dismiss':
          metrics.dismissals++
          break
        case 'rate':
          metrics.ratings++
          if (event.metadata?.rating) {
            metrics.avg_rating = (metrics.avg_rating * (metrics.ratings - 1) + event.metadata.rating) / metrics.ratings
          }
          break
        case 'convert':
          metrics.conversions++
          break
      }
    })

    // Calculate derived metrics
    if (metrics.impressions > 0) {
      metrics.ctr = metrics.clicks / metrics.impressions
      metrics.acceptance_rate = metrics.accepts / metrics.impressions
      metrics.conversion_rate = metrics.conversions / metrics.impressions
    }

    return metrics
  }
}

// Export singleton instance
export const recommendationAnalyticsService = new RecommendationAnalyticsService()
export default recommendationAnalyticsService