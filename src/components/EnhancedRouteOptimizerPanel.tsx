/**
 * 🚀 Enhanced Route Optimizer Panel
 * Real-time traffic integration, genetic algorithms, and fuel cost optimization
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { 
  Target, 
  Zap, 
  TrendingDown, 
  Clock, 
  Fuel, 
  Leaf, 
  Settings,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { apiService } from '@/services/apiService'
import { useMemoryLeakPrevention } from '@/lib/memoryLeakFixes'

interface OptimizationConfig {
  algorithm: 'genetic' | 'dijkstra' | 'a-star' | 'hybrid'
  populationSize: number
  generations: number
  mutationRate: number
  crossoverRate: number
  useRealTimeTraffic: boolean
  fuelOptimization: boolean
  co2Optimization: boolean
}

interface OptimizationResult {
  routes: any[]
  totalCost: number
  totalTime: number
  totalDistance: number
  fuelSavings: number
  timeSavings: number
  co2Reduction: number
  algorithm: string
  confidence: number
  optimizationMetrics?: {
    generations_run?: number
    convergence_achieved: boolean
    traffic_data_used: boolean
    constraints_satisfied: boolean
  }
}

interface TrafficData {
  segment_id: string
  current_speed: number
  congestion_level: number
  conditions: string
  last_updated: string
}

const EnhancedRouteOptimizerPanel: React.FC = () => {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null)
  const [trafficData, setTrafficData] = useState<TrafficData[]>([])
  const [config, setConfig] = useState<OptimizationConfig>({
    algorithm: 'genetic',
    populationSize: 50,
    generations: 100,
    mutationRate: 0.1,
    crossoverRate: 0.8,
    useRealTimeTraffic: true,
    fuelOptimization: true,
    co2Optimization: true
  })
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [currentGeneration, setCurrentGeneration] = useState(0)

  const { safeSetInterval, addCleanup } = useMemoryLeakPrevention()

  // Load traffic data on component mount
  useEffect(() => {
    loadTrafficData()
    
    // Update traffic data every 5 minutes
    const trafficInterval = safeSetInterval(loadTrafficData, 5 * 60 * 1000)
    
    return () => {
      // Cleanup handled by useMemoryLeakPrevention
    }
  }, [safeSetInterval])

  const loadTrafficData = async () => {
    try {
      // Load traffic data for major Accra route segments
      const segments = [
        'circle_madina',
        'kaneshie_mallam', 
        'tema_accra',
        'kasoa_circle',
        'achimota_lapaz'
      ]

      const trafficPromises = segments.map(async (segmentId) => {
        try {
          const response = await apiService.request(`/api/v1/traffic/${segmentId}`)
          return response.data
        } catch (error) {
          console.warn(`Failed to load traffic for ${segmentId}:`, error)
          return null
        }
      })

      const results = await Promise.all(trafficPromises)
      const validTrafficData = results.filter(data => data !== null)
      setTrafficData(validTrafficData)
    } catch (error) {
      console.error('Failed to load traffic data:', error)
    }
  }

  const runOptimization = async () => {
    setIsOptimizing(true)
    setOptimizationProgress(0)
    setCurrentGeneration(0)

    try {
      // Simulate progress updates for genetic algorithm
      let progressInterval: NodeJS.Timeout | null = null
      
      if (config.algorithm === 'genetic') {
        progressInterval = safeSetInterval(() => {
          setCurrentGeneration(prev => {
            const next = prev + 1
            setOptimizationProgress((next / config.generations) * 100)
            return next
          })
        }, 100) // Update every 100ms for smooth progress
      }

      // Prepare optimization request
      const optimizationRequest = {
        vehicles: [
          { id: 'vehicle_1', capacity: 50, fuelEfficiency: 8.5, costPerKm: 2.5 },
          { id: 'vehicle_2', capacity: 45, fuelEfficiency: 9.0, costPerKm: 2.3 },
          { id: 'vehicle_3', capacity: 55, fuelEfficiency: 8.0, costPerKm: 2.7 }
        ],
        points: [
          { id: 'circle', lat: 5.5717, lng: -0.2107, name: 'Circle', type: 'depot' },
          { id: 'madina', lat: 5.6836, lng: -0.1636, name: 'Madina', type: 'stop' },
          { id: 'kaneshie', lat: 5.5564, lng: -0.2469, name: 'Kaneshie', type: 'stop' },
          { id: 'tema', lat: 5.6698, lng: -0.0166, name: 'Tema', type: 'stop' },
          { id: 'kasoa', lat: 5.5320, lng: -0.4142, name: 'Kasoa', type: 'stop' },
          { id: 'achimota', lat: 5.6089, lng: -0.2297, name: 'Achimota', type: 'stop' }
        ],
        constraints: {
          maxRouteTime: 120, // 2 hours
          maxRouteDistance: 50, // 50 km
          vehicleCapacityConstraint: true,
          timeWindowConstraint: false,
          fuelBudgetConstraint: config.fuelOptimization ? 200 : undefined // GHS
        },
        algorithm: config.algorithm,
        geneticParams: config.algorithm === 'genetic' ? {
          populationSize: config.populationSize,
          generations: config.generations,
          mutationRate: config.mutationRate,
          crossoverRate: config.crossoverRate
        } : undefined,
        useRealTimeTraffic: config.useRealTimeTraffic,
        optimizeFor: {
          fuel: config.fuelOptimization,
          co2: config.co2Optimization,
          time: true,
          cost: true
        }
      }

      // Call enhanced optimization API
      const response = await apiService.request('/api/v1/optimize/routes/enhanced', {
        method: 'POST',
        body: JSON.stringify(optimizationRequest)
      })

      if (progressInterval) {
        clearInterval(progressInterval)
      }

      setOptimizationProgress(100)
      setOptimizationResult(response.data)

    } catch (error) {
      console.error('Optimization failed:', error)
      // Handle error state
    } finally {
      setIsOptimizing(false)
    }
  }

  const resetOptimization = () => {
    setOptimizationResult(null)
    setOptimizationProgress(0)
    setCurrentGeneration(0)
  }

  const getAlgorithmDescription = (algorithm: string) => {
    switch (algorithm) {
      case 'genetic':
        return 'Evolutionary algorithm with population-based optimization'
      case 'dijkstra':
        return 'Shortest path algorithm with guaranteed optimal solution'
      case 'a-star':
        return 'Heuristic search algorithm with intelligent pathfinding'
      case 'hybrid':
        return 'Combined approach using multiple optimization techniques'
      default:
        return 'Advanced route optimization algorithm'
    }
  }

  const getTrafficConditionColor = (condition: string) => {
    switch (condition) {
      case 'light': return 'bg-green-100 text-green-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'heavy': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Optimization Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Algorithm Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Algorithm
              </label>
              <select
                value={config.algorithm}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  algorithm: e.target.value as OptimizationConfig['algorithm']
                }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isOptimizing}
              >
                <option value="genetic">Genetic Algorithm</option>
                <option value="dijkstra">Dijkstra's Algorithm</option>
                <option value="a-star">A* Search</option>
                <option value="hybrid">Hybrid Approach</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {getAlgorithmDescription(config.algorithm)}
              </p>
            </div>

            {/* Genetic Algorithm Parameters */}
            {config.algorithm === 'genetic' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Population Size
                  </label>
                  <input
                    type="number"
                    value={config.populationSize}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      populationSize: parseInt(e.target.value) 
                    }))}
                    min="10"
                    max="200"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={isOptimizing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generations
                  </label>
                  <input
                    type="number"
                    value={config.generations}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      generations: parseInt(e.target.value) 
                    }))}
                    min="10"
                    max="500"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={isOptimizing}
                  />
                </div>
              </>
            )}

            {/* Optimization Options */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Optimization Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.useRealTimeTraffic}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      useRealTimeTraffic: e.target.checked 
                    }))}
                    className="mr-2"
                    disabled={isOptimizing}
                  />
                  <span className="text-sm">Real-time Traffic</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.fuelOptimization}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      fuelOptimization: e.target.checked 
                    }))}
                    className="mr-2"
                    disabled={isOptimizing}
                  />
                  <span className="text-sm">Fuel Optimization</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.co2Optimization}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      co2Optimization: e.target.checked 
                    }))}
                    className="mr-2"
                    disabled={isOptimizing}
                  />
                  <span className="text-sm">CO₂ Optimization</span>
                </label>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={runOptimization}
              disabled={isOptimizing}
              className="flex items-center space-x-2"
            >
              {isOptimizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Optimization</span>
                </>
              )}
            </Button>

            <Button
              onClick={resetOptimization}
              variant="outline"
              disabled={isOptimizing}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </Button>
          </div>

          {/* Progress Bar */}
          {isOptimizing && config.algorithm === 'genetic' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Generation {currentGeneration} of {config.generations}</span>
                <span>{optimizationProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${optimizationProgress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Traffic Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-orange-600" />
            <span>Real-time Traffic Conditions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trafficData.map((traffic) => (
              <div key={traffic.segment_id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 capitalize">
                    {traffic.segment_id.replace('_', ' → ')}
                  </h4>
                  <Badge className={getTrafficConditionColor(traffic.conditions)}>
                    {traffic.conditions}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Speed: {traffic.current_speed} km/h</div>
                  <div>Congestion: {(traffic.congestion_level * 100).toFixed(0)}%</div>
                  <div className="text-xs text-gray-500">
                    Updated: {new Date(traffic.last_updated).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Results */}
      {optimizationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Optimization Results</span>
              <Badge variant="outline" className="ml-auto">
                {optimizationResult.algorithm.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingDown className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">
                  GHS {optimizationResult.fuelSavings.toFixed(0)}
                </div>
                <div className="text-sm text-green-600">Fuel Savings</div>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">
                  {optimizationResult.timeSavings.toFixed(0)}m
                </div>
                <div className="text-sm text-blue-600">Time Savings</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Leaf className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-700">
                  {optimizationResult.co2Reduction.toFixed(1)}kg
                </div>
                <div className="text-sm text-purple-600">CO₂ Reduction</div>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-700">
                  {optimizationResult.confidence.toFixed(0)}%
                </div>
                <div className="text-sm text-orange-600">Confidence</div>
              </div>
            </div>

            {/* Optimization Metrics */}
            {optimizationResult.optimizationMetrics && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Optimization Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {optimizationResult.optimizationMetrics.generations_run && (
                    <div>
                      <span className="text-gray-600">Generations:</span>
                      <span className="ml-2 font-medium">{optimizationResult.optimizationMetrics.generations_run}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Converged:</span>
                    <span className="ml-2 font-medium">
                      {optimizationResult.optimizationMetrics.convergence_achieved ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Traffic Data:</span>
                    <span className="ml-2 font-medium">
                      {optimizationResult.optimizationMetrics.traffic_data_used ? 'Used' : 'Not Used'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Constraints:</span>
                    <span className="ml-2 font-medium">
                      {optimizationResult.optimizationMetrics.constraints_satisfied ? 'Satisfied' : 'Violated'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Route Summary */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Optimized Routes</h4>
              <div className="space-y-3">
                {optimizationResult.routes.map((route, index) => (
                  <div key={route.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-900">Route {index + 1}</h5>
                      <Badge variant="outline">
                        Vehicle {route.vehicle_id}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>Distance: {route.total_distance} km</div>
                      <div>Time: {route.total_time.toFixed(0)} min</div>
                      <div>Fuel Cost: GHS {route.fuel_cost.toFixed(0)}</div>
                      <div>Efficiency: {route.efficiency}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnhancedRouteOptimizerPanel
