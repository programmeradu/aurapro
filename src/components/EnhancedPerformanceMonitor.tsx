'use client'

import { useStore } from '@/store/useStore'
import { Activity, AlertTriangle, BarChart3, Clock, MapPin, TrendingUp, Users, Zap } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from './ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

interface PerformanceMetrics {
  timestamp: string
  activeVehicles: number
  totalPassengers: number
  averageSpeed: number
  onTimePerformance: number
  fuelEfficiency: number
  routeOptimization: number
  customerSatisfaction: number
  systemLoad: number
}

interface RoutePerformance {
  routeId: string
  routeName: string
  efficiency: number
  onTime: number
  passengers: number
  revenue: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
}

const EnhancedPerformanceMonitor: React.FC = () => {
  const { vehicles = [], kpis = [], connected } = useStore()
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetrics[]>([])
  const [routePerformance, setRoutePerformance] = useState<RoutePerformance[]>([])
  const [systemAlerts, setSystemAlerts] = useState<any[]>([])

  // Generate realistic performance data
  useEffect(() => {
    const generatePerformanceData = () => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false })
      
      // Calculate real metrics from vehicle data
      const activeVehicleCount = vehicles.length
      const totalPassengers = vehicles.reduce((sum, v) => sum + (v.passengers || 0), 0)
      const avgSpeed = vehicles.length > 0 
        ? vehicles.reduce((sum, v) => sum + (v.speed || 0), 0) / vehicles.length 
        : 0
      
      // Generate realistic performance metrics
      const newMetric: PerformanceMetrics = {
        timestamp: timeStr,
        activeVehicles: activeVehicleCount,
        totalPassengers,
        averageSpeed: Math.round(avgSpeed * 10) / 10,
        onTimePerformance: 85 + Math.random() * 10, // 85-95%
        fuelEfficiency: 12 + Math.random() * 3, // 12-15 km/l
        routeOptimization: 78 + Math.random() * 15, // 78-93%
        customerSatisfaction: 4.2 + Math.random() * 0.6, // 4.2-4.8/5
        systemLoad: 45 + Math.random() * 30 // 45-75%
      }

      setPerformanceHistory(prev => {
        const updated = [...prev, newMetric].slice(-20) // Keep last 20 points
        return updated
      })

      // Generate route performance data
      const routes = ['Circle-Kaneshie', 'Tema-Accra', 'Kumasi-Accra', 'Takoradi-Accra', 'Cape Coast-Accra']
      const routeData = routes.map((route, index) => ({
        routeId: `R${index + 1}`,
        routeName: route,
        efficiency: 75 + Math.random() * 20,
        onTime: 80 + Math.random() * 15,
        passengers: Math.floor(Math.random() * 500) + 200,
        revenue: Math.floor(Math.random() * 5000) + 2000,
        status: Math.random() > 0.8 ? 'warning' : Math.random() > 0.95 ? 'critical' : 'good'
      })) as RoutePerformance[]

      setRoutePerformance(routeData)

      // Generate system alerts
      const alerts = []
      if (Math.random() > 0.7) {
        alerts.push({
          type: 'warning',
          title: 'High Demand Detected',
          message: 'Route Circle-Kaneshie experiencing 40% above normal demand',
          timestamp: now.toLocaleTimeString()
        })
      }
      if (Math.random() > 0.85) {
        alerts.push({
          type: 'info',
          title: 'Route Optimization Complete',
          message: 'Alternative route for Tema-Accra saves 12 minutes',
          timestamp: now.toLocaleTimeString()
        })
      }
      if (Math.random() > 0.9) {
        alerts.push({
          type: 'error',
          title: 'Vehicle Breakdown',
          message: 'Bus EXP-001 requires immediate maintenance',
          timestamp: now.toLocaleTimeString()
        })
      }

      setSystemAlerts(alerts)
    }

    generatePerformanceData()
    const interval = setInterval(generatePerformanceData, 5000)
    return () => clearInterval(interval)
  }, [vehicles])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const latestMetrics = performanceHistory[performanceHistory.length - 1]

  return (
    <div className="space-y-6">
      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                <p className="text-2xl font-bold text-blue-600">{vehicles.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <Badge variant="default" size="sm" className={connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {connected ? 'Live Data' : 'Offline'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Passengers</p>
                <p className="text-2xl font-bold text-green-600">
                  {vehicles.reduce((sum, v) => sum + (v.passengers || 0), 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-2">
              <span className="text-xs text-gray-500">
                Avg: {vehicles.length > 0 ? Math.round(vehicles.reduce((sum, v) => sum + (v.passengers || 0), 0) / vehicles.length) : 0} per vehicle
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Speed</p>
                <p className="text-2xl font-bold text-purple-600">
                  {vehicles.length > 0 
                    ? Math.round(vehicles.reduce((sum, v) => sum + (v.speed || 0), 0) / vehicles.length * 10) / 10
                    : 0} km/h
                </p>
              </div>
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <span className="text-xs text-gray-500">Real-time tracking</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On-Time Performance</p>
                <p className="text-2xl font-bold text-orange-600">
                  {latestMetrics ? Math.round(latestMetrics.onTimePerformance) : 87}%
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <Badge variant="default" size="sm" className="bg-green-100 text-green-800">
                Target: 85%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>System Performance Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="onTimePerformance" stroke="#3B82F6" strokeWidth={2} name="On-Time %" />
                <Line type="monotone" dataKey="systemLoad" stroke="#10B981" strokeWidth={2} name="System Load %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Route Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {routePerformance.slice(0, 5).map((route) => (
                <div key={route.routeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{route.routeName}</p>
                      <p className="text-sm text-gray-600">{route.passengers} passengers</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{Math.round(route.efficiency)}%</span>
                    <Badge variant="default" size="sm" className={getStatusColor(route.status)}>
                      {route.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span>System Alerts</span>
              <Badge variant="default" size="sm" className="ml-auto">
                {systemAlerts.length} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  alert.type === 'error' ? 'bg-red-50 border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${
                        alert.type === 'error' ? 'text-red-800' :
                        alert.type === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>{alert.title}</p>
                      <p className={`text-sm mt-1 ${
                        alert.type === 'error' ? 'text-red-600' :
                        alert.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>{alert.message}</p>
                    </div>
                    <span className="text-xs text-gray-500">{alert.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnhancedPerformanceMonitor
