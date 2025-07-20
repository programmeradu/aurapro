'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPinIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TruckIcon,
  UserIcon,
  BoltIcon,
  StarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarIcon,
  UserGroupIcon,
  GlobeAltIcon,
  LightningBoltIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { MapPinIcon as MapPinIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { apiService, Location } from '@/services/apiService'

interface JourneyPlannerProps {
  className?: string
  onJourneySelect?: (journey: JourneyOption) => void
}

interface JourneyOption {
  id: string
  type: 'public_transport' | 'walking' | 'cycling' | 'ride_share' | 'taxi' | 'multimodal'
  duration: number
  cost: number
  distance: number
  co2_emissions: number
  comfort_score: number
  reliability_score: number
  steps: JourneyStep[]
  departure_time: Date
  arrival_time: Date
  provider?: string
  vehicle_type?: string
  surge_multiplier?: number
  eta_accuracy: number
}

interface JourneyStep {
  id: string
  type: 'walk' | 'bus' | 'tram' | 'taxi' | 'ride_share' | 'wait'
  duration: number
  distance?: number
  instruction: string
  route_name?: string
  departure_stop?: string
  arrival_stop?: string
  line_color?: string
  vehicle_id?: string
}

interface UberEstimate {
  product_id: string
  display_name: string
  estimate: string
  surge_multiplier: number
  duration: number
  high_estimate: number
  low_estimate: number
  currency_code: string
}

export function UberLevelJourneyPlanner({ className = '', onJourneySelect }: JourneyPlannerProps) {
  const [fromLocation, setFromLocation] = useState<Location | null>(null)
  const [toLocation, setToLocation] = useState<Location | null>(null)
  const [fromQuery, setFromQuery] = useState('')
  const [toQuery, setToQuery] = useState('')
  const [journeyOptions, setJourneyOptions] = useState<JourneyOption[]>([])
  const [uberEstimates, setUberEstimates] = useState<UberEstimate[]>([])
  const [isPlanning, setIsPlanning] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [departureTime, setDepartureTime] = useState<'now' | 'later'>('now')
  const [scheduledTime, setScheduledTime] = useState<Date>(new Date())
  const [preferences, setPreferences] = useState({
    prioritize: 'time' as 'time' | 'cost' | 'comfort' | 'eco',
    avoid_walking: false,
    wheelchair_accessible: false,
    max_walking_distance: 1000
  })

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFromLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          setFromQuery('Current Location')
        },
        (error) => {
          console.error('Geolocation error:', error)
          // Default to Accra center
          setFromLocation({ latitude: 5.6037, longitude: -0.1870 })
          setFromQuery('Accra Central')
        }
      )
    }
  }, [])

  // Plan journey when locations are set
  useEffect(() => {
    if (fromLocation && toLocation) {
      planJourney()
    }
  }, [fromLocation, toLocation, departureTime, scheduledTime, preferences])

  const planJourney = async () => {
    if (!fromLocation || !toLocation) return

    setIsPlanning(true)
    try {
      // Plan journey using our API
      const journeyResponse = await apiService.planJourney({
        origin: fromLocation,
        destination: toLocation,
        departure_time: departureTime === 'now' ? new Date() : scheduledTime,
        preferences: {
          mode: 'all',
          optimize_for: preferences.prioritize,
          max_walking_distance: preferences.max_walking_distance,
          wheelchair_accessible: preferences.wheelchair_accessible
        }
      })

      if (journeyResponse.success && journeyResponse.data) {
        const options: JourneyOption[] = journeyResponse.data.routes.map((route: any, index: number) => ({
          id: `route-${index}`,
          type: route.mode || 'multimodal',
          duration: route.duration,
          cost: route.cost || 0,
          distance: route.distance,
          co2_emissions: route.co2_emissions || 0,
          comfort_score: route.comfort_score || 80,
          reliability_score: route.reliability_score || 85,
          steps: route.steps || [],
          departure_time: new Date(route.departure_time),
          arrival_time: new Date(route.arrival_time),
          provider: route.provider,
          vehicle_type: route.vehicle_type,
          eta_accuracy: route.eta_accuracy || 90,
          // Add ML and algorithm information
          ml_confidence: route.ml_confidence || route.reliability,
          algorithm_used: route.algorithm_used || 'Enhanced ML Model + Real GTFS Data',
          co2Emissions: route.co2_emissions || 0,
          processing_time_ms: route.processing_time_ms
        }))

        setJourneyOptions(options)
      }

      // Get Uber estimates
      const uberResponse = await apiService.getUberEstimate({
        start_latitude: fromLocation.latitude,
        start_longitude: fromLocation.longitude,
        end_latitude: toLocation.latitude,
        end_longitude: toLocation.longitude
      })

      if (uberResponse.success && uberResponse.data) {
        // Handle new API response format
        const uberData = uberResponse.data

        if (uberData.success) {
          // Create Uber option from the new API response
          const uberOption: JourneyOption = {
            id: 'uber-ghana',
            type: 'ride_share',
            duration: Math.round((uberData.duration_seconds || 1200) / 60), // Convert to minutes
            cost: parseFloat(uberData.estimated_fare?.replace('GH₵', '') || '25'),
            distance: Math.round((uberData.distance_km || 5) * 1000), // Convert to meters
            co2_emissions: 2.5, // Estimated for ride-sharing
            comfort_score: 95,
            reliability_score: 92,
            steps: [{
              id: 'uber-ride',
              type: 'ride_share',
              duration: Math.round((uberData.duration_seconds || 1200) / 60),
              instruction: `${uberData.product || 'UberX Ghana'} ride`,
              departure_stop: fromQuery,
              arrival_stop: toQuery
            }],
            departure_time: new Date(),
            arrival_time: new Date(Date.now() + (uberData.duration_seconds || 1200) * 1000),
            provider: 'Uber',
            vehicle_type: uberData.product || 'UberX Ghana',
            surge_multiplier: uberData.surge_multiplier || 1.0,
            eta_accuracy: 95,
            currency: uberData.currency_code || 'GHS',
            api_source: uberData.api_source || 'uber_live'
          }

          setJourneyOptions(prev => [...prev, uberOption])
        } else {
          console.log('Uber estimate failed:', uberData.error_message)
        }
      }

    } catch (error) {
      console.error('Journey planning error:', error)
      
      // Fallback to mock data
      const mockOptions: JourneyOption[] = [
        {
          id: 'public-1',
          type: 'public_transport',
          duration: 1800, // 30 minutes
          cost: 2.50,
          distance: 8500,
          co2_emissions: 0.8,
          comfort_score: 75,
          reliability_score: 85,
          steps: [
            {
              id: 'walk-1',
              type: 'walk',
              duration: 300,
              distance: 400,
              instruction: 'Walk to Circle Bus Stop'
            },
            {
              id: 'bus-1',
              type: 'bus',
              duration: 1200,
              instruction: 'Take Bus 207 to Legon',
              route_name: '207',
              departure_stop: 'Circle',
              arrival_stop: 'Legon',
              line_color: '#2563eb'
            },
            {
              id: 'walk-2',
              type: 'walk',
              duration: 300,
              distance: 300,
              instruction: 'Walk to destination'
            }
          ],
          departure_time: new Date(),
          arrival_time: new Date(Date.now() + 1800000),
          eta_accuracy: 88
        },
        {
          id: 'uber-x',
          type: 'ride_share',
          duration: 1200, // 20 minutes
          cost: 25.00,
          distance: 8500,
          co2_emissions: 2.1,
          comfort_score: 95,
          reliability_score: 92,
          steps: [{
            id: 'uber-ride',
            type: 'ride_share',
            duration: 1200,
            instruction: 'UberX ride',
            departure_stop: fromQuery,
            arrival_stop: toQuery
          }],
          departure_time: new Date(),
          arrival_time: new Date(Date.now() + 1200000),
          provider: 'Uber',
          vehicle_type: 'UberX',
          surge_multiplier: 1.2,
          eta_accuracy: 95
        }
      ]
      
      setJourneyOptions(mockOptions)
    } finally {
      setIsPlanning(false)
    }
  }

  const searchLocation = async (query: string, isDestination: boolean) => {
    if (query.length < 2) return

    try {
      const response = await apiService.searchPlaces(query)
      if (response.success && response.data && response.data.length > 0) {
        const place = response.data[0]
        const location: Location = {
          latitude: place.lat || place.latitude,
          longitude: place.lon || place.longitude
        }
        
        if (isDestination) {
          setToLocation(location)
          setToQuery(place.name || place.display_name)
        } else {
          setFromLocation(location)
          setFromQuery(place.name || place.display_name)
        }
      }
    } catch (error) {
      console.error('Location search error:', error)
    }
  }

  const swapLocations = () => {
    const tempLocation = fromLocation
    const tempQuery = fromQuery
    setFromLocation(toLocation)
    setFromQuery(toQuery)
    setToLocation(tempLocation)
    setToQuery(tempQuery)
  }

  const getOptionIcon = (type: string) => {
    switch (type) {
      case 'public_transport':
        return <TruckIcon className="w-6 h-6" />
      case 'walking':
        return <UserIcon className="w-6 h-6" />
      case 'ride_share':
      case 'taxi':
        return <TruckIcon className="w-6 h-6" />
      default:
        return <MapPinIcon className="w-6 h-6" />
    }
  }

  const getOptionColor = (type: string) => {
    switch (type) {
      case 'public_transport':
        return 'text-blue-600 bg-blue-50'
      case 'walking':
        return 'text-green-600 bg-green-50'
      case 'ride_share':
      case 'taxi':
        return 'text-purple-600 bg-purple-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'time':
        return <BoltIcon className="w-4 h-4" />
      case 'cost':
        return <CurrencyDollarIcon className="w-4 h-4" />
      case 'comfort':
        return <StarIcon className="w-4 h-4" />
      case 'eco':
        return <GlobeAltIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const formatCost = (cost: number) => {
    return `₵${cost.toFixed(2)}`
  }

  return (
    <div className={`bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-aura-primary to-aura-secondary p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Plan Your Journey</h2>
          <div className="flex items-center space-x-2">
            {getPriorityIcon(preferences.prioritize)}
            <span className="text-sm capitalize">{preferences.prioritize} first</span>
          </div>
        </div>

        {/* Location Inputs */}
        <div className="space-y-3">
          {/* From Location */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <input
              type="text"
              placeholder="From"
              value={fromQuery}
              onChange={(e) => {
                setFromQuery(e.target.value)
                searchLocation(e.target.value, false)
              }}
              className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={swapLocations}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <ArrowsRightLeftIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* To Location */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            <input
              type="text"
              placeholder="To"
              value={toQuery}
              onChange={(e) => {
                setToQuery(e.target.value)
                searchLocation(e.target.value, true)
              }}
              className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>

        {/* Time Selection */}
        <div className="flex items-center space-x-4 mt-4">
          <button
            onClick={() => setDepartureTime('now')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              departureTime === 'now'
                ? 'bg-white text-aura-primary'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Leave Now
          </button>
          <button
            onClick={() => setDepartureTime('later')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              departureTime === 'later'
                ? 'bg-white text-aura-primary'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Leave Later
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Optimize for:</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(['time', 'cost', 'comfort', 'eco'] as const).map((priority) => (
            <button
              key={priority}
              onClick={() => setPreferences(prev => ({ ...prev, prioritize: priority }))}
              className={`flex flex-col items-center p-3 rounded-xl text-xs font-medium transition-colors ${
                preferences.prioritize === priority
                  ? 'bg-aura-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getPriorityIcon(priority)}
              <span className="mt-1 capitalize">{priority}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Journey Options */}
      <div className="p-4">
        {isPlanning ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <ArrowPathIcon className="w-8 h-8 animate-spin text-aura-primary mx-auto mb-2" />
              <p className="text-gray-600">Finding best routes...</p>
            </div>
          </div>
        ) : journeyOptions.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {journeyOptions.length} route{journeyOptions.length !== 1 ? 's' : ''} found
            </h3>
            
            <AnimatePresence>
              {journeyOptions.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    setSelectedOption(option.id)
                    onJourneySelect?.(option)
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedOption === option.id
                      ? 'border-aura-primary bg-aura-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Option Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getOptionColor(option.type)}`}>
                        {getOptionIcon(option.type)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {option.provider ? `${option.provider} ${option.vehicle_type}` : 
                           option.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-sm text-gray-500">
                          {option.eta_accuracy}% accuracy
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatDuration(option.duration)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCost(option.cost)}
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {(option.distance / 1000).toFixed(1)}km
                      </div>
                      <div className="text-xs text-gray-500">Distance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {option.co2_emissions.toFixed(1)}kg
                      </div>
                      <div className="text-xs text-gray-500">CO₂</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <StarIconSolid className="w-3 h-3 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {(option.comfort_score / 20).toFixed(1)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">Comfort</div>
                    </div>
                  </div>

                  {/* Surge Indicator */}
                  {option.surge_multiplier && option.surge_multiplier > 1 && (
                    <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg mb-3">
                      <FireIcon className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">
                        {option.surge_multiplier}x surge pricing
                      </span>
                    </div>
                  )}

                  {/* Journey Steps Preview */}
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {option.steps.slice(0, 3).map((step, stepIndex) => (
                      <div key={step.id} className="flex items-center space-x-1">
                        {stepIndex > 0 && <span>→</span>}
                        <span className="capitalize">{step.type}</span>
                        {step.route_name && <span>({step.route_name})</span>}
                      </div>
                    ))}
                    {option.steps.length > 3 && <span>...</span>}
                  </div>

                  {/* Departure Time */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <ClockIcon className="w-4 h-4" />
                      <span>Depart: {option.departure_time.toLocaleTimeString()}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Arrive: {option.arrival_time.toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : fromLocation && toLocation ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No routes found</h3>
            <p className="text-gray-500 mb-4">
              We couldn't find any routes for your journey. Try adjusting your preferences.
            </p>
            <button
              onClick={planJourney}
              className="bg-aura-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-aura-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPinIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Plan your journey</h3>
            <p className="text-gray-500">
              Enter your starting point and destination to see route options.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}