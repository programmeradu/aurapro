'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  TruckIcon,
  CloudIcon
} from '@heroicons/react/24/outline'
import { mlService, TravelTimePrediction, TrafficPrediction, DynamicPricing, PredictiveAnalytics } from '@/services/mlService'

interface MLInsightsProps {
  origin?: { lat: number; lng: number; name: string }
  destination?: { lat: number; lng: number; name: string }
  departureTime?: Date
  className?: string
}

export function MLInsights({ 
  origin, 
  destination, 
  departureTime = new Date(),
  className = '' 
}: MLInsightsProps) {
  const [travelPrediction, setTravelPrediction] = useState<TravelTimePrediction | null>(null)
  const [trafficPrediction, setTrafficPrediction] = useState<TrafficPrediction | null>(null)
  const [pricingData, setPricingData] = useState<DynamicPricing | null>(null)
  const [analytics, setAnalytics] = useState<PredictiveAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (origin && destination) {
      loadMLInsights()
    }
  }, [origin, destination, departureTime])

  const loadMLInsights = async () => {
    if (!origin || !destination || !origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      console.log('ML Insights: Missing required location data')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const hour = departureTime.getHours()
      const isWeekend = [0, 6].includes(departureTime.getDay())
      const dayOfWeek = departureTime.getDay()

      // Load all ML predictions in parallel
      const [travel, traffic, pricing, predictive] = await Promise.all([
        mlService.predictTravelTime({
          total_stops: 8, // Estimated stops
          departure_hour: hour,
          is_weekend: isWeekend
        }),
        mlService.predictTraffic({
          latitude: origin.lat,
          longitude: origin.lng,
          hour,
          day_of_week: dayOfWeek
        }),
        mlService.calculateDynamicPricing({
          start_latitude: origin.lat,
          start_longitude: origin.lng,
          end_latitude: destination.lat,
          end_longitude: destination.lng,
          departure_time: departureTime.toISOString()
        }),
        mlService.getPredictiveAnalytics({
          location: origin,
          time_horizon_hours: 3
        })
      ])

      setTravelPrediction(travel)
      setTrafficPrediction(traffic)
      setPricingData(pricing)
      setAnalytics(predictive)

    } catch (err) {
      setError('Failed to load ML insights')
      console.error('ML insights error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getTrafficColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'severe': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!origin || !destination) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-2xl p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <SparklesIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Select origin and destination to see AI insights</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-2xl p-6 ${className}`}>
        <div className="text-center text-red-600">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-2" />
          <p>{error}</p>
          <button 
            onClick={loadMLInsights}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl shadow-mobile border border-ui-border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-ui-border bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-6 w-6 text-blue-600" />
          <h3 className="font-semibold text-ui-text-primary">AI-Powered Insights</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            Advanced ML
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Powered by Ghana Transport ML Ensemble (R² 97.8%)
        </p>
      </div>

      {isLoading ? (
        <div className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-center text-gray-600 mt-2">Loading AI insights...</p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Travel Time Prediction */}
          {travelPrediction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Travel Time Prediction</span>
                </div>
                <span className={`text-sm font-medium ${getConfidenceColor(travelPrediction.confidence)}`}>
                  {Math.round(travelPrediction.confidence * 100)}% confidence
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-1">
                {Math.round(travelPrediction.predicted_travel_time_minutes)} minutes
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Stops: {travelPrediction.factors.total_stops} • Hour: {travelPrediction.factors.departure_hour}:00</div>
                <div>Rush hour: {travelPrediction.factors.is_rush_hour ? 'Yes' : 'No'} • Weekend: {travelPrediction.factors.is_weekend ? 'Yes' : 'No'}</div>
                <div>Model accuracy: RMSE {travelPrediction.model_performance.rmse_minutes}min</div>
              </div>
            </motion.div>
          )}

          {/* Traffic Prediction */}
          {trafficPrediction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-orange-50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TruckIcon className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Traffic Conditions</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTrafficColor(trafficPrediction.congestion_level)}`}>
                  {trafficPrediction.congestion_level.toUpperCase()}
                </span>
              </div>
              <div className="text-lg font-bold text-orange-900 mb-1">
                +{trafficPrediction.predicted_delay_minutes} min delay expected
              </div>
              <div className="text-xs text-orange-700">
                <div>Congestion score: {Math.round(trafficPrediction.congestion_score * 100)}%</div>
                {trafficPrediction.recommendations.map((rec, index) => (
                  <div key={index}>• {rec}</div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Dynamic Pricing */}
          {pricingData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-green-50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Smart Pricing</span>
                </div>
                {pricingData.surge_multiplier > 1 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    {pricingData.surge_multiplier}x surge
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-green-900 mb-1">
                ₵{pricingData.dynamic_fare.toFixed(2)}
              </div>
              <div className="text-xs text-green-700 space-y-1">
                <div>Base fare: ₵{pricingData.base_fare.toFixed(2)}</div>
                <div>Demand: {pricingData.factors.demand_level} • Time: {pricingData.factors.time_of_day}</div>
                {pricingData.factors.special_events.length > 0 && (
                  <div>Events: {pricingData.factors.special_events.join(', ')}</div>
                )}
              </div>
            </motion.div>
          )}

          {/* Predictive Analytics */}
          {analytics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-purple-50 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <ChartBarIcon className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-800">Demand Forecast</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-purple-700 font-medium">Next Hour</div>
                  <div className="text-lg font-bold text-purple-900">{analytics.demand_forecast.next_hour}%</div>
                </div>
                <div>
                  <div className="text-purple-700 font-medium">Next 3 Hours</div>
                  <div className="text-lg font-bold text-purple-900">{analytics.demand_forecast.next_3_hours}%</div>
                </div>
              </div>
              <div className="text-xs text-purple-700 mt-2">
                <div>Peak times: {analytics.demand_forecast.peak_times.join(', ')}</div>
                <div>Delay probability: {Math.round(analytics.delay_prediction.probability_of_delay * 100)}%</div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
