'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CpuChipIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  TruckIcon,
  MapPinIcon,
  BeakerIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { apiService } from '@/services/apiService'

interface BackendStatus {
  connected: boolean
  modelsLoaded: number
  totalModels: number
  activeVehicles: number
  mlAccuracy: string
  gtfsStops: number
  responseTime: number
}

interface MLModel {
  id: string
  name: string
  status: 'loaded' | 'loading' | 'error'
  accuracy: string
  description: string
  icon: any
  color: string
}

interface MLShowcaseWidgetProps {
  backendStatus: BackendStatus
  className?: string
}

export function MLShowcaseWidget({ backendStatus, className = '' }: MLShowcaseWidgetProps) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [liveMetrics, setLiveMetrics] = useState({
    predictionsGenerated: 0,
    optimizationSuggestions: 0,
    realTimeUpdates: 0
  })

  const mlModels: MLModel[] = [
    {
      id: 'advanced_travel_predictor_v2',
      name: 'Advanced Travel Time V2',
      status: 'loaded',
      accuracy: '97.8%',
      description: 'State-of-the-art travel time prediction with ensemble learning',
      icon: ClockIcon,
      color: 'text-purple-500'
    },
    {
      id: 'traffic_predictor',
      name: 'Traffic Prediction',
      status: 'loaded',
      accuracy: '99.5%',
      description: 'Real-time traffic analysis across 8 major corridors',
      icon: TruckIcon,
      color: 'text-blue-500'
    },
    {
      id: 'production_ml_service',
      name: 'Production ML Service',
      status: 'loaded',
      accuracy: '95.2%',
      description: 'Enterprise-grade ML pipeline with 3 specialized components',
      icon: CpuChipIcon,
      color: 'text-green-500'
    },
    {
      id: 'advanced_ghana_optimizer',
      name: 'Ghana Route Optimizer',
      status: 'loaded',
      accuracy: '92.1%',
      description: 'Multi-objective optimization for Ghana transport networks',
      icon: MapPinIcon,
      color: 'text-orange-500'
    },
    {
      id: 'basic_route_optimizer',
      name: 'Route Optimizer',
      status: 'loaded',
      accuracy: '88.7%',
      description: 'Vehicle routing problem solver with real-time constraints',
      icon: ChartBarIcon,
      color: 'text-indigo-500'
    },
    {
      id: 'enhanced_ml_ensemble',
      name: 'ML Ensemble',
      status: 'loaded',
      accuracy: '85.4%',
      description: 'Baseline ensemble model for travel time estimation',
      icon: BeakerIcon,
      color: 'text-pink-500'
    }
  ]

  useEffect(() => {
    // Simulate live metrics updates
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        predictionsGenerated: prev.predictionsGenerated + Math.floor(Math.random() * 5) + 1,
        optimizationSuggestions: prev.optimizationSuggestions + Math.floor(Math.random() * 2),
        realTimeUpdates: prev.realTimeUpdates + Math.floor(Math.random() * 3) + 1
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loaded': return <CheckCircleIcon className="w-4 h-4 text-green-500" />
      case 'loading': return <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
      case 'error': return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  return (
    <div className={`bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <SparklesIcon className="w-7 h-7 mr-3" />
              ML Intelligence Hub
            </h2>
            <p className="text-blue-100 mt-1">
              Powered by {backendStatus.modelsLoaded}/{backendStatus.totalModels} advanced models
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold">{backendStatus.mlAccuracy}</div>
            <div className="text-blue-100 text-sm">Overall Accuracy</div>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <motion.div
              key={liveMetrics.predictionsGenerated}
              initial={{ scale: 1.2, color: '#fbbf24' }}
              animate={{ scale: 1, color: '#ffffff' }}
              className="text-2xl font-bold"
            >
              {liveMetrics.predictionsGenerated}
            </motion.div>
            <div className="text-blue-100 text-xs">Predictions</div>
          </div>
          <div className="text-center">
            <motion.div
              key={liveMetrics.optimizationSuggestions}
              initial={{ scale: 1.2, color: '#fbbf24' }}
              animate={{ scale: 1, color: '#ffffff' }}
              className="text-2xl font-bold"
            >
              {liveMetrics.optimizationSuggestions}
            </motion.div>
            <div className="text-blue-100 text-xs">Optimizations</div>
          </div>
          <div className="text-center">
            <motion.div
              key={liveMetrics.realTimeUpdates}
              initial={{ scale: 1.2, color: '#fbbf24' }}
              animate={{ scale: 1, color: '#ffffff' }}
              className="text-2xl font-bold"
            >
              {liveMetrics.realTimeUpdates}
            </motion.div>
            <div className="text-blue-100 text-xs">Real-time Updates</div>
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mlModels.map((model, index) => {
            const IconComponent = model.icon
            return (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedModel(selectedModel === model.id ? null : model.id)}
                className="bg-gray-50 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition-all border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <IconComponent className={`w-6 h-6 ${model.color}`} />
                  {getStatusIcon(model.status)}
                </div>
                
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {model.name}
                </h3>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Accuracy</span>
                  <span className="text-sm font-bold text-gray-900">{model.accuracy}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${
                      model.color.includes('purple') ? 'from-purple-400 to-purple-600' :
                      model.color.includes('blue') ? 'from-blue-400 to-blue-600' :
                      model.color.includes('green') ? 'from-green-400 to-green-600' :
                      model.color.includes('orange') ? 'from-orange-400 to-orange-600' :
                      model.color.includes('indigo') ? 'from-indigo-400 to-indigo-600' :
                      'from-pink-400 to-pink-600'
                    }`}
                    style={{ width: model.accuracy }}
                  />
                </div>

                <AnimatePresence>
                  {selectedModel === model.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200"
                    >
                      {model.description}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Backend Connection Status */}
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                backendStatus.connected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div>
                <div className="font-medium text-gray-900">
                  Backend Connection
                </div>
                <div className="text-sm text-gray-600">
                  {backendStatus.connected ? 'All systems operational' : 'Connection lost'}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-gray-900">
                {backendStatus.responseTime}ms
              </div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div>
              <div className="font-bold text-gray-900">{backendStatus.activeVehicles}</div>
              <div className="text-xs text-gray-600">Active Vehicles</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">{backendStatus.gtfsStops.toLocaleString()}</div>
              <div className="text-xs text-gray-600">GTFS Stops</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">Real-time</div>
              <div className="text-xs text-gray-600">Data Stream</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
