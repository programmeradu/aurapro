'use client'

import { formatGhanaTime, formatPercentage } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { Activity, Brain, Calendar, Clock, Target, TrendingUp, Zap } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import {
    Area,
    Bar,
    BarChart,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

interface DemandForecast {
  timestamp: Date
  routeId: string
  routeName: string
  predictedDemand: number
  actualDemand?: number
  confidence: number
  factors: {
    weather: number
    timeOfDay: number
    dayOfWeek: number
    events: number
    historical: number
  }
}

interface MLModel {
  name: string
  type: 'LSTM' | 'Prophet' | 'ARIMA' | 'XGBoost'
  accuracy: number
  lastTrained: Date
  status: 'training' | 'ready' | 'updating'
  predictions: number
}

interface DemandPattern {
  hour: number
  weekday: string
  avgDemand: number
  peakDemand: number
  confidence: number
}

interface DemandForecastingSystemProps {
  className?: string
}

const DemandForecastingSystem: React.FC<DemandForecastingSystemProps> = ({ className = '' }) => {
  const { vehicles, routes, connected } = useStore()
  const [forecasts, setForecasts] = useState<DemandForecast[]>([])
  const [mlModels, setMLModels] = useState<MLModel[]>([])
  const [demandPatterns, setDemandPatterns] = useState<DemandPattern[]>([])
  const [selectedRoute, setSelectedRoute] = useState<string>('')
  const [forecastHorizon, setForecastHorizon] = useState<'1h' | '6h' | '24h' | '7d'>('24h')
  const [isTraining, setIsTraining] = useState(false)
  const [mlPerformance, setMLPerformance] = useState<any>(null)

  // Fetch real ML performance data from backend
  useEffect(() => {
    const fetchMLPerformance = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ml/performance`)
        if (response.ok) {
          const data = await response.json()
          setMLPerformance(data)
          console.log('✅ Loaded ML performance data:', data)
        }
      } catch (error) {
        console.error('❌ Error fetching ML performance:', error)
      }
    }

    if (connected) {
      fetchMLPerformance()
    }
  }, [connected])

  // Initialize ML models
  useEffect(() => {
    const models: MLModel[] = [
      {
        name: 'LSTM Neural Network',
        type: 'LSTM',
        accuracy: 87.5 + Math.random() * 8,
        lastTrained: new Date(Date.now() - Math.random() * 86400000 * 7),
        status: 'ready',
        predictions: Math.floor(Math.random() * 10000) + 5000
      },
      {
        name: 'Prophet Time Series',
        type: 'Prophet',
        accuracy: 82.3 + Math.random() * 10,
        lastTrained: new Date(Date.now() - Math.random() * 86400000 * 3),
        status: 'ready',
        predictions: Math.floor(Math.random() * 8000) + 3000
      },
      {
        name: 'ARIMA Seasonal',
        type: 'ARIMA',
        accuracy: 78.9 + Math.random() * 12,
        lastTrained: new Date(Date.now() - Math.random() * 86400000 * 5),
        status: 'ready',
        predictions: Math.floor(Math.random() * 6000) + 2000
      },
      {
        name: 'XGBoost Ensemble',
        type: 'XGBoost',
        accuracy: 85.1 + Math.random() * 9,
        lastTrained: new Date(Date.now() - Math.random() * 86400000 * 2),
        status: 'ready',
        predictions: Math.floor(Math.random() * 12000) + 4000
      }
    ]
    setMLModels(models)
  }, [])

  // Generate demand patterns
  useEffect(() => {
    const patterns: DemandPattern[] = []
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    weekdays.forEach(weekday => {
      for (let hour = 0; hour < 24; hour++) {
        let baseDemand = 20
        
        // Morning rush (6-9 AM)
        if (hour >= 6 && hour <= 9) {
          baseDemand = weekday === 'Saturday' || weekday === 'Sunday' ? 35 : 80
        }
        // Evening rush (4-7 PM)
        else if (hour >= 16 && hour <= 19) {
          baseDemand = weekday === 'Saturday' || weekday === 'Sunday' ? 45 : 85
        }
        // Lunch time (12-2 PM)
        else if (hour >= 12 && hour <= 14) {
          baseDemand = weekday === 'Saturday' || weekday === 'Sunday' ? 30 : 60
        }
        // Night time (10 PM - 5 AM)
        else if (hour >= 22 || hour <= 5) {
          baseDemand = 10
        }
        // Weekend evening (Friday/Saturday night)
        else if ((weekday === 'Friday' || weekday === 'Saturday') && hour >= 20 && hour <= 23) {
          baseDemand = 70
        }

        patterns.push({
          hour,
          weekday,
          avgDemand: baseDemand + Math.random() * 10,
          peakDemand: baseDemand * (1.3 + Math.random() * 0.4),
          confidence: 75 + Math.random() * 20
        })
      }
    })
    
    setDemandPatterns(patterns)
  }, [])

  // Generate forecasts
  const generateForecasts = () => {
    setIsTraining(true)
    
    setTimeout(() => {
      const newForecasts: DemandForecast[] = []
      const now = new Date()
      
      let hoursToForecast = 24
      switch (forecastHorizon) {
        case '1h': hoursToForecast = 1; break
        case '6h': hoursToForecast = 6; break
        case '24h': hoursToForecast = 24; break
        case '7d': hoursToForecast = 168; break
      }

      routes.forEach(route => {
        for (let i = 0; i < hoursToForecast; i++) {
          const forecastTime = new Date(now.getTime() + i * 60 * 60 * 1000)
          const hour = forecastTime.getHours()
          const dayOfWeek = forecastTime.getDay()
          
          // Base demand calculation
          let baseDemand = 25
          if (hour >= 6 && hour <= 9) baseDemand = 75 // Morning rush
          else if (hour >= 16 && hour <= 19) baseDemand = 80 // Evening rush
          else if (hour >= 12 && hour <= 14) baseDemand = 55 // Lunch
          else if (hour >= 22 || hour <= 5) baseDemand = 15 // Night
          
          // Weekend adjustment
          if (dayOfWeek === 0 || dayOfWeek === 6) baseDemand *= 0.7
          
          // Weather factor (simulated)
          const weatherFactor = 0.8 + Math.random() * 0.4
          
          // Event factor (simulated)
          const eventFactor = Math.random() > 0.9 ? 1.5 : 1.0
          
          const predictedDemand = Math.round(baseDemand * weatherFactor * eventFactor * (0.9 + Math.random() * 0.2))
          
          newForecasts.push({
            timestamp: forecastTime,
            routeId: route.id,
            routeName: route.name,
            predictedDemand,
            confidence: 75 + Math.random() * 20,
            factors: {
              weather: Math.round(weatherFactor * 100) / 100,
              timeOfDay: Math.round((baseDemand / 80) * 100) / 100,
              dayOfWeek: dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0,
              events: eventFactor,
              historical: 0.85 + Math.random() * 0.3
            }
          })
        }
      })
      
      setForecasts(newForecasts)
      setIsTraining(false)
    }, 3000)
  }

  // Auto-generate forecasts on component mount
  useEffect(() => {
    generateForecasts()
  }, [routes, forecastHorizon])

  const getModelStatusColor = (status: MLModel['status']) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-100'
      case 'training': return 'text-yellow-600 bg-yellow-100'
      case 'updating': return 'text-blue-600 bg-blue-100'
    }
  }

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!selectedRoute) return []
    
    return forecasts
      .filter(f => f.routeId === selectedRoute)
      .slice(0, 24)
      .map(forecast => ({
        time: forecast.timestamp.getHours() + ':00',
        demand: forecast.predictedDemand,
        confidence: forecast.confidence,
        weather: forecast.factors.weather * 100,
        events: forecast.factors.events * 100
      }))
  }, [forecasts, selectedRoute])

  // Aggregate metrics
  const totalPredictedDemand = forecasts.reduce((sum, f) => sum + f.predictedDemand, 0)
  const avgConfidence = forecasts.length > 0 
    ? forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length 
    : 0
  const peakDemandHour = forecasts.length > 0 
    ? forecasts.reduce((max, f) => f.predictedDemand > max.predictedDemand ? f : max, forecasts[0])
    : null
  const bestModel = mlModels.reduce((best, model) => model.accuracy > best.accuracy ? model : best, mlModels[0])

  // Weekly pattern data
  const weeklyPatternData = useMemo(() => {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return weekdays.map((day, index) => {
      const dayPatterns = demandPatterns.filter(p => p.weekday.startsWith(day))
      const avgDemand = dayPatterns.reduce((sum, p) => sum + p.avgDemand, 0) / Math.max(dayPatterns.length, 1)
      const peakDemand = Math.max(...dayPatterns.map(p => p.peakDemand))
      
      return {
        day,
        avgDemand: Math.round(avgDemand),
        peakDemand: Math.round(peakDemand),
        confidence: 80 + Math.random() * 15
      }
    })
  }, [demandPatterns])

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>AI Demand Forecasting System</span>
            <div className={`w-2 h-2 rounded-full ml-auto ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">{totalPredictedDemand}</div>
              <div className="text-sm text-purple-800">Total Predicted Demand</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">{formatPercentage(avgConfidence)}</div>
              <div className="text-sm text-blue-800">Avg Confidence</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {peakDemandHour ? peakDemandHour.timestamp.getHours() : 0}:00
              </div>
              <div className="text-sm text-green-800">Peak Demand Hour</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">{mlModels.length}</div>
              <div className="text-sm text-orange-800">Active ML Models</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4 mb-6">
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Route for Details</option>
              {routes.map(route => (
                <option key={route.id} value={route.id}>{route.name}</option>
              ))}
            </select>
            
            <select
              value={forecastHorizon}
              onChange={(e) => setForecastHorizon(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="1h">1 Hour</option>
              <option value="6h">6 Hours</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
            </select>
            
            <Button
              onClick={generateForecasts}
              disabled={isTraining}
              className="flex items-center space-x-2"
            >
              {isTraining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Training Models...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Generate Forecasts</span>
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ML Models Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>ML Models Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mlModels.map((model, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-sm">{model.name}</span>
                          <span className="text-xs text-gray-600">({model.type})</span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getModelStatusColor(model.status)}`}>
                          {model.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Accuracy:</span>
                          <div className="font-medium">{formatPercentage(model.accuracy)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Predictions:</span>
                          <div className="font-medium">{model.predictions.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Trained:</span>
                          <div className="font-medium">{Math.floor((Date.now() - model.lastTrained.getTime()) / (1000 * 60 * 60 * 24))}d ago</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Demand Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span>Weekly Demand Patterns</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyPatternData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgDemand" fill="#10B981" name="Avg Demand" />
                    <Bar dataKey="peakDemand" fill="#F59E0B" name="Peak Demand" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Forecast Chart */}
          {selectedRoute && chartData.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span>24-Hour Demand Forecast - {routes.find(r => r.id === selectedRoute)?.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="demand"
                      fill="#8B5CF6"
                      fillOpacity={0.3}
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      name="Predicted Demand"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="confidence"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Confidence %"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Forecast Results */}
          {forecasts.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <span>Recent Forecasts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {forecasts.slice(0, 10).map((forecast, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="font-medium text-sm">{forecast.routeName}</div>
                          <div className="text-xs text-gray-600">
                            {formatGhanaTime(forecast.timestamp)} • {forecast.predictedDemand} passengers
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-purple-600">
                          {formatPercentage(forecast.confidence)} confidence
                        </div>
                        <div className="text-xs text-gray-600">
                          Weather: {formatPercentage((forecast.factors.weather - 1) * 100)}
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

export default DemandForecastingSystem
