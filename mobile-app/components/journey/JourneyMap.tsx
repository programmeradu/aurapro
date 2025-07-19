'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import mapboxgl from 'mapbox-gl'
import {
  MapPinIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  NavigationArrowIcon,
  SpeakerWaveIcon,
  PlayIcon,
  StopIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

import { TurnByTurnNavigation } from './TurnByTurnNavigation'
import { RouteLegend } from './RouteLegend'
import { VoiceSettings } from './VoiceSettings'
import { voiceGuidanceService, VoiceSettings as VoiceSettingsType } from '../../services/voiceGuidanceService'

// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css'

// Turn-by-turn direction types
interface TurnInstruction {
  id: string
  type: 'turn-left' | 'turn-right' | 'straight' | 'slight-left' | 'slight-right' | 'sharp-left' | 'sharp-right' | 'u-turn' | 'arrive' | 'depart'
  instruction: string
  distance: number
  duration: number
  coordinates: [number, number]
  street_name?: string
  landmark?: string
  maneuver_type?: string
}

interface RouteSegment {
  id: string
  type: 'walking' | 'transport' | 'waiting'
  coordinates: [number, number][]
  instructions: TurnInstruction[]
  mode: string
  color: string
  duration: number
  distance: number
  vehicle_info?: {
    route_name: string
    vehicle_type: string
    stops: Array<{ name: string; coordinates: [number, number] }>
  }
}

interface JourneyMapProps {
  origin?: { lat: number; lng: number; name: string }
  destination?: { lat: number; lng: number; name: string }
  routes?: Array<{
    id: string
    coordinates: Array<[number, number]>
    mode: 'walking' | 'bus' | 'trotro' | 'taxi'
    duration: number
    distance: number
    color: string
    segments?: RouteSegment[]
    instructions?: TurnInstruction[]
  }>
  onLocationSelect?: (location: { lat: number; lng: number; name: string }) => void
  showNavigation?: boolean
  enableVoiceGuidance?: boolean
  showRealTimeTracking?: boolean
  showTurnByTurn?: boolean
  currentInstruction?: TurnInstruction
  onInstructionChange?: (instruction: TurnInstruction) => void
  className?: string
}

// Set Mapbox access token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
if (typeof window !== 'undefined' && MAPBOX_TOKEN && MAPBOX_TOKEN !== 'your_mapbox_token_here') {
  mapboxgl.accessToken = MAPBOX_TOKEN
}

export function JourneyMap({
  origin,
  destination,
  routes = [],
  onLocationSelect,
  showNavigation = false,
  enableVoiceGuidance = false,
  showRealTimeTracking = false,
  showTurnByTurn = false,
  currentInstruction,
  onInstructionChange,
  className = ''
}: JourneyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(enableVoiceGuidance)
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0)
  const [routeInstructions, setRouteInstructions] = useState<TurnInstruction[]>([])
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [navigationStarted, setNavigationStarted] = useState(false)
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isTrackingLocation, setIsTrackingLocation] = useState(false)
  const [userHeading, setUserHeading] = useState<number | null>(null)
  const [showStops, setShowStops] = useState(false)
  const [stopsLoaded, setStopsLoaded] = useState(false)
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsType>(voiceGuidanceService.getSettings())

  // Real Mapbox map initialization
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return

      try {
        setIsLoading(true)
        setMapError(null)

        // Check if Mapbox token is available
        if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'your_mapbox_token_here') {
          throw new Error('Mapbox access token not configured. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your environment variables.')
        }

        // Initialize Mapbox map
        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-0.1870, 5.6037], // Accra, Ghana
          zoom: 12,
          pitch: 0,
          bearing: 0
        })

        mapInstanceRef.current = map

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right')

        // Add geolocate control for user location
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        })
        map.addControl(geolocate, 'top-right')

        // Wait for map to load
        map.on('load', () => {
          setIsLoading(false)

          // Add route layers
          addRouteLayers(map)

          // Add markers if origin/destination provided
          if (origin) addMarker(map, origin, 'origin')
          if (destination) addMarker(map, destination, 'destination')

          // Add GTFS stops markers if enabled
          if (showStops) {
            addGTFSStopsMarkers(map)
            setStopsLoaded(true)
          }

          // Add transfer point markers for multi-modal routes
          addTransferPointMarkers(map)

          // Fit map to show all points
          if (origin && destination) {
            fitMapToPoints(map, [origin, destination])
          }
        })

        // Handle map click for location selection
        map.on('click', (e) => {
          if (onLocationSelect) {
            const { lng, lat } = e.lngLat
            onLocationSelect({ lat, lng: lng, name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})` })
          }
        })

        // Handle geolocation
        geolocate.on('geolocate', (e) => {
          setUserLocation({ lat: e.coords.latitude, lng: e.coords.longitude })
        })

      } catch (error) {
        console.error('Failed to initialize map:', error)
        setMapError('Failed to load map. Please check your internet connection.')
        setIsLoading(false)
      }
    }

    initializeMap()

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      // Stop GPS tracking on cleanup
      if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId)
      }
    }
  }, [])

  // Helper function to add markers
  const addMarker = (map: mapboxgl.Map, location: { lat: number; lng: number; name: string }, type: 'origin' | 'destination') => {
    const el = document.createElement('div')
    el.className = `w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm ${
      type === 'origin' ? 'bg-green-500' : 'bg-red-500'
    }`
    el.innerHTML = type === 'origin' ? 'A' : 'B'

    // Enhanced popup with more details
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false
    }).setHTML(`
      <div class="p-3 min-w-48">
        <h3 class="font-semibold text-gray-900 mb-2">${type === 'origin' ? '🚀 Starting Point' : '🎯 Destination'}</h3>
        <p class="text-sm text-gray-700 mb-2">${location.name}</p>
        <div class="text-xs text-gray-500">
          <p>Lat: ${location.lat.toFixed(6)}</p>
          <p>Lng: ${location.lng.toFixed(6)}</p>
        </div>
        <div class="mt-2 pt-2 border-t">
          <button
            onclick="navigator.geolocation.getCurrentPosition(pos => {
              const distance = Math.round(
                6371 * Math.acos(
                  Math.cos(pos.coords.latitude * Math.PI / 180) *
                  Math.cos(${location.lat} * Math.PI / 180) *
                  Math.cos((${location.lng} - pos.coords.longitude) * Math.PI / 180) +
                  Math.sin(pos.coords.latitude * Math.PI / 180) *
                  Math.sin(${location.lat} * Math.PI / 180)
                ) * 1000
              );
              alert('Distance from your location: ' + distance + 'm');
            })"
            class="w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            📍 Get Distance
          </button>
        </div>
      </div>
    `)

    new mapboxgl.Marker(el)
      .setLngLat([location.lng, location.lat])
      .setPopup(popup)
      .addTo(map)
  }

  // Add GTFS stops markers
  const addGTFSStopsMarkers = async (map: mapboxgl.Map) => {
    try {
      // Fetch GTFS stops from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/gtfs/stops`)
      if (!response.ok) return

      const data = await response.json()
      const stops = data.stops || []

      // Add stop markers (limit for performance)
      stops.slice(0, 100).forEach((stop: any) => {
        const stopEl = document.createElement('div')
        stopEl.className = 'gtfs-stop-marker'

        // Different icons for different stop types
        const isTerminal = stop.stop_name?.toLowerCase().includes('terminal') ||
                          stop.stop_name?.toLowerCase().includes('station')

        stopEl.innerHTML = `
          <div class="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs ${
            isTerminal ? 'bg-purple-600 text-white' : 'bg-blue-500 text-white'
          }">
            ${isTerminal ? '🚌' : '🚏'}
          </div>
        `

        // Create detailed popup for stops
        const stopPopup = new mapboxgl.Popup({
          offset: 15,
          closeButton: true,
          closeOnClick: false
        }).setHTML(`
          <div class="p-3 min-w-56">
            <h3 class="font-semibold text-gray-900 mb-2">
              ${isTerminal ? '🚌 Terminal' : '🚏 Bus Stop'}
            </h3>
            <p class="text-sm text-gray-700 mb-2">${stop.stop_name}</p>
            ${stop.stop_desc ? `<p class="text-xs text-gray-600 mb-2">${stop.stop_desc}</p>` : ''}

            <div class="border-t pt-2 mt-2">
              <div class="text-xs text-gray-500 space-y-1">
                <p><strong>Stop ID:</strong> ${stop.stop_id}</p>
                <p><strong>Location:</strong> ${stop.stop_lat?.toFixed(6)}, ${stop.stop_lon?.toFixed(6)}</p>
                ${stop.zone_id ? `<p><strong>Zone:</strong> ${stop.zone_id}</p>` : ''}
              </div>
            </div>

            <div class="mt-3 pt-2 border-t">
              <button
                onclick="navigator.geolocation.getCurrentPosition(pos => {
                  const distance = Math.round(
                    6371 * Math.acos(
                      Math.cos(pos.coords.latitude * Math.PI / 180) *
                      Math.cos(${stop.stop_lat} * Math.PI / 180) *
                      Math.cos((${stop.stop_lon} - pos.coords.longitude) * Math.PI / 180) +
                      Math.sin(pos.coords.latitude * Math.PI / 180) *
                      Math.sin(${stop.stop_lat} * Math.PI / 180)
                    ) * 1000
                  );
                  alert('Distance: ' + distance + 'm');
                })"
                class="w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                📍 Get Distance
              </button>
            </div>
          </div>
        `)

        new mapboxgl.Marker(stopEl)
          .setLngLat([stop.stop_lon, stop.stop_lat])
          .setPopup(stopPopup)
          .addTo(map)
      })

    } catch (error) {
      console.error('Failed to load GTFS stops:', error)
    }
  }

  // Add route transfer points
  const addTransferPointMarkers = (map: mapboxgl.Map) => {
    routes.forEach(route => {
      if (route.segments && route.segments.length > 1) {
        // Add transfer points between segments
        for (let i = 0; i < route.segments.length - 1; i++) {
          const currentSegment = route.segments[i]
          const nextSegment = route.segments[i + 1]

          // Transfer point is at the end of current segment / start of next segment
          const transferCoords = currentSegment.coordinates[currentSegment.coordinates.length - 1]

          const transferEl = document.createElement('div')
          transferEl.className = 'transfer-point-marker'

          transferEl.innerHTML = `
            <div class="w-5 h-5 rounded-full border-2 border-white shadow-md bg-orange-500 flex items-center justify-center">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
          `

          const transferPopup = new mapboxgl.Popup({
            offset: 15,
            closeButton: true,
            closeOnClick: false
          }).setHTML(`
            <div class="p-3 min-w-48">
              <h3 class="font-semibold text-gray-900 mb-2">🔄 Transfer Point</h3>
              <p class="text-sm text-gray-700 mb-2">
                Change from ${getTransportModeIcon(currentSegment.mode)} ${currentSegment.mode}
                to ${getTransportModeIcon(nextSegment.mode)} ${nextSegment.mode}
              </p>

              <div class="text-xs text-gray-500 space-y-1">
                <p><strong>Wait time:</strong> ~2-5 minutes</p>
                <p><strong>Walking distance:</strong> ~50-100m</p>
              </div>

              <div class="mt-2 pt-2 border-t text-xs text-blue-600">
                💡 Look for signs directing to ${nextSegment.mode} services
              </div>
            </div>
          `)

          new mapboxgl.Marker(transferEl)
            .setLngLat(transferCoords)
            .setPopup(transferPopup)
            .addTo(map)
        }
      }
    })
  }

  // Get transport mode icon
  const getTransportModeIcon = (mode: string): string => {
    const icons = {
      'walking': '🚶',
      'bus': '🚌',
      'trotro': '🚐',
      'taxi': '🚕',
      'metro': '🚇',
      'train': '🚆',
      'bicycle': '🚲',
      'motorcycle': '🏍️',
      'default': '🚗'
    }
    return icons[mode] || icons.default
  }

  // Get color scheme for transport modes
  const getTransportModeColor = (mode: string): string => {
    const colorScheme = {
      'walking': '#10B981',      // Green for walking
      'bus': '#3B82F6',          // Blue for bus
      'trotro': '#F59E0B',       // Amber for tro-tro
      'taxi': '#EF4444',         // Red for taxi
      'metro': '#8B5CF6',        // Purple for metro
      'train': '#6B7280',        // Gray for train
      'bicycle': '#84CC16',      // Lime for bicycle
      'motorcycle': '#F97316',   // Orange for motorcycle
      'default': '#6B7280'       // Default gray
    }
    return colorScheme[mode] || colorScheme.default
  }

  // Get line style for transport modes
  const getTransportModeStyle = (mode: string) => {
    const styles = {
      'walking': {
        width: 4,
        dashArray: [2, 3],
        opacity: 0.8
      },
      'bus': {
        width: 6,
        dashArray: [1, 0],
        opacity: 0.9
      },
      'trotro': {
        width: 5,
        dashArray: [8, 4],
        opacity: 0.9
      },
      'taxi': {
        width: 4,
        dashArray: [1, 0],
        opacity: 0.8
      },
      'metro': {
        width: 8,
        dashArray: [1, 0],
        opacity: 1.0
      },
      'train': {
        width: 8,
        dashArray: [12, 4],
        opacity: 1.0
      },
      'bicycle': {
        width: 3,
        dashArray: [4, 2],
        opacity: 0.7
      },
      'default': {
        width: 4,
        dashArray: [1, 0],
        opacity: 0.8
      }
    }
    return styles[mode] || styles.default
  }

  // Helper function to add route layers with enhanced styling
  const addRouteLayers = (map: mapboxgl.Map) => {
    routes.forEach((route, index) => {
      // Handle routes with segments (multi-modal)
      if (route.segments && route.segments.length > 0) {
        route.segments.forEach((segment, segmentIndex) => {
          const segmentLayerId = `route-${route.id}-segment-${segmentIndex}`
          const color = getTransportModeColor(segment.mode)
          const style = getTransportModeStyle(segment.mode)

          // Add segment source
          map.addSource(segmentLayerId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {
                mode: segment.mode,
                type: segment.type,
                duration: segment.duration,
                distance: segment.distance,
                routeId: route.id
              },
              geometry: {
                type: 'LineString',
                coordinates: segment.coordinates
              }
            }
          })

          // Add segment layer
          map.addLayer({
            id: segmentLayerId,
            type: 'line',
            source: segmentLayerId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': color,
              'line-width': selectedRoute === route.id ? style.width + 2 : style.width,
              'line-dasharray': style.dashArray,
              'line-opacity': selectedRoute === route.id ? 1 : style.opacity * 0.7
            }
          })

          // Add click handler for route selection
          map.on('click', segmentLayerId, () => {
            setSelectedRoute(selectedRoute === route.id ? null : route.id)
          })

          // Change cursor on hover
          map.on('mouseenter', segmentLayerId, () => {
            map.getCanvas().style.cursor = 'pointer'
          })

          map.on('mouseleave', segmentLayerId, () => {
            map.getCanvas().style.cursor = ''
          })
        })
      } else {
        // Handle simple routes (single mode)
        const layerId = `route-${route.id}`
        const color = route.color || getTransportModeColor(route.mode)
        const style = getTransportModeStyle(route.mode)

        // Add route source
        map.addSource(layerId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {
              mode: route.mode,
              duration: route.duration,
              distance: route.distance
            },
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates
            }
          }
        })

        // Add route layer with enhanced styling
        map.addLayer({
          id: layerId,
          type: 'line',
          source: layerId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': color,
            'line-width': selectedRoute === route.id ? style.width + 2 : style.width,
            'line-dasharray': style.dashArray,
            'line-opacity': selectedRoute === route.id ? 1 : style.opacity * 0.7
          }
        })

        // Add click handler for route selection
        map.on('click', layerId, () => {
          setSelectedRoute(selectedRoute === route.id ? null : route.id)
        })

        // Change cursor on hover
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer'
        })

        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = ''
        })
      }
    })
  }

  // Generate turn-by-turn instructions from route coordinates
  const generateTurnInstructions = (route: any): TurnInstruction[] => {
    if (!route.coordinates || route.coordinates.length < 2) return []

    const instructions: TurnInstruction[] = []
    const coords = route.coordinates

    // Start instruction
    instructions.push({
      id: 'start',
      type: 'depart',
      instruction: `Start your journey ${route.mode === 'walking' ? 'on foot' : `by ${route.mode}`}`,
      distance: 0,
      duration: 0,
      coordinates: coords[0],
      street_name: 'Starting point'
    })

    // Generate intermediate instructions based on coordinate changes
    for (let i = 1; i < coords.length - 1; i++) {
      const prev = coords[i - 1]
      const current = coords[i]
      const next = coords[i + 1]

      // Calculate bearing changes to determine turn type
      const bearing1 = calculateBearing(prev, current)
      const bearing2 = calculateBearing(current, next)
      const turnAngle = bearing2 - bearing1

      let turnType: TurnInstruction['type'] = 'straight'
      let instruction = 'Continue straight'

      if (Math.abs(turnAngle) > 15) {
        if (turnAngle > 45) {
          turnType = 'turn-right'
          instruction = 'Turn right'
        } else if (turnAngle < -45) {
          turnType = 'turn-left'
          instruction = 'Turn left'
        } else if (turnAngle > 15) {
          turnType = 'slight-right'
          instruction = 'Slight right'
        } else if (turnAngle < -15) {
          turnType = 'slight-left'
          instruction = 'Slight left'
        }

        // Add Ghana-specific landmarks and street context
        const ghanaContext = getGhanaNavigationContext(current)
        if (ghanaContext) {
          instruction += ` ${ghanaContext}`
        }

        instructions.push({
          id: `turn-${i}`,
          type: turnType,
          instruction,
          distance: calculateDistance(coords[0], current) * 1000, // Convert to meters
          duration: Math.round((calculateDistance(coords[0], current) / 5) * 60), // Estimate walking time
          coordinates: current,
          street_name: `Step ${i}`,
          landmark: ghanaContext
        })
      }
    }

    // Arrival instruction
    instructions.push({
      id: 'arrive',
      type: 'arrive',
      instruction: `Arrive at your destination`,
      distance: route.distance * 1000,
      duration: route.duration * 60,
      coordinates: coords[coords.length - 1],
      street_name: 'Destination'
    })

    return instructions
  }

  // Calculate bearing between two coordinates
  const calculateBearing = (from: [number, number], to: [number, number]): number => {
    const lat1 = from[1] * Math.PI / 180
    const lat2 = to[1] * Math.PI / 180
    const deltaLng = (to[0] - from[0]) * Math.PI / 180

    const x = Math.sin(deltaLng) * Math.cos(lat2)
    const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

    return Math.atan2(x, y) * 180 / Math.PI
  }

  // Calculate distance between coordinates (Haversine formula)
  const calculateDistance = (from: [number, number], to: [number, number]): number => {
    const R = 6371 // Earth's radius in km
    const lat1 = from[1] * Math.PI / 180
    const lat2 = to[1] * Math.PI / 180
    const deltaLat = (to[1] - from[1]) * Math.PI / 180
    const deltaLng = (to[0] - from[0]) * Math.PI / 180

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // Get Ghana-specific navigation context
  const getGhanaNavigationContext = (coordinates: [number, number]): string | null => {
    const [lng, lat] = coordinates

    // Ghana landmark-based navigation context
    if (lat > 5.55 && lat < 5.58 && lng > -0.25 && lng < -0.15) {
      return 'towards Accra Central'
    } else if (lat > 5.57 && lng > -0.22) {
      return 'towards Circle'
    } else if (lat > 5.56 && lng < -0.23) {
      return 'towards Kaneshie'
    } else if (lat < 5.55) {
      return 'towards Tema direction'
    }

    return null
  }

  // Voice guidance function using the service
  const speakInstruction = async (instruction: TurnInstruction) => {
    if (!voiceEnabled || !voiceGuidanceService.isVoiceSupported()) return

    try {
      await voiceGuidanceService.speak(instruction)
    } catch (error) {
      console.error('Voice guidance failed:', error)
    }
  }

  // Start navigation mode
  const startNavigation = async () => {
    if (routes.length === 0) return

    const selectedRouteData = routes.find(r => r.id === selectedRoute) || routes[0]
    const instructions = generateTurnInstructions(selectedRouteData)

    setRouteInstructions(instructions)
    setCurrentInstructionIndex(0)
    setNavigationStarted(true)
    setIsNavigating(true)

    // Start GPS tracking for navigation
    startLocationTracking()

    // Announce navigation start
    if (destination && voiceEnabled) {
      try {
        await voiceGuidanceService.announceNavigationStart(destination.name)
      } catch (error) {
        console.error('Failed to announce navigation start:', error)
      }
    }

    // Speak first instruction
    if (instructions.length > 0) {
      await speakInstruction(instructions[0])
      onInstructionChange?.(instructions[0])
    }
  }

  // Stop navigation
  const stopNavigation = async () => {
    setNavigationStarted(false)
    setIsNavigating(false)
    setCurrentInstructionIndex(0)

    // Stop voice guidance
    voiceGuidanceService.stop()

    // Stop GPS tracking
    stopLocationTracking()

    // Announce navigation end if it was completed
    if (voiceEnabled && currentInstructionIndex >= routeInstructions.length - 1) {
      try {
        await voiceGuidanceService.announceNavigationEnd()
      } catch (error) {
        console.error('Failed to announce navigation end:', error)
      }
    }
  }

  // Check voice synthesis support and initialize voice service
  useEffect(() => {
    setVoiceSupported(voiceGuidanceService.isVoiceSupported())

    // Update voice enabled state based on service settings
    const currentSettings = voiceGuidanceService.getSettings()
    setVoiceEnabled(currentSettings.enabled)
    setVoiceSettings(currentSettings)
  }, [])

  // GPS Tracking Functions
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      return
    }

    setIsTrackingLocation(true)
    setLocationError(null)

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setUserLocation(newLocation)
        setLocationAccuracy(position.coords.accuracy)

        // Update heading if available
        if (position.coords.heading !== null) {
          setUserHeading(position.coords.heading)
        }

        // Add user location marker to map
        if (mapInstanceRef.current) {
          addUserLocationMarker(mapInstanceRef.current, newLocation, position.coords.heading)
        }
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`)
        setIsTrackingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )

    // Start continuous tracking
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        setUserLocation(newLocation)
        setLocationAccuracy(position.coords.accuracy)

        // Update heading if available
        if (position.coords.heading !== null) {
          setUserHeading(position.coords.heading)
        }

        // Update user location on map
        if (mapInstanceRef.current) {
          updateUserLocationMarker(mapInstanceRef.current, newLocation, position.coords.heading)
        }

        // Check if we need to update navigation instructions
        if (navigationStarted && routeInstructions.length > 0) {
          checkNavigationProgress(newLocation)
        }
      },
      (error) => {
        console.error('Location tracking error:', error)
        setLocationError(`Tracking error: ${error.message}`)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000
      }
    )

    setGpsWatchId(watchId)
  }

  const stopLocationTracking = () => {
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId)
      setGpsWatchId(null)
    }
    setIsTrackingLocation(false)
    setLocationError(null)
  }

  // Add user location marker with heading indicator
  const addUserLocationMarker = (map: mapboxgl.Map, location: { lat: number; lng: number }, heading?: number | null) => {
    // Remove existing user location marker
    const existingMarker = document.getElementById('user-location-marker')
    if (existingMarker) {
      existingMarker.remove()
    }

    // Create user location element
    const el = document.createElement('div')
    el.id = 'user-location-marker'
    el.className = 'user-location-marker'
    el.style.cssText = `
      width: 20px;
      height: 20px;
      background: #007cbf;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(0, 124, 191, 0.5);
      position: relative;
    `

    // Add heading indicator if available
    if (heading !== null && heading !== undefined) {
      const arrow = document.createElement('div')
      arrow.style.cssText = `
        position: absolute;
        top: -8px;
        left: 50%;
        transform: translateX(-50%) rotate(${heading}deg);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 8px solid #007cbf;
      `
      el.appendChild(arrow)
    }

    // Add accuracy circle
    if (locationAccuracy && locationAccuracy < 100) {
      const accuracyCircle = document.createElement('div')
      const radiusInPixels = Math.max(locationAccuracy / 2, 10) // Rough conversion
      accuracyCircle.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${radiusInPixels * 2}px;
        height: ${radiusInPixels * 2}px;
        background: rgba(0, 124, 191, 0.1);
        border: 1px solid rgba(0, 124, 191, 0.3);
        border-radius: 50%;
        pointer-events: none;
      `
      el.appendChild(accuracyCircle)
    }

    new mapboxgl.Marker(el)
      .setLngLat([location.lng, location.lat])
      .addTo(map)
  }

  // Update user location marker
  const updateUserLocationMarker = (map: mapboxgl.Map, location: { lat: number; lng: number }, heading?: number | null) => {
    addUserLocationMarker(map, location, heading)
  }

  // Check navigation progress and update instructions
  const checkNavigationProgress = (currentLocation: { lat: number; lng: number }) => {
    if (!routeInstructions.length || currentInstructionIndex >= routeInstructions.length) return

    const currentInstruction = routeInstructions[currentInstructionIndex]
    const instructionLocation = {
      lat: currentInstruction.coordinates[1],
      lng: currentInstruction.coordinates[0]
    }

    // Calculate distance to current instruction point
    const distanceToInstruction = calculateDistance(
      [currentLocation.lng, currentLocation.lat],
      currentInstruction.coordinates
    ) * 1000 // Convert to meters

    // If we're close to the instruction point (within 50 meters), move to next instruction
    if (distanceToInstruction < 50 && currentInstructionIndex < routeInstructions.length - 1) {
      handleNextInstruction()
    }
  }

  // Navigation control functions
  const handleNextInstruction = async () => {
    if (currentInstructionIndex < routeInstructions.length - 1) {
      const nextIndex = currentInstructionIndex + 1
      setCurrentInstructionIndex(nextIndex)

      if (voiceEnabled) {
        await speakInstruction(routeInstructions[nextIndex])
      }

      onInstructionChange?.(routeInstructions[nextIndex])
    }
  }

  const handlePreviousInstruction = () => {
    if (currentInstructionIndex > 0) {
      const prevIndex = currentInstructionIndex - 1
      setCurrentInstructionIndex(prevIndex)
      onInstructionChange?.(routeInstructions[prevIndex])
    }
  }

  const handleToggleVoice = async () => {
    const newVoiceEnabled = !voiceEnabled
    setVoiceEnabled(newVoiceEnabled)

    // Update voice service settings
    voiceGuidanceService.updateSettings({ enabled: newVoiceEnabled })

    if (newVoiceEnabled) {
      // Speak current instruction when voice is enabled
      if (routeInstructions[currentInstructionIndex]) {
        await speakInstruction(routeInstructions[currentInstructionIndex])
      }
    } else {
      // Stop speaking when voice is disabled
      voiceGuidanceService.stop()
    }
  }

  // Handle voice settings change
  const handleVoiceSettingsChange = (newSettings: VoiceSettingsType) => {
    setVoiceSettings(newSettings)
    setVoiceEnabled(newSettings.enabled)
  }

  // Helper function to fit map to points
  const fitMapToPoints = (map: mapboxgl.Map, points: Array<{ lat: number; lng: number }>) => {
    const bounds = new mapboxgl.LngLatBounds()
    points.forEach(point => bounds.extend([point.lng, point.lat]))
    map.fitBounds(bounds, { padding: 50 })
  }

  // Update routes when they change
  useEffect(() => {
    if (!mapInstanceRef.current || isLoading) return

    const map = mapInstanceRef.current

    // Clear existing route layers (including segments)
    routes.forEach(route => {
      // Clear main route layer
      const layerId = `route-${route.id}`
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
        map.removeSource(layerId)
      }

      // Clear segment layers if they exist
      if (route.segments) {
        route.segments.forEach((segment, segmentIndex) => {
          const segmentLayerId = `route-${route.id}-segment-${segmentIndex}`
          if (map.getLayer(segmentLayerId)) {
            map.removeLayer(segmentLayerId)
            map.removeSource(segmentLayerId)
          }
        })
      }
    })

    // Add new route layers
    addRouteLayers(map)
  }, [routes, isLoading, selectedRoute])

  // Update markers when origin/destination changes
  useEffect(() => {
    if (!mapInstanceRef.current || isLoading) return

    const map = mapInstanceRef.current

    // Clear existing markers (we'll recreate them)
    // Note: In a production app, you'd want to track markers and remove them properly

    if (origin) addMarker(map, origin, 'origin')
    if (destination) addMarker(map, destination, 'destination')

    if (origin && destination) {
      fitMapToPoints(map, [origin, destination])
    }
  }, [origin, destination, isLoading])





  const handleLocationClick = (lat: number, lng: number) => {
    const location = {
      lat,
      lng,
      name: `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
    onLocationSelect?.(location)
  }

  const getRouteColor = (mode: string) => {
    switch (mode) {
      case 'walking': return '#10B981'
      case 'bus': return '#3B82F6'
      case 'trotro': return '#F59E0B'
      case 'taxi': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getRouteIcon = (mode: string) => {
    switch (mode) {
      case 'walking': return '🚶'
      case 'bus': return '🚌'
      case 'trotro': return '🚐'
      case 'taxi': return '🚕'
      default: return '📍'
    }
  }

  if (mapError) {
    return (
      <div className={`bg-gray-100 rounded-mobile p-8 text-center ${className}`}>
        <div className="text-red-500 mb-4">
          <MapPinIcon className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium">Map Error</p>
          <p className="text-sm text-gray-600">{mapError}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={`relative bg-white rounded-mobile shadow-mobile overflow-hidden ${className}`}>
      {/* Turn-by-Turn Navigation Overlay */}
      <TurnByTurnNavigation
        instructions={routeInstructions}
        currentInstructionIndex={currentInstructionIndex}
        isNavigating={navigationStarted}
        voiceEnabled={voiceEnabled}
        onToggleVoice={handleToggleVoice}
        onStopNavigation={stopNavigation}
        onNextInstruction={handleNextInstruction}
        onPreviousInstruction={handlePreviousInstruction}
      />

      {/* Map Header */}
      <div className={`absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4 ${navigationStarted ? 'mt-32' : ''}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Journey Map</h3>
          <div className="flex items-center space-x-2">
            {/* Navigation Controls */}
            {routes.length > 0 && !navigationStarted && (
              <button
                onClick={startNavigation}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlayIcon className="h-4 w-4" />
                <span className="text-sm">Start Navigation</span>
              </button>
            )}

            {navigationStarted && (
              <button
                onClick={stopNavigation}
                className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <StopIcon className="h-4 w-4" />
                <span className="text-sm">Stop</span>
              </button>
            )}

            {/* GPS Tracking Controls */}
            {!navigationStarted && (
              <button
                onClick={isTrackingLocation ? stopLocationTracking : startLocationTracking}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isTrackingLocation
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <SignalIcon className="h-4 w-4" />
                <span className="text-sm">
                  {isTrackingLocation ? 'GPS On' : 'GPS Off'}
                </span>
              </button>
            )}

            {/* Stops Toggle */}
            <button
              onClick={() => {
                setShowStops(!showStops)
                if (!showStops && mapInstanceRef.current && !stopsLoaded) {
                  addGTFSStopsMarkers(mapInstanceRef.current)
                  setStopsLoaded(true)
                }
              }}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                showStops
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <MapPinIcon className="h-4 w-4" />
              <span className="text-sm">
                {showStops ? 'Hide Stops' : 'Show Stops'}
              </span>
            </button>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            {/* Voice Settings Button */}
            <button
              onClick={() => setShowVoiceSettings(true)}
              className={`p-2 rounded-full transition-colors ${
                voiceSettings.enabled
                  ? 'text-blue-600 bg-blue-100 hover:bg-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Voice Settings"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Real Mapbox Container */}
      <div className="relative">
        <div
          ref={mapRef}
          className="h-96 w-full"
          style={{ minHeight: '400px' }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
            <div className="text-center">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Loading Mapbox...</p>
              <p className="text-sm text-gray-500 mt-1">Initializing interactive map</p>
            </div>
          </div>
        )}

        {/* Navigation Controls Overlay */}
        {showNavigation && !isLoading && (
          <div className="absolute top-16 left-4 right-4 z-30">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={isNavigating ? stopNavigation : startNavigation}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isNavigating
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isNavigating ? 'Stop Navigation' : 'Start Navigation'}
                  </button>

                  {isNavigating && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span>GPS Active</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    voiceEnabled
                      ? 'bg-green-100 hover:bg-green-200 text-green-600'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  title={voiceEnabled ? 'Disable Voice Guidance' : 'Enable Voice Guidance'}
                >
                  <SpeakerWaveIcon className="h-5 w-5" />
                </button>
              </div>

              {isNavigating && userLocation && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Current Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GPS Status Information */}
        {(isTrackingLocation || locationError) && !navigationStarted && (
          <div className="absolute bottom-20 left-4 right-4 z-30">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              {isTrackingLocation && userLocation && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-gray-900">GPS Active</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">
                      Lat: {userLocation.lat.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Lng: {userLocation.lng.toFixed(6)}
                    </p>
                    {locationAccuracy && (
                      <p className="text-xs text-gray-500">
                        Accuracy: ±{Math.round(locationAccuracy)}m
                      </p>
                    )}
                    {userHeading !== null && (
                      <p className="text-xs text-gray-500">
                        Heading: {Math.round(userHeading)}°
                      </p>
                    )}
                  </div>
                </div>
              )}

              {locationError && (
                <div className="flex items-center space-x-2 text-red-600">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span className="text-sm">{locationError}</span>
                  <button
                    onClick={startLocationTracking}
                    className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Enhanced Route Legend */}
      {routes.length > 0 && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0">
          <RouteLegend
            routes={routes}
            selectedRoute={selectedRoute}
            onRouteSelect={(routeId) => setSelectedRoute(selectedRoute === routeId ? null : routeId)}
          />
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute right-4 top-20 flex flex-col space-y-2">
        <button className="bg-white shadow-lg p-2 rounded-lg hover:bg-gray-50">
          <span className="text-lg">+</span>
        </button>
        <button className="bg-white shadow-lg p-2 rounded-lg hover:bg-gray-50">
          <span className="text-lg">−</span>
        </button>
      </div>

      {/* Voice Settings Modal */}
      <VoiceSettings
        isOpen={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
        onSettingsChange={handleVoiceSettingsChange}
      />
    </div>
  )
}
