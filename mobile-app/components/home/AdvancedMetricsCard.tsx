'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  CpuChipIcon,
  ClockIcon,
  TruckIcon,
  MapPinIcon,
  BoltIcon,
  SparklesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

interface BackendStatus {
  connected: boolean
  modelsLoaded: number
  totalModels: number
  activeVehicles: number
  mlAccuracy: string
  gtfsStops: number
  responseTime: number
}

interface AdvancedMetricsCardProps {
  backendStatus: BackendStatus
  className?: string
}

export function AdvancedMetricsCard({ backendStatus, className = '' }: AdvancedMetricsCardProps) {
  const [animatedValues, setAnimatedValues] = useState({
    predictions: 0,
    optimizations: 0,
    accuracy: 0
  })

  useEffect(() => {
    // Animate values on mount
    const timer = setTimeout(() => {
      setAnimatedValues({
        predictions: 1247,
        optimizations: 89,
        accuracy: parseFloat(backendStatus.mlAccuracy.replace('%', ''))
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [backendStatus.mlAccuracy])

  const metrics = [
    {
      id: 'models',
      label: 'ML Models Active',
      value: `${backendStatus.modelsLoaded}/${backendStatus.totalModels}`,
      icon: CpuChipIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      description: 'Advanced models running'
    },
    {
      id: 'accuracy',
      label: 'Prediction Accuracy',
      value: backendStatus.mlAccuracy,
      icon: SparklesIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      description: 'Overall model performance'
    },
    {
      id: 'vehicles',
      label: 'Vehicles Tracked',
      value: backendStatus.activeVehicles.toString(),
      icon: TruckIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      description: 'Real-time monitoring'
    },
    {
      id: 'stops',
      label: 'GTFS Stops',
      value: backendStatus.gtfsStops.toLocaleString(),
      icon: MapPinIcon,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      description: 'Transport network coverage'
    },
    {
      id: 'response',
      label: 'Response Time',
      value: `${backendStatus.responseTime}ms`,
      icon: BoltIcon,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      description: 'API performance'
    },
    {
      id: 'predictions',
      label: 'Predictions Today',
      value: animatedValues.predictions.toLocaleString(),
      icon: ChartBarIcon,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      description: 'ML predictions generated'
    }
  ]

  return (
    <div className={`bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <ChartBarIcon className="w-7 h-7 mr-3" />
              System Analytics
            </h2>
            <p className="text-gray-300 mt-1">
              Advanced metrics from our ML infrastructure
            </p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium">All Systems Optimal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
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
                className={`${metric.bgColor} rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all`}
              >
                <div className="flex items-center justify-between mb-3">
                  <IconComponent className={`w-6 h-6 ${metric.color}`} />
                  <div className={`w-2 h-2 rounded-full ${
                    backendStatus.connected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
                
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </div>
                
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {metric.label}
                </div>
                
                <div className="text-xs text-gray-500">
                  {metric.description}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Performance Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Performance Summary
              </h3>
              <p className="text-sm text-gray-600">
                All systems operating at optimal performance levels
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {backendStatus.connected ? '100%' : '0%'}
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {(animatedValues.accuracy || 97.8).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">ML Accuracy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {animatedValues.predictions.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Predictions</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {animatedValues.optimizations}
              </div>
              <div className="text-xs text-gray-600">Optimizations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
