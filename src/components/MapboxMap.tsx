'use client'

import { apiService } from '@/services/apiService'
import { useStore } from '@/store/useStore'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import React, { useEffect, useRef, useState } from 'react'

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

interface MapboxMapProps {
  className?: string
}

// Agency color mapping for visual distinction
const AGENCY_COLORS = {
  'Metro Mass Transit': '#EF4444', // Red
  'STC (State Transport Corporation)': '#3B82F6', // Blue
  'Trotro Operators': '#10B981', // Green
  'VIP Transport': '#F59E0B', // Amber
  'OA Travel & Tours': '#8B5CF6', // Purple
  'default': '#6B7280' // Gray
}

// Route type colors
const ROUTE_TYPE_COLORS = {
  0: '#3B82F6', // Tram, Streetcar, Light rail
  1: '#10B981', // Subway, Metro
  2: '#EF4444', // Rail
  3: '#F59E0B', // Bus
  4: '#8B5CF6', // Ferry
  5: '#EC4899', // Cable tram
  6: '#06B6D4', // Aerial lift
  7: '#84CC16'  // Funicular
}

const MapboxMap: React.FC<MapboxMapProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memory leak prevention
  const { safeSetInterval, safeAddEventListener, addCleanup } = useMemoryLeakPrevention()
  const [gtfsStops, setGtfsStops] = useState<any[]>([])
  const [gtfsRoutes, setGtfsRoutes] = useState<any[]>([])
  const [gtfsAgencies, setGtfsAgencies] = useState<any[]>([])
  const [gtfsShapes, setGtfsShapes] = useState<any>({})
  const [gtfsTrips, setGtfsTrips] = useState<any[]>([])
  const [simulatedVehicles, setSimulatedVehicles] = useState<any[]>([])
  const [stopTimesCache, setStopTimesCache] = useState<Map<string, any>>(new Map())
  const [layerVisibility, setLayerVisibility] = useState({
    stops: true,
    routes: true,
    vehicles: true,
    shapes: true
  })
  const [mapStyle, setMapStyle] = useState<'standard' | 'streets'>('standard')
  const [isEnhancedMode, setIsEnhancedMode] = useState(true)
  const { vehicles, routes, trips, connected } = useStore()

  // Fetch GTFS data from backend API
  useEffect(() => {
    const fetchGTFSData = async () => {
      try {
        console.log('🗺️ Loading comprehensive GTFS data for enhanced map visualization...')

        const [stopsData, routesData, agenciesData, shapesData, tripsData] = await Promise.all([
          apiService.getStops().catch(err => {
            console.warn('⚠️ Failed to load stops for map:', err)
            return []
          }),
          apiService.getRoutes().catch(err => {
            console.warn('⚠️ Failed to load routes for map:', err)
            return []
          }),
          apiService.getAgencies().catch(err => {
            console.warn('⚠️ Failed to load agencies for map:', err)
            return []
          }),
          fetch(`http://localhost:8000/api/v1/gtfs/geojson/shapes`)
            .then(res => res.json())
            .catch(err => {
              console.warn('⚠️ Failed to load shapes for map:', err)
              return { type: 'FeatureCollection', features: [] }
            }),
          apiService.getTrips().catch(err => {
            console.warn('⚠️ Failed to load trips for map:', err)
            return []
          })
        ])

        console.log('✅ Enhanced GTFS data loaded for map:', {
          stops: stopsData?.length || 0,
          routes: routesData?.length || 0,
          agencies: agenciesData?.length || 0,
          shapes: shapesData?.features?.length || 0,
          trips: tripsData?.length || 0
        })

        setGtfsStops(stopsData || [])
        setGtfsRoutes(routesData || [])
        setGtfsAgencies(agenciesData || [])
        setGtfsShapes(shapesData || { type: 'FeatureCollection', features: [] })
        setGtfsTrips(tripsData || [])

        // Start realistic vehicle simulation with backend trip data
        if (tripsData && tripsData.length > 0 && stopsData && stopsData.length > 0) {
          startVehicleSimulation(tripsData, stopsData, shapesData)
        }

        console.log('📊 GTFS Data Summary:')
        console.log(`  🚏 Stops: ${stopsData?.length || 0}`)
        console.log(`  🚌 Routes: ${routesData?.length || 0}`)
        console.log(`  🚗 Trips: ${tripsData?.length || 0}`)
        console.log(`  🗺️ Shapes: ${shapesData?.features?.length || 0}`)
      } catch (error) {
        console.error('❌ Failed to load GTFS data for map:', error)
      }
    }

    fetchGTFSData()
  }, [])

  // Update vehicle simulation when WebSocket trip data changes
  useEffect(() => {
    if (trips.length > 0 && gtfsStops.length > 0 && gtfsShapes.features) {
      console.log('🔄 Updating vehicle simulation with WebSocket trip data...')
      console.log(`📅 Received ${trips.length} trips from WebSocket`)

      // Convert WebSocket trips to our format and update simulation
      const webSocketTrips = trips.map(trip => ({
        trip_id: trip.trip_id,
        route_id: trip.route_id,
        service_id: trip.service_id,
        shape_id: trip.shape_id,
        route_short_name: trip.route_info?.route_short_name || trip.route_id,
        route_long_name: trip.route_info?.route_long_name || '',
        stop_times: trip.stop_times || []
      }))

      // Update vehicles with real WebSocket trip data
      startVehicleSimulation(webSocketTrips, gtfsStops, gtfsShapes)
    }
  }, [trips, gtfsStops, gtfsShapes])

  // Function to switch map styles
  const switchMapStyle = (newStyle: 'standard' | 'streets') => {
    if (!map.current) return

    const styleUrl = newStyle === 'standard'
      ? 'mapbox://styles/mapbox/standard'
      : 'mapbox://styles/mapbox/streets-v12'

    const newEnhancedMode = newStyle === 'standard'

    // Update state
    setMapStyle(newStyle)
    setIsEnhancedMode(newEnhancedMode)

    // Switch map style
    map.current.setStyle(styleUrl)

    // Update pitch based on mode
    map.current.easeTo({
      pitch: newEnhancedMode ? 60 : 0,
      duration: 1000
    })
  }

  // Fetch stop times for a specific trip
  const fetchStopTimesForTrip = async (tripId: string) => {
    if (stopTimesCache.has(tripId)) {
      return stopTimesCache.get(tripId)
    }

    try {
      const stopTimesData = await apiService.getStopTimesByTrip(tripId)
      setStopTimesCache(prev => new Map(prev.set(tripId, stopTimesData)))
      console.log(`📅 Loaded stop times for trip ${tripId}:`, stopTimesData.stop_count, 'stops')
      return stopTimesData
    } catch (error) {
      console.warn(`⚠️ Failed to fetch stop times for trip ${tripId}:`, error)
      return null
    }
  }

  // Enhanced vehicle simulation with real-time WebSocket integration
  const startVehicleSimulation = (trips: any[], stops: any[], shapes: any) => {
    console.log('🚌 Starting enhanced vehicle simulation with real-time backend data...')
    console.log(`📊 Data sources: ${trips.length} trips, ${stops.length} stops, ${shapes?.features?.length || 0} shapes`)

    // Create 3 unique buses with different characteristics
    const busTypes = [
      {
        name: 'Express Bus',
        icon: '🚌',
        color: '#3B82F6',
        speed: 45,
        capacity: 60,
        type: 'express',
        description: 'High-speed express service'
      },
      {
        name: 'City Bus',
        icon: '🚐',
        color: '#10B981',
        speed: 30,
        capacity: 40,
        type: 'city',
        description: 'Standard city transport'
      },
      {
        name: 'Mini Bus',
        icon: '🚙',
        color: '#F59E0B',
        speed: 25,
        capacity: 20,
        type: 'mini',
        description: 'Local area shuttle'
      }
    ]

    const activeTrips = trips.slice(0, 20) // Create up to 20 buses to match WebSocket data
    const simulatedVehicles = activeTrips.map((trip, index) => {
      const busType = busTypes[index % busTypes.length]
      // Find route shape for this trip
      const routeShape = shapes.features?.find((shape: any) =>
        shape.properties?.route_id === trip.route_id
      )

      // Get stops for this trip - try to fetch real stop times
      let tripStops = stops.slice(0, 8) // Fallback: first 8 stops

      // Attempt to fetch stop times asynchronously (will update later)
      fetchStopTimesForTrip(trip.trip_id).then(stopTimesData => {
        if (stopTimesData && stopTimesData.stop_times) {
          // Update vehicle with real stop times data
          setSimulatedVehicles(prevVehicles =>
            prevVehicles.map(vehicle =>
              vehicle.tripId === trip.trip_id
                ? {
                    ...vehicle,
                    stops: stopTimesData.stop_times.map((st: any) => ({
                      stop_id: st.stop_id,
                      stop_name: st.stop_name || 'Unknown Stop',
                      stop_lat: st.stop_lat,
                      stop_lon: st.stop_lon,
                      arrival_time: st.arrival_time,
                      departure_time: st.departure_time,
                      stop_sequence: st.stop_sequence
                    })),
                    hasRealSchedule: true,
                    stopTimes: stopTimesData.stop_times
                  }
                : vehicle
            )
          )
        }
      })

      return {
        id: `${busType.type.toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
        tripId: trip.trip_id,
        routeId: trip.route_id,
        routeName: trip.route_short_name || `Route ${index + 1}`,
        currentStopIndex: 0,
        stops: tripStops,
        shape: routeShape?.geometry?.coordinates || [],
        position: tripStops[0] ? [tripStops[0].stop_lon, tripStops[0].stop_lat] : [-0.187, 5.6037],
        bearing: (index * 45) % 360,
        speed: busType.speed, // Use bus type specific speed
        isAtStop: false,
        stopDuration: 0,
        lastUpdate: typeof window !== 'undefined' ? Date.now() : 0,
        hasRealSchedule: false,
        stopTimes: [],
        // Bus type specific properties
        busType: busType.type,
        busName: busType.name,
        busIcon: busType.icon,
        busColor: busType.color,
        capacity: busType.capacity,
        description: busType.description,
        dataSource: trips.length > 0 && trips[0].stop_times ? 'websocket' : 'static' // Track data source
      }
    })

    setSimulatedVehicles(simulatedVehicles)

    // Start simulation loop with memory leak prevention
    const simulationInterval = safeSetInterval(() => {
      setSimulatedVehicles(prevVehicles =>
        prevVehicles.map(vehicle => updateVehiclePosition(vehicle, stops))
      )
    }, 500) // Update every 0.5 seconds for smoother movement

    // Cleanup is handled automatically by useMemoryLeakPrevention
    return () => {}
  }

  // Advanced trip-following vehicle system with GTFS schedule adherence
  const updateVehiclePosition = (vehicle: any, stops: any[]) => {
    const now = typeof window !== 'undefined' ? Date.now() : 0
    const timeDelta = vehicle.lastUpdate ? (now - vehicle.lastUpdate) / 1000 : 2 // seconds

    // Initialize trip following if not set
    if (!vehicle.tripStartTime) {
      vehicle.tripStartTime = now
      vehicle.scheduleOffset = 0 // Offset from scheduled times
    }

    // If at stop, handle realistic stop behavior
    if (vehicle.isAtStop) {
      vehicle.stopDuration += timeDelta

      // Calculate realistic stop time based on bus type and schedule
      let stopTime = 30 // Default 30 seconds
      if (vehicle.busType === 'express') stopTime = 20 // Express buses stop less
      if (vehicle.busType === 'mini') stopTime = 45 // Mini buses stop longer

      // Add schedule adherence - try to match GTFS departure times
      if (vehicle.hasRealSchedule && vehicle.stopTimes.length > 0) {
        const currentStopTime = vehicle.stopTimes[vehicle.currentStopIndex]
        if (currentStopTime && currentStopTime.departure_time) {
          // Parse departure time and add realistic delay
          const [hours, minutes, seconds] = currentStopTime.departure_time.split(':').map(Number)
          const scheduledTime = hours * 3600 + minutes * 60 + seconds
          const currentTime = ((now - vehicle.tripStartTime) / 1000) % 86400 // Seconds in day

          // If we're ahead of schedule, wait longer
          if (currentTime < scheduledTime + vehicle.scheduleOffset) {
            stopTime = Math.max(stopTime, (scheduledTime + vehicle.scheduleOffset - currentTime))
          }
        }
      }

      if (vehicle.stopDuration >= stopTime) {
        vehicle.isAtStop = false
        vehicle.stopDuration = 0
        vehicle.currentStopIndex = (vehicle.currentStopIndex + 1) % vehicle.stops.length

        // Add realistic schedule variance (buses can be early/late)
        vehicle.scheduleOffset += (Math.random() - 0.5) * 60 // ±30 seconds variance
      }
      vehicle.lastUpdate = now
      return vehicle
    }

    // Enhanced movement: Follow actual route shape with schedule awareness
    if (vehicle.shape && vehicle.shape.length > 0) {
      // Initialize shape progress if not set
      if (vehicle.shapeProgress === undefined) {
        vehicle.shapeProgress = 0
      }

      // Calculate movement speed based on schedule adherence
      let effectiveSpeed = vehicle.speed
      if (vehicle.hasRealSchedule && vehicle.stopTimes.length > 0) {
        const currentStopTime = vehicle.stopTimes[vehicle.currentStopIndex]
        if (currentStopTime && currentStopTime.arrival_time) {
          const [hours, minutes, seconds] = currentStopTime.arrival_time.split(':').map(Number)
          const scheduledArrival = hours * 3600 + minutes * 60 + seconds
          const currentTime = ((now - vehicle.tripStartTime) / 1000) % 86400

          // Adjust speed to meet schedule
          if (currentTime < scheduledArrival + vehicle.scheduleOffset) {
            effectiveSpeed *= 0.8 // Slow down if ahead
          } else {
            effectiveSpeed *= 1.2 // Speed up if behind
          }
        }
      }

      // Calculate movement along shape
      const moveDistance = (effectiveSpeed / 3600) * timeDelta * 0.008
      vehicle.shapeProgress += moveDistance

      // If we've completed the shape, reset to beginning (loop)
      if (vehicle.shapeProgress >= 1) {
        vehicle.shapeProgress = 0
        vehicle.currentStopIndex = 0
        vehicle.tripStartTime = now // Start new trip
      }

      // Interpolate position along shape
      const shapeIndex = Math.floor(vehicle.shapeProgress * (vehicle.shape.length - 1))
      const nextIndex = Math.min(shapeIndex + 1, vehicle.shape.length - 1)
      const localProgress = (vehicle.shapeProgress * (vehicle.shape.length - 1)) - shapeIndex

      if (vehicle.shape[shapeIndex] && vehicle.shape[nextIndex]) {
        const currentPoint = vehicle.shape[shapeIndex]
        const nextPoint = vehicle.shape[nextIndex]

        // Smooth interpolation between shape points
        vehicle.position = [
          currentPoint[0] + (nextPoint[0] - currentPoint[0]) * localProgress,
          currentPoint[1] + (nextPoint[1] - currentPoint[1]) * localProgress
        ]

        // Calculate realistic bearing based on shape direction
        vehicle.bearing = Math.atan2(
          nextPoint[0] - currentPoint[0],
          nextPoint[1] - currentPoint[1]
        ) * 180 / Math.PI

        // Check if approaching next stop
        const currentStop = vehicle.stops[vehicle.currentStopIndex]
        if (currentStop) {
          const stopDistance = Math.sqrt(
            Math.pow(vehicle.position[0] - currentStop.stop_lon, 2) +
            Math.pow(vehicle.position[1] - currentStop.stop_lat, 2)
          )

          // Arrive at stop with realistic detection distance
          if (stopDistance < 0.002) {
            vehicle.position = [currentStop.stop_lon, currentStop.stop_lat]
            vehicle.isAtStop = true
            vehicle.stopDuration = 0
          }
        }
      }
    } else {
      // Fallback: Direct movement to stops with schedule awareness
      const currentStop = vehicle.stops[vehicle.currentStopIndex]
      if (currentStop) {
        const targetLng = currentStop.stop_lon
        const targetLat = currentStop.stop_lat
        const currentLng = vehicle.position[0]
        const currentLat = vehicle.position[1]

        const distance = Math.sqrt(
          Math.pow(targetLng - currentLng, 2) + Math.pow(targetLat - currentLat, 2)
        )

        if (distance < 0.001) {
          vehicle.position = [targetLng, targetLat]
          vehicle.isAtStop = true
          vehicle.stopDuration = 0
        } else {
          const moveDistance = (vehicle.speed / 3600) * timeDelta * 0.05 // Increased speed multiplier
          const ratio = Math.min(moveDistance / distance, 1)

          vehicle.position = [
            currentLng + (targetLng - currentLng) * ratio,
            currentLat + (targetLat - currentLat) * ratio
          ]

          vehicle.bearing = Math.atan2(targetLng - currentLng, targetLat - currentLat) * 180 / Math.PI
        }
      }
    }

    vehicle.lastUpdate = now
    return vehicle
  }

  // Cleanup function with comprehensive memory leak prevention
  useEffect(() => {
    addCleanup(() => {
      if (map.current) {
        try {
          console.log('🗺️ Cleaning up Mapbox map instance...')

          // Remove all event listeners
          map.current.off()

          // Remove all sources and layers
          const style = map.current.getStyle()
          if (style && style.sources) {
            Object.keys(style.sources).forEach(sourceId => {
              try {
                if (map.current!.getSource(sourceId)) {
                  map.current!.removeSource(sourceId)
                }
              } catch (e) {
                console.warn(`Failed to remove source ${sourceId}:`, e)
              }
            })
          }

          // Remove the map instance
          map.current.remove()
          console.log('✅ Mapbox map cleaned up successfully')
        } catch (error) {
          console.warn('Error during map cleanup:', error)
        } finally {
          map.current = null
        }
      }
    })
  }, [addCleanup])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    try {
      const styleUrl = mapStyle === 'standard'
        ? 'mapbox://styles/mapbox/standard'
        : 'mapbox://styles/mapbox/streets-v12'

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [-0.187, 5.6037], // Accra, Ghana
        zoom: 11, // Slightly zoomed out to show more area
        pitch: isEnhancedMode ? 60 : 0, // Enhanced 3D view or flat
        bearing: 0,
        antialias: true // Better rendering quality
      })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')

      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      }), 'bottom-right')

      map.current.on('style.load', () => {
        setIsLoading(false)

        // Configure Mapbox Standard style with dynamic lighting (only for standard style)
        if (mapStyle === 'standard') {
          map.current!.setConfigProperty('basemap', 'lightPreset', 'dusk')
          map.current!.setConfigProperty('basemap', 'show3dObjects', true)
          map.current!.setConfigProperty('basemap', 'showTransitLabels', true)
        }

        // Add vehicle source with error handling
        try {
          map.current!.addSource('vehicles', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          })
        } catch (error) {
          console.warn('Error adding vehicles source:', error)
        }

        // Load bus icon image
        if (!map.current!.hasImage('bus-icon')) {
          try {
            // Create a simple bus icon using ImageData
            const size = 32
            const canvas = document.createElement('canvas')
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext('2d')

            if (ctx) {
              // Clear canvas with transparent background
              ctx.clearRect(0, 0, size, size)

              // Draw bus shape
              ctx.fillStyle = '#3B82F6'
              ctx.fillRect(4, 8, 24, 16)
              ctx.fillStyle = '#FFFFFF'
              ctx.fillRect(8, 12, 4, 4)
              ctx.fillRect(20, 12, 4, 4)
              ctx.fillStyle = '#1F2937'
              ctx.beginPath()
              ctx.arc(10, 26, 2, 0, 2 * Math.PI)
              ctx.arc(22, 26, 2, 0, 2 * Math.PI)
              ctx.fill()

              // Get ImageData and add to map
              const imageData = ctx.getImageData(0, 0, size, size)
              map.current!.addImage('bus-icon', imageData)
            }
          } catch (error) {
            console.warn('Failed to create bus icon:', error)
            // Fallback: use a simple circle layer instead
          }
        }

        // Add vehicle layer with bus icons (top slot for visibility)
        // Try symbol layer first, fallback to circle if icon fails
        try {
          map.current!.addLayer({
            id: 'vehicles',
            type: 'symbol',
            source: 'vehicles',
            slot: 'top', // Place above POI labels
            layout: {
              'icon-image': 'bus-icon',
              'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 0.8,
                15, 1.0,
                20, 1.2
              ],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true
            },
            paint: {
              'icon-opacity': 0.9
            }
          })
        } catch (error) {
          console.warn('Failed to add symbol layer, using circle fallback:', error)
          // Fallback to circle layer
          map.current!.addLayer({
            id: 'vehicles',
            type: 'circle',
            source: 'vehicles',
            slot: 'top',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 6,
                15, 8,
                20, 10
              ],
              'circle-color': '#3B82F6',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FFFFFF',
              'circle-opacity': 0.9
            }
          })
        }

        // Add vehicle labels
        map.current!.addLayer({
          id: 'vehicles-labels',
          type: 'symbol',
          source: 'vehicles',
          slot: 'top',
          layout: {
            'text-field': [
              'case',
              ['==', ['get', 'status'], 'At Stop'], '🚏', // Stop icon when at stop
              ['==', ['get', 'busType'], 'express'], '🚌', // Express bus icon
              ['==', ['get', 'busType'], 'city'], '🚐', // City bus icon
              ['==', ['get', 'busType'], 'mini'], '🚙', // Mini bus icon
              '🚌' // Default bus icon
            ],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 14,
              15, 16,
              20, 20
            ],
            'text-allow-overlap': true,
            'text-ignore-placement': true
          },
          paint: {
            'text-color': '#FFFFFF',
            'text-emissive-strength': 1.0 // Bright text for visibility
          }
        })

        // Add route source
        map.current!.addSource('routes', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        })

        // Add route layer with dynamic colors (middle slot above roads)
        map.current!.addLayer({
          id: 'routes',
          type: 'line',
          source: 'routes',
          slot: 'middle', // Above roads, behind 3D buildings
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': ['case',
              ['has', 'color'], ['get', 'color'],
              '#10b981'
            ],
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 2,
              15, 4,
              20, 8
            ],
            'line-opacity': 0.8,
            'line-emissive-strength': 0.6 // Subtle glow for visibility
          }
        })

        // Add GTFS stops source
        map.current!.addSource('gtfs-stops', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        })

        // Add GTFS stops layer with terminal/stop differentiation (middle slot)
        map.current!.addLayer({
          id: 'gtfs-stops',
          type: 'circle',
          source: 'gtfs-stops',
          slot: 'middle', // Above roads, visible but not blocking labels
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, ['case', ['==', ['get', 'type'], 'terminal'], 4, 2],
              15, ['case', ['==', ['get', 'type'], 'terminal'], 6, 4],
              20, ['case', ['==', ['get', 'type'], 'terminal'], 10, 6]
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'type'], 'terminal'], '#DC2626', // Dark red for terminals
              '#EF4444' // Regular red for stops
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF',
            'circle-opacity': 0.9,
            'circle-emissive-strength': 0.7 // Glow for better visibility
          }
        })

        // Add GTFS stop labels for terminals
        map.current!.addLayer({
          id: 'gtfs-stops-labels',
          type: 'symbol',
          source: 'gtfs-stops',
          layout: {
            'text-field': ['get', 'stop_name'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
            'text-size': 10
          },
          paint: {
            'text-color': '#1f2937',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1
          },
          filter: ['==', ['get', 'type'], 'terminal']
        })

        // Add GTFS route shapes source
        map.current!.addSource('gtfs-shapes', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        })

        // Add GTFS route shapes layer (bottom slot, above land but below roads)
        map.current!.addLayer({
          id: 'gtfs-shapes',
          type: 'line',
          source: 'gtfs-shapes',
          slot: 'bottom', // Above polygons (land, water) but below roads
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': ['case',
              ['has', 'color'], ['get', 'color'],
              '#8B5CF6'
            ],
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8, 1,
              12, 3,
              16, 5
            ],
            'line-opacity': 0.7,
            'line-emissive-strength': 0.4 // Subtle glow
          }
        })

        // Add agencies source for agency-specific styling
        map.current!.addSource('agencies', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        })

        // Add traditional event handlers for better stability
        // Wait for layers to be added before attaching event listeners
        setTimeout(() => {
          if (!map.current) return

          // GTFS Stops click handler
          map.current.on('click', 'gtfs-stops', (e) => {
          const features = e.features
          if (features && features.length > 0) {
            const feature = features[0]
            const coordinates = (feature.geometry as any).coordinates.slice()
            const properties = feature.properties

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`
                <div class="p-4 bg-white rounded-lg shadow-lg">
                  <h3 class="font-bold text-lg mb-2 text-gray-800">${properties?.stop_name || 'Unknown Stop'}</h3>
                  <div class="space-y-1 text-sm">
                    <p><span class="font-medium text-gray-700">ID:</span> ${properties?.stop_id || 'N/A'}</p>
                    <p><span class="font-medium text-gray-700">Type:</span> <span class="capitalize">${properties?.type || 'stop'}</span></p>
                    ${properties?.stop_code ? `<p><span class="font-medium text-gray-700">Code:</span> ${properties.stop_code}</p>` : ''}
                  </div>
                </div>
              `)
              .addTo(map.current!)
            }
          })

          // Vehicle click handler
          map.current.on('click', 'vehicles', (e) => {
          const features = e.features
          if (features && features.length > 0) {
            const feature = features[0]
            const coordinates = (feature.geometry as any).coordinates.slice()
            const properties = feature.properties

            const isAtStop = properties?.status === 'At Stop'
            const icon = isAtStop ? '🚏' : '🚌'
            const statusColor = isAtStop ? 'text-orange-600' : 'text-blue-600'

            // Find the vehicle data to get comprehensive trip info
            const vehicleData = simulatedVehicles.find(v => v.id === properties?.id)
            const hasSchedule = vehicleData?.hasRealSchedule ? '📅 Real Schedule' : '🔄 Simulated'
            const nextStop = vehicleData?.stops[vehicleData.currentStopIndex]
            const arrivalTime = nextStop?.arrival_time ? `Arrives: ${nextStop.arrival_time}` : ''
            const busIcon = properties?.busIcon || icon
            const busName = properties?.busName || 'Unknown Bus'
            const capacity = properties?.capacity || 'Unknown'
            const description = properties?.description || ''

            // Calculate schedule adherence
            let scheduleStatus = ''
            if (vehicleData?.scheduleOffset !== undefined) {
              const offset = Math.round(vehicleData.scheduleOffset)
              if (offset > 30) scheduleStatus = `🔴 ${offset}s late`
              else if (offset < -30) scheduleStatus = `🟢 ${Math.abs(offset)}s early`
              else scheduleStatus = '🟡 On time'
            }

            // Trip progress
            const tripProgress = vehicleData?.shapeProgress ?
              `${Math.round(vehicleData.shapeProgress * 100)}%` : 'N/A'

            // Data source indicator
            const dataSource = vehicleData?.dataSource === 'websocket' ?
              '🔴 Live WebSocket Data' : '📁 Static GTFS Data'

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`
                <div class="p-4 bg-white rounded-lg shadow-lg max-w-sm">
                  <h3 class="font-bold text-lg mb-2 ${statusColor}">${busIcon} ${busName}</h3>
                  <div class="text-xs text-gray-600 mb-2">${description}</div>
                  <div class="space-y-1 text-sm">
                    <p><span class="font-medium text-gray-700">Vehicle ID:</span> ${properties?.id || 'Unknown'}</p>
                    <p><span class="font-medium text-gray-700">Route:</span> ${properties?.route || 'N/A'}</p>
                    <p><span class="font-medium text-gray-700">Capacity:</span> ${capacity} passengers</p>
                    <p><span class="font-medium text-gray-700">Status:</span> <span class="${statusColor} font-medium">${properties?.status || 'Moving'}</span></p>
                    <p><span class="font-medium text-gray-700">Schedule:</span> ${hasSchedule}</p>
                    <p><span class="font-medium text-gray-700">Data Source:</span> ${dataSource}</p>
                    ${scheduleStatus ? `<p><span class="font-medium text-gray-700">Adherence:</span> ${scheduleStatus}</p>` : ''}
                    <p><span class="font-medium text-gray-700">Trip Progress:</span> ${tripProgress}</p>
                    ${properties?.currentStop ? `<p><span class="font-medium text-gray-700">Next Stop:</span> ${properties.currentStop}</p>` : ''}
                    ${arrivalTime ? `<p><span class="font-medium text-gray-700">${arrivalTime}</span></p>` : ''}
                    ${properties?.tripId ? `<p><span class="font-medium text-gray-700">Trip ID:</span> ${properties.tripId}</p>` : ''}
                  </div>
                </div>
              `)
              .addTo(map.current!)
            }
          })

          // Hover effects for cursor changes
          map.current.on('mouseenter', 'gtfs-stops', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = 'pointer'
            }
          })
          map.current.on('mouseleave', 'gtfs-stops', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = ''
            }
          })
          map.current.on('mouseenter', 'vehicles', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = 'pointer'
            }
          })
          map.current.on('mouseleave', 'vehicles', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = ''
            }
          })
        }, 100) // Small delay to ensure layers are ready
      })

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e)
        setError('Failed to load map')
        setIsLoading(false)
      })

    } catch (err) {
      console.error('Map initialization error:', err)
      setError('Failed to initialize map')
      setIsLoading(false)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update vehicles on map with error handling (GTFS-based simulation only)
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return

    try {
      // Use only simulated vehicles based on GTFS data
      const vehicleFeatures = simulatedVehicles.map(vehicle => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: vehicle.position
        },
        properties: {
          id: vehicle.id,
          route: vehicle.routeName,
          bearing: vehicle.bearing || 0,
          status: vehicle.isAtStop ? 'At Stop' : 'Moving',
          tripId: vehicle.tripId,
          currentStop: vehicle.stops[vehicle.currentStopIndex]?.stop_name || 'Unknown',
          busType: vehicle.busType,
          busName: vehicle.busName,
          busIcon: vehicle.busIcon,
          busColor: vehicle.busColor,
          capacity: vehicle.capacity,
          description: vehicle.description
        }
      }))

      const source = map.current.getSource('vehicles') as mapboxgl.GeoJSONSource
      if (source && source.setData) {
        source.setData({
          type: 'FeatureCollection',
          features: vehicleFeatures
        })
      }
    } catch (error) {
      console.warn('Error updating vehicle data:', error)
    }
  }, [simulatedVehicles])

  // Note: Removed hardcoded WebSocket routes - now using only GTFS routes from trained data

  // Update GTFS stops on map with enhanced features
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || gtfsStops.length === 0) return

    const stopFeatures = gtfsStops.map(stop => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [parseFloat(stop.stop_lon), parseFloat(stop.stop_lat)]
      },
      properties: {
        stop_id: stop.stop_id,
        stop_name: stop.stop_name,
        stop_code: stop.stop_code,
        type: stop.stop_id?.toString().startsWith('T') ? 'terminal' : 'stop'
      }
    }))

    const source = map.current.getSource('gtfs-stops') as mapboxgl.GeoJSONSource
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: stopFeatures
      })
    }
  }, [gtfsStops])

  // Update GTFS shapes on map
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || !gtfsShapes.features) return

    const source = map.current.getSource('gtfs-shapes') as mapboxgl.GeoJSONSource
    if (source) {
      source.setData(gtfsShapes)
    }
  }, [gtfsShapes])

  // Update GTFS routes on map
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || gtfsRoutes.length === 0) return

    const routeFeatures = gtfsRoutes.map(route => ({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: route.coordinates || []
      },
      properties: {
        id: route.route_id,
        name: route.route_short_name,
        longName: route.route_long_name
      }
    }))

    const source = map.current.getSource('gtfs-routes') as mapboxgl.GeoJSONSource
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: routeFeatures
      })
    }
  }, [gtfsRoutes])

  if (error) {
    return (
      <div className={`w-full h-full bg-red-50 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <div className="text-red-500 text-lg font-semibold mb-2">Map Error</div>
          <div className="text-red-600 text-sm">{error}</div>
          <div className="text-xs text-red-500 mt-2">Check console for details</div>
        </div>
      </div>
    )
  }

  return (
    <MapErrorBoundary>
      <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading Mapbox...</p>
            <p className="text-sm text-gray-500 mt-2">Initializing real-time transport map</p>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full shadow-md">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs font-medium text-gray-700">
            {connected ? 'Live Data' : 'Disconnected'}
          </span>
        </div>
      </div>



      {/* Enhanced Layer Controls & Legend */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
          🎛️ Map Controls & Legend
        </h3>

        {/* Map Style Switcher */}
        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Map Style</h4>
          <div className="flex space-x-2">
            <button
              onClick={() => switchMapStyle('standard')}
              className={`flex-1 text-xs p-2 rounded border transition-colors ${
                mapStyle === 'standard'
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              🌟 Enhanced v3
            </button>
            <button
              onClick={() => switchMapStyle('streets')}
              className={`flex-1 text-xs p-2 rounded border transition-colors ${
                mapStyle === 'streets'
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              🗺️ Classic
            </button>
          </div>
        </div>

        {/* Enhanced Controls (only for v3 style) */}
        {isEnhancedMode && (
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Lighting & 3D</h4>
            <select
              className="w-full text-xs p-1 border rounded"
              onChange={(e) => {
                if (map.current && mapStyle === 'standard') {
                  map.current.setConfigProperty('basemap', 'lightPreset', e.target.value)
                }
              }}
              defaultValue="dusk"
            >
              <option value="day">☀️ Day</option>
              <option value="dusk">🌅 Dusk</option>
              <option value="dawn">🌄 Dawn</option>
              <option value="night">🌙 Night</option>
            </select>
            <label className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                defaultChecked={true}
                onChange={(e) => {
                  if (map.current && mapStyle === 'standard') {
                    map.current.setConfigProperty('basemap', 'show3dObjects', e.target.checked)
                  }
                }}
                className="rounded"
              />
              <span className="text-gray-700">🏢 3D Buildings</span>
            </label>
          </div>
        )}

        {/* Reset View Button */}
        <div className="mb-4">
          <button
            onClick={() => {
              if (map.current) {
                map.current.flyTo({
                  center: [-0.187, 5.6037],
                  zoom: 11,
                  pitch: isEnhancedMode ? 60 : 0,
                  bearing: 0,
                  duration: 2000
                })
              }
            }}
            className="w-full text-xs p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition-colors"
          >
            🎯 Reset View
          </button>
        </div>

        {/* Layer Toggles */}
        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Layers</h4>
          {Object.entries(layerVisibility).map(([layer, visible]) => (
            <label key={layer} className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => {
                  const newVisibility = { ...layerVisibility, [layer]: e.target.checked }
                  setLayerVisibility(newVisibility)

                  // Toggle layer visibility on map
                  if (map.current) {
                    const layerId = layer === 'shapes' ? 'gtfs-shapes' :
                                   layer === 'stops' ? 'gtfs-stops' : layer
                    map.current.setLayoutProperty(
                      layerId,
                      'visibility',
                      e.target.checked ? 'visible' : 'none'
                    )
                  }
                }}
                className="rounded"
              />
              <span className="capitalize text-gray-700">{layer}</span>
            </label>
          ))}
        </div>


      </div>
    </div>
    </MapErrorBoundary>
  )
}

export default MapboxMap
