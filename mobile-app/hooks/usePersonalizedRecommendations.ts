/**
 * 🎯 Hook for managing personalized recommendations
 * Provides state management and caching for recommendation data
 */

import { useState, useEffect, useCallback } from 'react'
import { personalizedRecommendationService, PersonalizedRecommendation, RecommendationContext } from '@/services/personalizedRecommendationService'
import { GeoPoint } from '@/types/transport'

interface UsePersonalizedRecommendationsOptions {
  userId: string
  userLocation?: GeoPoint
  autoRefresh?: boolean
  refreshInterval?: number
  limit?: number
}

interface UsePersonalizedRecommendationsReturn {
  recommendations: PersonalizedRecommendation[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  dismiss: (recommendationId: string) => Promise<void>
  accept: (recommendationId: string) => Promise<void>
  rate: (recommendationId: string, rating: number, feedback?: string) => Promise<void>
  updateContext: (context: Partial<RecommendationContext>) => void
}

export function usePersonalizedRecommendations({
  userId,
  userLocation,
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000, // 5 minutes
  limit = 5
}: UsePersonalizedRecommendationsOptions): UsePersonalizedRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<Partial<RecommendationContext>>({})

  // Load recommendations
  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const now = new Date()
      const enrichedContext: Partial<RecommendationContext> = {
        currentLocation: userLocation,
        timeOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
        ...context
      }

      const recs = await personalizedRecommendationService.getPersonalizedRecommendations(
        userId,
        enrichedContext,
        limit
      )

      setRecommendations(recs)
    } catch (err) {
      console.error('Error loading recommendations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }, [userId, userLocation, context, limit])

  // Refresh recommendations
  const refresh = useCallback(async () => {
    await loadRecommendations()
  }, [loadRecommendations])

  // Dismiss a recommendation
  const dismiss = useCallback(async (recommendationId: string) => {
    try {
      await personalizedRecommendationService.recordFeedback(
        userId,
        recommendationId,
        'dismissed'
      )

      // Remove from local state
      setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId))
    } catch (err) {
      console.error('Error dismissing recommendation:', err)
    }
  }, [userId])

  // Accept a recommendation
  const accept = useCallback(async (recommendationId: string) => {
    try {
      await personalizedRecommendationService.recordFeedback(
        userId,
        recommendationId,
        'accepted'
      )

      // Update local state to mark as accepted
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, accepted: true } 
            : rec
        )
      )
    } catch (err) {
      console.error('Error accepting recommendation:', err)
    }
  }, [userId])

  // Rate a recommendation
  const rate = useCallback(async (recommendationId: string, rating: number, feedback?: string) => {
    try {
      await personalizedRecommendationService.recordFeedback(
        userId,
        recommendationId,
        'rated',
        rating,
        feedback
      )

      // Update local state
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, userRating: rating, userFeedback: feedback } 
            : rec
        )
      )
    } catch (err) {
      console.error('Error rating recommendation:', err)
    }
  }, [userId])

  // Update context
  const updateContext = useCallback((newContext: Partial<RecommendationContext>) => {
    setContext(prev => ({ ...prev, ...newContext }))
  }, [])

  // Initial load
  useEffect(() => {
    loadRecommendations()
  }, [loadRecommendations])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadRecommendations()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadRecommendations])

  // Refresh when user location changes
  useEffect(() => {
    if (userLocation) {
      loadRecommendations()
    }
  }, [userLocation, loadRecommendations])

  return {
    recommendations,
    loading,
    error,
    refresh,
    dismiss,
    accept,
    rate,
    updateContext
  }
}

// Hook for recommendation metrics
export function useRecommendationMetrics(userId: string) {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true)
        setError(null)

        // This would call the ML service to get metrics
        // For now, we'll use mock data
        const mockMetrics = {
          accuracy: 0.78,
          precision: 0.72,
          recall: 0.75,
          user_satisfaction: 0.85,
          click_through_rate: 0.42,
          conversion_rate: 0.35,
          model_confidence: 0.82,
          recommendations_shown: 156,
          recommendations_accepted: 54,
          last_updated: new Date().toISOString()
        }

        setMetrics(mockMetrics)
      } catch (err) {
        console.error('Error loading recommendation metrics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [userId])

  return { metrics, loading, error }
}

// Hook for user preferences
export function useUserPreferences(userId: string) {
  const [preferences, setPreferences] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const updatePreferences = useCallback(async (newPreferences: any) => {
    try {
      await personalizedRecommendationService.updateUserPreferences(userId, newPreferences)
      setPreferences(prev => ({ ...prev, ...newPreferences }))
    } catch (err) {
      console.error('Error updating preferences:', err)
      throw err
    }
  }, [userId])

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true)
        setError(null)

        const userProfile = await personalizedRecommendationService.getUserProfile(userId)
        setPreferences(userProfile.preferences)
      } catch (err) {
        console.error('Error loading user preferences:', err)
        setError(err instanceof Error ? err.message : 'Failed to load preferences')
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [userId])

  return {
    preferences,
    loading,
    error,
    updatePreferences
  }
}