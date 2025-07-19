import { Activity, MapPin, Navigation as NavigationIcon, Users, Zap } from 'lucide-react'
import React from 'react'
import EnhancedLiveTracking from '../components/EnhancedLiveTracking'
import MapboxMap from '../components/MapboxMap'
import MapLegend from '../components/MapLegend'
import Navigation from '../components/Navigation'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { useStore } from '../store/useStore'

const LiveTracking: React.FC = () => {
  const { vehicles = [], gtfsData, connected } = useStore()

  // Calculate real-time metrics
  const activeVehicles = vehicles.filter(v => v.status !== 'breakdown')
  const totalPassengers = vehicles.reduce((sum, v) => sum + (v.passengers || 0), 0)
  const avgSpeed = vehicles.length > 0
    ? Math.round(vehicles.reduce((sum, v) => sum + (v.speed || 0), 0) / vehicles.length * 10) / 10
    : 0
  const totalRoutes = gtfsData?.routes?.length || 0
  const totalStops = gtfsData?.stops?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      <Navigation />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/50 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  <span>Live Vehicle Tracking</span>
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Real-time monitoring of {totalRoutes} routes and {totalStops} stops across Ghana
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="default" size="sm" className={connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {connected ? 'Live Data' : 'Offline'}
                </Badge>
                <Badge variant="default" size="sm" className="bg-blue-100 text-blue-800">
                  {activeVehicles.length} Active Vehicles
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <EnhancedLiveTracking />

          {/* Real-time KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                    <p className="text-2xl font-bold text-blue-600">{activeVehicles.length}</p>
                    <p className="text-xs text-gray-500">of {vehicles.length} total</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Passengers</p>
                    <p className="text-2xl font-bold text-green-600">{totalPassengers}</p>
                    <p className="text-xs text-gray-500">Currently on board</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Speed</p>
                    <p className="text-2xl font-bold text-purple-600">{avgSpeed} km/h</p>
                    <p className="text-xs text-gray-500">Network average</p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Network Coverage</p>
                    <p className="text-2xl font-bold text-orange-600">{totalRoutes}</p>
                    <p className="text-xs text-gray-500">Active routes</p>
                  </div>
                  <NavigationIcon className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map and Vehicle List */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Map */}
            <div className="xl:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span>Live Map View</span>
                    <Badge variant="default" size="sm" className="ml-auto">
                      Real-time Updates
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative">
                    <MapboxMap />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar with Legend and Vehicle List */}
            <div className="xl:col-span-1 space-y-6">
              {/* Map Legend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Map Legend</CardTitle>
                </CardHeader>
                <CardContent>
                  <MapLegend />
                </CardContent>
              </Card>

              {/* Active Vehicles List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Active Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {vehicles.slice(0, 8).map((vehicle) => (
                      <div key={vehicle.id} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{vehicle.id}</span>
                          <Badge
                            variant="default"
                            size="sm"
                            className={
                              vehicle.status === 'on_time' ? "bg-green-100 text-green-800" :
                              vehicle.status === 'delayed' ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }
                          >
                            {vehicle.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Route:</span>
                            <span className="font-medium">{vehicle.route_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Speed:</span>
                            <span className="font-medium">{Math.round(vehicle.speed || 0)} km/h</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Passengers:</span>
                            <span className="font-medium">{vehicle.passengers || 0}/{vehicle.capacity || 60}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="font-medium">{vehicle.vehicle_type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default LiveTracking
