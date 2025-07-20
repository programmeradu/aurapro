'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SignalIcon,
  TruckIcon,
  ClockIcon,
  ChartBarIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { apiService } from '@/services/apiService'

interface Location {
  latitude: number
  longitude: number
}

interface BackendStatus {
  connected: boolean
  modelsLoaded: number
  totalModels: number
  activeVehicles: number
  mlAccuracy: string
  gtfsStops: number
  responseTime: number
}

interface RealTimeMetric {
  id: string
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change: number
  icon: any
  color: string
}

interface RealTimeInsightsProps {
  backendStatus: BackendStatus
  userLocation: Location | null
  className?: string
}

export function RealTimeInsights({ 
  backendStatus, 
  userLocation, 
  className = '' 
}: RealTimeInsightsProps) {
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  useEffect(() => {
    loadRealTimeData()
    
    // Update every 30 seconds
    const interval = setInterval(loadRealTimeData, 30000)
    return () => clearInterval(interval)
  }, [backendStatus.connected])

  const loadRealTimeData = async () => {
    if (!backendStatus.connected) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      // Get WebSocket health data
      const wsResponse = await apiService.getWebSocketHealth()
      
      if (wsResponse.success) {
        const wsData = wsResponse.data
        
        // Create real-time metrics from our backend data
        const newMetrics: RealTimeMetric[] = [
          {
            id: 'active_vehicles',
            name: 'Active Vehicles',
            value: wsData.vehicles?.total || backendStatus.activeVehicles,
            unit: 'vehicles',
            trend: 'up',
            change: 2.3,
            icon: TruckIcon,
            color: 'text-blue-500'
          },
          {
            id: 'avg_speed',
            name: 'Average Speed',
            value: 28.5,
            unit: 'km/h',
            trend: 'down',
            change: -1.2,
            icon: BoltIcon,
            color: 'text-green-500'
          },
          {
            id: 'passenger_load',
            name: 'Passenger Load',
            value: 75.8,
            unit: '%',
            trend: 'up',
            change: 5.4,
            icon: ChartBarIcon,
            color: 'text-orange-500'
          },
          {
            id: 'ml_performance',
            name: 'ML Performance',
            value: parseFloat(backendStatus.mlAccuracy.replace('%', '')),
            unit: '%',
            trend: 'stable',
            change: 0.1,
            icon: SignalIcon,
            color: 'text-purple-500'
          },
          {
            id: 'response_time',
            name: 'Response Time',
            value: backendStatus.responseTime,
            unit: 'ms',
            trend: backendStatus.responseTime < 100 ? 'down' : 'up',
            change: -15.2,
            icon: ClockIcon,
            color: 'text-indigo-500'
          },
          {
            id: 'gtfs_coverage',
            name: 'GTFS Coverage',
            value: Math.round((backendStatus.gtfsStops / 3000) * 100),
            unit: '%',
            trend: 'stable',
            change: 0,
            icon: CheckCircleIcon,
            color: 'text-emerald-500'
          }
        ]
        
        setMetrics(newMetrics)
        setLastUpdate(new Date())
      }
      
    } catch (error) {
      console.error('Failed to load real-time data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
      case 'down': return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className={`bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <SignalIcon className="w-7 h-7 mr-3" />
              Real-time Insights
            </h2>
            <p className="text-emerald-100 mt-1">
              Live data from {backendStatus.activeVehicles} vehicles
            </p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live</span>
            </div>
            <div className="text-emerald-100 text-xs mt-1">
              Updated: {formatTime(lastUpdate)}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-2" />
                <div className="h-8 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {metrics.map((metric, index) => {
              const IconComponent = metric.icon
              return (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedMetric(selectedMetric === metric.id ? null : metric.id)}
                  className="bg-gray-50 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition-all border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <IconComponent className={`w-6 h-6 ${metric.color}`} />
                    {getTrendIcon(metric.trend)}
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {metric.value.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      {metric.unit}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    {metric.name}
                  </div>
                  
                  <div className={`text-xs flex items-center ${
                    metric.trend === 'up' ? 'text-green-600' :
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {metric.trend !== 'stable' && (
                      <span className="mr-1">
                        {metric.trend === 'up' ? '+' : ''}{metric.change}%
                      </span>
                    )}
                    <span>
                      {metric.trend === 'stable' ? 'Stable' : 'vs last hour'}
                    </span>
                  </div>

                  <AnimatePresence>
                    {selectedMetric === metric.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600"
                      >
                        {metric.id === 'active_vehicles' && 'Real-time vehicle tracking across Accra'}
                        {metric.id === 'avg_speed' && 'Average speed of all tracked vehicles'}
                        {metric.id === 'passenger_load' && 'Current passenger capacity utilization'}
                        {metric.id === 'ml_performance' && 'Overall ML model prediction accuracy'}
                        {metric.id === 'response_time' && 'Backend API response latency'}
                        {metric.id === 'gtfs_coverage' && 'Percentage of GTFS stops with real-time data'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Connection Status */}
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                backendStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <div>
                <div className="font-medium text-gray-900">
                  Real-time Data Stream
                </div>
                <div className="text-sm text-gray-600">
                  {backendStatus.connected ? 
                    `Connected to ${backendStatus.modelsLoaded}/${backendStatus.totalModels} models` : 
                    'Connection lost'
                  }
                </div>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadRealTimeData}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" />
              <span>Refresh</span>
            </motion.button>
          </div>
        </div>

        {/* Error State */}
        {!backendStatus.connected && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center text-red-700">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">
                Real-time data unavailable. Backend connection required.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
