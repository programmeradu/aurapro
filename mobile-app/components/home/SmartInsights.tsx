'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { mlService } from '@/services/mlService'
import { budgetService } from '@/services/budgetService'
import { journeyService } from '@/services/journeyService'
import { apiService } from '@/services/apiService'
import { GeoPoint } from '@/types/transport'

interface SmartInsightsProps {
  userId: string
  userLocation?: GeoPoint
  className?: string
}

interface Insight {
  id: string
  type: 'savings' | 'pattern' | 'prediction' | 'tip' | 'warning'
  title: string
  description: string
  value?: string
  trend?: 'up' | 'down' | 'stable'
  icon: any
  color: string
  priority: number
}

export default function SmartInsights({
  userId,
  userLocation,
  className = ''
}: SmartInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInsights()
  }, [userId, userLocation])

  const loadInsights = async () => {
    try {
      setLoading(true)
      setError(null)

      const insightPromises = [
        generateBudgetInsights(),
        generateTravelPatternInsights(),
        generatePredictiveInsights(),
        generateOptimizationTips()
      ]

      const allInsights = await Promise.all(insightPromises)
      const flatInsights = allInsights.flat()
      
      // Sort by priority and take top 4
      const topInsights = flatInsights
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 4)

      setInsights(topInsights)
    } catch (err) {
      console.error('Error loading insights:', err)
      setError('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const generateBudgetInsights = async (): Promise<Insight[]> => {
    const insights: Insight[] = []

    try {
      const budget = await budgetService.getCurrentBudget()
      const spentPercentage = budget.currentSpent / budget.monthlyLimit
      const remainingDays = Math.ceil((budget.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      const dailyBudgetRemaining = (budget.monthlyLimit - budget.currentSpent) / Math.max(remainingDays, 1)

      if (spentPercentage > 0.8) {
        insights.push({
          id: 'budget_warning',
          type: 'warning',
          title: 'Budget Alert',
          description: `You've used ${Math.round(spentPercentage * 100)}% of your monthly budget`,
          value: `GHS ${dailyBudgetRemaining.toFixed(2)}/day remaining`,
          trend: 'up',
          icon: ExclamationTriangleIcon,
          color: 'text-red-600 bg-red-50',
          priority: 5
        })
      } else if (spentPercentage < 0.5) {
        const savedAmount = budget.monthlyLimit * 0.7 - budget.currentSpent
        if (savedAmount > 0) {
          insights.push({
            id: 'budget_savings',
            type: 'savings',
            title: 'Great Savings!',
            description: `You're on track to save GHS ${savedAmount.toFixed(2)} this month`,
            trend: 'down',
            icon: CurrencyDollarIcon,
            color: 'text-green-600 bg-green-50',
            priority: 4
          })
        }
      }
    } catch (error) {
      console.error('Error generating budget insights:', error)
    }

    return insights
  }

  const generateTravelPatternInsights = async (): Promise<Insight[]> => {
    const insights: Insight[] = []

    try {
      const history = await journeyService.getJourneyHistory(30)
      
      if (history.length > 5) {
        // Analyze travel patterns
        const hourCounts: { [key: number]: number } = {}
        const routeCounts: { [key: string]: number } = {}

        history.forEach(journey => {
          const hour = new Date(journey.timestamp).getHours()
          hourCounts[hour] = (hourCounts[hour] || 0) + 1
          
          if (journey.route?.name) {
            routeCounts[journey.route.name] = (routeCounts[journey.route.name] || 0) + 1
          }
        })

        // Find peak travel hour
        const peakHour = Object.entries(hourCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0]

        if (peakHour) {
          const isRushHour = (parseInt(peakHour) >= 7 && parseInt(peakHour) <= 9) || 
                            (parseInt(peakHour) >= 17 && parseInt(peakHour) <= 19)
          
          insights.push({
            id: 'travel_pattern',
            type: 'pattern',
            title: 'Travel Pattern',
            description: `You travel most at ${peakHour}:00${isRushHour ? ' (rush hour)' : ''}`,
            value: `${hourCounts[parseInt(peakHour)]} trips`,
            icon: ClockIcon,
            color: isRushHour ? 'text-orange-600 bg-orange-50' : 'text-blue-600 bg-blue-50',
            priority: 3
          })
        }

        // Find most frequent route
        const topRoute = Object.entries(routeCounts)
          .sort(([,a], [,b]) => b - a)[0]

        if (topRoute && topRoute[1] > 2) {
          insights.push({
            id: 'frequent_route',
            type: 'pattern',
            title: 'Frequent Route',
            description: `Your go-to route: ${topRoute[0]}`,
            value: `${topRoute[1]} times`,
            icon: ChartBarIcon,
            color: 'text-purple-600 bg-purple-50',
            priority: 2
          })
        }
      }
    } catch (error) {
      console.error('Error generating travel pattern insights:', error)
    }

    return insights
  }

  const generatePredictiveInsights = async (): Promise<Insight[]> => {
    const insights: Insight[] = []

    try {
      if (userLocation) {
        const now = new Date()
        const trafficPrediction = await mlService.predictTraffic({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          hour: now.getHours(),
          day_of_week: now.getDay()
        })

        if (trafficPrediction.congestion_level === 'high' || trafficPrediction.congestion_level === 'severe') {
          insights.push({
            id: 'traffic_prediction',
            type: 'prediction',
            title: 'Traffic Alert',
            description: `${trafficPrediction.congestion_level} congestion expected`,
            value: `+${trafficPrediction.predicted_delay_minutes} min delay`,
            trend: 'up',
            icon: ExclamationTriangleIcon,
            color: 'text-red-600 bg-red-50',
            priority: 4
          })
        } else if (trafficPrediction.congestion_level === 'low') {
          insights.push({
            id: 'traffic_good',
            type: 'prediction',
            title: 'Clear Roads',
            description: 'Low traffic conditions ahead',
            value: 'Good time to travel',
            trend: 'down',
            icon: ArrowTrendingDownIcon,
            color: 'text-green-600 bg-green-50',
            priority: 3
          })
        }
      }
    } catch (error) {
      console.error('Error generating predictive insights:', error)
    }

    return insights
  }

  const generateOptimizationTips = async (): Promise<Insight[]> => {
    const insights: Insight[] = []

    try {
      const now = new Date()
      const currentHour = now.getHours()

      // Time-based tips
      if (currentHour >= 6 && currentHour <= 8) {
        insights.push({
          id: 'morning_tip',
          type: 'tip',
          title: 'Morning Commute Tip',
          description: 'Leave 15 minutes earlier to avoid rush hour delays',
          icon: LightBulbIcon,
          color: 'text-blue-600 bg-blue-50',
          priority: 3
        })
      } else if (currentHour >= 16 && currentHour <= 18) {
        insights.push({
          id: 'evening_tip',
          type: 'tip',
          title: 'Evening Travel Tip',
          description: 'Consider shared transport to save money during peak hours',
          icon: LightBulbIcon,
          color: 'text-blue-600 bg-blue-50',
          priority: 3
        })
      }

      // Weather-based tips (simplified)
      const isRainySeason = now.getMonth() >= 4 && now.getMonth() <= 9
      if (isRainySeason) {
        insights.push({
          id: 'weather_tip',
          type: 'tip',
          title: 'Rainy Season Tip',
          description: 'Allow extra time for travel during rainy weather',
          icon: InformationCircleIcon,
          color: 'text-indigo-600 bg-indigo-50',
          priority: 2
        })
      }
    } catch (error) {
      console.error('Error generating optimization tips:', error)
    }

    return insights
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return ArrowTrendingUpIcon
      case 'down':
        return ArrowTrendingDownIcon
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="w-5 h-5 text-aura-primary animate-pulse" />
          <h2 className="text-lg font-semibold text-ui-text-primary">
            Loading Smart Insights...
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-mobile animate-pulse">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          onClick={loadInsights}
          className="mt-2 text-sm text-red-600 font-medium hover:text-red-800"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center ${className}`}>
        <ChartBarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          No insights available yet.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Travel more to unlock smart insights!
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="w-5 h-5 text-aura-primary" />
          <h2 className="text-lg font-semibold text-ui-text-primary">
            Smart Insights
          </h2>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-ui-text-secondary">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon
          const TrendIcon = getTrendIcon(insight.trend)

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`${insight.color} rounded-xl p-3 border border-opacity-20`}
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className="w-5 h-5 flex-shrink-0" />
                {TrendIcon && (
                  <TrendIcon className="w-4 h-4 opacity-60" />
                )}
              </div>

              <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                {insight.title}
              </h3>

              <p className="text-xs opacity-80 line-clamp-2 mb-2">
                {insight.description}
              </p>

              {insight.value && (
                <div className="text-xs font-medium opacity-90">
                  {insight.value}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Refresh button */}
      <div className="mt-4 text-center">
        <button
          onClick={loadInsights}
          className="text-sm text-aura-primary font-medium hover:text-aura-primary/80 transition-colors"
        >
          Refresh Insights
        </button>
      </div>
    </div>
  )
}