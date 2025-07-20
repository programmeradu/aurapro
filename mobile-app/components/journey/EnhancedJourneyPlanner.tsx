'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPinIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TruckIcon,
  UserGroupIcon,
  BoltIcon,
  StarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { apiService, JourneyPlan, Location, UberEstimate } from '@/services/apiService'

interface JourneyPlannerProps {
  className?: string
  onJourneySelect?: (journey: any) => void
}

interface PlaceSearchResult {
  name: string
  address: string
  coordinates: Location
  category: string
  distance?: number
}

interface RouteOption {
  id: string
  type: 'public' | 'uber' | 'walking' | 'mixed'
  duration: number
  cost: number
  steps: Array<{
    mode: string
    instruction: string
    duration: number
    distance: number
  }>
  emissions: number
  comfort_score: number
  reliability_score: number
}

export function EnhancedJourneyPlanner({ className = '', onJourneySelect }: JourneyPlannerProps) {
  // State management
  const [origin, setOrigin] = useState<PlaceSearchResult | null>(null)
  const [destination, setDestination] = useState<PlaceSearchResult | null>(null)
  const [originQuery, setOriginQuery] = useState('')
  const [destinationQuery, setDestinationQuery] = useState('')
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSearchResult[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSearchResult[]>([])
  const [routes, setRoutes] = useState<RouteOption[]>([])
  const [uberOptions, setUberOptions] = useState<UberEstimate[]>([])
  const [isPlanning, setIsPlanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null)
  const [showRoutes, setShowRoutes] = useState(false)
  const [departureTime, setDepartureTime] = useState('now')

  // Refs for input management
  const originInputRef = useRef<HTMLInputElement>(null)
  const destinationInputRef = useRef<HTMLInputElement>(null)

  // Search for places
  const searchPlaces = async (query: string, isOrigin: boolean) => {
    if (query.length < 2) {
      if (isOrigin) setOriginSuggestions([])
      else setDestinationSuggestions([])
      return
    }

    try {
      const response = await apiService.searchPlaces(query)
      
      if (response.success && response.data) {
        const suggestions = response.data.map((place: any) => ({
          name: place.name || place.display_name,
          address: place.address || place.display_name,
          coordinates: {
            latitude: place.lat || place.latitude,
            longitude: place.lon || place.longitude
          },
          category: place.category || 'location',
          distance: place.distance
        }))

        if (isOrigin) {
          setOriginSuggestions(suggestions)
        } else {
          setDestinationSuggestions(suggestions)
        }
      }
    } catch (err) {
      console.error('Place search error:', err)
    }
  }

  // Plan journey with multiple options
  const planJourney = async () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination')
      return
    }

    setIsPlanning(true)
    setError(null)
    setRoutes([])
    setUberOptions([])

    try {
      // Get public transport routes
      const journeyResponse = await apiService.planJourney({
        origin: origin.coordinates,
        destination: destination.coordinates,
        preferences: {
          departure_time: departureTime === 'now' ? new Date().toISOString() : departureTime
        }
      })

      // Get Uber estimates
      const uberResponse = await apiService.getUberEstimate({
        start_latitude: origin.coordinates.latitude,
        start_longitude: origin.coordinates.longitude,
        end_latitude: destination.coordinates.latitude,
        end_longitude: destination.coordinates.longitude
      })

      // Process public transport routes
      if (journeyResponse.success && journeyResponse.data) {
        const publicRoutes: RouteOption[] = journeyResponse.data.routes.map((route: any, index: number) => ({
          id: `public_${index}`,
          type: 'public' as const,
          duration: route.duration,
          cost: route.cost_estimate || 5,
          steps: route.steps,
          emissions: calculateEmissions(route.distance, 'public'),
          comfort_score: 7,
          reliability_score: 8
        }))

        setRoutes(publicRoutes)
      }

      // Process Uber options (updated for new API)
      if (uberResponse.success && uberResponse.data && uberResponse.data.success) {
        const uberData = uberResponse.data
        const uberRoute: RouteOption = {
          id: 'uber_ghana',
          type: 'uber' as const,
          duration: Math.round((uberData.duration_seconds || 1200) / 60), // Convert to minutes
          cost: parseFloat(uberData.estimated_fare?.replace('GH₵', '') || '25'),
          steps: [{
            mode: 'uber',
            instruction: `${uberData.product || 'UberX Ghana'} ride`,
            duration: Math.round((uberData.duration_seconds || 1200) / 60),
            distance: uberData.distance_km || 5
          }],
          emissions: calculateEmissions(uberData.distance_km || 5, 'car'),
          comfort_score: 9,
          reliability_score: 9,
          currency: uberData.currency_code || 'GHS',
          surge_multiplier: uberData.surge_multiplier || 1.0,
          api_source: uberData.api_source || 'uber_live'
        }

        setUberOptions([uberData])
        setRoutes(prev => [...prev, uberRoute])
      }

      setShowRoutes(true)
    } catch (err) {
      console.error('Journey planning error:', err)
      setError('Failed to plan journey. Please try again.')
    } finally {
      setIsPlanning(false)
    }
  }

  // Calculate emissions based on distance and transport mode
  const calculateEmissions = (distance: number, mode: string): number => {
    const emissionFactors = {
      public: 0.05, // kg CO2 per km
      car: 0.2,
      uber: 0.2,
      walking: 0
    }
    return distance * (emissionFactors[mode as keyof typeof emissionFactors] || 0.1)
  }

  // Swap origin and destination
  const swapLocations = () => {
    const tempOrigin = origin
    const tempQuery = originQuery
    
    setOrigin(destination)
    setOriginQuery(destinationQuery)
    setDestination(tempOrigin)
    setDestinationQuery(tempQuery)
  }

  // Get route type icon
  const getRouteIcon = (type: string) => {
    switch (type) {
      case 'uber':
        return <TruckIcon className="w-5 h-5" />
      case 'public':
        return <UserGroupIcon className="w-5 h-5" />
      case 'walking':
        return <UserGroupIcon className="w-5 h-5" />
      default:
        return <MapPinIcon className="w-5 h-5" />
    }
  }

  // Get route type color
  const getRouteColor = (type: string) => {
    switch (type) {
      case 'uber':
        return 'from-black to-gray-800'
      case 'public':
        return 'from-blue-500 to-blue-600'
      case 'walking':
        return 'from-green-500 to-green-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className={`bg-white rounded-3xl shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-aura-primary to-aura-secondary p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MapPinIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Journey Planner</h2>
            <p className="text-sm opacity-90">Find the best route for your trip</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Location Inputs */}
        <div className="space-y-4 mb-6">
          {/* Origin Input */}
          <div className="relative">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <input
                ref={originInputRef}
                type="text"
                placeholder="From where?"
                value={originQuery}
                onChange={(e) => {
                  setOriginQuery(e.target.value)
                  searchPlaces(e.target.value, true)
                }}
                className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
              />
            </div>
            
            {/* Origin Suggestions */}
            <AnimatePresence>
              {originSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 z-10 bg-white rounded-2xl shadow-lg border mt-2 max-h-60 overflow-y-auto"
                >
                  {originSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setOrigin(suggestion)
                        setOriginQuery(suggestion.name)
                        setOriginSuggestions([])
                      }}
                      className="w-full p-4 text-left hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{suggestion.name}</div>
                      <div className="text-sm text-gray-500">{suggestion.address}</div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={swapLocations}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowsRightLeftIcon className="w-5 h-5 text-gray-600 rotate-90" />
            </button>
          </div>

          {/* Destination Input */}
          <div className="relative">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <input
                ref={destinationInputRef}
                type="text"
                placeholder="To where?"
                value={destinationQuery}
                onChange={(e) => {
                  setDestinationQuery(e.target.value)
                  searchPlaces(e.target.value, false)
                }}
                className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
              />
            </div>
            
            {/* Destination Suggestions */}
            <AnimatePresence>
              {destinationSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 z-10 bg-white rounded-2xl shadow-lg border mt-2 max-h-60 overflow-y-auto"
                >
                  {destinationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setDestination(suggestion)
                        setDestinationQuery(suggestion.name)
                        setDestinationSuggestions([])
                      }}
                      className="w-full p-4 text-left hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{suggestion.name}</div>
                      <div className="text-sm text-gray-500">{suggestion.address}</div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Departure Time */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time</label>
          <select
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="w-full p-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-aura-primary"
          >
            <option value="now">Leave now</option>
            <option value="15min">In 15 minutes</option>
            <option value="30min">In 30 minutes</option>
            <option value="1hour">In 1 hour</option>
          </select>
        </div>

        {/* Plan Journey Button */}
        <button
          onClick={planJourney}
          disabled={!origin || !destination || isPlanning}
          className="w-full bg-gradient-to-r from-aura-primary to-aura-secondary text-white py-4 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200"
        >
          {isPlanning ? (
            <div className="flex items-center justify-center space-x-2">
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span>Planning Journey...</span>
            </div>
          ) : (
            'Find Routes'
          )}
        </button>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3"
          >
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </motion.div>
        )}

        {/* Route Options */}
        <AnimatePresence>
          {showRoutes && routes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900">Route Options</h3>
              
              {routes.map((route) => (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedRoute?.id === route.id
                      ? 'border-aura-primary bg-aura-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRoute(route)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${getRouteColor(route.type)} rounded-full flex items-center justify-center text-white`}>
                        {getRouteIcon(route.type)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">{route.type} Transport</div>
                        <div className="text-sm text-gray-500">{route.steps.length} steps</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900">₵{route.cost.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{Math.round(route.duration)} min</div>
                    </div>
                  </div>

                  {/* Route Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500">Emissions</div>
                      <div className="font-semibold text-green-600">{route.emissions.toFixed(1)} kg CO₂</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Comfort</div>
                      <div className="flex items-center justify-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.round(route.comfort_score / 2)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Reliability</div>
                      <div className="flex items-center justify-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.round(route.reliability_score / 2)
                                ? 'text-blue-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Selected Route Details */}
                  {selectedRoute?.id === route.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">Route Steps</h4>
                      <div className="space-y-2">
                        {route.steps.map((step, index) => (
                          <div key={index} className="flex items-center space-x-3 text-sm">
                            <div className="w-6 h-6 bg-aura-primary/10 rounded-full flex items-center justify-center text-aura-primary font-semibold text-xs">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{step.instruction}</div>
                              <div className="text-gray-500">{Math.round(step.duration)} min • {step.distance.toFixed(1)} km</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => onJourneySelect?.(route)}
                        className="w-full mt-4 bg-aura-primary text-white py-3 rounded-xl font-semibold hover:bg-aura-primary/90 transition-colors"
                      >
                        Start Journey
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}