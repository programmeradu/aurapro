/**
 * 👥 Community Service
 * Social features and community reporting for Ghana's transport system
 */

import {
  CommunityReport,
  ServiceRating,
  CommunityAlert,
  CommunityFeed,
  CommunityStats,
  ReportSubmission,
  RatingSubmission,
  ReportFilter,
  CommunityResponse,
  ReportResponse,
  RatingResponse,
  AlertResponse,
  FeedResponse,
  StatsResponse,
  CommunityComment
} from '@/types/community'
import { GeoPoint } from '@/types/transport'

class CommunityService {
  private apiUrl: string
  private cache: Map<string, any> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }

  /**
   * 📝 Submit a community report
   */
  async submitReport(submission: ReportSubmission): Promise<CommunityReport> {
    try {
      const formData = new FormData()
      
      // Add text fields
      formData.append('type', submission.type)
      formData.append('category', submission.category)
      formData.append('title', submission.title)
      formData.append('description', submission.description)
      formData.append('severity', submission.severity)
      formData.append('location', JSON.stringify(submission.location))
      formData.append('isAnonymous', submission.isAnonymous.toString())
      
      if (submission.stopId) formData.append('stopId', submission.stopId)
      if (submission.routeId) formData.append('routeId', submission.routeId)
      if (submission.vehicleId) formData.append('vehicleId', submission.vehicleId)
      if (submission.language) formData.append('language', submission.language)
      
      // Add media files
      submission.photos?.forEach((photo, index) => {
        formData.append(`photos`, photo)
      })
      
      submission.videos?.forEach((video, index) => {
        formData.append(`videos`, video)
      })
      
      submission.audioNotes?.forEach((audio, index) => {
        formData.append(`audioNotes`, audio)
      })

      const response = await fetch(`${this.apiUrl}/api/v1/community/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to submit report')
      }

      const result: ReportResponse = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to submit report')
      }

      // Clear relevant caches
      this.clearCachePattern('community_feed')
      this.clearCachePattern('community_stats')
      
      return result.data
    } catch (error) {
      console.error('Error submitting report:', error)
      throw error
    }
  }

  /**
   * ⭐ Submit a service rating
   */
  async submitRating(submission: RatingSubmission): Promise<ServiceRating> {
    try {
      const formData = new FormData()
      
      // Add rating data
      formData.append('overallRating', submission.overallRating.toString())
      formData.append('aspectRatings', JSON.stringify(submission.aspectRatings))
      formData.append('review', submission.review)
      formData.append('pros', JSON.stringify(submission.pros))
      formData.append('cons', JSON.stringify(submission.cons))
      formData.append('recommendations', JSON.stringify(submission.recommendations))
      formData.append('journeyDate', submission.journeyDate.toISOString())
      
      if (submission.vehicleId) formData.append('vehicleId', submission.vehicleId)
      if (submission.routeId) formData.append('routeId', submission.routeId)
      if (submission.driverId) formData.append('driverId', submission.driverId)
      if (submission.fareAmount) formData.append('fareAmount', submission.fareAmount.toString())
      
      // Add photos
      submission.photos?.forEach((photo) => {
        formData.append('photos', photo)
      })

      const response = await fetch(`${this.apiUrl}/api/v1/community/ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to submit rating')
      }

      const result: RatingResponse = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to submit rating')
      }

      // Clear caches
      this.clearCachePattern('community_feed')
      this.clearCachePattern('service_ratings')
      
      return result.data
    } catch (error) {
      console.error('Error submitting rating:', error)
      throw error
    }
  }

  /**
   * 📰 Get community feed
   */
  async getCommunityFeed(
    filter?: ReportFilter,
    cursor?: string
  ): Promise<CommunityFeed> {
    try {
      const cacheKey = `community_feed_${JSON.stringify(filter)}_${cursor || 'initial'}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const queryParams = new URLSearchParams()
      
      if (filter?.type?.length) {
        queryParams.append('types', filter.type.join(','))
      }
      
      if (filter?.category?.length) {
        queryParams.append('categories', filter.category.join(','))
      }
      
      if (filter?.severity?.length) {
        queryParams.append('severity', filter.severity.join(','))
      }
      
      if (filter?.location) {
        queryParams.append('lat', filter.location.center.latitude.toString())
        queryParams.append('lng', filter.location.center.longitude.toString())
        queryParams.append('radius', filter.location.radius.toString())
      }
      
      if (filter?.dateRange) {
        queryParams.append('startDate', filter.dateRange.start.toISOString())
        queryParams.append('endDate', filter.dateRange.end.toISOString())
      }
      
      if (filter?.sortBy) {
        queryParams.append('sortBy', filter.sortBy)
      }
      
      if (filter?.limit) {
        queryParams.append('limit', filter.limit.toString())
      }
      
      if (cursor) {
        queryParams.append('cursor', cursor)
      }

      const response = await fetch(
        `${this.apiUrl}/api/v1/community/feed?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get community feed')
      }

      const result: FeedResponse = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load community feed')
      }

      this.setCache(cacheKey, result.data, 2 * 60 * 1000) // 2 minutes cache
      return result.data
    } catch (error) {
      console.error('Error getting community feed:', error)
      throw error
    }
  }

  /**
   * 📊 Get community statistics
   */
  async getCommunityStats(): Promise<CommunityStats> {
    try {
      const cacheKey = 'community_stats'
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await fetch(`${this.apiUrl}/api/v1/community/stats`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get community stats')
      }

      const result: StatsResponse = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load community stats')
      }

      this.setCache(cacheKey, result.data, 10 * 60 * 1000) // 10 minutes cache
      return result.data
    } catch (error) {
      console.error('Error getting community stats:', error)
      throw error
    }
  }

  /**
   * 🔍 Get nearby reports
   */
  async getNearbyReports(
    location: GeoPoint,
    radius: number = 1000,
    limit: number = 20
  ): Promise<CommunityReport[]> {
    try {
      const queryParams = new URLSearchParams({
        lat: location.latitude.toString(),
        lng: location.longitude.toString(),
        radius: radius.toString(),
        limit: limit.toString()
      })

      const response = await fetch(
        `${this.apiUrl}/api/v1/community/reports/nearby?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get nearby reports')
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error getting nearby reports:', error)
      return []
    }
  }

  /**
   * 👍 Vote on a report
   */
  async voteOnReport(
    reportId: string,
    voteType: 'upvote' | 'downvote' | 'verify' | 'dispute'
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/v1/community/reports/${reportId}/vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify({ voteType })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to vote on report')
      }

      // Clear relevant caches
      this.clearCachePattern('community_feed')
    } catch (error) {
      console.error('Error voting on report:', error)
      throw error
    }
  }

  /**
   * 💬 Add comment to report
   */
  async addComment(
    reportId: string,
    content: string,
    parentCommentId?: string,
    isAnonymous: boolean = false
  ): Promise<CommunityComment> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/v1/community/reports/${reportId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify({
            content,
            parentCommentId,
            isAnonymous
          })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const result = await response.json()
      
      // Clear caches
      this.clearCachePattern('community_feed')
      
      return result.data
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    }
  }

  /**
   * 🚨 Create community alert
   */
  async createAlert(alert: {
    type: string
    title: string
    message: string
    location: GeoPoint
    radius: number
    severity: 'info' | 'warning' | 'urgent' | 'emergency'
    affectedRoutes?: string[]
    estimatedDuration?: number
  }): Promise<CommunityAlert> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/community/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(alert)
      })

      if (!response.ok) {
        throw new Error('Failed to create alert')
      }

      const result: AlertResponse = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create alert')
      }

      // Clear caches
      this.clearCachePattern('community_feed')
      this.clearCachePattern('community_alerts')
      
      return result.data
    } catch (error) {
      console.error('Error creating alert:', error)
      throw error
    }
  }

  /**
   * 📱 Get user's reports
   */
  async getUserReports(limit: number = 50): Promise<CommunityReport[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/v1/community/reports/my?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get user reports')
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error getting user reports:', error)
      return []
    }
  }

  /**
   * 🏆 Get user's community profile
   */
  async getUserProfile(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/community/profile`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get user profile')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error getting user profile:', error)
      throw error
    }
  }

  /**
   * 🔄 Refresh community data
   */
  async refreshCommunityData(): Promise<void> {
    this.cache.clear()
  }

  // Private helper methods
  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && cached.expiry > Date.now()) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any, timeout?: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (timeout || this.cacheTimeout)
    })
  }

  private clearCachePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || ''
  }
}

// Export singleton instance
export const communityService = new CommunityService()
export default communityService
