'use client'

import { useStore } from '@/store/useStore'
import { formatCurrency, formatPercentage, formatGhanaTime } from '@/lib/utils'
import { DollarSign, TrendingUp, Target, Zap, BarChart3, Activity, Calculator, Settings } from 'lucide-react'
import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'

interface PricingStrategy {
  id: string
  name: string
  type: 'surge' | 'discount' | 'dynamic' | 'fixed'
  baseFare: number
  multiplier: number
  conditions: {
    demandThreshold: number
    timeWindow: string
    weatherSensitive: boolean
    eventBased: boolean
  }
  performance: {
    revenueIncrease: number
    demandResponse: number
    customerSatisfaction: number
  }
}

interface PriceOptimization {
  routeId: string
  routeName: string
  currentPrice: number
  optimizedPrice: number
  priceChange: number
  expectedRevenue: number
  demandImpact: number
  confidence: number
  strategy: string
  factors: {
    demand: number
    supply: number
    competition: number
    weather: number
    events: number
  }
}

interface RevenueProjection {
  timestamp: Date
  currentRevenue: number
  optimizedRevenue: number
  passengerCount: number
  averagePrice: number
}

interface DynamicPricingEngineProps {
  className?: string
}

const DynamicPricingEngine: React.FC<DynamicPricingEngineProps> = ({ className = '' }) => {
  const { vehicles, routes, connected } = useStore()
  const [pricingStrategies, setPricingStrategies] = useState<PricingStrategy[]>([])
  const [priceOptimizations, setPriceOptimizations] = useState<PriceOptimization[]>([])
  const [revenueProjections, setRevenueProjections] = useState<RevenueProjection[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<string>('')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationMode, setOptimizationMode] = useState<'revenue' | 'demand' | 'balanced'>('balanced')

  // Initialize pricing strategies
  useEffect(() => {
    const strategies: PricingStrategy[] = [
      {
        id: 'surge-pricing',
        name: 'Surge Pricing',
        type: 'surge',
        baseFare: 2.50,
        multiplier: 1.5,
        conditions: {
          demandThreshold: 80,
          timeWindow: 'peak-hours',
          weatherSensitive: true,
          eventBased: true
        },
        performance: {
          revenueIncrease: 25.3,
          demandResponse: -12.5,
          customerSatisfaction: 72.1
        }
      },
      {
        id: 'off-peak-discount',
        name: 'Off-Peak Discount',
        type: 'discount',
        baseFare: 2.50,
        multiplier: 0.8,
        conditions: {
          demandThreshold: 30,
          timeWindow: 'off-peak',
          weatherSensitive: false,
          eventBased: false
        },
        performance: {
          revenueIncrease: 8.7,
          demandResponse: 18.2,
          customerSatisfaction: 85.4
        }
      },
      {
        id: 'dynamic-optimization',
        name: 'AI Dynamic Pricing',
        type: 'dynamic',
        baseFare: 2.50,
        multiplier: 1.0,
        conditions: {
          demandThreshold: 50,
          timeWindow: 'all-day',
          weatherSensitive: true,
          eventBased: true
        },
        performance: {
          revenueIncrease: 32.1,
          demandResponse: -5.8,
          customerSatisfaction: 78.9
        }
      },
      {
        id: 'competitive-pricing',
        name: 'Competitive Pricing',
        type: 'dynamic',
        baseFare: 2.50,
        multiplier: 0.95,
        conditions: {
          demandThreshold: 60,
          timeWindow: 'business-hours',
          weatherSensitive: false,
          eventBased: false
        },
        performance: {
          revenueIncrease: 15.6,
          demandResponse: 22.3,
          customerSatisfaction: 82.7
        }
      }
    ]
    setPricingStrategies(strategies)
    setSelectedStrategy(strategies[0].id)
  }, [])

  // Generate price optimizations
  const generateOptimizations = () => {
    setIsOptimizing(true)
    
    setTimeout(() => {
      const optimizations: PriceOptimization[] = routes.map(route => {
        const baseFare = 2.50
        const currentDemand = 40 + Math.random() * 60 // 40-100% demand
        const supply = 60 + Math.random() * 40 // 60-100% supply
        const competition = 0.8 + Math.random() * 0.4 // 0.8-1.2 competition factor
        const weather = 0.9 + Math.random() * 0.2 // 0.9-1.1 weather factor
        const events = Math.random() > 0.8 ? 1.3 : 1.0 // 20% chance of events
        
        let priceMultiplier = 1.0
        let strategy = 'base-pricing'
        
        // Apply optimization logic based on mode
        switch (optimizationMode) {
          case 'revenue':
            // Maximize revenue - increase price when demand is high
            if (currentDemand > 80) {
              priceMultiplier = 1.4 + Math.random() * 0.3
              strategy = 'surge-pricing'
            } else if (currentDemand > 60) {
              priceMultiplier = 1.1 + Math.random() * 0.2
              strategy = 'premium-pricing'
            }
            break
            
          case 'demand':
            // Maximize demand - decrease price when demand is low
            if (currentDemand < 40) {
              priceMultiplier = 0.7 + Math.random() * 0.2
              strategy = 'discount-pricing'
            } else if (currentDemand < 60) {
              priceMultiplier = 0.9 + Math.random() * 0.1
              strategy = 'competitive-pricing'
            }
            break
            
          case 'balanced':
            // Balance revenue and demand
            const demandSupplyRatio = currentDemand / supply
            if (demandSupplyRatio > 1.2) {
              priceMultiplier = 1.2 + Math.random() * 0.2
              strategy = 'surge-pricing'
            } else if (demandSupplyRatio < 0.8) {
              priceMultiplier = 0.85 + Math.random() * 0.1
              strategy = 'discount-pricing'
            } else {
              priceMultiplier = 0.95 + Math.random() * 0.1
              strategy = 'dynamic-pricing'
            }
            break
        }
        
        // Apply external factors
        priceMultiplier *= weather * events * competition
        
        const currentPrice = baseFare
        const optimizedPrice = baseFare * priceMultiplier
        const priceChange = ((optimizedPrice - currentPrice) / currentPrice) * 100
        
        // Calculate expected revenue and demand impact
        const priceElasticity = -0.8 // Typical price elasticity for transport
        const demandImpact = priceElasticity * priceChange
        const expectedRevenue = optimizedPrice * (currentDemand * (1 + demandImpact / 100))
        
        return {
          routeId: route.id,
          routeName: route.name,
          currentPrice,
          optimizedPrice: Math.round(optimizedPrice * 100) / 100,
          priceChange: Math.round(priceChange * 10) / 10,
          expectedRevenue: Math.round(expectedRevenue * 10) / 10,
          demandImpact: Math.round(demandImpact * 10) / 10,
          confidence: 75 + Math.random() * 20,
          strategy,
          factors: {
            demand: Math.round(currentDemand),
            supply: Math.round(supply),
            competition: Math.round(competition * 100) / 100,
            weather: Math.round(weather * 100) / 100,
            events: Math.round(events * 100) / 100
          }
        }
      })
      
      setPriceOptimizations(optimizations)
      generateRevenueProjections(optimizations)
      setIsOptimizing(false)
    }, 2500)
  }

  // Generate revenue projections
  const generateRevenueProjections = (optimizations: PriceOptimization[]) => {
    const projections: RevenueProjection[] = []
    const now = new Date()
    
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000)
      const hour = timestamp.getHours()
      
      // Simulate passenger count based on time of day
      let passengerCount = 50
      if (hour >= 6 && hour <= 9) passengerCount = 120 // Morning rush
      else if (hour >= 16 && hour <= 19) passengerCount = 130 // Evening rush
      else if (hour >= 12 && hour <= 14) passengerCount = 80 // Lunch
      else if (hour >= 22 || hour <= 5) passengerCount = 20 // Night
      
      const currentRevenue = passengerCount * 2.50
      const avgOptimizedPrice = optimizations.reduce((sum, opt) => sum + opt.optimizedPrice, 0) / optimizations.length
      const avgDemandImpact = optimizations.reduce((sum, opt) => sum + opt.demandImpact, 0) / optimizations.length
      
      const adjustedPassengerCount = passengerCount * (1 + avgDemandImpact / 100)
      const optimizedRevenue = adjustedPassengerCount * avgOptimizedPrice
      
      projections.push({
        timestamp,
        currentRevenue: Math.round(currentRevenue),
        optimizedRevenue: Math.round(optimizedRevenue),
        passengerCount: Math.round(adjustedPassengerCount),
        averagePrice: Math.round(avgOptimizedPrice * 100) / 100
      })
    }
    
    setRevenueProjections(projections)
  }

  // Auto-generate optimizations on component mount
  useEffect(() => {
    generateOptimizations()
  }, [routes, optimizationMode])

  const getStrategyColor = (type: PricingStrategy['type']) => {
    switch (type) {
      case 'surge': return 'text-red-600 bg-red-100'
      case 'discount': return 'text-green-600 bg-green-100'
      case 'dynamic': return 'text-purple-600 bg-purple-100'
      case 'fixed': return 'text-gray-600 bg-gray-100'
    }
  }

  // Aggregate metrics
  const totalRevenueIncrease = priceOptimizations.reduce((sum, opt) => sum + opt.expectedRevenue, 0)
  const avgPriceChange = priceOptimizations.length > 0 
    ? priceOptimizations.reduce((sum, opt) => sum + opt.priceChange, 0) / priceOptimizations.length 
    : 0
  const avgConfidence = priceOptimizations.length > 0 
    ? priceOptimizations.reduce((sum, opt) => sum + opt.confidence, 0) / priceOptimizations.length 
    : 0
  const totalDemandImpact = priceOptimizations.reduce((sum, opt) => sum + opt.demandImpact, 0)

  // Chart data for revenue projections
  const revenueChartData = revenueProjections.map(proj => ({
    time: proj.timestamp.getHours() + ':00',
    current: proj.currentRevenue,
    optimized: proj.optimizedRevenue,
    passengers: proj.passengerCount,
    price: proj.averagePrice
  }))

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span>Dynamic Pricing Engine</span>
            <div className={`w-2 h-2 rounded-full ml-auto ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(totalRevenueIncrease)}</div>
              <div className="text-sm text-green-800">Expected Revenue</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">{formatPercentage(avgPriceChange)}</div>
              <div className="text-sm text-blue-800">Avg Price Change</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">{formatPercentage(avgConfidence)}</div>
              <div className="text-sm text-purple-800">Avg Confidence</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">{formatPercentage(totalDemandImpact)}</div>
              <div className="text-sm text-orange-800">Demand Impact</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4 mb-6">
            <select
              value={optimizationMode}
              onChange={(e) => setOptimizationMode(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="revenue">Maximize Revenue</option>
              <option value="demand">Maximize Demand</option>
              <option value="balanced">Balanced Approach</option>
            </select>
            
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {pricingStrategies.map(strategy => (
                <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
              ))}
            </select>
            
            <Button
              onClick={generateOptimizations}
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
                  <Calculator className="w-4 h-4" />
                  <span>Optimize Prices</span>
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pricing Strategies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <span>Pricing Strategies</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pricingStrategies.map((strategy, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-sm">{strategy.name}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStrategyColor(strategy.type)}`}>
                          {strategy.type}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-gray-600">Base Fare:</span>
                          <div className="font-medium">{formatCurrency(strategy.baseFare)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Multiplier:</span>
                          <div className="font-medium">{strategy.multiplier}x</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Revenue +:</span>
                          <div className="font-medium">{formatPercentage(strategy.performance.revenueIncrease)}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Demand Response:</span>
                          <div className={`font-medium ${strategy.performance.demandResponse >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(strategy.performance.demandResponse)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Satisfaction:</span>
                          <div className="font-medium">{formatPercentage(strategy.performance.customerSatisfaction)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Price Optimizations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Route Price Optimizations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {priceOptimizations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No optimizations available</p>
                      <p className="text-sm">Click "Optimize Prices" to generate recommendations</p>
                    </div>
                  ) : (
                    priceOptimizations.map((optimization, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-sm">{optimization.routeName}</span>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            optimization.priceChange > 0 ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'
                          }`}>
                            {optimization.priceChange > 0 ? '+' : ''}{formatPercentage(optimization.priceChange)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                          <div>
                            <span className="text-gray-600">Current:</span>
                            <div className="font-medium">{formatCurrency(optimization.currentPrice)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Optimized:</span>
                            <div className="font-medium">{formatCurrency(optimization.optimizedPrice)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Revenue:</span>
                            <div className="font-medium">{formatCurrency(optimization.expectedRevenue)}</div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-1">
                          Strategy: <span className="font-medium">{optimization.strategy}</span> • 
                          Confidence: <span className="font-medium">{formatPercentage(optimization.confidence)}</span>
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          Demand: {optimization.factors.demand}% • 
                          Supply: {optimization.factors.supply}% • 
                          Weather: {optimization.factors.weather}x
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Projections Chart */}
          {revenueProjections.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <span>24-Hour Revenue Projections</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="current"
                      fill="#94A3B8"
                      fillOpacity={0.3}
                      stroke="#94A3B8"
                      strokeWidth={2}
                      name="Current Revenue (GHS)"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="optimized"
                      fill="#10B981"
                      fillOpacity={0.3}
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Optimized Revenue (GHS)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="passengers"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      name="Passenger Count"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DynamicPricingEngine
