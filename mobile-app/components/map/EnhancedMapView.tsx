'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPinIcon,
  TruckIcon,
  ArrowRightIcon as NavigationIcon,
  PlusIcon as ZoomInIcon,
  MinusIcon as ZoomOutIcon,
  MapPinIcon as LocationMarkerIcon,
  EyeIcon,
  Squares2X2Icon as LayersIcon,
  ArrowRightIcon as RouteIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { apiService, VehiclePosition, Location, GTFSStop } from '@/services/apiService'

interface EnhancedMapViewProps {
  className?: string
  center?: Location
  zoom?: number
  showVehicles?: boolean
  showStops?: boolean
  showRoutes?: boolean
  onLocationSelect?: (location: Location) => void
  onVehicleSelect?: (vehicle: VehiclePosition) => void
  selectedRoute?: any
}

interface MapLayer {
  id: string
  name: string
  visible: boolean
  icon: React.ReactNode
  color: string
}

interface MapMarker {
  id: string
  type: 'vehicle' | 'stop' | 'user' | 'destination'
  position: Location
  data: any
  icon?: string
  color?: string
  pulse?: boolean
}

export function EnhancedMapView({
  className = '',
  center = { latitude: 5.6037, longitude: -0.1870 }, // Accra center
  zoom = 12,
  showVehicles = true,
  showStops = true,
  showRoutes = false,
  onLocationSelect,
  onVehicleSelect,
  selectedRoute
}: EnhancedMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([])
  const [stops, setStops] = useState<GTFSStop[]>([])
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets')
  const [layers, setLayers] = useState<MapLayer[]>([
    {
      id: 'vehicles',
      name: 'Live Vehicles',
      visible: showVehicles,
      icon: <TruckIcon className="w-4 h-4" />,
      color: 'text-blue-500'
    },
    {
      id: 'stops',
      name: 'Bus Stops',
      visible: showStops,
      icon: <MapPinIcon className="w-4 h-4" />,
      color: 'text-green-500'
    },
    {
      id: 'routes',
      name: 'Routes',
      visible: showRoutes,
      icon: <RouteIcon className="w-4 h-4" />,
      color: 'text-purple-500'
    }
  ])

  // Initialize map (using Mapbox GL JS or similar)
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true)
        
        // In a real implementation, you would initialize Mapbox GL JS here
        // For now, we'll simulate the map initialization
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock map instance
        const mockMap = {
          center,
          zoom,
          style: mapStyle,
          addMarker: (marker: MapMarker) => console.log('Adding marker:', marker),
          removeMarker: (id: string) => console.log('Removing marker:', id),
          flyTo: (location: Location) => console.log('Flying to:', location),
          setStyle: (style: string) => console.log('Setting style:', style)
        }
        
        setMapInstance(mockMap)
        setError(null)
      } catch (err) {
        console.error('Map initialization error:', err)
        setError('Failed to initialize map')
      } finally {
        setIsLoading(false)
      }
    }

    if (mapRef.current) {
      initializeMap()
    }
  }, [center, zoom, mapStyle])

  // Fetch vehicle positions
  const fetchVehicles = useCallback(async () => {
    if (!layers.find(l => l.id === 'vehicles')?.visible) return

    try {
      const response = await apiService.getVehiclePositions()
      if (response.success && response.data) {
        setVehicles(response.data)
        
        // Convert vehicles to markers
        const vehicleMarkers: MapMarker[] = response.data.map(vehicle => ({
          id: `vehicle-${vehicle.vehicle_id}`,
          type: 'vehicle',
          position: { latitude: vehicle.latitude, longitude: vehicle.longitude },
          data: vehicle,
          color: getVehicleColor(vehicle.speed),
          pulse: vehicle.speed > 0
        }))
        
        setMarkers(prev => [
          ...prev.filter(m => m.type !== 'vehicle'),
          ...vehicleMarkers
        ])
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error)
    }
  }, [layers])

  // Fetch GTFS stops
  const fetchStops = useCallback(async () => {
    if (!layers.find(l => l.id === 'stops')?.visible) return

    try {
      const response = await apiService.getGTFSStops()
      if (response.success && response.data) {
        setStops(response.data)
        
        // Convert stops to markers (limit to nearby stops for performance)
        const nearbyStops = response.data.slice(0, 50) // Limit for performance
        const stopMarkers: MapMarker[] = nearbyStops.map(stop => ({
          id: `stop-${stop.stop_id}`,
          type: 'stop',
          position: { latitude: stop.stop_lat, longitude: stop.stop_lon },
          data: stop,
          color: 'text-green-500'
        }))
        
        setMarkers(prev => [
          ...prev.filter(m => m.type !== 'stop'),
          ...stopMarkers
        ])
      }
    } catch (error) {
      console.error('Failed to fetch stops:', error)
    }
  }, [layers])

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          setUserLocation(location)
          
          // Add user location marker
          const userMarker: MapMarker = {
            id: 'user-location',
            type: 'user',
            position: location,
            data: { name: 'Your Location' },
            color: 'text-blue-600',
            pulse: true
          }
          
          setMarkers(prev => [
            ...prev.filter(m => m.id !== 'user-location'),
            userMarker
          ])
        },
        (error) => {
          console.error('Geolocation error:', error)
        }
      )
    }
  }, [])

  // Fetch data when layers change
  useEffect(() => {
    fetchVehicles()
    fetchStops()
  }, [fetchVehicles, fetchStops])

  // Auto-refresh vehicles
  useEffect(() => {
    const interval = setInterval(fetchVehicles, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [fetchVehicles])

  const getVehicleColor = (speed: number): string => {
    if (speed === 0) return 'text-red-500'
    if (speed < 20) return 'text-yellow-500'
    if (speed < 40) return 'text-green-500'
    return 'text-blue-500'
  }

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ))
  }

  const handleMarkerClick = (marker: MapMarker) => {
    if (marker.type === 'vehicle' && onVehicleSelect) {
      onVehicleSelect(marker.data)
    } else if (onLocationSelect) {
      onLocationSelect(marker.position)
    }
  }

  const zoomIn = () => {
    if (mapInstance) {
      mapInstance.zoom = Math.min(mapInstance.zoom + 1, 18)
    }
  }

  const zoomOut = () => {
    if (mapInstance) {
      mapInstance.zoom = Math.max(mapInstance.zoom - 1, 1)
    }
  }

  const centerOnUser = () => {
    if (userLocation && mapInstance) {
      mapInstance.flyTo(userLocation)
    }
  }

  const changeMapStyle = (style: 'streets' | 'satellite' | 'dark') => {
    setMapStyle(style)
    if (mapInstance) {
      mapInstance.setStyle(style)
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-100 rounded-3xl flex items-center justify-center ${className}`}>
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 animate-spin text-aura-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 rounded-3xl flex items-center justify-center ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-gray-900 rounded-3xl overflow-hidden shadow-xl ${className}`}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full min-h-[400px] relative">
        {/* Simulated Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-green-50 to-blue-100">
          {/* Grid pattern to simulate map */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Simulated Roads */}
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-0 right-0 h-2 bg-gray-400 opacity-60"></div>
            <div className="absolute top-2/3 left-0 right-0 h-1 bg-gray-300 opacity-40"></div>
            <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-gray-300 opacity-40"></div>
            <div className="absolute left-3/4 top-0 bottom-0 w-2 bg-gray-400 opacity-60"></div>
          </div>
        </div>

        {/* Markers */}
        <AnimatePresence>
          {markers.map((marker) => (
            <motion.div
              key={marker.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              style={{
                left: `${((marker.position.longitude + 0.1870) / 0.3740) * 100}%`,
                top: `${(1 - (marker.position.latitude - 5.4037) / 0.4000) * 100}%`
              }}
              onClick={() => handleMarkerClick(marker)}
            >
              <div className={`relative ${marker.pulse ? 'animate-pulse' : ''}`}>
                {marker.type === 'vehicle' && (
                  <div className={`w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-blue-500`}>
                    <TruckIcon className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                {marker.type === 'stop' && (
                  <div className="w-6 h-6 rounded-full bg-green-500 shadow-lg flex items-center justify-center">
                    <MapPinIcon className="w-3 h-3 text-white" />
                  </div>
                )}
                {marker.type === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-blue-600 shadow-lg flex items-center justify-center border-4 border-white">
                    <LocationMarkerIcon className="w-5 h-5 text-white" />
                  </div>
                )}
                
                {/* Pulse animation for active markers */}
                {marker.pulse && (
                  <div className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping"></div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        {/* Zoom Controls */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={zoomIn}
            className="block w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ZoomInIcon className="w-5 h-5 text-gray-700" />
          </button>
          <div className="border-t border-gray-200"></div>
          <button
            onClick={zoomOut}
            className="block w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ZoomOutIcon className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Location Button */}
        <button
          onClick={centerOnUser}
          className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <NavigationIcon className="w-5 h-5 text-gray-700" />
        </button>

        {/* Layers Button */}
        <button
          onClick={() => {/* Toggle layers panel */}}
          className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <LayersIcon className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Map Style Selector */}
      <div className="absolute top-4 left-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-2 flex space-x-1">
          {(['streets', 'satellite', 'dark'] as const).map((style) => (
            <button
              key={style}
              onClick={() => changeMapStyle(style)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                mapStyle === style
                  ? 'bg-aura-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Layer Controls */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Map Layers</h3>
          <div className="space-y-2">
            {layers.map((layer) => (
              <label key={layer.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => toggleLayer(layer.id)}
                  className="rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                />
                <div className={layer.color}>
                  {layer.icon}
                </div>
                <span className="text-sm text-gray-700">{layer.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="absolute bottom-4 right-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{vehicles.length}</div>
              <div className="text-xs text-gray-500">Active Vehicles</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{stops.length}</div>
              <div className="text-xs text-gray-500">Bus Stops</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}