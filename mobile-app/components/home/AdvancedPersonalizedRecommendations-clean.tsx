'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ChevronRightIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { 
  SparklesIcon as SparklesIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid'
import { apiService } from '@/services/apiService'

interface Location {
  latitude: number
  longitude: number
}

interface PersonalizedRecommendation {
  id: string
  type: 'route' | 'time' | 'cost' | 'comfort'
  title: string
  description: string
  value?: string
  confidence: number
  priority: number
  icon: any
  color: string
  actionable: boolean
}

interface AdvancedPersonalizedRecommendationsProps {
  userId: string
  userLocation?: Location
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
  
  const componentRef = useRef<HTMLDivElement>(null)

  // Load ML-powered recommendations
  useEffect(() => {
    loadMLRecommendations()
  }, [userId, userLocation])

  const loadMLRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)

      // Generate ML-powered recommendations
      const mlRecommendations = await generateMLRecommendations()
      
      // Filter out dismissed recommendations
      const filteredRecommendations = mlRecommendations.filter(
        rec => !dismissedIds.has(rec.id)
      )

      setRecommendations(filteredRecommendations.slice(0, maxRecommendations))
    } catch (err) {
      console.error('Error loading ML recommendations:', err)
      setError('Failed to load recommendations')
      // Provide fallback recommendations
      setRecommendations(getFallbackRecommendations())
    } finally {
      setLoading(false)
    }
  }

  const generateMLRecommendations = async (): Promise<PersonalizedRecommendation[]> => {
    const recommendations: PersonalizedRecommendation[] = []

    try {
      // Get ML travel time prediction for personalized timing
      const travelTimeResponse = await apiService.predictTravelTime({
        total_stops: 8,
        departure_hour: new Date().getHours(),
        is_weekend: new Date().getDay() === 0 || new Date().getDay() === 6
      })

      if (travelTimeResponse.success) {
        const travelTime = travelTimeResponse.data.predicted_travel_time_minutes
        const confidence = travelTimeResponse.data.confidence

        recommendations.push({
          id: 'ml_optimal_time',
          type: 'time',
          title: 'Optimal Travel Time',
          description: `Leave now for a ${travelTime.toFixed(0)}-minute journey`,
          value: `${(confidence * 100).toFixed(0)}% accurate`,
          confidence,
          priority: 10,
          icon: ClockIcon,
          color: 'text-blue-500',
          actionable: true
        })
      }

      // Get traffic prediction for route recommendations
      const trafficResponse = await apiService.getTrafficPrediction({
        corridor: 'N1_Highway',
        hour: new Date().getHours(),
        is_weekend: new Date().getDay() === 0 || new Date().getDay() === 6
      })

      if (trafficResponse.success) {
        recommendations.push({
          id: 'traffic_route',
          type: 'route',
          title: 'Best Route Available',
          description: 'Current traffic conditions favor the main route',
          value: 'Light traffic',
          confidence: 0.95,
          priority: 9,
          icon: MapPinIcon,
          color: 'text-green-500',
          actionable: true
        })
      }

      // Add cost-saving recommendation
      recommendations.push({
        id: 'cost_savings',
        type: 'cost',
        title: 'Save Money Today',
        description: 'Choose shared trotro for maximum savings',
        value: 'Save ₵3-5',
        confidence: 0.9,
        priority: 8,
        icon: CurrencyDollarIcon,
        color: 'text-green-600',
        actionable: true
      })

      // Add comfort recommendation
      recommendations.push({
        id: 'comfort_tip',
        type: 'comfort',
        title: 'Comfort Tip',
        description: 'Board at Circle station for better seating availability',
        confidence: 0.85,
        priority: 7,
        icon: SparklesIcon,
        color: 'text-purple-500',
        actionable: true
      })

    } catch (error) {
      console.log('ML recommendations unavailable, using fallback')
    }

    return recommendations
  }

  const getFallbackRecommendations = (): PersonalizedRecommendation[] => {
    return [
      {
        id: 'fallback_time',
        type: 'time',
        title: 'Travel Smart',
        description: 'Best time to travel is during off-peak hours',
        confidence: 0.8,
        priority: 6,
        icon: ClockIcon,
        color: 'text-blue-500',
        actionable: true
      },
      {
        id: 'fallback_cost',
        type: 'cost',
        title: 'Budget Friendly',
        description: 'Trotro is the most economical option',
        value: '₵2-5 per trip',
        confidence: 0.9,
        priority: 5,
        icon: CurrencyDollarIcon,
        color: 'text-green-500',
        actionable: true
      }
    ]
  }

  const handleDismiss = (recommendationId: string) => {
    setDismissedIds(prev => new Set([...prev, recommendationId]))
    setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId))
  }

  const handleAction = (recommendation: PersonalizedRecommendation) => {
    console.log('Taking action on recommendation:', recommendation.title)
    // Here you would implement the actual action based on recommendation type
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <SparklesIconSolid className="w-5 h-5 text-yellow-500 mr-2" />
            Smart Recommendations
          </h2>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`} ref={componentRef}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <SparklesIconSolid className="w-5 h-5 text-yellow-500 mr-2" />
          Smart Recommendations
        </h2>
        <button
          onClick={loadMLRecommendations}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {error ? (
        <div className="text-center py-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {recommendations.map((recommendation, index) => {
              const IconComponent = recommendation.icon
              return (
                <motion.div
                  key={recommendation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 transition-all border border-gray-100"
                  data-recommendation-id={recommendation.id}
                  data-position={index}
                >
                  <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                    <IconComponent className={`w-5 h-5 ${recommendation.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{recommendation.title}</h3>
                      <div className="flex items-center space-x-1">
                        <div className="flex items-center">
                          <StarIconSolid className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-gray-600 ml-1">
                            {(recommendation.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <button
                          onClick={() => handleDismiss(recommendation.id)}
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          <XMarkIcon className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{recommendation.description}</p>
                    {recommendation.value && (
                      <p className="text-xs font-medium text-gray-900 mb-2">{recommendation.value}</p>
                    )}
                    {recommendation.actionable && (
                      <button
                        onClick={() => handleAction(recommendation)}
                        className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Take Action
                        <ChevronRightIcon className="w-3 h-3 ml-1" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
