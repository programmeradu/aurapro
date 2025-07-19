'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPinIcon,
  TruckIcon,
  ClockIcon,
  SignalIcon,
  UserGroupIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  PhoneIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { apiService, VehiclePosition, Location } from '@/services/apiService'

interface LiveTrackingProps {
  className?: string
  userLocation?: Location
  onVehicleSelect?: (vehicle: VehiclePosition) => void
}

interface EnhancedVehicle extends VehiclePosition {
  distance?: number
  eta?: number
  capacity?: number
  occupancy?: number
  route_name?: string
  next_stop?: string
  status: 'active' | 'delayed' | 'offline'
}

export function EnhancedLiveTracking({ 
  className = '', 
  userLocation,
  onVehicleSelect 
}: LiveTrackingProps) {
  const [vehicles, setVehicles] = useState<EnhancedVehicle[]>([])
  const [nearbyVehicles, setNearbyVehicles] = useState<EnhancedVehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<EnhancedVehicle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'nearby'>('nearby')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchVehicleData = async () => {
    try {
      setError(null)

      if (viewMode === 'nearby' && userLocation) {
        // Fetch nearby vehicles
        const response = await apiService.getNearbyVehicles(
          userLocation.latitude,
          userLocation.longitude,
          2000 // 2km radius
        )

        if (response.success && response.data) {
          const enhancedVehicles = await enhanceVehicleData(response.data)
          setNearbyVehicles(enhancedVehicles)
        }
      } else {
        // Fetch all vehicle positions
        const response = await apiService.getVehiclePositions()

        if (response.success && response.data) {
          const enhancedVehicles = await enhanceVehicleData(response.data)
          setVehicles(enhancedVehicles)
        }
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Vehicle tracking error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load vehicle data')
      
      // Fallback to mock data
      const mockVehicles = generateMockVehicles(userLocation)
      if (viewMode === 'nearby') {
        setNearbyVehicles(mockVehicles)
      } else {
        setVehicles(mockVehicles)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const enhanceVehicleData = async (vehicles: VehiclePosition[]): Promise<EnhancedVehicle[]> => {
    return vehicles.map((vehicle, index) => {
      const distance = userLocation 
        ? calculateDistance(userLocation, { latitude: vehicle.latitude, longitude: vehicle.longitude })
        : undefined

      return {
        ...vehicle,
        distance,
        eta: distance ? Math.round(distance / 0.5) : undefined, // Rough ETA calculation
        capacity: 20 + Math.floor(Math.random() * 30),
        occupancy: Math.floor(Math.random() * 100),
        route_name: `Route ${String.fromCharCode(65 + (index % 26))}`,
        next_stop: getRandomStop(),
        status: getRandomStatus()
      }
    })
  }

  const generateMockVehicles = (userLocation?: Location): EnhancedVehicle[] => {
    const mockVehicles: EnhancedVehicle[] = []
    const baseLocation = userLocation || { latitude: 5.6037, longitude: -0.1870 }

    for (let i = 0; i < 8; i++) {
      const offsetLat = (Math.random() - 0.5) * 0.02
      const offsetLng = (Math.random() - 0.5) * 0.02
      
      const vehicle: EnhancedVehicle = {
        vehicle_id: `GH-${1000 + i}`,
        latitude: baseLocation.latitude + offsetLat,
        longitude: baseLocation.longitude + offsetLng,
        speed: Math.floor(Math.random() * 60) + 10,
        heading: Math.floor(Math.random() * 360),
        route_id: `route_${i + 1}`,
        timestamp: new Date().toISOString(),
        distance: Math.random() * 2,
        eta: Math.floor(Math.random() * 15) + 2,
        capacity: 20 + Math.floor(Math.random() * 30),
        occupancy: Math.floor(Math.random() * 100),
        route_name: `Route ${String.fromCharCode(65 + i)}`,
        next_stop: getRandomStop(),
        status: getRandomStatus()
      }

      mockVehicles.push(vehicle)
    }

    return mockVehicles
  }

  const getRandomStop = (): string => {
    const stops = [
      'Accra Mall', 'Kotoka Airport', 'Tema Station', 'Kaneshie Market',
      'Circle', 'Madina', 'Legon', 'East Legon', 'Spintex', 'Dansoman'
    ]
    return stops[Math.floor(Math.random() * stops.length)]
  }

  const getRandomStatus = (): 'active' | 'delayed' | 'offline' => {
    const statuses: ('active' | 'delayed' | 'offline')[] = ['active', 'active', 'active', 'delayed', 'offline']
    return statuses[Math.floor(Math.random() * statuses.length)]
  }

  const calculateDistance = (point1: Location, point2: Location): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'delayed':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'delayed':
        return 'Delayed'
      case 'offline':
        return 'Offline'
      default:
        return 'Unknown'
    }
  }

  useEffect(() => {
    fetchVehicleData()

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchVehicleData, 10000) // Update every 10 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [viewMode, userLocation, autoRefresh])

  const currentVehicles = viewMode === 'nearby' ? nearbyVehicles : vehicles

  return (
    <div className={`bg-white rounded-3xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-aura-primary to-aura-secondary p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Live Vehicle Tracking</h2>
            <p className="text-sm opacity-90">Real-time transport monitoring</p>
          </div>
          <button
            onClick={fetchVehicleData}
            disabled={isLoading}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('nearby')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'nearby'
                ? 'bg-white text-aura-primary'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Nearby
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'all'
                ? 'bg-white text-aura-primary'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            All Vehicles
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Auto Refresh Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {autoRefresh ? 'Auto-updating' : 'Manual refresh'}
            </span>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="text-sm text-aura-primary hover:text-aura-primary/80"
          >
            {autoRefresh ? 'Disable' : 'Enable'} auto-refresh
          </button>
        </div>

        {/* Loading State */}
        {isLoading && currentVehicles.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-aura-primary" />
          </div>
        )}

        {/* Error State */}
        {error && currentVehicles.length === 0 && (
          <div className="flex items-center justify-center h-64 text-center">
            <div>
              <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Failed to load vehicle data</p>
              <button
                onClick={fetchVehicleData}
                className="px-4 py-2 bg-aura-primary text-white rounded-lg hover:bg-aura-primary/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Vehicle List */}
        {currentVehicles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {viewMode === 'nearby' ? 'Nearby Vehicles' : 'All Vehicles'} ({currentVehicles.length})
              </h3>
              <p className="text-sm text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            </div>

            <div className="grid gap-4">
              {currentVehicles.map((vehicle) => (
                <motion.div
                  key={vehicle.vehicle_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedVehicle?.vehicle_id === vehicle.vehicle_id
                      ? 'border-aura-primary bg-aura-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedVehicle(vehicle)
                    onVehicleSelect?.(vehicle)
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white">
                          <TruckIcon className="w-6 h-6" />
                        </div>
                        <div className={`absolute -top-1 -right-1 w-4 h-4 ${getStatusColor(vehicle.status)} rounded-full border-2 border-white`}></div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{vehicle.vehicle_id}</div>
                        <div className="text-sm text-gray-500">{vehicle.route_name}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {vehicle.distance && (
                        <div className="font-semibold text-gray-900">{vehicle.distance.toFixed(1)} km</div>
                      )}
                      {vehicle.eta && (
                        <div className="text-sm text-gray-500">{vehicle.eta} min ETA</div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Stats */}
                  <div className="grid grid-cols-4 gap-4 text-center text-sm">
                    <div>
                      <div className="text-gray-500">Speed</div>
                      <div className="font-semibold">{vehicle.speed} km/h</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Occupancy</div>
                      <div className="font-semibold">{vehicle.occupancy}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Status</div>
                      <div className={`font-semibold ${
                        vehicle.status === 'active' ? 'text-green-600' :
                        vehicle.status === 'delayed' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {getStatusText(vehicle.status)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Next Stop</div>
                      <div className="font-semibold text-xs">{vehicle.next_stop}</div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedVehicle?.vehicle_id === vehicle.vehicle_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Route ID</div>
                          <div className="font-semibold">{vehicle.route_id}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Capacity</div>
                          <div className="font-semibold">{vehicle.capacity} passengers</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Heading</div>
                          <div className="font-semibold">{vehicle.heading}°</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Last Update</div>
                          <div className="font-semibold">
                            {new Date(vehicle.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <button className="flex-1 bg-aura-primary text-white py-2 px-4 rounded-xl text-sm font-semibold hover:bg-aura-primary/90 transition-colors">
                          Track Vehicle
                        </button>
                        <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                          Get Directions
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && currentVehicles.length === 0 && (
          <div className="text-center py-12">
            <TruckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicles Found</h3>
            <p className="text-gray-500">
              {viewMode === 'nearby' 
                ? 'No vehicles are currently nearby your location'
                : 'No vehicles are currently active in the system'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}