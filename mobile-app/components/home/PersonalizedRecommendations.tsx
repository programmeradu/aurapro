'use client'

import { useState, useEffect } from 'react'
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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { 
  SparklesIcon as SparklesIconSolid,
  StarIcon as StarIconSolid 
} from '@heroicons/react/24/solid'
import { personalizedRecommendationService, PersonalizedRecommendation } from '@/services/personalizedRecommendationService'
import { GeoPoint } from '@/types/transport'

interface PersonalizedRecommendationsProps {
  userId: string
  userLocation?: GeoPoint
  className?: string
}

export default function PersonalizedRecommendations({
  userId,
  userLocation,
  className = ''
}: PersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadRecommendations()
  }, [userId, userLocation])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)

      const now = new Date()
      const context = {
        currentLocation: userLocation,
        timeOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
        weather: undefined, // Will be enriched by the service
        trafficConditions: undefined,
        budgetStatus: 'under' as const,
        recentActivity: []
      }

      const recs = await personalizedRecommendationService.getPersonalizedRecommendations(
        userId,
        context,
        5
      )

      // Filter out dismissed recommendations
      const activeRecs = recs.filter(rec => !dismissedIds.has(rec.id))
      setRecommendations(activeRecs)
    } catch (err) {
      console.error('Error loading recommendations:', err)
      setError('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleRecommendationAction = async (recommendation: PersonalizedRecommendation) => {
    try {
      // Record acceptance
      await personalizedRecommendationService.recordFeedback(
        userId,
        recommendation.id,
        'accepted'
      )

      // Handle different recommendation types
      switch (recommendation.type) {
        case 'route':
          // Navigate to journey planning with pre-filled data
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
    } catch (error) {
      console.error('Error handling recommendation action:', error)
    }
  }

  const handleDismiss = async (recommendation: PersonalizedRecommendation) => {
    try {
      // Record dismissal
      await personalizedRecommendationService.recordFeedback(
        userId,
        recommendation.id,
        'dismissed'
      )

      // Add to dismissed set
      setDismissedIds(prev => new Set([...prev, recommendation.id]))
      
      // Remove from current recommendations
      setRecommendations(prev => prev.filter(rec => rec.id !== recommendation.id))
    } catch (error) {
      console.error('Error dismissing recommendation:', error)
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'route':
        return MapPinIcon
      case 'budget':
        return CurrencyDollarIcon
      case 'time':
        return ClockIcon
      case 'mode':
        return TruckIcon
      case 'community':
        return UserGroupIcon
      default:
        return SparklesIcon
    }
  }

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'route':
        return 'bg-blue-500'
      case 'budget':
        return 'bg-green-500'
      case 'time':
        return 'bg-orange-500'
      case 'mode':
        return 'bg-purple-500'
      case 'community':
        return 'bg-pink-500'
      default:
        return 'bg-aura-primary'
    }
  }

  const getPriorityBadge = (priority: number) => {
    if (priority >= 5) return { text: 'High Priority', color: 'bg-red-100 text-red-800' }
    if (priority >= 3) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800' }
    return { text: 'Low', color: 'bg-gray-100 text-gray-800' }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <SparklesIconSolid className="w-5 h-5 text-aura-primary animate-pulse" />
          <h2 className="text-lg font-semibold text-ui-text-primary">
            Loading Smart Recommendations...
          </h2>
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
          Use the app more to get smart suggestions!
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <SparklesIconSolid className="w-5 h-5 text-aura-primary" />
          <h2 className="text-lg font-semibold text-ui-text-primary">
            Smart Recommendations
          </h2>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-aura-primary rounded-full animate-pulse"></div>
          <span className="text-xs text-ui-text-secondary">AI-Powered</span>
        </div>
      </div>

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
                          <h3 className="font-semibold text-ui-text-primary text-sm truncate">
                            {recommendation.title}
                          </h3>
                          <p className="text-xs text-ui-text-secondary mt-1 line-clamp-2">
                            {recommendation.description}
                          </p>
                        </div>

                        {/* Dismiss button */}
                        <button
                          onClick={() => handleDismiss(recommendation)}
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

                        {/* Action button */}
                        <button
                          onClick={() => handleRecommendationAction(recommendation)}
                          className="flex items-center space-x-1 bg-aura-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-aura-primary/90 transition-colors"
                        >
                          <span>Try It</span>
                          <ChevronRightIcon className="w-3 h-3" />
                        </button>
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

      {/* Refresh button */}
      <div className="mt-4 text-center">
        <button
          onClick={loadRecommendations}
          className="text-sm text-aura-primary font-medium hover:text-aura-primary/80 transition-colors"
        >
          Refresh Recommendations
        </button>
      </div>
    </div>
  )
}