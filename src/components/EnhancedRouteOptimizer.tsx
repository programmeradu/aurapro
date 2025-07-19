'use client'

import { useStore } from '@/store/useStore'
import { formatCurrency, formatDuration, formatPercentage } from '@/lib/utils'
import { Route, Navigation, Zap, TrendingDown, MapPin, Clock, DollarSign, Activity, Target, Cpu } from 'lucide-react'
import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'

interface TrafficCondition {
  segmentId: string
  routeName: string
  congestionLevel: 'low' | 'medium' | 'high' | 'severe'
  averageSpeed: number
  delayMinutes: number
  fuelImpact: number
}

interface OptimizationResult {
  routeId: string
  routeName: string
  originalTime: number
  optimizedTime: number
  timeSaved: number
  originalFuelCost: number
  optimizedFuelCost: number
  fuelSaved: number
  totalSavings: number
  confidence: number
  algorithm: 'genetic' | 'dijkstra' | 'a-star' | 'hybrid'
}

interface GeneticAlgorithmParams {
  populationSize: number
  generations: number
  mutationRate: number
  crossoverRate: number
  elitismRate: number
}

interface EnhancedRouteOptimizerProps {
  className?: string
}

const EnhancedRouteOptimizer: React.FC<EnhancedRouteOptimizerProps> = ({ className = '' }) => {
  const { vehicles, routes, connected } = useStore()
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([])
  const [trafficConditions, setTrafficConditions] = useState<TrafficCondition[]>([])
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'genetic' | 'dijkstra' | 'a-star' | 'hybrid'>('genetic')
  const [gaParams, setGaParams] = useState<GeneticAlgorithmParams>({
    populationSize: 50,
    generations: 100,
    mutationRate: 0.1,
    crossoverRate: 0.8,
    elitismRate: 0.2
  })

  // Simulate real-time traffic data
  useEffect(() => {
    const updateTrafficConditions = () => {
      const conditions: TrafficCondition[] = routes.map(route => {
        const congestionLevels: TrafficCondition['congestionLevel'][] = ['low', 'medium', 'high', 'severe']
        const congestionLevel = congestionLevels[Math.floor(Math.random() * congestionLevels.length)]
        
        let averageSpeed = 45
        let delayMinutes = 0
        let fuelImpact = 1.0

        switch (congestionLevel) {
          case 'low':
            averageSpeed = 40 + Math.random() * 15
            delayMinutes = Math.random() * 5
            fuelImpact = 1.0 + Math.random() * 0.1
            break
          case 'medium':
            averageSpeed = 25 + Math.random() * 15
            delayMinutes = 5 + Math.random() * 10
            fuelImpact = 1.1 + Math.random() * 0.2
            break
          case 'high':
            averageSpeed = 15 + Math.random() * 10
            delayMinutes = 15 + Math.random() * 15
            fuelImpact = 1.3 + Math.random() * 0.3
            break
          case 'severe':
            averageSpeed = 5 + Math.random() * 10
            delayMinutes = 30 + Math.random() * 20
            fuelImpact = 1.6 + Math.random() * 0.4
            break
        }

        return {
          segmentId: `segment-${route.id}`,
          routeName: route.name,
          congestionLevel,
          averageSpeed: Math.round(averageSpeed),
          delayMinutes: Math.round(delayMinutes),
          fuelImpact: Math.round(fuelImpact * 100) / 100
        }
      })
      setTrafficConditions(conditions)
    }

    updateTrafficConditions()
    const interval = setInterval(updateTrafficConditions, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [routes])

  // Genetic Algorithm Implementation
  const runGeneticAlgorithm = (routeData: any) => {
    const { populationSize, generations, mutationRate, crossoverRate } = gaParams
    
    // Simplified genetic algorithm simulation
    let bestFitness = 0
    let currentGeneration = 0
    
    while (currentGeneration < generations) {
      // Simulate population evolution
      const fitness = Math.random() * 100
      if (fitness > bestFitness) {
        bestFitness = fitness
      }
      currentGeneration++
    }
    
    return {
      timeSaved: 5 + Math.random() * 20, // 5-25 minutes saved
      fuelSaved: 0.1 + Math.random() * 0.3, // 10-40% fuel savings
      confidence: bestFitness
    }
  }

  // Route optimization algorithms
  const optimizeRoutes = async () => {
    setIsOptimizing(true)
    
    try {
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const results: OptimizationResult[] = routes.map(route => {
        const trafficCondition = trafficConditions.find(tc => tc.routeName === route.name)
        const baseTime = 45 + Math.random() * 30 // 45-75 minutes base time
        const baseFuelCost = 25 + Math.random() * 15 // GHS 25-40 base fuel cost
        
        let optimization
        switch (selectedAlgorithm) {
          case 'genetic':
            optimization = runGeneticAlgorithm(route)
            break
          case 'dijkstra':
            optimization = {
              timeSaved: 3 + Math.random() * 15,
              fuelSaved: 0.05 + Math.random() * 0.2,
              confidence: 70 + Math.random() * 20
            }
            break
          case 'a-star':
            optimization = {
              timeSaved: 4 + Math.random() * 18,
              fuelSaved: 0.08 + Math.random() * 0.25,
              confidence: 75 + Math.random() * 20
            }
            break
          case 'hybrid':
            optimization = {
              timeSaved: 6 + Math.random() * 25,
              fuelSaved: 0.12 + Math.random() * 0.35,
              confidence: 80 + Math.random() * 15
            }
            break
        }
        
        const optimizedTime = baseTime - optimization.timeSaved
        const optimizedFuelCost = baseFuelCost * (1 - optimization.fuelSaved)
        const totalSavings = (baseFuelCost - optimizedFuelCost) + (optimization.timeSaved * 2) // Time value
        
        return {
          routeId: route.id,
          routeName: route.name,
          originalTime: Math.round(baseTime),
          optimizedTime: Math.round(optimizedTime),
          timeSaved: Math.round(optimization.timeSaved),
          originalFuelCost: Math.round(baseFuelCost),
          optimizedFuelCost: Math.round(optimizedFuelCost),
          fuelSaved: Math.round((baseFuelCost - optimizedFuelCost) * 100) / 100,
          totalSavings: Math.round(totalSavings * 100) / 100,
          confidence: Math.round(optimization.confidence),
          algorithm: selectedAlgorithm
        }
      })
      
      setOptimizationResults(results)
    } catch (error) {
      console.error('Optimization failed:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const getCongestionColor = (level: TrafficCondition['congestionLevel']) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'severe': return 'text-red-600 bg-red-100'
    }
  }

  const totalTimeSaved = optimizationResults.reduce((sum, result) => sum + result.timeSaved, 0)
  const totalFuelSaved = optimizationResults.reduce((sum, result) => sum + result.fuelSaved, 0)
  const totalCostSavings = optimizationResults.reduce((sum, result) => sum + result.totalSavings, 0)
  const avgConfidence = optimizationResults.length > 0 
    ? optimizationResults.reduce((sum, result) => sum + result.confidence, 0) / optimizationResults.length 
    : 0

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Route className="w-5 h-5 text-blue-600" />
            <span>Enhanced Route Optimization Engine</span>
            <div className={`w-2 h-2 rounded-full ml-auto ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Optimization Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">{totalTimeSaved} min</div>
              <div className="text-sm text-blue-800">Total Time Saved</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(totalFuelSaved)}</div>
              <div className="text-sm text-green-800">Fuel Cost Saved</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">{formatCurrency(totalCostSavings)}</div>
              <div className="text-sm text-purple-800">Total Savings</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">{formatPercentage(avgConfidence)}</div>
              <div className="text-sm text-orange-800">Avg Confidence</div>
            </div>
          </div>

          {/* Algorithm Selection & Parameters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-purple-600" />
                  <span>Algorithm Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Optimization Algorithm
                    </label>
                    <select
                      value={selectedAlgorithm}
                      onChange={(e) => setSelectedAlgorithm(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="genetic">Genetic Algorithm</option>
                      <option value="dijkstra">Dijkstra's Algorithm</option>
                      <option value="a-star">A* Search</option>
                      <option value="hybrid">Hybrid Approach</option>
                    </select>
                  </div>

                  {selectedAlgorithm === 'genetic' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600">Population Size</label>
                          <input
                            type="number"
                            value={gaParams.populationSize}
                            onChange={(e) => setGaParams(prev => ({ ...prev, populationSize: parseInt(e.target.value) }))}
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600">Generations</label>
                          <input
                            type="number"
                            value={gaParams.generations}
                            onChange={(e) => setGaParams(prev => ({ ...prev, generations: parseInt(e.target.value) }))}
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600">Mutation Rate</label>
                          <input
                            type="number"
                            step="0.01"
                            value={gaParams.mutationRate}
                            onChange={(e) => setGaParams(prev => ({ ...prev, mutationRate: parseFloat(e.target.value) }))}
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600">Crossover Rate</label>
                          <input
                            type="number"
                            step="0.01"
                            value={gaParams.crossoverRate}
                            onChange={(e) => setGaParams(prev => ({ ...prev, crossoverRate: parseFloat(e.target.value) }))}
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={optimizeRoutes}
                    disabled={isOptimizing}
                    className="w-full"
                  >
                    {isOptimizing ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Optimizing Routes...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4" />
                        <span>Run Optimization</span>
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Traffic Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-red-600" />
                  <span>Real-time Traffic Conditions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {trafficConditions.map((condition, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="font-medium text-sm">{condition.routeName}</div>
                          <div className="text-xs text-gray-600">
                            {condition.averageSpeed} km/h • +{condition.delayMinutes} min delay
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCongestionColor(condition.congestionLevel)}`}>
                          {condition.congestionLevel}
                        </span>
                        <div className="text-xs text-gray-600 mt-1">
                          {formatPercentage((condition.fuelImpact - 1) * 100)} fuel impact
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Results */}
          {optimizationResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-green-600" />
                  <span>Optimization Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizationResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Navigation className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{result.routeName}</span>
                          <span className="text-xs text-gray-600">({result.algorithm})</span>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          {formatPercentage(result.confidence)} confidence
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-2 bg-white rounded">
                          <div className="text-lg font-bold text-blue-600">{result.timeSaved} min</div>
                          <div className="text-xs text-gray-600">Time Saved</div>
                          <div className="text-xs text-gray-500">{result.originalTime} → {result.optimizedTime} min</div>
                        </div>
                        
                        <div className="text-center p-2 bg-white rounded">
                          <div className="text-lg font-bold text-green-600">{formatCurrency(result.fuelSaved)}</div>
                          <div className="text-xs text-gray-600">Fuel Saved</div>
                          <div className="text-xs text-gray-500">{formatCurrency(result.originalFuelCost)} → {formatCurrency(result.optimizedFuelCost)}</div>
                        </div>
                        
                        <div className="text-center p-2 bg-white rounded">
                          <div className="text-lg font-bold text-purple-600">{formatCurrency(result.totalSavings)}</div>
                          <div className="text-xs text-gray-600">Total Savings</div>
                          <div className="text-xs text-gray-500">Per trip</div>
                        </div>
                        
                        <div className="text-center p-2 bg-white rounded">
                          <div className="text-lg font-bold text-orange-600">
                            {formatPercentage(((result.originalTime - result.optimizedTime) / result.originalTime) * 100)}
                          </div>
                          <div className="text-xs text-gray-600">Efficiency Gain</div>
                          <div className="text-xs text-gray-500">Overall improvement</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default EnhancedRouteOptimizer
