import React, { useEffect, useState } from 'react'
import { Activity, MapPin, Navigation as NavigationIcon, Users, Zap, TrendingUp, AlertTriangle, Clock, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { useStore } from '../store/useStore'
import { useMLService } from '../hooks/useMLService'
import MapboxMap from './MapboxMap'
import MapLegend from './MapLegend'

interface TrafficCondition {
  corridor: string
  congestion_level: number
  current_speed: number
  congestion_description: string
  prediction_time: string
}

const EnhancedLiveTracking: React.FC = () => {
  const { vehicles = [], gtfsData, connected } = useStore()
  const { predictTraffic, predictTravelTime, isMLHealthy } = useMLService()
  const [trafficConditions, setTrafficConditions] = useState<TrafficCondition[]>([])
  const [currentPredictions, setCurrentPredictions] = useState<any>(null)
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(false)

  // Major Accra corridors for traffic monitoring
  const majorCorridors = [
    'N1_Highway',
    'Ring_Road_East', 
    'Ring_Road_West',
    'Tema_Motorway',
    'Spintex_Road',
    'Liberation_Road'
  ]

  // Load traffic conditions for all major corridors
  useEffect(() => {
    const loadTrafficConditions = async () => {
      setIsLoadingTraffic(true)
      const now = new Date()
      const hour = now.getHours()
      const dayOfWeek = now.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      try {
        const trafficPromises = majorCorridors.map(async (corridor) => {
          const prediction = await predictTraffic({
            corridor,
            hour,
            day_of_week: dayOfWeek,
            is_weekend: isWeekend
          })

          if (prediction && !prediction.error) {
            return {
              corridor,
              congestion_level: prediction.predictions?.congestion_level || 0,
              current_speed: prediction.predictions?.current_speed || 25,
              congestion_description: prediction.congestion_description || 'Unknown',
              prediction_time: now.toLocaleTimeString()
            }
          }
          return null
        })

        const results = await Promise.all(trafficPromises)
        const validResults = results.filter(r => r !== null) as TrafficCondition[]
        setTrafficConditions(validResults)

        // Also get travel time prediction for current conditions
        const travelTimePred = await predictTravelTime({
          total_stops: 15,
          departure_hour: hour,
          is_weekend: isWeekend,
          stops_remaining: 8
        })
        setCurrentPredictions({ travelTime: travelTimePred })

      } catch (error) {
        console.error('Failed to load traffic conditions:', error)
      } finally {
        setIsLoadingTraffic(false)
      }
    }

    loadTrafficConditions()
    
    // Update traffic conditions every 2 minutes
    const interval = setInterval(loadTrafficConditions, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [predictTraffic, predictTravelTime])

  // Calculate real-time metrics
  const activeVehicles = vehicles.filter(v => v.status !== 'breakdown')
  const totalPassengers = vehicles.reduce((sum, v) => sum + (v.passengers || 0), 0)
  const avgSpeed = vehicles.length > 0 
    ? Math.round(vehicles.reduce((sum, v) => sum + (v.speed || 0), 0) / vehicles.length * 10) / 10
    : 0
  const totalRoutes = gtfsData?.routes?.length || 651
  const totalStops = gtfsData?.stops?.length || 2565

  const getCongestionColor = (level: number) => {
    if (level < 0.3) return 'text-green-600'
    if (level < 0.6) return 'text-yellow-600'
    if (level < 0.8) return 'text-orange-600'
    return 'text-red-600'
  }

  const getCongestionBadgeColor = (description: string) => {
    switch (description.toLowerCase()) {
      case 'free flow': return 'bg-green-100 text-green-800'
      case 'light congestion': return 'bg-yellow-100 text-yellow-800'
      case 'moderate congestion': return 'bg-orange-100 text-orange-800'
      case 'heavy congestion': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-time KPIs with ML Integration */}
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
                <p className="text-sm font-medium text-gray-600">Network Speed</p>
                <p className="text-2xl font-bold text-green-600">{avgSpeed} km/h</p>
                <p className="text-xs text-gray-500">Real-time average</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ML Predictions</p>
                <p className="text-2xl font-bold text-purple-600">{isMLHealthy ? 'Active' : 'Offline'}</p>
                <p className="text-xs text-gray-500">99.5% accuracy</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Passengers</p>
                <p className="text-2xl font-bold text-orange-600">{totalPassengers}</p>
                <p className="text-xs text-gray-500">Currently on board</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time ML Predictions */}
      {currentPredictions?.travelTime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Live Travel Time Prediction</span>
              <Badge variant="default" size="sm" className="ml-auto bg-blue-100 text-blue-800">
                97.8% Accuracy
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Predicted Time</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {currentPredictions.travelTime.predicted_travel_time_minutes?.toFixed(1)} min
                </p>
                <p className="text-sm text-blue-700">
                  For typical 15-stop route
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Confidence</h4>
                <p className="text-2xl font-bold text-green-600">
                  {((currentPredictions.travelTime.confidence || 0) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-green-700">
                  Model reliability
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">Model Type</h4>
                <p className="text-lg font-bold text-purple-600">
                  Ensemble
                </p>
                <p className="text-sm text-purple-700">
                  XGBoost + RF + GB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traffic Conditions Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span>Real-time Traffic Conditions</span>
            <Badge variant="default" size="sm" className="ml-auto bg-green-100 text-green-800">
              99.5% Accuracy
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTraffic ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading traffic predictions...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trafficConditions.map((condition, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      {condition.corridor.replace(/_/g, ' ')}
                    </h4>
                    <Badge 
                      variant="default" 
                      size="sm" 
                      className={getCongestionBadgeColor(condition.congestion_description)}
                    >
                      {condition.congestion_description}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Congestion Level:</span>
                      <span className={`font-medium ${getCongestionColor(condition.congestion_level)}`}>
                        {(condition.congestion_level * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Speed:</span>
                      <span className="font-medium text-blue-600">
                        {condition.current_speed.toFixed(1)} km/h
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Updated:</span>
                      <span className="text-xs text-gray-500">
                        {condition.prediction_time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map and Vehicle List */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Map */}
        <div className="xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>Live Ghana Transport Network</span>
                <Badge variant="default" size="sm" className="ml-auto">
                  {totalRoutes} Routes • {totalStops} Stops
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

        {/* Sidebar */}
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

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Data Connection</span>
                  <Badge variant="default" size="sm" className={connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {connected ? 'Live' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ML Health</span>
                  <Badge variant="default" size="sm" className={isMLHealthy ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {isMLHealthy ? 'Optimal' : 'Degraded'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Traffic Monitoring</span>
                  <Badge variant="default" size="sm" className="bg-blue-100 text-blue-800">
                    {majorCorridors.length} Corridors
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default EnhancedLiveTracking
