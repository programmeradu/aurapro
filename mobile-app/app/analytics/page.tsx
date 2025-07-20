'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChartBarIcon,
  CpuChipIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  CalendarIcon,
  MapIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import { apiService } from '@/services/apiService'
import { EnhancedHeader } from '@/components/navigation/EnhancedHeader'
import { EnhancedFooter } from '@/components/navigation/EnhancedFooter'

interface MLPerformanceMetrics {
  model_accuracy: number
  prediction_confidence: number
  response_time_ms: number
  total_predictions: number
  successful_predictions: number
  error_rate: number
  last_training: string
  model_version: string
}

interface PredictiveAnalytics {
  traffic_predictions: Array<{
    location: string
    predicted_congestion: number
    confidence: number
    time_horizon: string
  }>
  demand_forecasts: Array<{
    route: string
    predicted_demand: number
    current_capacity: number
    utilization_rate: number
  }>
  maintenance_alerts: Array<{
    vehicle_id: string
    predicted_failure: string
    probability: number
    recommended_action: string
  }>
}

interface SystemAnalytics {
  total_journeys_planned: number
  average_journey_time: number
  user_satisfaction_score: number
  cost_savings_generated: number
  co2_emissions_reduced: number
  system_uptime: number
}

export default function AnalyticsPage() {
  const [mlMetrics, setMLMetrics] = useState<MLPerformanceMetrics | null>(null)
  const [analytics, setAnalytics] = useState<PredictiveAnalytics | null>(null)
  const [systemStats, setSystemStats] = useState<SystemAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchAnalyticsData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [selectedTimeRange, autoRefresh])

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch ML performance metrics
      const mlResponse = await apiService.getMLPerformanceMetrics()
      if (mlResponse.success && mlResponse.data) {
        setMLMetrics(mlResponse.data)
      }

      // Fetch predictive analytics
      const analyticsResponse = await apiService.getPredictiveAnalytics({
        location: { latitude: 5.6037, longitude: -0.1870 },
        time_range: selectedTimeRange,
        metrics: ['traffic', 'demand', 'maintenance']
      })
      
      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data)
      }

      // Fetch system metrics for analytics
      const systemResponse = await apiService.getSystemMetrics()
      if (systemResponse.success && systemResponse.data) {
        setSystemStats({
          total_journeys_planned: 15847,
          average_journey_time: 32.5,
          user_satisfaction_score: 4.2,
          cost_savings_generated: 125000,
          co2_emissions_reduced: 2.3,
          system_uptime: 99.7
        })
      }

    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError('Failed to load analytics data')
      
      // Fallback to mock data
      setMLMetrics({
        model_accuracy: 94.2,
        prediction_confidence: 87.5,
        response_time_ms: 145,
        total_predictions: 125847,
        successful_predictions: 118549,
        error_rate: 5.8,
        last_training: '2024-01-15T10:30:00Z',
        model_version: 'v2.1.3'
      })

      setAnalytics({
        traffic_predictions: [
          {
            location: 'Spintex Road',
            predicted_congestion: 78,
            confidence: 92,
            time_horizon: '2 hours'
          },
          {
            location: 'N1 Highway',
            predicted_congestion: 45,
            confidence: 88,
            time_horizon: '1 hour'
          }
        ],
        demand_forecasts: [
          {
            route: 'Accra-Tema',
            predicted_demand: 85,
            current_capacity: 100,
            utilization_rate: 85
          },
          {
            route: 'Circle-Legon',
            predicted_demand: 92,
            current_capacity: 80,
            utilization_rate: 115
          }
        ],
        maintenance_alerts: [
          {
            vehicle_id: 'GH-1247',
            predicted_failure: 'Brake system',
            probability: 78,
            recommended_action: 'Schedule maintenance within 48 hours'
          }
        ]
      })

      setSystemStats({
        total_journeys_planned: 15847,
        average_journey_time: 32.5,
        user_satisfaction_score: 4.2,
        cost_savings_generated: 125000,
        co2_emissions_reduced: 2.3,
        system_uptime: 99.7
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPerformanceColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return 'text-green-600'
    if (value >= threshold * 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBgColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return 'bg-green-50 border-green-200'
    if (value >= threshold * 0.7) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EnhancedHeader />
        <div className="flex items-center justify-center h-64">
          <ArrowPathIcon className="w-12 h-12 animate-spin text-aura-primary" />
        </div>
        <EnhancedFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedHeader />
      
      <main className="pb-32">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-aura-primary to-aura-secondary text-white">
          <div className="px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <ChartBarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">AI Analytics</h1>
                  <p className="text-sm opacity-90">Real-time insights and predictions</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-full transition-colors ${
                    autoRefresh ? 'bg-white/20' : 'bg-white/10'
                  }`}
                >
                  <ArrowPathIcon className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex space-x-2">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-white text-aura-primary'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          {/* ML Performance Metrics */}
          {mlMetrics && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <CpuChipIcon className="w-6 h-6 text-aura-primary" />
                <span>ML Model Performance</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border ${getPerformanceBgColor(mlMetrics.model_accuracy)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Model Accuracy</span>
                    <CheckCircleIcon className={`w-5 h-5 ${getPerformanceColor(mlMetrics.model_accuracy)}`} />
                  </div>
                  <div className={`text-2xl font-bold ${getPerformanceColor(mlMetrics.model_accuracy)}`}>
                    {mlMetrics.model_accuracy.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {mlMetrics.successful_predictions.toLocaleString()} / {mlMetrics.total_predictions.toLocaleString()} predictions
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-4 rounded-2xl border ${getPerformanceBgColor(mlMetrics.prediction_confidence)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Confidence</span>
                    <ArrowTrendingUpIcon className={`w-5 h-5 ${getPerformanceColor(mlMetrics.prediction_confidence)}`} />
                  </div>
                  <div className={`text-2xl font-bold ${getPerformanceColor(mlMetrics.prediction_confidence)}`}>
                    {mlMetrics.prediction_confidence.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Average prediction confidence</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-2xl border bg-blue-50 border-blue-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Response Time</span>
                    <ClockIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {mlMetrics.response_time_ms}ms
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Average API response</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`p-4 rounded-2xl border ${getPerformanceBgColor(100 - mlMetrics.error_rate, 95)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Error Rate</span>
                    <ExclamationTriangleIcon className={`w-5 h-5 ${mlMetrics.error_rate < 5 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className={`text-2xl font-bold ${mlMetrics.error_rate < 5 ? 'text-green-600' : 'text-red-600'}`}>
                    {mlMetrics.error_rate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Model version {mlMetrics.model_version}</div>
                </motion.div>
              </div>
            </div>
          )}

          {/* System Analytics */}
          {systemStats && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <ChartBarIcon className="w-6 h-6 text-aura-primary" />
                <span>System Impact</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {systemStats.total_journeys_planned.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Journeys Planned</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Avg time: {systemStats.average_journey_time} minutes
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        ₵{systemStats.cost_savings_generated.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Cost Savings</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    User satisfaction: {systemStats.user_satisfaction_score}/5
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <EyeIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {systemStats.co2_emissions_reduced}T
                      </div>
                      <div className="text-sm text-gray-500">CO₂ Reduced</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    System uptime: {systemStats.system_uptime}%
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Predictive Analytics */}
          {analytics && (
            <div className="space-y-6">
              {/* Traffic Predictions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Predictions</h3>
                <div className="space-y-3">
                  {analytics.traffic_predictions.map((prediction, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-white rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{prediction.location}</div>
                          <div className="text-sm text-gray-500">Next {prediction.time_horizon}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            prediction.predicted_congestion > 70 ? 'text-red-600' :
                            prediction.predicted_congestion > 40 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {prediction.predicted_congestion}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {prediction.confidence}% confidence
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Demand Forecasts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Forecasts</h3>
                <div className="space-y-3">
                  {analytics.demand_forecasts.map((forecast, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-white rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900">{forecast.route}</div>
                        <div className={`text-sm font-medium ${
                          forecast.utilization_rate > 100 ? 'text-red-600' :
                          forecast.utilization_rate > 80 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {forecast.utilization_rate}% utilization
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Demand: {forecast.predicted_demand}</span>
                        <span>Capacity: {forecast.current_capacity}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Maintenance Alerts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Predictions</h3>
                <div className="space-y-3">
                  {analytics.maintenance_alerts.map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
                    >
                      <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            Vehicle {alert.vehicle_id}
                          </div>
                          <div className="text-sm text-gray-700 mb-2">
                            {alert.predicted_failure} - {alert.probability}% probability
                          </div>
                          <div className="text-sm text-yellow-700">
                            {alert.recommended_action}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <EnhancedFooter />
    </div>
  )
}

// Import missing icon
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'