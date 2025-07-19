'use client'

import { JourneyTracker } from '@/components/tracking/JourneyTracker'
import { LiveTrackingMap } from '@/components/tracking/LiveTrackingMap'
import { trackingService } from '@/services/trackingService'
import { GeoPoint, TransportRoute, VehicleLocation } from '@/types/transport'
import {
    ClockIcon,
    FunnelIcon,
    ListBulletIcon,
    MagnifyingGlassIcon,
    MapIcon,
    TruckIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function TrackPage() {
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [nearbyVehicles, setNearbyVehicles] = useState<VehicleLocation[]>([])
  const [routes, setRoutes] = useState<TransportRoute[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: GeoPoint = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          }
          setUserLocation(location)
        },
        (error) => {
          console.error('Error getting location:', error)
          toast.error('Unable to get your location')
          // Default to Accra
          setUserLocation({
            latitude: 5.6037,
            longitude: -0.1870,
            timestamp: new Date()
          })
        }
      )
    }
  }, [])

  // Fetch nearby vehicles and routes
  useEffect(() => {
    const fetchData = async () => {
      if (!userLocation) return

      try {
        setIsLoading(true)
        
        // Fetch nearby vehicles
        const vehiclesResponse = await trackingService.getNearbyVehicles({
          location: userLocation,
          radius: 3000 // 3km radius
        })

        if (vehiclesResponse.success && vehiclesResponse.data) {
          setNearbyVehicles(vehiclesResponse.data.vehicles)
          setRoutes(vehiclesResponse.data.routes)
        }
      } catch (error) {
        console.error('Error fetching tracking data:', error)
        toast.error('Failed to load vehicle data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userLocation])

  const handleVehicleSelect = (vehicle: VehicleLocation) => {
    setSelectedVehicle(vehicle)
    // Find the route for this vehicle
    const route = routes.find(r => r.id === vehicle.vehicleId.split('-')[1])
    if (route) {
      setSelectedRoute(route)
    }
  }

  const filteredVehicles = nearbyVehicles.filter(vehicle => {
    if (!searchQuery) return true
    return vehicle.vehicleId.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'trotro': return '🚐'
      case 'metro_mass': return '🚌'
      case 'stc': return '🚍'
      case 'bus': return '🚌'
      case 'taxi': return '🚕'
      case 'okada': return '🏍️'
      default: return '🚐'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving': return 'text-green-600 bg-green-100'
      case 'stopped': return 'text-yellow-600 bg-yellow-100'
      case 'boarding': return 'text-blue-600 bg-blue-100'
      case 'breakdown': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatLastSeen = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="min-h-screen-safe bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-mobile border-b border-ui-border safe-area-top"
      >
        <div className="px-mobile py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-responsive-xl font-bold font-display text-aura-primary truncate">
                Live Tracking
              </h1>
              <p className="text-responsive-sm text-ui-text-secondary truncate">
                Real-time vehicle locations
              </p>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="tap-target p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 active:scale-95"
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles or routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-mobile pl-10"
            />
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-aura-primary shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Map</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-aura-primary shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <ListBulletIcon className="w-4 h-4" />
              <span className="text-sm font-medium">List</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-aura-primary">
              {filteredVehicles.length}
            </div>
            <div className="text-xs text-gray-600">Vehicles</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredVehicles.filter(v => v.status === 'moving').length}
            </div>
            <div className="text-xs text-gray-600">Moving</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {routes.length}
            </div>
            <div className="text-xs text-gray-600">Routes</div>
          </div>
        </motion.div>

        {/* Map or List View */}
        {viewMode === 'map' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl overflow-hidden shadow-mobile"
          >
            <LiveTrackingMap
              userLocation={userLocation || undefined}
              selectedRoute={selectedRoute || undefined}
              onVehicleSelect={handleVehicleSelect}
              height="400px"
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-aura-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading vehicles...</p>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="text-center py-8">
                <TruckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No vehicles found nearby</p>
              </div>
            ) : (
              filteredVehicles.map((vehicle, index) => (
                <motion.div
                  key={vehicle.vehicleId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 shadow-mobile border border-ui-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {getVehicleIcon(vehicle.vehicleId.split('-')[0] || 'trotro')}
                      </div>
                      <div>
                        <h3 className="font-semibold text-ui-text-primary">
                          {vehicle.vehicleId}
                        </h3>
                        <p className="text-sm text-ui-text-secondary capitalize">
                          {vehicle.vehicleId.split('-')[0]?.replace('_', ' ') || 'Tro-tro'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status.replace('_', ' ')}
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <ClockIcon className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatLastSeen(vehicle.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-600">
                        Passengers: {vehicle.passengerCount}/{vehicle.capacity}
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-aura-primary h-2 rounded-full"
                          style={{
                            width: `${(vehicle.passengerCount / vehicle.capacity) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleVehicleSelect(vehicle)}
                      className="text-aura-primary font-medium"
                    >
                      Track
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Journey Tracker */}
        {selectedVehicle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <JourneyTracker
              vehicle={{
                id: selectedVehicle.vehicleId,
                licensePlate: selectedVehicle.vehicleId,
                type: (selectedVehicle.vehicleId.split('-')[0] as any) || 'trotro',
                capacity: selectedVehicle.capacity,
                operator: { name: 'Unknown' },
                features: [],
                condition: 'good',
                isActive: true,
                lastSeen: selectedVehicle.timestamp
              }}
              route={selectedRoute}
              onJourneyStart={(journey) => {
                toast.success('Journey tracking started!')
              }}
              onJourneyEnd={() => {
                toast.success('Journey completed!')
                setSelectedVehicle(null)
                setSelectedRoute(null)
              }}
            />
          </motion.div>
        )}
      </main>
    </div>
  )
}
