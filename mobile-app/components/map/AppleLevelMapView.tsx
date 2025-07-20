'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPinIcon,
  TruckIcon,
  UserIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon,
  SignalIcon,
  WifiIcon,
  PlayIcon,
  PauseIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline'
import { MapPinIcon as MapPinIconSolid, TruckIcon as TruckIconSolid } from '@heroicons/react/24/solid'
import { apiService, realTimeDataService, unifiedDataService, Location, VehiclePosition, GTFSStop, LiveEvent } from '@/services'

interface MapViewProps {
  className?: string
  center?: Location
  zoom?: number
  onLocationSelect?: (location: Location) => void
  onVehicleSelect?: (vehicle: VehiclePosition) => void
  showJourneyPlanner?: boolean
}

interface MapLayer {
  id: string
  name: string
  visible: boolean
  icon: any
  color: string
}

interface VehicleMarker extends VehiclePosition {
  isSelected: boolean
  isAnimating: boolean
  lastUpdate: Date
}

interface StopMarker extends GTFSStop {
  isActive: boolean
  nextArrivals: any[]
  passengerCount: number
}

export function AppleLevelMapView({
  className = '',
  center = { latitude: 5.6037, longitude: -0.1870 }, // Accra center
  zoom = 12,
  onLocationSelect,
  onVehicleSelect,
  showJourneyPlanner = false
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapCenter, setMapCenter] = useState<Location>(center)
  const [mapZoom, setMapZoom] = useState(zoom)
  const [vehicles, setVehicles] = useState<VehicleMarker[]>([])
  const [stops, setStops] = useState<StopMarker[]>([])
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleMarker | null>(null)
  const [selectedStop, setSelectedStop] = useState<StopMarker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRealTimeActive, setIsRealTimeActive] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLayers, setShowLayers] = useState(false)
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [isFollowingUser, setIsFollowingUser] = useState(false)

  const [layers, setLayers] = useState<MapLayer[]>([
    { id: 'vehicles', name: 'Live Vehicles', visible: true, icon: TruckIcon, color: '#3B82F6' },
    { id: 'stops', name: 'Bus Stops', visible: true, icon: MapPinIcon, color: '#10B981' },
    { id: 'routes', name: 'Routes', visible: true, icon: ArrowsPointingOutIcon, color: '#8B5CF6' },
    { id: 'traffic', name: 'Traffic', visible: false, icon: ExclamationTriangleIcon, color: '#F59E0B' },
    { id: 'events', name: 'Live Events', visible: true, icon: BoltIcon, color: '#EF4444' }
  ])

  useEffect(() => {
    initializeMap()
    getUserLocation()
    
    // Set up real-time updates
    const updateInterval = setInterval(() => {
      if (isRealTimeActive) {
        updateMapData()
      }
    }, 10000) // Update every 10 seconds

    return () => clearInterval(updateInterval)
  }, [])

  useEffect(() => {
    if (isFollowingUser && userLocation) {
      setMapCenter(userLocation)
    }
  }, [userLocation, isFollowingUser])

  const initializeMap = async () => {
    setIsLoading(true)
    try {
      await updateMapData()
    } catch (error) {
      console.error('Failed to initialize map:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateMapData = async () => {
    try {
      const mapData = await unifiedDataService.getMapScreenData(mapCenter)
      
      // Update vehicles with animation states
      const vehicleMarkers: VehicleMarker[] = mapData.vehicles.map(vehicle => ({
        ...vehicle,
        isSelected: selectedVehicle?.vehicle_id === vehicle.vehicle_id,
        isAnimating: true,
        lastUpdate: new Date()
      }))
      
      // Update stops with real-time data
      const stopMarkers: StopMarker[] = mapData.stops.map(stop => ({
        ...stop,
        isActive: Math.random() > 0.3, // Mock active status
        nextArrivals: [], // Would be populated from real API
        passengerCount: Math.floor(Math.random() * 20)
      }))

      setVehicles(vehicleMarkers)
      setStops(stopMarkers)
      setEvents(mapData.events)

      // Animate vehicles to new positions
      setTimeout(() => {
        setVehicles(prev => prev.map(v => ({ ...v, isAnimating: false })))
      }, 1000)

    } catch (error) {
      console.error('Failed to update map data:', error)
    }
  }

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          setUserLocation(location)
        },
        (error) => {
          console.error('Failed to get user location:', error)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    }
  }

  const handleVehicleClick = (vehicle: VehicleMarker) => {
    setSelectedVehicle(vehicle)
    setSelectedStop(null)
    onVehicleSelect?.(vehicle)
  }

  const handleStopClick = (stop: StopMarker) => {
    setSelectedStop(stop)
    setSelectedVehicle(null)
  }

  const handleMapClick = (event: React.MouseEvent) => {
    // Convert click coordinates to lat/lng (mock implementation)
    const rect = mapRef.current?.getBoundingClientRect()
    if (rect) {
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      // Mock coordinate conversion
      const lat = mapCenter.latitude + (y - rect.height / 2) * 0.0001
      const lng = mapCenter.longitude + (x - rect.width / 2) * 0.0001
      
      const location: Location = { latitude: lat, longitude: lng }
      onLocationSelect?.(location)
    }
  }

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ))
  }

  const zoomIn = () => setMapZoom(prev => Math.min(prev + 1, 18))
  const zoomOut = () => setMapZoom(prev => Math.max(prev - 1, 8))

  const centerOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation)
      setIsFollowingUser(true)
    } else {
      getUserLocation()
    }
  }

  const getVehicleIcon = (vehicle: VehicleMarker) => {
    const baseClasses = "w-6 h-6 transition-all duration-300"
    const colorClasses = vehicle.isSelected 
      ? "text-white" 
      : vehicle.status === 'active' 
        ? "text-green-600" 
        : "text-gray-600"
    
    return (
      <motion.div
        animate={vehicle.isAnimating ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5 }}
        className={`${baseClasses} ${colorClasses}`}
      >
        <TruckIconSolid />
      </motion.div>
    )
  }

  const getStopIcon = (stop: StopMarker) => {
    const baseClasses = "w-4 h-4"
    const colorClasses = stop.isActive ? "text-blue-600" : "text-gray-400"
    
    return <MapPinIconSolid className={`${baseClasses} ${colorClasses}`} />
  }

  const getEventIcon = (event: LiveEvent) => {
    switch (event.severity) {
      case 'high':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
      case 'medium':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
      default:
        return <CheckCircleIcon className="w-5 h-5 text-blue-600" />
    }
  }

  return (
    <div className={`relative bg-gray-100 rounded-2xl overflow-hidden ${className}`}>
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full min-h-[400px] relative cursor-crosshair"
        onClick={handleMapClick}
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
          `,
          backgroundColor: '#f8fafc'
        }}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
            <div className="flex items-center space-x-3">
              <ArrowPathIcon className="w-6 h-6 animate-spin text-aura-primary" />
              <span className="text-gray-600">Loading map data...</span>
            </div>
          </div>
        )}

        {/* User Location */}
        {userLocation && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute z-20"
            style={{
              left: `${50 + (userLocation.longitude - mapCenter.longitude) * 1000}%`,
              top: `${50 - (userLocation.latitude - mapCenter.latitude) * 1000}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="relative">
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg" />
              <div className="absolute inset-0 w-4 h-4 bg-blue-600 rounded-full animate-ping opacity-30" />
            </div>
          </motion.div>
        )}

        {/* Vehicle Markers */}
        {layers.find(l => l.id === 'vehicles')?.visible && vehicles.map((vehicle) => (
          <motion.div
            key={vehicle.vehicle_id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute z-10 cursor-pointer"
            style={{
              left: `${50 + (vehicle.longitude - mapCenter.longitude) * 1000}%`,
              top: `${50 - (vehicle.latitude - mapCenter.latitude) * 1000}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => handleVehicleClick(vehicle)}
          >
            <div className={`p-2 rounded-full shadow-lg transition-all duration-300 ${
              vehicle.isSelected 
                ? 'bg-aura-primary scale-125' 
                : 'bg-white hover:bg-gray-50 hover:scale-110'
            }`}>
              {getVehicleIcon(vehicle)}
            </div>
            
            {/* Vehicle Status Indicator */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              vehicle.status === 'active' ? 'bg-green-500' :
              vehicle.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
            }`} />
          </motion.div>
        ))}

        {/* Stop Markers */}
        {layers.find(l => l.id === 'stops')?.visible && stops.map((stop) => (
          <motion.div
            key={stop.stop_id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute z-5 cursor-pointer"
            style={{
              left: `${50 + (stop.stop_lon - mapCenter.longitude) * 1000}%`,
              top: `${50 - (stop.stop_lat - mapCenter.latitude) * 1000}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => handleStopClick(stop)}
          >
            <div className={`p-1 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 ${
              selectedStop?.stop_id === stop.stop_id ? 'ring-2 ring-aura-primary' : ''
            }`}>
              {getStopIcon(stop)}
            </div>
            
            {/* Passenger Count Indicator */}
            {stop.passengerCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {stop.passengerCount > 9 ? '9+' : stop.passengerCount}
              </div>
            )}
          </motion.div>
        ))}

        {/* Event Markers */}
        {layers.find(l => l.id === 'events')?.visible && events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute z-15 cursor-pointer"
            style={{
              left: `${50 + (event.location.longitude - mapCenter.longitude) * 1000}%`,
              top: `${50 - (event.location.latitude - mapCenter.latitude) * 1000}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
              {getEventIcon(event)}
            </div>
            
            {/* Event Pulse Animation */}
            {event.severity === 'high' && (
              <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-30" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
        {/* Zoom Controls */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={zoomIn}
            className="p-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <ArrowsPointingOutIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={zoomOut}
            className="p-3 hover:bg-gray-50 transition-colors"
          >
            <ArrowsPointingInIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Layer Toggle */}
        <button
          onClick={() => setShowLayers(!showLayers)}
          className="p-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition-colors"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-600" />
        </button>

        {/* Real-time Toggle */}
        <button
          onClick={() => setIsRealTimeActive(!isRealTimeActive)}
          className={`p-3 rounded-xl shadow-lg transition-colors ${
            isRealTimeActive 
              ? 'bg-green-500 text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {isRealTimeActive ? (
            <PauseIcon className="w-5 h-5" />
          ) : (
            <PlayIcon className="w-5 h-5" />
          )}
        </button>

        {/* Center on User */}
        <button
          onClick={centerOnUser}
          className={`p-3 rounded-xl shadow-lg transition-colors ${
            isFollowingUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ArrowsPointingOutIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-20 z-30">
        <div className="bg-white rounded-xl shadow-lg p-3 flex items-center space-x-3">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search locations, stops, or routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Layer Panel */}
      <AnimatePresence>
        {showLayers && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-20 right-4 bg-white rounded-xl shadow-lg p-4 z-40 min-w-[200px]"
          >
            <h3 className="font-semibold text-gray-900 mb-3">Map Layers</h3>
            <div className="space-y-2">
              {layers.map((layer) => (
                <label key={layer.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={() => toggleLayer(layer.id)}
                    className="rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                  <layer.icon className="w-4 h-4" style={{ color: layer.color }} />
                  <span className="text-sm text-gray-700">{layer.name}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Vehicle Info */}
      <AnimatePresence>
        {selectedVehicle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 z-40"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-aura-primary/10 rounded-lg">
                  <TruckIconSolid className="w-6 h-6 text-aura-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Vehicle {selectedVehicle.vehicle_id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Route {selectedVehicle.route_id || 'Unknown'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-semibold ${
                  selectedVehicle.status === 'active' ? 'text-green-600' :
                  selectedVehicle.status === 'idle' ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {selectedVehicle.status?.toUpperCase() || 'UNKNOWN'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Speed</p>
                <p className="font-semibold text-gray-900">
                  {selectedVehicle.speed || 0} km/h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Updated</p>
                <p className="font-semibold text-gray-900">
                  {selectedVehicle.lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Stop Info */}
      <AnimatePresence>
        {selectedStop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 z-40"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPinIconSolid className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedStop.stop_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Stop ID: {selectedStop.stop_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStop(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Waiting</p>
                <p className="font-semibold text-gray-900">
                  {selectedStop.passengerCount} people
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-semibold ${
                  selectedStop.isActive ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {selectedStop.isActive ? 'ACTIVE' : 'INACTIVE'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Status Indicator */}
      <div className="absolute bottom-4 right-4 z-30">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm ${
          isRealTimeActive 
            ? 'bg-green-500 text-white' 
            : 'bg-gray-500 text-white'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isRealTimeActive ? 'bg-white animate-pulse' : 'bg-gray-300'
          }`} />
          <span>{isRealTimeActive ? 'LIVE' : 'PAUSED'}</span>
        </div>
      </div>
    </div>
  )
}