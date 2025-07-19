'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ChevronRightIcon,
  XMarkIcon,
  StarIcon,
  TruckIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  LightBulbIcon,
  EyeIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { 
  SparklesIcon as SparklesIconSolid,
  StarIcon as StarIconSolid,
  BoltIcon
} from '@heroicons/react/24/solid'
import { personalizedRecommendationService, PersonalizedRecommendation } from '@/services/personalizedRecommendationService'
import { realtimeRecommendationService } from '@/services/realtimeRecommendationService'
import { recommendationAnalyticsService } from '@/services/recommendationAnalyticsService'
import { recommendationOptimizationService } from '@/services/recommendationOptimizationService'
import { GeoPoint } from '@/types/transport'

interface AdvancedPersonalizedRecommendationsProps {
  userId: string
  userLocation?: GeoPoint
  className?: string
  maxRecommendations?: number
  enableRealtime?: boolean
  enableAnalytics?: boolean
  enableOptimization?: boolean
}

export default function AdvancedPersonalizedRecommendations({
  userId,
  userLocation,
  className = '',
  maxRecommendations = 5,
  enableRealtime = true,
  enableAnalytics = true,
  enableOptimization = true
}: AdvancedPersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [isConnected, setIsConnected] = useState(false)
  const [optimizationEnabled, setOptimizationEnabled] = useState(enableOptimization)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  
  const impressionTracked = useRef<Set<string>>(new Set())
  const componentRef = useRef<HTMLDivElement>(null)

  // Initialize real-time connection
  useEffect(() => {
    if (enableRealtime) {
      initializeRealtime()
    }
    return () => {
      if (enableRealtime) {
        realtimeRecommendationService.disconnect()
      }
    }
  }, [enableRealtime, userId])

  // Load initial recommendations
  useEffect(() => {
    loadRecommendations()
  }, [userId, userLocation, optimizationEnabled])

  // Track impressions when recommendations are visible
  useEffect(() => {
    if (enableAnalytics && recommendations.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const recId = entry.target.getAttribute('data-recommendation-id')
              const position = parseInt(entry.target.getAttribute('data-position') || '0')
              
              if (recId && !impressionTracked.current.has(recId)) {
                recommendationAnalyticsService.trackImpression(
                  recId,
                  userId,
                  position,
                  recommendations.length,
                  'home'
                )
                impressionTracked.current.add(recId)
              }
            }
          })
        },
        { threshold: 0.5 }
      )

      // Observe all recommendation cards
      const cards = componentRef.current?.querySelectorAll('[data-recommendation-id]')
      cards?.forEach(card => observer.observe(card))

      return () => observer.disconnect()
    }
  }, [recommendations, enableAnalytics, userId])

  const initializeRealtime = async () => {
    try {
      await realtimeRecommendationService.connect(userId)
      setIsConnected(true)

      // Subscribe to real-time updates
      const unsubscribeRecommendations = realtimeRecommendationService.subscribe(
        'recommendations_updated',
        handleRealtimeRecommendationUpdate
      )

      const unsubscribeConnection = realtimeRecommendationService.subscribe(
        'connection',
        (data) => setIsConnected(data.status === 'connected')
      )

      // Enable location updates
      realtimeRecommendationService.enableLocationUpdates(userId)

      return () => {
        unsubscribeRecommendations()
        unsubscribeConnection()
        realtimeRecommendationService.disableLocationUpdates()
      }
    } catch (error) {
      console.error('Failed to initialize real-time service:', error)
      setIsConnected(false)
    }
  }

  const handleRealtimeRecommendationUpdate = useCallback((data: any) => {
    const { recommendations: newRecs, reason } = data
    console.log(`🔄 Real-time update: ${reason}`)
    
    setRecommendations(prev => {
      // Merge new recommendations with existing ones, avoiding duplicates
      const existingIds = new Set(prev.map(r => r.id))
      const uniqueNewRecs = newRecs.filter((r: PersonalizedRecommendation) => !existingIds.has(r.id))
      
      return [...uniqueNewRecs, ...prev].slice(0, maxRecommendations)
    })
  }, [maxRecommendations])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)

      const now = new Date()
      const context = {
        currentLocation: userLocation,
        timeOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
        weather: undefined,
        trafficConditions: undefined,
        budgetStatus: 'under' as const,
        recentActivity: []
      }

      let recs = await personalizedRecommendationService.getPersonalizedRecommendations(
        userId,
        context,
        maxRecommendations
      )

      // Apply optimization if enabled
      if (optimizationEnabled) {
        recs = await recommendationOptimizationService.optimizeRecommendations(
          recs,
          userId,
          context
        )
      }

      // Filter out dismissed recommendations
      const activeRecs = recs.filter(rec => !dismissedIds.has(rec.id))
      setRecommendations(activeRecs)

      // Load analytics if enabled
      if (enableAnalytics) {
        loadAnalytics()
      }

    } catch (err) {
      console.error('Error loading recommendations:', err)
      setError('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const systemMetrics = await recommendationAnalyticsService.getSystemMetrics('7d')
      setAnalytics(systemMetrics)
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const handleRecommendationClick = async (recommendation: PersonalizedRecommendation, position: number) => {
    try {
      // Track click
      if (enableAnalytics) {
        recommendationAnalyticsService.trackClick(
          recommendation.id,
          userId,
          position,
          recommendations.length,
          'home'
        )
      }

      // Record acceptance
      await personalizedRecommendationService.recordFeedback(
        userId,
        recommendation.id,
        'accepted'
      )

      // Update optimization model
      if (optimizationEnabled) {
        await recommendationOptimizationService.updateModelWeights(userId, {
          action: 'click',
          recommendationId: recommendation.id,
          position,
          context: { timeOfDay: new Date().getHours() }
        })
      }

      // Handle navigation based on recommendation type
      handleRecommendationAction(recommendation)

    } catch (error) {
      console.error('Error handling recommendation click:', error)
    }
  }

  const handleRecommendationAction = (recommendation: PersonalizedRecommendation) => {
    switch (recommendation.type) {
      case 'route':
        if (recommendation.actionData.origin && recommendation.actionData.destination) {
          window.location.href = `/journey?from=${encodeURIComponent(JSON.stringify(recommendation.actionData.origin))}&to=${encodeURIComponent(JSON.stringify(recommendation.actionData.destination))}`
        } else {
          window.location.href = '/journey'
        }
        break
      case 'budget':
        window.location.href = '/journey?tab=budget'
        break
      case 'time':
        window.location.href = '/journey?optimize=time'
        break
      case 'mode':
        window.location.href = `/journey?mode=${recommendation.actionData.transportMode}`
        break
      case 'community':
        window.location.href = '/community'
        break
      default:
        window.location.href = '/journey'
    }
  }

  const handleDismiss = async (recommendation: PersonalizedRecommendation, position: number) => {
    try {
      // Track dismissal
      if (enableAnalytics) {
        recommendationAnalyticsService.trackDismissal(
          recommendation.id,
          userId,
          position,
          recommendations.length,
          'home',
          'user_dismissed'
        )
      }

      // Record dismissal
      await personalizedRecommendationService.recordFeedback(
        userId,
        recommendation.id,
        'dismissed'
      )

      // Update optimization model
      if (optimizationEnabled) {
        await recommendationOptimizationService.updateModelWeights(userId, {
          action: 'dismiss',
          recommendationId: recommendation.id,
          position,
          context: { timeOfDay: new Date().getHours() }
        })
      }

      // Add to dismissed set and remove from current recommendations
      setDismissedIds(prev => new Set([...prev, recommendation.id]))
      setRecommendations(prev => prev.filter(rec => rec.id !== recommendation.id))

    } catch (error) {
      console.error('Error dismissing recommendation:', error)
    }
  }

  const handleRating = async (recommendation: PersonalizedRecommendation, rating: number, feedback?: string) => {
    try {
      // Track rating
      if (enableAnalytics) {
        recommendationAnalyticsService.trackRating(
          recommendation.id,
          userId,
          rating,
          feedback
        )
      }

      // Record feedback
      await personalizedRecommendationService.recordFeedback(
        userId,
        recommendation.id,
        'rated',
        rating,
        feedback
      )

      // Update optimization model
      if (optimizationEnabled) {
        await recommendationOptimizationService.updateModelWeights(userId, {
          action: 'rate',
          recommendationId: recommendation.id,
          rating,
          feedback,
          context: { timeOfDay: new Date().getHours() }
        })
      }

    } catch (error) {
      console.error('Error rating recommendation:', error)
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'route': return MapPinIcon
      case 'budget': return CurrencyDollarIcon
      case 'time': return ClockIcon
      case 'mode': return TruckIcon
      case 'community': return UserGroupIcon
      default: return SparklesIcon
    }
  }

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'route': return 'bg-blue-500'
      case 'budget': return 'bg-green-500'
      case 'time': return 'bg-orange-500'
      case 'mode': return 'bg-purple-500'
      case 'community': return 'bg-pink-500'
      default: return 'bg-aura-primary'
    }
  }

  const getPriorityBadge = (priority: number) => {
    if (priority >= 5) return { text: 'High Priority', color: 'bg-red-100 text-red-800' }
    if (priority >= 3) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800' }
    return { text: 'Low', color: 'bg-gray-100 text-gray-800' }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`} ref={componentRef}>
        <div className="flex items-center space-x-2">
          <SparklesIconSolid className="w-5 h-5 text-aura-primary animate-pulse" />
          <h2 className="text-lg font-semibold text-ui-text-primary">
            Loading AI Recommendations...
          </h2>
          {enableRealtime && (
            <div className="flex items-center space-x-1 ml-auto">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-ui-text-secondary">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-mobile animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-2xl p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <button
          onClick={loadRecommendations}
          className="mt-2 text-sm text-red-600 font-medium hover:text-red-800"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center ${className}`}>
        <SparklesIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          No personalized recommendations available right now.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Use the app more to get smart AI suggestions!
        </p>
      </div>
    )
  }

  return (
    <div className={className} ref={componentRef}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <SparklesIconSolid className="w-5 h-5 text-aura-primary" />
          <h2 className="text-lg font-semibold text-ui-text-primary">
            AI Recommendations
          </h2>
          {optimizationEnabled && (
            <BoltIcon className="w-4 h-4 text-yellow-500" title="ML Optimization Enabled" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {enableRealtime && (
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-ui-text-secondary">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          )}
          
          {enableAnalytics && (
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChartBarIcon className="w-4 h-4 text-gray-500" />
            </button>
          )}
          
          <button
            onClick={() => setOptimizationEnabled(!optimizationEnabled)}
            className={`p-1 rounded-full transition-colors ${
              optimizationEnabled ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Toggle ML Optimization"
          >
            <BoltIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && analytics && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4"
        >
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(analytics.overall.acceptance_rate * 100)}%
              </div>
              <div className="text-xs text-blue-700">Acceptance Rate</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(analytics.overall.ctr * 100)}%
              </div>
              <div className="text-xs text-blue-700">Click Rate</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {analytics.overall.avg_rating.toFixed(1)}
              </div>
              <div className="text-xs text-blue-700">Avg Rating</div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {recommendations.map((recommendation, index) => {
            const Icon = getRecommendationIcon(recommendation.type)
            const colorClass = getRecommendationColor(recommendation.type)
            const priorityBadge = getPriorityBadge(recommendation.priority)

            return (
              <motion.div
                key={recommendation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-mobile border border-ui-border overflow-hidden"
                data-recommendation-id={recommendation.id}
                data-position={index}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-ui-text-primary text-sm truncate">
                              {recommendation.title}
                            </h3>
                            {recommendation.explorationFlag && (
                              <span className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
                                Explore
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ui-text-secondary mt-1 line-clamp-2">
                            {recommendation.description}
                          </p>
                          
                          {/* Optimization metadata */}
                          {recommendation.optimizationMetadata && (
                            <p className="text-xs text-blue-600 mt-1">
                              {recommendation.optimizationMetadata.reason}
                            </p>
                          )}
                        </div>

                        {/* Dismiss button */}
                        <button
                          onClick={() => handleDismiss(recommendation, index)}
                          className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                        >
                          <XMarkIcon className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          {/* Confidence */}
                          <div className="flex items-center space-x-1">
                            <StarIconSolid className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-ui-text-secondary">
                              {Math.round(recommendation.confidence * 100)}%
                            </span>
                          </div>

                          {/* Priority badge */}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge.color}`}>
                            {priorityBadge.text}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleRating(recommendation, 5)}
                            className="p-1 rounded-full hover:bg-green-100 transition-colors"
                            title="Like"
                          >
                            <HandThumbUpIcon className="w-3 h-3 text-green-600" />
                          </button>
                          
                          <button
                            onClick={() => handleRating(recommendation, 1)}
                            className="p-1 rounded-full hover:bg-red-100 transition-colors"
                            title="Dislike"
                          >
                            <HandThumbDownIcon className="w-3 h-3 text-red-600" />
                          </button>
                          
                          <button
                            onClick={() => handleRecommendationClick(recommendation, index)}
                            className="flex items-center space-x-1 bg-aura-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-aura-primary/90 transition-colors"
                          >
                            <span>Try It</span>
                            <ChevronRightIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar for confidence */}
                <div className="h-1 bg-gray-100">
                  <div
                    className={`h-full ${colorClass} transition-all duration-500`}
                    style={{ width: `${recommendation.confidence * 100}%` }}
                  />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Control buttons */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={loadRecommendations}
          className="flex items-center space-x-1 text-sm text-aura-primary font-medium hover:text-aura-primary/80 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Refresh</span>
        </button>
        
        <div className="text-xs text-ui-text-muted">
          Powered by AI • {recommendations.length} recommendations
        </div>
      </div>
    </div>
  )
}