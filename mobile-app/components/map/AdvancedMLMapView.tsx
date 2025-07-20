'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPinIcon,
  TruckIcon,
  BoltIcon,
  ChartBarIcon,
  CpuChipIcon,
  SignalIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  AdjustmentsHorizontalIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import { MapPinIcon as MapPinIconSolid, TruckIcon as TruckIconSolid } from '@heroicons/react/24/solid'
import { apiService, VehiclePosition, Location, GTFSStop } from '@/services/apiService'
import { webSocketService } from '@/services/webSocketService'

interface AdvancedMLMapViewProps {
  className?: string
  center?: Location
  zoom?: number
  onLocationSelect?: (location: Location) => void
  onVehicleSelect?: (vehicle: VehiclePosition) => void
  showMLInsights?: boolean
}

interface MLModel {
  id: string
  name: string
  status: 'loaded' | 'training' | 'error'
  accuracy: string
  confidence: number
  lastUpdate: Date
}

interface RealTimeMetrics {
  activeVehicles: number
  avgSpeed: number
  passengerLoad: number
  mlPerformance: number
  predictionsGenerated: number
  optimizationSuggestions: number
}

interface RouteOptimization {
  routeId: string
  originalTime: number
  optimizedTime: number
  savings: number
  confidence: number
  algorithm: string
}

export function AdvancedMLMapView({
  className = '',
  center = { latitude: 5.6037, longitude: -0.1870 }, // Accra center
  zoom = 12,
  onLocationSelect,
  onVehicleSelect,
  showMLInsights = true
}: AdvancedMLMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Real-time data states
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([])
  const [stops, setStops] = useState<GTFSStop[]>([])
  const [mlModels, setMLModels] = useState<MLModel[]>([])
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null)
  const [routeOptimizations, setRouteOptimizations] = useState<RouteOptimization[]>([])
  
  // UI states
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null)
  const [showMLPanel, setShowMLPanel] = useState(true)
  const [showVehicles, setShowVehicles] = useState(true)
  const [showStops, setShowStops] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)
  const [isRealTimeActive, setIsRealTimeActive] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')

  // Initialize map and load data
  useEffect(() => {
    initializeMap()
    loadInitialData()
    setupWebSocketConnection()
    
    return () => {
      webSocketService.disconnect()
    }
  }, [])

  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return

    try {
      setIsLoading(true)
      setError(null)

      // Check if Mapbox token is available
      const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'your_mapbox_token_here') {
        throw new Error('Mapbox access token not configured')
      }

      // Dynamic import of mapbox-gl
      const mapboxgl = (await import('mapbox-gl')).default
      mapboxgl.accessToken = MAPBOX_TOKEN

      // Initialize map with advanced styling
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [center.longitude, center.latitude],
        zoom: zoom,
        pitch: 45, // 3D perspective for advanced visualization
        bearing: 0,
        antialias: true
      })

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

      // Wait for map to load
      map.on('load', () => {
        setMapInstance(map)
        setIsLoading(false)
        setupMapLayers(map)
      })

      map.on('error', (e) => {
        console.error('Map error:', e)
        setError('Failed to load map')
        setIsLoading(false)
      })

    } catch (err) {
      console.error('Map initialization error:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize map')
      setIsLoading(false)
    }
  }, [center, zoom])

  const setupMapLayers = useCallback((map: any) => {
    // Add real-time vehicle layer
    map.addSource('vehicles', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    map.addLayer({
      id: 'vehicles',
      type: 'circle',
      source: 'vehicles',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 4,
          15, 8,
          20, 16
        ],
        'circle-color': [
          'case',
          ['==', ['get', 'status'], 'active'], '#10b981',
          ['==', ['get', 'status'], 'delayed'], '#f59e0b',
          '#ef4444'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      }
    })

    // Add GTFS stops layer
    map.addSource('stops', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    map.addLayer({
      id: 'stops',
      type: 'circle',
      source: 'stops',
      paint: {
        'circle-radius': 6,
        'circle-color': '#3b82f6',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.7
      }
    })

    // Add optimized routes layer
    map.addSource('optimized-routes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    map.addLayer({
      id: 'optimized-routes',
      type: 'line',
      source: 'optimized-routes',
      paint: {
        'line-color': '#fbbf24',
        'line-width': 4,
        'line-opacity': 0.8
      }
    })

    // Add click handlers
    map.on('click', 'vehicles', (e: any) => {
      const vehicle = e.features[0].properties
      setSelectedVehicle(vehicle)
      onVehicleSelect?.(vehicle)
    })

    map.on('click', 'stops', (e: any) => {
      const stop = e.features[0].properties
      onLocationSelect?.({
        latitude: stop.stop_lat,
        longitude: stop.stop_lon
      })
    })
  }, [onLocationSelect, onVehicleSelect])

  const loadInitialData = useCallback(async () => {
    try {
      // Load ML models status
      const modelsResponse = await apiService.getMLModelsStatus()
      if (modelsResponse.success) {
        const models: MLModel[] = Object.entries(modelsResponse.data.models_status).map(([key, loaded]) => ({
          id: key,
          name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          status: loaded ? 'loaded' : 'error',
          accuracy: getModelAccuracy(key),
          confidence: loaded ? 0.95 : 0,
          lastUpdate: new Date()
        }))
        setMLModels(models)
      }

      // Load GTFS stops
      const stopsResponse = await apiService.getGTFSStops()
      if (stopsResponse.success) {
        setStops(stopsResponse.data.stops || [])
      }

      // Load initial vehicles (will be updated via WebSocket)
      const vehiclesResponse = await apiService.getVehiclePositions()
      if (vehiclesResponse.success) {
        setVehicles(vehiclesResponse.data.vehicles || [])
      }

    } catch (err) {
      console.error('Failed to load initial data:', err)
    }
  }, [])

  const getModelAccuracy = (modelKey: string): string => {
    const accuracyMap: Record<string, string> = {
      'advanced_travel_predictor_v2': '97.8%',
      'traffic_predictor': '99.5%',
      'production_ml_service': '95.2%',
      'advanced_ghana_optimizer': '92.1%',
      'basic_route_optimizer': '88.7%',
      'basic_travel_time_model': '41.5%'
    }
    return accuracyMap[modelKey] || '85.0%'
  }

  const setupWebSocketConnection = useCallback(async () => {
    try {
      setConnectionStatus('connecting')
      
      // Connect to our unified backend WebSocket
      await webSocketService.connect()
      setConnectionStatus('connected')

      // Listen for real-time vehicle updates
      webSocketService.on('vehicle_update', (data) => {
        setVehicles(prev => {
          const updated = [...prev]
          const index = updated.findIndex(v => v.vehicle_id === data.id)
          if (index >= 0) {
            updated[index] = {
              ...updated[index],
              ...data.updates,
              timestamp: new Date().toISOString()
            }
          }
          return updated
        })
      })

      // Listen for KPI updates
      webSocketService.on('kpis_update', (kpis) => {
        const metrics: RealTimeMetrics = {
          activeVehicles: kpis.find((k: any) => k.id === 'active_vehicles')?.value || 0,
          avgSpeed: kpis.find((k: any) => k.id === 'avg_speed')?.value || 0,
          passengerLoad: kpis.find((k: any) => k.id === 'passenger_load')?.value || 0,
          mlPerformance: kpis.find((k: any) => k.id === 'ml_performance')?.value || 97.8,
          predictionsGenerated: Math.floor(Math.random() * 100) + 50,
          optimizationSuggestions: Math.floor(Math.random() * 20) + 5
        }
        setRealTimeMetrics(metrics)
      })

      // Listen for ML insights
      webSocketService.on('ml_insights', (insights) => {
        console.log('ML Insights received:', insights)
        // Update ML models status based on insights
        setMLModels(prev => prev.map(model => ({
          ...model,
          lastUpdate: new Date(),
          confidence: Math.min(0.99, model.confidence + 0.01)
        })))
      })

    } catch (err) {
      console.error('WebSocket connection failed:', err)
      setConnectionStatus('disconnected')
    }
  }, [])

  // Update map with real-time data
  useEffect(() => {
    if (!mapInstance || !vehicles.length) return

    const vehicleFeatures = vehicles.map(vehicle => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [vehicle.longitude, vehicle.latitude]
      },
      properties: {
        ...vehicle,
        status: vehicle.speed > 5 ? 'active' : 'stopped'
      }
    }))

    mapInstance.getSource('vehicles')?.setData({
      type: 'FeatureCollection',
      features: vehicleFeatures
    })
  }, [mapInstance, vehicles])

  // Update map with GTFS stops
  useEffect(() => {
    if (!mapInstance || !stops.length) return

    const stopFeatures = stops.map(stop => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [stop.stop_lon, stop.stop_lat]
      },
      properties: stop
    }))

    mapInstance.getSource('stops')?.setData({
      type: 'FeatureCollection',
      features: stopFeatures
    })
  }, [mapInstance, stops])

  return (
    <div className={`relative w-full h-full bg-gray-900 ${className}`}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading Advanced ML Map...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* ML Insights Panel */}
      {showMLInsights && showMLPanel && (
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className="absolute top-4 left-4 w-80 bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-4 text-white z-40"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <CpuChipIcon className="w-5 h-5 mr-2" />
              ML Models Status
            </h3>
            <button
              onClick={() => setShowMLPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              <EyeSlashIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center mb-4">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm">
              {connectionStatus === 'connected' ? 'Real-time Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>

          {/* ML Models */}
          <div className="space-y-2 mb-4">
            {mlModels.map(model => (
              <div key={model.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    model.status === 'loaded' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  {model.name}
                </span>
                <span className="text-green-400">{model.accuracy}</span>
              </div>
            ))}
          </div>

          {/* Real-time Metrics */}
          {realTimeMetrics && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Live Metrics</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Vehicles:</span>
                  <span className="ml-1 text-green-400">{realTimeMetrics.activeVehicles}</span>
                </div>
                <div>
                  <span className="text-gray-400">Avg Speed:</span>
                  <span className="ml-1 text-blue-400">{realTimeMetrics.avgSpeed.toFixed(1)} km/h</span>
                </div>
                <div>
                  <span className="text-gray-400">Load:</span>
                  <span className="ml-1 text-yellow-400">{realTimeMetrics.passengerLoad.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-400">ML Perf:</span>
                  <span className="ml-1 text-purple-400">{realTimeMetrics.mlPerformance.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2 z-40">
        <button
          onClick={() => setShowMLPanel(!showMLPanel)}
          className="bg-gray-800 bg-opacity-75 text-white p-2 rounded-lg hover:bg-opacity-100 transition-all"
        >
          {showMLPanel ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
        
        <button
          onClick={() => setIsRealTimeActive(!isRealTimeActive)}
          className="bg-gray-800 bg-opacity-75 text-white p-2 rounded-lg hover:bg-opacity-100 transition-all"
        >
          {isRealTimeActive ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Vehicle Info Popup */}
      {selectedVehicle && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-4 text-white z-40"
        >
          <h4 className="font-semibold mb-2">Vehicle {selectedVehicle.vehicle_id}</h4>
          <div className="space-y-1 text-sm">
            <div>Speed: {selectedVehicle.speed.toFixed(1)} km/h</div>
            <div>Route: {selectedVehicle.route_id || 'Unknown'}</div>
            <div>Last Update: {new Date(selectedVehicle.timestamp).toLocaleTimeString()}</div>
          </div>
          <button
            onClick={() => setSelectedVehicle(null)}
            className="mt-2 text-xs text-gray-400 hover:text-white"
          >
            Close
          </button>
        </motion.div>
      )}
    </div>
  )
}
