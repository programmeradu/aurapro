'use client'

import { useStore } from '@/store/useStore'
import { formatGhanaTime } from '@/lib/utils'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Truck, 
  Users, 
  Zap,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'

interface RealTimeCommandCenterProps {
  className?: string
}

const RealTimeCommandCenter: React.FC<RealTimeCommandCenterProps> = ({ className = '' }) => {
  const { vehicles, routes, kpis, connected } = useStore()
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [systemHealth, setSystemHealth] = useState({
    overall: 98.5,
    network: 99.2,
    database: 97.8,
    api: 98.9,
    sensors: 96.4
  })

  // Generate enhanced vehicle data
  const enhancedVehicles = vehicles.map(vehicle => ({
    ...vehicle,
    fuelLevel: Math.floor(Math.random() * 100),
    engineTemp: Math.floor(Math.random() * 40) + 80,
    lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    nextMaintenance: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    driverName: `Driver ${Math.floor(Math.random() * 100) + 1}`,
    revenue: Math.floor(Math.random() * 500) + 100,
    trips: Math.floor(Math.random() * 20) + 5
  }))

  // Generate route performance metrics
  const routeMetrics = routes.map(route => ({
    ...route,
    onTimePerformance: Math.floor(Math.random() * 20) + 80,
    avgSpeed: Math.floor(Math.random() * 20) + 30,
    passengerLoad: Math.floor(Math.random() * 100),
    revenue: Math.floor(Math.random() * 2000) + 500,
    incidents: Math.floor(Math.random() * 3),
    efficiency: Math.floor(Math.random() * 30) + 70
  }))

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'maintenance': return 'text-yellow-600 bg-yellow-100'
      case 'offline': return 'text-red-600 bg-red-100'
      case 'idle': return 'text-gray-600 bg-gray-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  const getTrendIcon = (value: number, threshold: number = 0) => {
    if (value > threshold) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (value < threshold) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-600" />
  }

  const getHealthColor = (health: number) => {
    if (health >= 95) return 'text-green-600'
    if (health >= 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>System Health Monitor</span>
            <div className={`w-2 h-2 rounded-full ml-auto ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className={`text-2xl font-bold ${getHealthColor(systemHealth.overall)}`}>
                {systemHealth.overall}%
              </div>
              <div className="text-sm text-blue-800">Overall Health</div>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className={`text-2xl font-bold ${getHealthColor(systemHealth.network)}`}>
                {systemHealth.network}%
              </div>
              <div className="text-sm text-green-800">Network</div>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className={`text-2xl font-bold ${getHealthColor(systemHealth.database)}`}>
                {systemHealth.database}%
              </div>
              <div className="text-sm text-purple-800">Database</div>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className={`text-2xl font-bold ${getHealthColor(systemHealth.api)}`}>
                {systemHealth.api}%
              </div>
              <div className="text-sm text-orange-800">API Services</div>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
              <div className={`text-2xl font-bold ${getHealthColor(systemHealth.sensors)}`}>
                {systemHealth.sensors}%
              </div>
              <div className="text-sm text-red-800">Sensors</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Live Vehicle Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-green-600" />
              <span>Live Vehicle Tracking</span>
              <Badge variant="default" size="sm" className="ml-auto">
                {enhancedVehicles.length} Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {enhancedVehicles.map((vehicle, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedVehicle === vehicle.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedVehicle(selectedVehicle === vehicle.id ? null : vehicle.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-sm">{vehicle.id}</span>
                      <Badge size="sm" className={getStatusColor(vehicle.status)}>
                        {vehicle.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {vehicle.speed} km/h
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Route:</span> {vehicle.route}
                    </div>
                    <div>
                      <span className="text-gray-600">Passengers:</span> {vehicle.passengers}
                    </div>
                    <div>
                      <span className="text-gray-600">Fuel:</span> {vehicle.fuelLevel}%
                    </div>
                    <div>
                      <span className="text-gray-600">Revenue:</span> GHS {vehicle.revenue}
                    </div>
                  </div>
                  
                  {selectedVehicle === vehicle.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Driver:</span> {vehicle.driverName}
                        </div>
                        <div>
                          <span className="text-gray-600">Trips Today:</span> {vehicle.trips}
                        </div>
                        <div>
                          <span className="text-gray-600">Engine Temp:</span> {vehicle.engineTemp}°C
                        </div>
                        <div>
                          <span className="text-gray-600">Last Maintenance:</span> {vehicle.lastMaintenance.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Route Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <span>Route Performance</span>
              <Badge variant="outline" size="sm" className="ml-auto">
                {routeMetrics.length} Routes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {routeMetrics.map((route, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-sm">{route.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(route.efficiency - 85)}
                      <span className="text-xs text-gray-600">{route.efficiency}%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">On-Time:</span> {route.onTimePerformance}%
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Speed:</span> {route.avgSpeed} km/h
                    </div>
                    <div>
                      <span className="text-gray-600">Load:</span> {route.passengerLoad}%
                    </div>
                    <div>
                      <span className="text-gray-600">Revenue:</span> GHS {route.revenue}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">Incidents:</span> 
                      <span className={route.incidents > 0 ? 'text-red-600' : 'text-green-600'}>
                        {route.incidents}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Vehicles:</span> {route.vehicles?.length || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Passenger Flow Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span>Passenger Flow Analytics</span>
            <Badge variant="default" size="sm" className="ml-auto">
              Real-time
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {vehicles.reduce((sum, v) => sum + v.passengers, 0)}
              </div>
              <div className="text-sm text-blue-800">Current Passengers</div>
              <div className="text-xs text-blue-600 mt-1">
                {getTrendIcon(5)} +12% vs yesterday
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {enhancedVehicles.reduce((sum, v) => sum + v.trips, 0)}
              </div>
              <div className="text-sm text-green-800">Total Trips Today</div>
              <div className="text-xs text-green-600 mt-1">
                {getTrendIcon(8)} +8% vs yesterday
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                GHS {enhancedVehicles.reduce((sum, v) => sum + v.revenue, 0)}
              </div>
              <div className="text-sm text-purple-800">Revenue Today</div>
              <div className="text-xs text-purple-600 mt-1">
                {getTrendIcon(15)} +15% vs yesterday
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {Math.floor(routeMetrics.reduce((sum, r) => sum + r.onTimePerformance, 0) / routeMetrics.length)}%
              </div>
              <div className="text-sm text-orange-800">Avg On-Time</div>
              <div className="text-xs text-orange-600 mt-1">
                {getTrendIcon(3)} +3% vs yesterday
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RealTimeCommandCenter
