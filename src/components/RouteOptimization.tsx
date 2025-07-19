'use client'

import { useStore } from '@/store/useStore'
import { formatDuration, formatPercentage, calculateDistance } from '@/lib/utils'
import { Route, Navigation, Clock, TrendingUp, MapPin, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'

interface RouteOptimizationProps {
  className?: string
}

interface OptimizationSuggestion {
  id: string
  type: 'time' | 'fuel' | 'traffic' | 'demand'
  title: string
  description: string
  impact: string
  savings: number
  priority: 'low' | 'medium' | 'high'
  routeId: string
  status: 'pending' | 'applied' | 'rejected'
}

const RouteOptimization: React.FC<RouteOptimizationProps> = ({ className = '' }) => {
  const { vehicles, routes, connected } = useStore()
  const [optimizations, setOptimizations] = useState<OptimizationSuggestion[]>([])
  const [selectedRoute, setSelectedRoute] = useState<string>('all')

  // Generate optimization suggestions based on real-time data
  const suggestions = useMemo(() => {
    const newSuggestions: OptimizationSuggestion[] = []

    // Analyze each route for optimization opportunities
    routes.forEach((route, index) => {
      const routeVehicles = vehicles.filter(v => v.route === route.name)
      
      if (routeVehicles.length > 0) {
        const avgSpeed = routeVehicles.reduce((sum, v) => sum + (v.speed || 0), 0) / routeVehicles.length
        const avgOccupancy = routeVehicles.reduce((sum, v) => sum + (v.occupancy || 0), 0) / routeVehicles.length

        // Speed optimization
        if (avgSpeed < 20) {
          newSuggestions.push({
            id: `speed-${route.id}`,
            type: 'traffic',
            title: 'Traffic Congestion Detected',
            description: `Route ${route.name} showing low average speed (${avgSpeed.toFixed(1)} km/h)`,
            impact: 'Reduce travel time by 15-20%',
            savings: 18,
            priority: 'high',
            routeId: route.id,
            status: 'pending'
          })
        }

        // Demand optimization
        if (avgOccupancy > 85) {
          newSuggestions.push({
            id: `demand-${route.id}`,
            type: 'demand',
            title: 'High Demand Route',
            description: `Route ${route.name} at ${avgOccupancy.toFixed(1)}% capacity`,
            impact: 'Deploy additional vehicles',
            savings: 25,
            priority: 'medium',
            routeId: route.id,
            status: 'pending'
          })
        }

        // Fuel efficiency
        if (Math.random() > 0.7) {
          newSuggestions.push({
            id: `fuel-${route.id}`,
            type: 'fuel',
            title: 'Fuel Efficiency Opportunity',
            description: `Alternative route available for ${route.name}`,
            impact: 'Reduce fuel consumption by 12%',
            savings: 12,
            priority: 'medium',
            routeId: route.id,
            status: 'pending'
          })
        }

        // Time optimization
        if (Math.random() > 0.8) {
          newSuggestions.push({
            id: `time-${route.id}`,
            type: 'time',
            title: 'Schedule Optimization',
            description: `Peak hour timing adjustment for ${route.name}`,
            impact: 'Improve on-time performance',
            savings: 15,
            priority: 'low',
            routeId: route.id,
            status: 'pending'
          })
        }
      }
    })

    return newSuggestions
  }, [vehicles, routes])

  useEffect(() => {
    setOptimizations(suggestions)
  }, [suggestions])

  const getTypeIcon = (type: OptimizationSuggestion['type']) => {
    switch (type) {
      case 'time': return <Clock className="w-5 h-5 text-blue-500" />
      case 'fuel': return <Zap className="w-5 h-5 text-green-500" />
      case 'traffic': return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'demand': return <TrendingUp className="w-5 h-5 text-purple-500" />
    }
  }

  const getPriorityColor = (priority: OptimizationSuggestion['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-blue-200 bg-blue-50'
    }
  }

  const getStatusColor = (status: OptimizationSuggestion['status']) => {
    switch (status) {
      case 'applied': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
    }
  }

  const applyOptimization = (id: string) => {
    setOptimizations(prev => prev.map(opt => 
      opt.id === id ? { ...opt, status: 'applied' } : opt
    ))
  }

  const rejectOptimization = (id: string) => {
    setOptimizations(prev => prev.map(opt => 
      opt.id === id ? { ...opt, status: 'rejected' } : opt
    ))
  }

  const filteredOptimizations = selectedRoute === 'all' 
    ? optimizations 
    : optimizations.filter(opt => opt.routeId === selectedRoute)

  const totalSavings = optimizations
    .filter(opt => opt.status === 'applied')
    .reduce((sum, opt) => sum + opt.savings, 0)

  const pendingCount = optimizations.filter(opt => opt.status === 'pending').length
  const appliedCount = optimizations.filter(opt => opt.status === 'applied').length

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Route className="w-5 h-5 text-blue-600" />
            <span>Route Optimization</span>
            <div className={`w-2 h-2 rounded-full ml-auto ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Optimization Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-1">{pendingCount}</div>
              <div className="text-sm text-blue-800">Pending Optimizations</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-1">{appliedCount}</div>
              <div className="text-sm text-green-800">Applied</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-1">{formatPercentage(totalSavings)}</div>
              <div className="text-sm text-purple-800">Total Savings</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-1">{routes.length}</div>
              <div className="text-sm text-orange-800">Active Routes</div>
            </div>
          </div>

          {/* Route Filter */}
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-sm font-medium text-gray-700">Filter by route:</span>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Routes</option>
              {routes.map(route => (
                <option key={route.id} value={route.id}>{route.name}</option>
              ))}
            </select>
          </div>

          {/* Optimization Suggestions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Suggestions</h3>
            
            {filteredOptimizations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Navigation className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No optimization suggestions available</p>
                <p className="text-sm">Routes are running efficiently</p>
              </div>
            ) : (
              filteredOptimizations.map((optimization) => (
                <div
                  key={optimization.id}
                  className={`border-2 rounded-lg p-4 ${getPriorityColor(optimization.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getTypeIcon(optimization.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{optimization.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            optimization.priority === 'high' ? 'bg-red-100 text-red-800' :
                            optimization.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {optimization.priority} priority
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(optimization.status)}`}>
                            {optimization.status}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 text-sm mb-2">{optimization.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-green-600 font-medium">
                            💡 {optimization.impact}
                          </span>
                          <span className="text-blue-600 font-medium">
                            📈 {formatPercentage(optimization.savings)} improvement
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {optimization.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => applyOptimization(optimization.id)}
                          className="text-xs"
                        >
                          Apply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectOptimization(optimization.id)}
                          className="text-xs"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {optimization.status === 'applied' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Real-time Route Performance */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Route Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routes.slice(0, 6).map((route) => {
                const routeVehicles = vehicles.filter(v => v.route === route.name)
                const avgSpeed = routeVehicles.length > 0 
                  ? routeVehicles.reduce((sum, v) => sum + (v.speed || 0), 0) / routeVehicles.length 
                  : 0
                const avgOccupancy = routeVehicles.length > 0
                  ? routeVehicles.reduce((sum, v) => sum + (v.occupancy || 0), 0) / routeVehicles.length
                  : 0

                return (
                  <div key={route.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{route.name}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vehicles:</span>
                        <span className="font-medium">{routeVehicles.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Speed:</span>
                        <span className="font-medium">{avgSpeed.toFixed(1)} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Occupancy:</span>
                        <span className="font-medium">{formatPercentage(avgOccupancy)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RouteOptimization
