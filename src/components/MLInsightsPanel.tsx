'use client'

import { useStore } from '@/store/useStore'
import { Brain, TrendingUp, AlertTriangle, Target, BarChart3, Activity, Zap } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface MLInsightsPanelProps {
  className?: string
}

const MLInsightsPanel: React.FC<MLInsightsPanelProps> = ({ className = '' }) => {
  const { vehicles, routes, connected } = useStore()
  const [selectedChart, setSelectedChart] = useState<'demand' | 'travel' | 'optimization' | 'anomalies'>('demand')
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h')

  // Generate demand forecasting data
  const demandData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    predicted: Math.floor(Math.random() * 200) + 100 + Math.sin(i / 4) * 50,
    actual: Math.floor(Math.random() * 180) + 90 + Math.sin(i / 4) * 45,
    confidence: Math.floor(Math.random() * 20) + 80
  }))

  // Generate travel time predictions
  const travelTimeData = routes.map((route, index) => ({
    route: route.name,
    predicted: Math.floor(Math.random() * 30) + 20,
    actual: Math.floor(Math.random() * 35) + 18,
    historical: Math.floor(Math.random() * 40) + 25,
    accuracy: Math.floor(Math.random() * 15) + 85
  }))

  // Generate route optimization suggestions
  const optimizationData = [
    { category: 'Fuel Efficiency', current: 78, optimized: 92, savings: 'GHS 450/day' },
    { category: 'Travel Time', current: 85, optimized: 94, savings: '12 min/trip' },
    { category: 'Passenger Load', current: 67, optimized: 83, savings: '24% increase' },
    { category: 'Route Coverage', current: 89, optimized: 96, savings: '3 new stops' }
  ]

  // Generate anomaly detection data
  const anomalyData = [
    { type: 'Traffic Congestion', severity: 'High', location: 'Spintex Road', confidence: 94, time: '14:30' },
    { type: 'Vehicle Breakdown', severity: 'Critical', location: 'Circle Interchange', confidence: 98, time: '13:45' },
    { type: 'Weather Impact', severity: 'Medium', location: 'Tema Motorway', confidence: 87, time: '12:20' },
    { type: 'Demand Spike', severity: 'Low', location: 'Kaneshie Market', confidence: 76, time: '11:15' }
  ]

  // ML Model Performance Data
  const modelPerformance = [
    { model: 'LSTM Demand', accuracy: 87.5, predictions: 1247, status: 'active' },
    { model: 'Route Optimizer', accuracy: 92.3, optimizations: 156, status: 'active' },
    { model: 'Anomaly Detector', accuracy: 89.1, alerts: 23, status: 'active' },
    { model: 'Travel Time Predictor', accuracy: 85.7, predictions: 892, status: 'active' }
  ]

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const renderChart = () => {
    switch (selectedChart) {
      case 'demand':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={demandData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="predicted" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="actual" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        )
      
      case 'travel':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={travelTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="route" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="predicted" fill="#3B82F6" />
              <Bar dataKey="actual" fill="#10B981" />
              <Bar dataKey="historical" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case 'optimization':
        return (
          <div className="space-y-4">
            {optimizationData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.category}</div>
                  <div className="text-xs text-gray-600 mt-1">Potential savings: {item.savings}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-600">{item.current}%</div>
                    <div className="text-xs text-gray-500">Current</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-600">{item.optimized}%</div>
                    <div className="text-xs text-gray-500">Optimized</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-600">+{item.optimized - item.current}%</div>
                    <div className="text-xs text-gray-500">Improvement</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      
      case 'anomalies':
        return (
          <div className="space-y-3">
            {anomalyData.map((anomaly, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-sm">{anomaly.type}</span>
                    <Badge size="sm" className={getSeverityColor(anomaly.severity)}>
                      {anomaly.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">{anomaly.time}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Location:</span> {anomaly.location}
                  </div>
                  <div>
                    <span className="text-gray-600">Confidence:</span> {anomaly.confidence}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>ML Insights & Predictions</span>
            <div className={`w-2 h-2 rounded-full ml-auto ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* ML Model Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {modelPerformance.map((model, index) => (
              <div key={index} className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-lg font-bold text-purple-600 mb-1">{model.accuracy}%</div>
                <div className="text-sm text-purple-800">{model.model}</div>
                <div className="text-xs text-purple-600 mt-1">
                  {model.predictions || model.optimizations || model.alerts} {model.predictions ? 'predictions' : model.optimizations ? 'optimizations' : 'alerts'}
                </div>
              </div>
            ))}
          </div>

          {/* Chart Selection */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              onClick={() => setSelectedChart('demand')}
              variant={selectedChart === 'demand' ? 'default' : 'outline'}
              size="sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Demand Forecasting
            </Button>
            <Button
              onClick={() => setSelectedChart('travel')}
              variant={selectedChart === 'travel' ? 'default' : 'outline'}
              size="sm"
            >
              <Activity className="w-4 h-4 mr-2" />
              Travel Time Predictions
            </Button>
            <Button
              onClick={() => setSelectedChart('optimization')}
              variant={selectedChart === 'optimization' ? 'default' : 'outline'}
              size="sm"
            >
              <Target className="w-4 h-4 mr-2" />
              Route Optimization
            </Button>
            <Button
              onClick={() => setSelectedChart('anomalies')}
              variant={selectedChart === 'anomalies' ? 'default' : 'outline'}
              size="sm"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Anomaly Alerts
            </Button>
          </div>

          {/* Time Range Selection */}
          <div className="flex gap-2 mb-6">
            {(['1h', '6h', '24h', '7d'] as const).map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Chart Display */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {selectedChart === 'demand' && 'Passenger Demand Forecasting'}
                {selectedChart === 'travel' && 'Travel Time Predictions'}
                {selectedChart === 'optimization' && 'Route Optimization Suggestions'}
                {selectedChart === 'anomalies' && 'Real-time Anomaly Detection'}
              </h3>
              <Badge variant="outline" size="sm">
                {timeRange} view
              </Badge>
            </div>
            {renderChart()}
          </div>

          {/* Key Insights */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Key ML Insights</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
              <div>• Demand forecasting accuracy: 87.5% (↑2.3% this week)</div>
              <div>• Route optimization potential: 15% efficiency gain</div>
              <div>• Anomaly detection: 4 active alerts requiring attention</div>
              <div>• Travel time predictions: 85.7% accuracy across all routes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MLInsightsPanel
