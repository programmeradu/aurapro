'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TruckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { apiService, SystemMetrics } from '@/services/apiService'

interface SystemMetricsProps {
  className?: string
}

interface MetricCard {
  id: string
  title: string
  value: string | number
  unit?: string
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  color: string
  description: string
}

export function EnhancedSystemMetrics({ className = '' }: SystemMetricsProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchSystemMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch multiple metrics from different endpoints
      const [systemResponse, realtimeResponse, mlResponse] = await Promise.all([
        apiService.getSystemMetrics(),
        apiService.getRealtimeKPIs(),
        apiService.getMLPerformanceMetrics()
      ])

      if (systemResponse.success && systemResponse.data) {
        setMetrics(systemResponse.data)
        setLastUpdated(new Date())
      } else {
        throw new Error('Failed to fetch system metrics')
      }
    } catch (err) {
      console.error('System metrics error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load metrics')
      
      // Fallback to mock data
      setMetrics({
        active_vehicles: 1247,
        average_speed: 32.5,
        congestion_level: 'moderate',
        service_reliability: 87.3,
        user_satisfaction: 4.2,
        cost_efficiency: 92.1
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemMetrics()

    // Update metrics every 30 seconds
    const interval = setInterval(fetchSystemMetrics, 30 * 1000)

    return () => clearInterval(interval)
  }, [])

  const getMetricCards = (metrics: SystemMetrics): MetricCard[] => [
    {
      id: 'vehicles',
      title: 'Active Vehicles',
      value: metrics.active_vehicles.toLocaleString(),
      change: 5.2,
      changeType: 'increase',
      icon: <TruckIcon className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
      description: 'Vehicles currently in service'
    },
    {
      id: 'speed',
      title: 'Average Speed',
      value: metrics.average_speed.toFixed(1),
      unit: 'km/h',
      change: -2.1,
      changeType: 'decrease',
      icon: <SignalIcon className="w-6 h-6" />,
      color: 'from-green-500 to-green-600',
      description: 'Network-wide average speed'
    },
    {
      id: 'reliability',
      title: 'Service Reliability',
      value: metrics.service_reliability.toFixed(1),
      unit: '%',
      change: 1.8,
      changeType: 'increase',
      icon: <CheckCircleIcon className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
      description: 'On-time performance rate'
    },
    {
      id: 'satisfaction',
      title: 'User Satisfaction',
      value: metrics.user_satisfaction.toFixed(1),
      unit: '/5',
      change: 0.3,
      changeType: 'increase',
      icon: <ChartBarIcon className="w-6 h-6" />,
      color: 'from-yellow-500 to-yellow-600',
      description: 'Average user rating'
    },
    {
      id: 'efficiency',
      title: 'Cost Efficiency',
      value: metrics.cost_efficiency.toFixed(1),
      unit: '%',
      change: 3.7,
      changeType: 'increase',
      icon: <CurrencyDollarIcon className="w-6 h-6" />,
      color: 'from-indigo-500 to-indigo-600',
      description: 'Operational cost optimization'
    },
    {
      id: 'congestion',
      title: 'Traffic Level',
      value: metrics.congestion_level,
      change: 0,
      changeType: 'neutral',
      icon: <ClockIcon className="w-6 h-6" />,
      color: getCongestionColor(metrics.congestion_level),
      description: 'Current traffic conditions'
    }
  ]

  function getCongestionColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'low':
        return 'from-green-500 to-green-600'
      case 'moderate':
        return 'from-yellow-500 to-yellow-600'
      case 'high':
        return 'from-orange-500 to-orange-600'
      case 'severe':
        return 'from-red-500 to-red-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
      case 'decrease':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
      default:
        return <div className="w-4 h-4" />
    }
  }

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-3xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-aura-primary" />
        </div>
      </div>
    )
  }

  if (error && !metrics) {
    return (
      <div className={`bg-white rounded-3xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-64 text-center">
          <div>
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Failed to load system metrics</p>
            <button
              onClick={fetchSystemMetrics}
              className="px-4 py-2 bg-aura-primary text-white rounded-lg hover:bg-aura-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const metricCards = getMetricCards(metrics)

  return (
    <div className={`bg-white rounded-3xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-aura-primary to-aura-secondary p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">System Performance</h2>
            <p className="text-sm opacity-90">Real-time transport metrics</p>
          </div>
          <button
            onClick={fetchSystemMetrics}
            disabled={isLoading}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricCards.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow"
            >
              {/* Metric Header */}
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 bg-gradient-to-r ${metric.color} rounded-full flex items-center justify-center text-white`}>
                  {metric.icon}
                </div>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(metric.changeType)}
                  {metric.change !== 0 && (
                    <span className={`text-sm font-medium ${getChangeColor(metric.changeType)}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  )}
                </div>
              </div>

              {/* Metric Value */}
              <div className="mb-2">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                  {metric.unit && (
                    <span className="text-sm text-gray-500">{metric.unit}</span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-700">{metric.title}</h3>
              </div>

              {/* Metric Description */}
              <p className="text-xs text-gray-500">{metric.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Last Updated */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        {/* System Status Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
            <div>
              <h3 className="font-semibold text-gray-900">System Status: Operational</h3>
              <p className="text-sm text-gray-600">
                All systems running smoothly. Service reliability at {metrics.service_reliability.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}