'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CpuChipIcon,
  ChartBarIcon,
  TruckIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BoltIcon,
  SignalIcon,
  ClockIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'
import { SimpleAdvancedMap } from '@/components/map/SimpleAdvancedMap'

interface MLTestResult {
  endpoint: string
  name: string
  status: 'success' | 'error' | 'loading'
  data?: any
  error?: string
  responseTime?: number
}

export default function ShowcasePage() {
  const [mlTests, setMLTests] = useState<MLTestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [backendHealth, setBackendHealth] = useState({
    connected: false,
    modelsLoaded: 0,
    totalModels: 0,
    responseTime: 0
  })

  useEffect(() => {
    runComprehensiveTests()
  }, [])

  const runComprehensiveTests = async () => {
    setIsLoading(true)
    
    const tests: Omit<MLTestResult, 'status' | 'responseTime'>[] = [
      {
        endpoint: '/api/v1/ml/models-status',
        name: 'ML Models Status'
      },
      {
        endpoint: '/api/v1/ml/predict-travel-time',
        name: 'Travel Time Prediction'
      },
      {
        endpoint: '/api/v1/ml/advanced-travel-time',
        name: 'Advanced Travel Time V2'
      },
      {
        endpoint: '/api/v1/ml/traffic-prediction',
        name: 'Traffic Prediction'
      },
      {
        endpoint: '/api/v1/gtfs/stops',
        name: 'GTFS Stops Data'
      },
      {
        endpoint: '/api/v1/gtfs/routes',
        name: 'GTFS Routes Data'
      },
      {
        endpoint: '/api/v1/websocket/health',
        name: 'Real-time WebSocket'
      },
      {
        endpoint: '/api/v1/journey/plan',
        name: 'Journey Planning'
      }
    ]

    const results: MLTestResult[] = []

    for (const test of tests) {
      const startTime = Date.now()
      try {
        let response: Response
        
        if (test.endpoint === '/api/v1/ml/predict-travel-time') {
          response = await fetch(`http://localhost:8001${test.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              total_stops: 8,
              departure_hour: new Date().getHours(),
              is_weekend: new Date().getDay() === 0 || new Date().getDay() === 6
            })
          })
        } else if (test.endpoint === '/api/v1/ml/advanced-travel-time') {
          response = await fetch(`http://localhost:8001${test.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              origin_lat: 5.5502,
              origin_lng: -0.2174,
              dest_lat: 5.6037,
              dest_lng: -0.1870
            })
          })
        } else if (test.endpoint === '/api/v1/ml/traffic-prediction') {
          response = await fetch(`http://localhost:8001${test.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              corridor: 'N1_Highway',
              hour: new Date().getHours(),
              is_weekend: new Date().getDay() === 0 || new Date().getDay() === 6
            })
          })
        } else if (test.endpoint === '/api/v1/journey/plan') {
          response = await fetch(`http://localhost:8001${test.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              origin: { latitude: 5.5502, longitude: -0.2174 },
              destination: { latitude: 5.6037, longitude: -0.1870 }
            })
          })
        } else {
          response = await fetch(`http://localhost:8001${test.endpoint}`)
        }

        const responseTime = Date.now() - startTime
        
        if (response.ok) {
          const data = await response.json()
          results.push({
            ...test,
            status: 'success',
            data,
            responseTime
          })

          // Update backend health from models status
          if (test.endpoint === '/api/v1/ml/models-status' && data.success) {
            const loaded = Object.values(data.models_status || {}).filter(Boolean).length
            const total = Object.keys(data.models_status || {}).length
            setBackendHealth({
              connected: true,
              modelsLoaded: loaded,
              totalModels: total,
              responseTime
            })
          }
        } else {
          results.push({
            ...test,
            status: 'error',
            error: `HTTP ${response.status}`,
            responseTime
          })
        }
      } catch (error) {
        results.push({
          ...test,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: Date.now() - startTime
        })
      }
    }

    setMLTests(results)
    setIsLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-400" />
      case 'error': return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
      default: return <ArrowPathIcon className="w-5 h-5 text-yellow-400 animate-spin" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-500 bg-green-900/20'
      case 'error': return 'border-red-500 bg-red-900/20'
      default: return 'border-yellow-500 bg-yellow-900/20'
    }
  }

  const successfulTests = mlTests.filter(t => t.status === 'success').length
  const totalTests = mlTests.length

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center">
                <BeakerIcon className="w-10 h-10 mr-4" />
                AURA ML Showcase
              </h1>
              <p className="text-blue-200 mt-2 text-lg">
                Live demonstration of our 12/12 advanced models and real-time features
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                {successfulTests}/{totalTests}
              </div>
              <div className="text-sm text-blue-200">Tests Passing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Health */}
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <CpuChipIcon className="w-6 h-6 mr-3" />
            Backend Health Status
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${backendHealth.connected ? 'text-green-400' : 'text-red-400'}`}>
                {backendHealth.connected ? '✅' : '❌'}
              </div>
              <div className="text-sm text-gray-400">Connection</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                {backendHealth.modelsLoaded}/{backendHealth.totalModels}
              </div>
              <div className="text-sm text-gray-400">ML Models</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {backendHealth.responseTime}ms
              </div>
              <div className="text-sm text-gray-400">Response Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">
                8001
              </div>
              <div className="text-sm text-gray-400">Backend Port</div>
            </div>
          </div>
        </motion.div>

        {/* ML Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {mlTests.map((test, index) => (
            <motion.div
              key={test.endpoint}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{test.name}</h3>
                {getStatusIcon(test.status)}
              </div>
              
              <div className="text-sm text-gray-400 mb-2">
                {test.endpoint}
              </div>
              
              {test.responseTime && (
                <div className="text-xs text-gray-500 mb-2">
                  Response: {test.responseTime}ms
                </div>
              )}
              
              {test.status === 'success' && test.data && (
                <div className="text-xs text-green-300">
                  {test.name === 'Travel Time Prediction' && test.data.predicted_travel_time_minutes && 
                    `Predicted: ${test.data.predicted_travel_time_minutes.toFixed(1)} min`}
                  {test.name === 'Advanced Travel Time V2' && test.data.prediction?.travel_time_minutes && 
                    `Advanced: ${test.data.prediction.travel_time_minutes} min`}
                  {test.name === 'GTFS Stops Data' && test.data.count && 
                    `${test.data.count} stops loaded`}
                  {test.name === 'GTFS Routes Data' && test.data.count && 
                    `${test.data.count} routes loaded`}
                  {test.name === 'Real-time WebSocket' && test.data.vehicles && 
                    `${test.data.vehicles.total} vehicles active`}
                </div>
              )}
              
              {test.status === 'error' && (
                <div className="text-xs text-red-300">
                  Error: {test.error}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Live Map Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-lg overflow-hidden"
        >
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold flex items-center">
              <SignalIcon className="w-6 h-6 mr-3" />
              Live ML-Powered Map Visualization
            </h2>
            <p className="text-gray-400 mt-1">
              Real-time vehicle tracking and ML predictions from our backend
            </p>
          </div>
          
          <div className="h-96">
            <SimpleAdvancedMap className="w-full h-full" />
          </div>
        </motion.div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={runComprehensiveTests}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center mx-auto"
          >
            {isLoading ? (
              <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ArrowPathIcon className="w-5 h-5 mr-2" />
            )}
            {isLoading ? 'Testing...' : 'Refresh Tests'}
          </button>
        </div>
      </div>
    </div>
  )
}
