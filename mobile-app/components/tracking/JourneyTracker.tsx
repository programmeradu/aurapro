'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlayIcon,
  StopIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { JourneyTracking, TransportStop, Vehicle } from '@/types/transport'
import { trackingService } from '@/services/trackingService'
import toast from 'react-hot-toast'

interface JourneyTrackerProps {
  vehicle?: Vehicle
  route?: any
  onJourneyStart?: (journey: JourneyTracking) => void
  onJourneyEnd?: () => void
}

export function JourneyTracker({
  vehicle,
  route,
  onJourneyStart,
  onJourneyEnd
}: JourneyTrackerProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [currentJourney, setCurrentJourney] = useState<JourneyTracking | null>(null)
  const [selectedBoardingStop, setSelectedBoardingStop] = useState<TransportStop | null>(null)
  const [selectedAlightingStop, setSelectedAlightingStop] = useState<TransportStop | null>(null)
  const [shareLocation, setShareLocation] = useState(true)
  const [passengerCount, setPassengerCount] = useState(1)
  const [showEndJourney, setShowEndJourney] = useState(false)
  const [fareAmount, setFareAmount] = useState<number | undefined>()
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')

  // Check for active journey on mount
  useEffect(() => {
    const activeJourney = trackingService.activeJourney
    if (activeJourney) {
      setCurrentJourney(activeJourney)
      setIsTracking(true)
    }
  }, [])

  const handleStartJourney = async () => {
    if (!vehicle || !route || !selectedBoardingStop) {
      toast.error('Please select a vehicle and boarding stop')
      return
    }

    try {
      const journey = await trackingService.startJourneyTracking({
        vehicleId: vehicle.id,
        routeId: route.id,
        boardingStopId: selectedBoardingStop.id,
        shareLocation
      })

      setCurrentJourney(journey)
      setIsTracking(true)
      onJourneyStart?.(journey)
      
      toast.success('Journey tracking started!')
    } catch (error) {
      console.error('Error starting journey:', error)
      toast.error('Failed to start journey tracking')
    }
  }

  const handleEndJourney = async () => {
    if (!currentJourney || !selectedAlightingStop) {
      toast.error('Please select where you alighted')
      return
    }

    try {
      await trackingService.endJourneyTracking({
        alightingStopId: selectedAlightingStop.id,
        fareAmount,
        rating: rating > 0 ? rating : undefined,
        feedback: feedback.trim() || undefined
      })

      setCurrentJourney(null)
      setIsTracking(false)
      setShowEndJourney(false)
      setRating(0)
      setFeedback('')
      setFareAmount(undefined)
      onJourneyEnd?.()
      
      toast.success('Journey completed! Thank you for sharing data.')
    } catch (error) {
      console.error('Error ending journey:', error)
      toast.error('Failed to end journey tracking')
    }
  }

  const formatDuration = (start: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(start).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  if (isTracking && currentJourney) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-mobile border border-ui-border p-4"
      >
        {/* Active Journey Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <PlayIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-ui-text-primary">Journey Active</h3>
              <p className="text-sm text-ui-text-secondary">
                Started {formatDuration(currentJourney.boardingTime)} ago
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-600 font-medium">Live</span>
          </div>
        </div>

        {/* Journey Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-3">
            <MapPinIcon className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium">From: {currentJourney.boardingStop.name}</p>
              <p className="text-xs text-gray-500">
                {new Date(currentJourney.boardingTime).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <UserGroupIcon className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm">Passengers: {currentJourney.passengerCount}</p>
              <p className="text-xs text-gray-500">Vehicle condition: {currentJourney.vehicleCondition}</p>
            </div>
          </div>

          {shareLocation && (
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
              <p className="text-sm text-blue-600">Sharing location for better predictions</p>
            </div>
          )}
        </div>

        {/* End Journey Button */}
        <button
          onClick={() => setShowEndJourney(true)}
          className="w-full bg-red-500 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 tap-target"
        >
          <StopIcon className="w-5 h-5" />
          <span>End Journey</span>
        </button>

        {/* End Journey Modal */}
        <AnimatePresence>
          {showEndJourney && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
              onClick={() => setShowEndJourney(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4">
                  <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                  
                  <h3 className="text-lg font-semibold mb-4">Complete Journey</h3>

                  {/* Alighting Stop Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Where did you alight?</label>
                    <select
                      value={selectedAlightingStop?.id || ''}
                      onChange={(e) => {
                        const stop = route?.stops.find((s: TransportStop) => s.id === e.target.value)
                        setSelectedAlightingStop(stop || null)
                      }}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-aura-primary"
                    >
                      <option value="">Select stop...</option>
                      {route?.stops.map((stop: TransportStop) => (
                        <option key={stop.id} value={stop.id}>
                          {stop.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fare Amount */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Fare Amount (GHS)</label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.50"
                        placeholder="0.00"
                        value={fareAmount || ''}
                        onChange={(e) => setFareAmount(parseFloat(e.target.value) || undefined)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-aura-primary"
                      />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Rate this journey</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="tap-target"
                        >
                          {star <= rating ? (
                            <StarIconSolid className="w-8 h-8 text-yellow-400" />
                          ) : (
                            <StarIcon className="w-8 h-8 text-gray-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Additional feedback (optional)</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Share your experience..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-aura-primary resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowEndJourney(false)}
                      className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEndJourney}
                      disabled={!selectedAlightingStop}
                      className="flex-1 py-3 px-4 bg-aura-primary text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Complete Journey
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-mobile border border-ui-border p-4"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-ui-text-primary mb-2">
          Start Journey Tracking
        </h3>
        <p className="text-sm text-ui-text-secondary">
          Help improve transport predictions by sharing your journey data
        </p>
      </div>

      {/* Boarding Stop Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Boarding Stop</label>
        <select
          value={selectedBoardingStop?.id || ''}
          onChange={(e) => {
            const stop = route?.stops.find((s: TransportStop) => s.id === e.target.value)
            setSelectedBoardingStop(stop || null)
          }}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-aura-primary"
        >
          <option value="">Select boarding stop...</option>
          {route?.stops.map((stop: TransportStop) => (
            <option key={stop.id} value={stop.id}>
              {stop.name}
            </option>
          ))}
        </select>
      </div>

      {/* Passenger Count */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Passenger Count (approx.)</label>
        <div className="flex space-x-2">
          {[1, 5, 10, 15, 20].map((count) => (
            <button
              key={count}
              onClick={() => setPassengerCount(count)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                passengerCount === count
                  ? 'bg-aura-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {count}+
            </button>
          ))}
        </div>
      </div>

      {/* Location Sharing */}
      <div className="mb-6">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={shareLocation}
            onChange={(e) => setShareLocation(e.target.checked)}
            className="w-4 h-4 text-aura-primary border-gray-300 rounded focus:ring-aura-primary"
          />
          <div className="flex-1">
            <span className="text-sm font-medium">Share location during journey</span>
            <p className="text-xs text-gray-500">
              Helps improve arrival predictions for other commuters
            </p>
          </div>
        </label>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStartJourney}
        disabled={!vehicle || !route || !selectedBoardingStop}
        className="w-full bg-aura-primary text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed tap-target"
      >
        <PlayIcon className="w-5 h-5" />
        <span>Start Tracking Journey</span>
      </button>

      {/* Benefits */}
      <div className="mt-4 p-3 bg-green-50 rounded-xl">
        <h4 className="text-sm font-medium text-green-800 mb-2">Benefits of tracking:</h4>
        <ul className="text-xs text-green-700 space-y-1">
          <li>• Help other commuters with real-time updates</li>
          <li>• Earn data rewards and fare discounts</li>
          <li>• Improve transport service quality</li>
          <li>• Support Ghana's digital transport initiative</li>
        </ul>
      </div>
    </motion.div>
  )
}
