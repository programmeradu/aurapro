'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPinIcon,
  TruckIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { VehicleLocation, GeoPoint, TransportRoute, Vehicle } from '@/types/transport'
import { trackingService } from '@/services/trackingService'
import { VEHICLE_TYPE_COLORS } from '@/types/transport'

interface LiveTrackingMapProps {
  userLocation?: GeoPoint
  selectedRoute?: TransportRoute
  onVehicleSelect?: (vehicle: VehicleLocation) => void
  showUserLocation?: boolean
  height?: string
}

export function LiveTrackingMap({
  userLocation,
  selectedRoute,
  onVehicleSelect,
  showUserLocation = true,
  height = '400px'
}: LiveTrackingMapProps) {
  const mapRef = useRef<any>(null)
  const [vehicles, setVehicles] = useState<VehicleLocation[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12')
  const [viewState, setViewState] = useState({
    longitude: -0.1870, // Accra longitude
    latitude: 5.6037,   // Accra latitude
    zoom: 12
  })

  // Initialize map with user location
  useEffect(() => {
    if (userLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: userLocation.longitude,
        latitude: userLocation.latitude,
        zoom: 14
      }))
    }
  }, [userLocation])

  // Fetch nearby vehicles
  const fetchNearbyVehicles = useCallback(async () => {
    if (!userLocation) return

    try {
      setIsLoading(true)
      const response = await trackingService.getNearbyVehicles({
        location: userLocation,
        radius: 2000, // 2km radius
        routeIds: selectedRoute ? [selectedRoute.id] : undefined
      })

      if (response.success && response.data) {
        setVehicles(response.data.vehicles)
      }
    } catch (error) {
      console.error('Error fetching nearby vehicles:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userLocation, selectedRoute])

  // Initial load and periodic updates
  useEffect(() => {
    fetchNearbyVehicles()
    
    // Update every 30 seconds
    const interval = setInterval(fetchNearbyVehicles, 30000)
    return () => clearInterval(interval)
  }, [fetchNearbyVehicles])

  // Real-time updates via WebSocket
  useEffect(() => {
    trackingService.onVehicleUpdate = (vehicleUpdate: VehicleLocation) => {
      setVehicles(prev => {
        const index = prev.findIndex(v => v.vehicleId === vehicleUpdate.vehicleId)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = vehicleUpdate
          return updated
        } else {
          return [...prev, vehicleUpdate]
        }
      })
    }

    return () => {
      trackingService.onVehicleUpdate = undefined
    }
  }, [])

  const handleVehicleClick = (vehicle: VehicleLocation) => {
    setSelectedVehicle(vehicle)
    onVehicleSelect?.(vehicle)
  }

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'trotro':
        return '🚐'
      case 'metro_mass':
        return '🚌'
      case 'stc':
        return '🚍'
      case 'bus':
        return '🚌'
      case 'taxi':
        return '🚕'
      case 'okada':
        return '🏍️'
      default:
        return '🚐'
    }
  }

  const getVehicleColor = (vehicleType: string) => {
    return VEHICLE_TYPE_COLORS[vehicleType as keyof typeof VEHICLE_TYPE_COLORS] || '#6B7280'
  }

  const getOccupancyColor = (passengerCount: number, capacity: number) => {
    const occupancy = passengerCount / capacity
    if (occupancy < 0.5) return '#10B981' // Green - available
    if (occupancy < 0.8) return '#F59E0B' // Amber - filling up
    return '#EF4444' // Red - full
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
    <div className="relative" style={{ height }}>
      {/* Map */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        attributionControl={false}
      >
        {/* User location marker */}
        {showUserLocation && userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor="center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative"
            >
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
              <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75" />
            </motion.div>
          </Marker>
        )}

        {/* Vehicle markers */}
        {vehicles.filter(vehicle =>
          (vehicle.longitude || vehicle.location?.longitude) &&
          (vehicle.latitude || vehicle.location?.latitude)
        ).map((vehicle) => (
          <Marker
            key={vehicle.id || vehicle.vehicleId}
            longitude={vehicle.longitude || vehicle.location?.longitude}
            latitude={vehicle.latitude || vehicle.location?.latitude}
            anchor="center"
          >
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleVehicleClick(vehicle)}
              className="relative tap-target"
            >
              {/* Vehicle icon */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white"
                style={{ backgroundColor: getVehicleColor((vehicle.vehicleId || vehicle.id || 'trotro').split('-')[0] || 'trotro') }}
              >
                {getVehicleIcon((vehicle.vehicleId || vehicle.id || 'trotro').split('-')[0] || 'trotro')}
              </div>
              
              {/* Occupancy indicator */}
              <div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white"
                style={{ backgroundColor: getOccupancyColor(vehicle.passengerCount, vehicle.capacity) }}
              />
              
              {/* Movement indicator */}
              {vehicle.status === 'moving' && (
                <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-blue-400 animate-ping opacity-75" />
              )}
            </motion.button>
          </Marker>
        ))}

        {/* Route line */}
        {selectedRoute && (
          <Source
            id="route"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: selectedRoute.stops.map(stop => [
                  stop.longitude || stop.location?.longitude,
                  stop.latitude || stop.location?.latitude
                ])
              }
            }}
          >
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#006B3F',
                'line-width': 4,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* Vehicle popup */}
        {selectedVehicle && (
          <Popup
            longitude={selectedVehicle.longitude || selectedVehicle.location?.longitude}
            latitude={selectedVehicle.latitude || selectedVehicle.location?.latitude}
            anchor="bottom"
            onClose={() => setSelectedVehicle(null)}
            closeButton={true}
            closeOnClick={false}
            className="vehicle-popup"
          >
            <div className="p-3 min-w-[200px]">
              <div className="flex items-center space-x-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: getVehicleColor((selectedVehicle.vehicleId || selectedVehicle.id || 'trotro').split('-')[0] || 'trotro') }}
                >
                  {getVehicleIcon((selectedVehicle.vehicleId || selectedVehicle.id || 'trotro').split('-')[0] || 'trotro')}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    {selectedVehicle.vehicleId || selectedVehicle.id || 'Unknown Vehicle'}
                  </h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {(selectedVehicle.vehicleId || selectedVehicle.id || 'trotro').split('-')[0]?.replace('_', ' ') || selectedVehicle.type || 'Tro-tro'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Passengers:</span>
                  <div className="flex items-center space-x-1">
                    <UserGroupIcon className="w-3 h-3" />
                    <span>{selectedVehicle.passengerCount}/{selectedVehicle.capacity}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`capitalize px-2 py-1 rounded text-xs ${
                    selectedVehicle.status === 'moving' ? 'bg-green-100 text-green-800' :
                    selectedVehicle.status === 'stopped' ? 'bg-yellow-100 text-yellow-800' :
                    selectedVehicle.status === 'boarding' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedVehicle.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last seen:</span>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>{formatLastSeen(selectedVehicle.timestamp)}</span>
                  </div>
                </div>

                {selectedVehicle.confidence < 0.8 && (
                  <div className="flex items-center space-x-1 text-amber-600">
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    <span>Estimated location</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-gray-200">
                <button className="w-full bg-aura-primary text-white py-2 px-3 rounded-lg text-xs font-medium">
                  Track This Vehicle
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Map controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <button
          onClick={() => setMapStyle(
            mapStyle === 'mapbox://styles/mapbox/streets-v12' 
              ? 'mapbox://styles/mapbox/satellite-streets-v12'
              : 'mapbox://styles/mapbox/streets-v12'
          )}
          className="bg-white p-2 rounded-lg shadow-lg tap-target"
        >
          <span className="text-xs">
            {mapStyle.includes('satellite') ? '🗺️' : '🛰️'}
          </span>
        </button>

        {userLocation && (
          <button
            onClick={() => {
              setViewState(prev => ({
                ...prev,
                longitude: userLocation.longitude,
                latitude: userLocation.latitude,
                zoom: 15
              }))
            }}
            className="bg-white p-2 rounded-lg shadow-lg tap-target"
          >
            <MapPinIcon className="w-4 h-4 text-blue-500" />
          </button>
        )}
      </div>

      {/* Loading indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg"
          >
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-aura-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">Loading vehicles...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vehicle count */}
      <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <TruckIcon className="w-4 h-4 text-aura-primary" />
          <span className="text-sm font-medium">
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} nearby
          </span>
        </div>
      </div>
    </div>
  )
}
