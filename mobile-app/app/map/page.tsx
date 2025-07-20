'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapIcon,
  TruckIcon,
  MapPinIcon,
  CpuChipIcon,
  ChartBarIcon,
  BoltIcon,
  SignalIcon,
  LayersIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import { EnhancedHeader } from '@/components/navigation/EnhancedHeader'
import { EnhancedFooter } from '@/components/navigation/EnhancedFooter'
import { AdvancedMLMapView } from '@/components/map/AdvancedMLMapView'
import { UberLevelJourneyPlanner } from '@/components/journey/UberLevelJourneyPlanner'
import { apiService, VehiclePosition, Location, GTFSStop } from '@/services/apiService'
import { enhancedWebSocketService } from '@/services/enhancedWebSocketService'

interface MapPageProps {}

interface MapFilter {
  vehicles: boolean
  stops: boolean
  routes: boolean
  traffic: boolean
  incidents: boolean
}

interface TrafficAlert {
  id: string
  type: 'accident' | 'construction' | 'congestion' | 'closure'
  location: string
  description: string
  severity: 'low' | 'medium' | 'high'
  coordinates: Location
  timestamp: Date
  estimated_duration: number
}

export default function MapPage({}: MapPageProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [mapCenter, setMapCenter] = useState<Location>({ latitude: 5.6037, longitude: -0.1870 })
  const [mapZoom, setMapZoom] = useState(12)
  const [showJourneyPlanner, setShowJourneyPlanner] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [trafficAlerts, setTrafficAlerts] = useState<TrafficAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [filters, setFilters] = useState<MapFilter>({
    vehicles: true,
    stops: true,
    routes: false,
    traffic: true,
    incidents: true
  })

  useEffect(() => {
    fetchMapData()
    
    // Auto-refresh map data every 30 seconds
    const interval = setInterval(fetchMapData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchMapData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch traffic alerts
      const alertsResponse = await apiService.getTrafficAlerts()
      if (alertsResponse.success && alertsResponse.data) {
        const alerts: TrafficAlert[] = alertsResponse.data.map((alert: any) => ({
          id: alert.id,
          type: alert.type || 'congestion',
          location: alert.location_name || 'Unknown Location',
          description: alert.description,
          severity: alert.severity || 'medium',
          coordinates: {
            latitude: alert.latitude,
            longitude: alert.longitude
          },
          timestamp: new Date(alert.timestamp),
          estimated_duration: alert.estimated_duration || 30
        }))
        setTrafficAlerts(alerts)
      }

      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setMapCenter({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          },
          (error) => {
            console.error('Geolocation error:', error)
          }
        )
      }

    } catch (error) {
      console.error('Failed to fetch map data:', error)
      
      // Fallback to mock traffic alerts
      setTrafficAlerts([
        {
          id: '1',
          type: 'accident',
          location: 'Spintex Road',
          description: 'Minor accident causing delays',
          severity: 'medium',
          coordinates: { latitude: 5.6037, longitude: -0.1870 },
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          estimated_duration: 45
        },
        {
          id: '2',
          type: 'construction',
          location: 'N1 Highway',
          description: 'Road maintenance in progress',
          severity: 'low',
          coordinates: { latitude: 5.6200, longitude: -0.1600 },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          estimated_duration: 120
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleVehicleSelect = (vehicle: VehiclePosition) => {
    setSelectedVehicle(vehicle)
    setMapCenter({ latitude: vehicle.latitude, longitude: vehicle.longitude })
    setMapZoom(15)
  }

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location)
    setMapCenter(location)
  }

  const toggleFilter = (filterKey: keyof MapFilter) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }))
  }

  const searchLocation = async (query: string) => {
    if (query.length < 2) return

    try {
      const response = await apiService.searchPlaces(query)
      if (response.success && response.data && response.data.length > 0) {
        const place = response.data[0]
        const location: Location = {
          latitude: place.lat || place.latitude,
          longitude: place.lon || place.longitude
        }
        setMapCenter(location)
        setMapZoom(15)
      }
    } catch (error) {
      console.error('Location search error:', error)
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'accident':
        return <ExclamationTriangleIcon className="w-5 h-5" />
      case 'construction':
        return <TruckIcon className="w-5 h-5" />
      case 'congestion':
        return <ClockIcon className="w-5 h-5" />
      case 'closure':
        return <ExclamationTriangleIcon className="w-5 h-5" />
      default:
        return <InformationCircleIcon className="w-5 h-5" />
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-700'
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-700'
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-700'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedHeader />
      
      <main className="relative">
        {/* Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center p-4">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search locations, routes, or stops..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchLocation(e.target.value)
                }}
                className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`ml-3 p-2 rounded-full transition-colors ${
                  showFilters ? 'bg-aura-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 p-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(filters).map(([key, value]) => (
                      <label key={key} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => toggleFilter(key as keyof MapFilter)}
                          className="rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {key.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Map Container */}
        <div className="h-screen">
          <AppleLevelMapView
            center={mapCenter}
            zoom={mapZoom}
            showVehicles={filters.vehicles}
            showStops={filters.stops}
            showRoutes={filters.routes}
            onLocationSelect={handleLocationSelect}
            onVehicleSelect={handleVehicleSelect}
            className="w-full h-full"
          />
        </div>

        {/* Traffic Alerts Panel */}
        {trafficAlerts.length > 0 && filters.incidents && (
          <div className="absolute bottom-32 left-4 right-4 z-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 max-h-48 overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                  <span>Traffic Alerts</span>
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {trafficAlerts.length}
                  </span>
                </h3>
              </div>
              <div className="space-y-2 p-4">
                {trafficAlerts.slice(0, 3).map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setMapCenter(alert.coordinates)}
                    className={`p-3 rounded-xl border cursor-pointer hover:shadow-md transition-shadow ${getAlertColor(alert.severity)}`}
                  >
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{alert.location}</div>
                        <div className="text-xs opacity-80 mt-1">{alert.description}</div>
                        <div className="text-xs opacity-60 mt-1">
                          {Math.round((Date.now() - alert.timestamp.getTime()) / 60000)}m ago • 
                          ~{alert.estimated_duration}m duration
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Vehicle Details Panel */}
        <AnimatePresence>
          {selectedVehicle && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="absolute top-20 right-4 w-80 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 z-20"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Vehicle Details</h3>
                  <button
                    onClick={() => setSelectedVehicle(null)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {selectedVehicle.vehicle_id}
                  </div>
                  <div className="text-sm text-gray-500">
                    Route: {selectedVehicle.route_id || 'Unknown'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Speed</div>
                    <div className="font-semibold">{selectedVehicle.speed || 0} km/h</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <div className={`font-semibold ${
                      (selectedVehicle.speed || 0) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(selectedVehicle.speed || 0) > 0 ? 'Moving' : 'Stopped'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-2">Location</div>
                  <div className="text-sm">
                    {selectedVehicle.latitude.toFixed(4)}, {selectedVehicle.longitude.toFixed(4)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowJourneyPlanner(true)
                    setSelectedVehicle(null)
                  }}
                  className="w-full bg-aura-primary text-white py-3 rounded-xl font-semibold hover:bg-aura-primary/90 transition-colors"
                >
                  Plan Journey to This Vehicle
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Journey Planner FAB */}
        <button
          onClick={() => setShowJourneyPlanner(true)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-aura-primary text-white rounded-full shadow-lg hover:bg-aura-primary/90 transition-colors z-30 flex items-center justify-center"
        >
          <CompassIcon className="w-6 h-6" />
        </button>

        {/* Journey Planner Modal */}
        <AnimatePresence>
          {showJourneyPlanner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 flex items-end"
              onClick={() => setShowJourneyPlanner(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-h-[80vh] overflow-y-auto"
              >
                <UberLevelJourneyPlanner
                  onJourneySelect={(journey) => {
                    console.log('Selected journey:', journey)
                    setShowJourneyPlanner(false)
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <EnhancedFooter />
    </div>
  )
}

// Import missing XMarkIcon
import { XMarkIcon } from '@heroicons/react/24/outline'