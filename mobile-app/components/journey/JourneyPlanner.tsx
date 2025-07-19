'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ArrowsUpDownIcon,
  ClockIcon,
  CogIcon,
  BookmarkIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { MapPinIcon as MapPinIconSolid } from '@heroicons/react/24/solid'
import { JourneyRequest, JourneyPreferences, PopularDestination } from '@/types/journey'
import { GeoPoint, TransportStop } from '@/types/transport'
import { journeyService } from '@/services/journeyService'
import { PlaceSearchInput } from './PlaceSearchInput'
import { JourneyPreferencesModal } from './JourneyPreferencesModal'
import { PopularDestinations } from './PopularDestinations'
import toast from 'react-hot-toast'

interface JourneyPlannerProps {
  userLocation?: GeoPoint
  onPlanJourney: (request: JourneyRequest) => void
  initialOrigin?: TransportStop
  initialDestination?: TransportStop
}

export function JourneyPlanner({
  userLocation,
  onPlanJourney,
  initialOrigin,
  initialDestination
}: JourneyPlannerProps) {
  const [origin, setOrigin] = useState<TransportStop | null>(initialOrigin || null)
  const [destination, setDestination] = useState<TransportStop | null>(initialDestination || null)
  const [departureTime, setDepartureTime] = useState<Date | null>(null)
  const [preferences, setPreferences] = useState<JourneyPreferences>(
    journeyService.getDefaultPreferences()
  )
  const [showPreferences, setShowPreferences] = useState(false)
  const [showPopular, setShowPopular] = useState(false)
  const [popularDestinations, setPopularDestinations] = useState<PopularDestination[]>([])
  const [isPlanning, setIsPlanning] = useState(false)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)

  // Load popular destinations
  useEffect(() => {
    const loadPopularDestinations = async () => {
      try {
        const destinations = await journeyService.getPopularDestinations(userLocation, undefined, 10)
        setPopularDestinations(destinations)
      } catch (error) {
        console.error('Error loading popular destinations:', error)
      }
    }

    loadPopularDestinations()
  }, [userLocation])

  // Set current location as origin if requested
  useEffect(() => {
    if (useCurrentLocation && userLocation) {
      setOrigin({
        id: 'current_location',
        name: 'Current Location',
        location: userLocation,
        type: 'stop',
        region: { id: 'GAR', name: 'Greater Accra Region', code: 'GAR' },
        facilities: [],
        accessibility: true,
        isActive: true
      })
      setUseCurrentLocation(false)
    }
  }, [useCurrentLocation, userLocation])

  const handleSwapLocations = () => {
    const temp = origin
    setOrigin(destination)
    setDestination(temp)
  }

  const handlePlanJourney = async () => {
    if (!origin || !destination) {
      toast.error('Please select both origin and destination')
      return
    }

    if (origin.id === destination.id) {
      toast.error('Origin and destination cannot be the same')
      return
    }

    setIsPlanning(true)

    try {
      const request: JourneyRequest = {
        origin: origin.location,
        destination: destination.location,
        departureTime: departureTime || new Date(),
        preferences
      }

      onPlanJourney(request)
    } catch (error) {
      console.error('Error planning journey:', error)
      toast.error('Failed to plan journey')
    } finally {
      setIsPlanning(false)
    }
  }

  const handlePopularDestinationSelect = (destination: PopularDestination) => {
    setDestination(destination.stop)
    setShowPopular(false)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getTimeOptions = () => {
    const now = new Date()
    const options = []
    
    // Add "Now" option
    options.push({
      label: 'Leave now',
      value: now
    })

    // Add next few hours
    for (let i = 1; i <= 6; i++) {
      const time = new Date(now.getTime() + i * 30 * 60 * 1000) // 30-minute intervals
      options.push({
        label: formatTime(time),
        value: time
      })
    }

    return options
  }

  return (
    <div className="bg-white rounded-2xl shadow-mobile border border-ui-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-ui-text-primary">
            Plan Your Journey
          </h2>
          <p className="text-sm text-ui-text-secondary">
            Find the best routes and transport options
          </p>
        </div>
        
        <button
          onClick={() => setShowPreferences(true)}
          className="p-2 rounded-full bg-gray-100 text-gray-600 tap-target"
        >
          <CogIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Location Inputs */}
      <div className="space-y-4 mb-6">
        {/* Origin */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
          </div>
          <PlaceSearchInput
            placeholder="From where?"
            value={origin}
            onChange={setOrigin}
            userLocation={userLocation}
            className="pl-10"
          />
          {!origin && userLocation && (
            <button
              onClick={() => setUseCurrentLocation(true)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-aura-primary text-sm font-medium"
            >
              Use current location
            </button>
          )}
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapLocations}
            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors tap-target"
          >
            <ArrowsUpDownIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Destination */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <MapPinIconSolid className="w-4 h-4 text-red-500" />
          </div>
          <PlaceSearchInput
            placeholder="To where?"
            value={destination}
            onChange={setDestination}
            userLocation={userLocation}
            className="pl-10"
          />
          {!destination && (
            <button
              onClick={() => setShowPopular(true)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-aura-primary text-sm font-medium"
            >
              Popular places
            </button>
          )}
        </div>
      </div>

      {/* Departure Time */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ui-text-primary mb-2">
          Departure Time
        </label>
        <div className="grid grid-cols-2 gap-2">
          {getTimeOptions().slice(0, 4).map((option, index) => (
            <button
              key={index}
              onClick={() => setDepartureTime(option.value)}
              className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                departureTime?.getTime() === option.value.getTime()
                  ? 'bg-aura-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Preferences */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ui-text-primary mb-2">
          Optimize for
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'time', label: 'Fastest', icon: '⚡' },
            { key: 'cost', label: 'Cheapest', icon: '💰' },
            { key: 'comfort', label: 'Comfort', icon: '🛋️' },
            { key: 'reliability', label: 'Reliable', icon: '✅' }
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setPreferences(prev => ({ ...prev, prioritizeBy: option.key as any }))}
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2 ${
                preferences.prioritizeBy === option.key
                  ? 'bg-aura-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Plan Journey Button */}
      <button
        onClick={handlePlanJourney}
        disabled={!origin || !destination || isPlanning}
        className="w-full bg-aura-primary text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed tap-target"
      >
        {isPlanning ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Planning...</span>
          </>
        ) : (
          <>
            <MagnifyingGlassIcon className="w-5 h-5" />
            <span>Find Routes</span>
          </>
        )}
      </button>

      {/* Popular Destinations Modal */}
      <AnimatePresence>
        {showPopular && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
            onClick={() => setShowPopular(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white rounded-t-2xl w-full max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                <PopularDestinations
                  onDestinationSelect={(destination) => {
                    console.log('Popular destination selected:', destination)
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences Modal */}
      <JourneyPreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        preferences={{
          transportModes: ['bus', 'trotro'],
          maxWalkingDistance: 500,
          maxWaitTime: 15,
          budgetRange: [5, 50],
          prioritizeSpeed: true,
          prioritizeCost: false,
          prioritizeComfort: false,
          avoidTraffic: true,
          accessibilityNeeds: [],
          preferredAmenities: [],
          timePreferences: {
            departureFlexibility: 10,
            arrivalFlexibility: 15
          }
        }}
        onSave={(newPreferences) => {
          console.log('Preferences saved:', newPreferences)
          setShowPreferences(false)
        }}
      />
    </div>
  )
}
