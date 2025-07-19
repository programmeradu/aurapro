'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  UsersIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  HandThumbUpIcon,
  CursorArrowRaysIcon,
  ArrowPathIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { recommendationAnalyticsService } from '@/services/recommendationAnalyticsService'

interface DashboardMetrics {
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
}

interface SystemMetrics {
  overall: {
    impressions: number
    clicks: number
    accepts: number
    dismissals: number
    ratings: number
    conversions: number
    ctr: number
    acceptance_rate: number
    conversion_rate: number
    avg_rating: number
    avg_position: number
  }
  byType: Record<string, any>
  byPosition: Record<number, any>
  trends: Array<{ date: string; metrics: any }>
}

export default function RecommendationDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadDashboardData()
    loadSystemMetrics()
  }, [timeRange])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDashboardData()
        loadSystemMetrics()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh, timeRange])

  const loadDashboardData = async () => {
    try {
      const data = await recommendationAnalyticsService.getDashboardData()
      setDashboardData(data)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data')
    }
  }

  const loadSystemMetrics = async () => {
    try {
      setLoading(true)
      const metrics = await recommendationAnalyticsService.getSystemMetrics(timeRange)
      setSystemMetrics(metrics)
      setError(null)
    } catch (err) {
      console.error('Error loading system metrics:', err)
      setError('Failed to load system metrics')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatPercentage = (num: number): string => {
    return `${(num * 100).toFixed(1)}%`
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return ExclamationTriangleIcon
      case 'performance': return ArrowTrendingDownIcon
      case 'anomaly': return ExclamationTriangleIcon
      default: return CheckCircleIcon
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800'
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return ArrowTrendingUpIcon
    if (current < previous) return ArrowTrendingDownIcon
    return null
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600'
    if (current < previous) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading && !systemMetrics) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="w-6 h-6 text-aura-primary animate-pulse" />
          <h1 className="text-2xl font-bold text-ui-text-primary">
            Recommendation Analytics Dashboard
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error && !systemMetrics) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => {
              loadDashboardData()
              loadSystemMetrics()
            }}
            className="mt-2 text-sm text-red-600 font-medium hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SparklesIcon className="w-8 h-8 text-aura-primary" />
          <div>
            <h1 className="text-2xl font-bold text-ui-text-primary">
              AI Recommendation Analytics
            </h1>
            <p className="text-sm text-ui-text-secondary">
              Real-time performance monitoring and insights
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-ui-border rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ArrowPathIcon className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'Auto Refresh' : 'Manual'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => {
              loadDashboardData()
              loadSystemMetrics()
            }}
            className="p-2 rounded-lg bg-aura-primary text-white hover:bg-aura-primary/90 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Metrics */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-ui-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ui-text-secondary">Active Users</p>
                <p className="text-2xl font-bold text-ui-text-primary">
                  {formatNumber(dashboardData.liveMetrics.activeUsers)}
                </p>
              </div>
              <UsersIcon className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-ui-text-secondary">Live</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-ui-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ui-text-secondary">Recommendations Served</p>
                <p className="text-2xl font-bold text-ui-text-primary">
                  {formatNumber(dashboardData.liveMetrics.recommendationsServed)}
                </p>
              </div>
              <SparklesIcon className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2 text-xs text-ui-text-secondary">
              Today
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-ui-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ui-text-secondary">Acceptance Rate</p>
                <p className="text-2xl font-bold text-ui-text-primary">
                  {formatPercentage(dashboardData.liveMetrics.acceptanceRate)}
                </p>
              </div>
              <HandThumbUpIcon className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2 text-xs text-ui-text-secondary">
              Last 24 hours
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-ui-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ui-text-secondary">Avg Response Time</p>
                <p className="text-2xl font-bold text-ui-text-primary">
                  {dashboardData.liveMetrics.avgResponseTime}ms
                </p>
              </div>
              <ClockIcon className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2 text-xs text-ui-text-secondary">
              System performance
            </div>
          </motion.div>
        </div>
      )}

      {/* System Metrics */}
      {systemMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-ui-border"
          >
            <h3 className="text-lg font-semibold text-ui-text-primary mb-4">
              Overall Performance
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(systemMetrics.overall.impressions)}
                </div>
                <div className="text-sm text-blue-700">Impressions</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatPercentage(systemMetrics.overall.ctr)}
                </div>
                <div className="text-sm text-green-700">Click Rate</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatPercentage(systemMetrics.overall.acceptance_rate)}
                </div>
                <div className="text-sm text-purple-700">Acceptance</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {systemMetrics.overall.avg_rating.toFixed(1)}
                </div>
                <div className="text-sm text-orange-700">Avg Rating</div>
              </div>
            </div>
          </motion.div>

          {/* Performance by Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-ui-border"
          >
            <h3 className="text-lg font-semibold text-ui-text-primary mb-4">
              Performance by Type
            </h3>
            
            <div className="space-y-3">
              {Object.entries(systemMetrics.byType).map(([type, metrics]: [string, any]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-aura-primary rounded-full"></div>
                    <span className="font-medium capitalize">{type}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-blue-600">
                      {formatPercentage(metrics.ctr)} CTR
                    </span>
                    <span className="text-green-600">
                      {formatPercentage(metrics.acceptance_rate)} Accept
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Alerts */}
      {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-ui-border"
        >
          <h3 className="text-lg font-semibold text-ui-text-primary mb-4">
            System Alerts
          </h3>
          
          <div className="space-y-3">
            {dashboardData.alerts.map((alert, index) => {
              const AlertIcon = getAlertIcon(alert.type)
              const alertColor = getAlertColor(alert.severity)
              
              return (
                <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg border ${alertColor}`}>
                  <AlertIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      {dashboardData?.recentActivity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-ui-border"
        >
          <h3 className="text-lg font-semibold text-ui-text-primary mb-4">
            Recent Activity
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {dashboardData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.event === 'accept' ? 'bg-green-500' :
                    activity.event === 'dismiss' ? 'bg-red-500' :
                    activity.event === 'click' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div>
                    <span className="font-medium capitalize">{activity.event}</span>
                    <span className="text-sm text-ui-text-secondary ml-2">
                      by {activity.userId.slice(0, 8)}...
                    </span>
                  </div>
                </div>
                <span className="text-xs text-ui-text-secondary">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}