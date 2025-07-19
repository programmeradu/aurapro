'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  CogIcon,
  ClockIcon,
  BanknotesIcon,
  MapPinIcon,
  UserGroupIcon,
  WifiIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface JourneyPreferences {
  transportModes: string[]
  maxWalkingDistance: number
  maxWaitTime: number
  budgetRange: [number, number]
  prioritizeSpeed: boolean
  prioritizeCost: boolean
  prioritizeComfort: boolean
  avoidTraffic: boolean
  accessibilityNeeds: string[]
  preferredAmenities: string[]
  timePreferences: {
    departureFlexibility: number
    arrivalFlexibility: number
  }
}

interface JourneyPreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  preferences: JourneyPreferences
  onSave: (preferences: JourneyPreferences) => void
}

const transportModeOptions = [
  { id: 'walking', name: 'Walking', icon: '🚶', description: 'Walk to destination' },
  { id: 'bus', name: 'Bus', icon: '🚌', description: 'Public buses' },
  { id: 'trotro', name: 'Tro-tro', icon: '🚐', description: 'Shared minibus' },
  { id: 'taxi', name: 'Taxi', icon: '🚕', description: 'Private taxi' },
  { id: 'uber', name: 'Ride-hailing', icon: '🚗', description: 'Uber, Bolt, etc.' },
  { id: 'motorcycle', name: 'Okada', icon: '🏍️', description: 'Motorcycle taxi' }
]

const accessibilityOptions = [
  { id: 'wheelchair', name: 'Wheelchair Accessible', icon: '♿' },
  { id: 'low-floor', name: 'Low Floor Vehicles', icon: '🚌' },
  { id: 'audio-announcements', name: 'Audio Announcements', icon: '🔊' },
  { id: 'visual-displays', name: 'Visual Displays', icon: '📺' }
]

const amenityOptions = [
  { id: 'ac', name: 'Air Conditioning', icon: '❄️' },
  { id: 'wifi', name: 'WiFi', icon: '📶' },
  { id: 'charging', name: 'Phone Charging', icon: '🔌' },
  { id: 'music', name: 'Music/Entertainment', icon: '🎵' },
  { id: 'comfortable-seats', name: 'Comfortable Seats', icon: '💺' },
  { id: 'clean', name: 'Clean Vehicle', icon: '✨' }
]

export function JourneyPreferencesModal({ isOpen, onClose, preferences, onSave }: JourneyPreferencesModalProps) {
  const [localPreferences, setLocalPreferences] = useState<JourneyPreferences>(preferences)

  useEffect(() => {
    setLocalPreferences(preferences)
  }, [preferences])

  const handleSave = () => {
    onSave(localPreferences)
    onClose()
  }

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item]
  }

  const updatePreferences = (updates: Partial<JourneyPreferences>) => {
    setLocalPreferences(prev => ({ ...prev, ...updates }))
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-mobile shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-mobile">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <CogIcon className="h-6 w-6 mr-2 text-blue-600" />
                  Journey Preferences
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Transport Modes */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Preferred Transport Modes</h3>
                <div className="grid grid-cols-2 gap-3">
                  {transportModeOptions.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => updatePreferences({
                        transportModes: toggleArrayItem(localPreferences.transportModes, mode.id)
                      })}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        localPreferences.transportModes.includes(mode.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{mode.icon}</span>
                        <span className="font-medium text-gray-900">{mode.name}</span>
                      </div>
                      <p className="text-xs text-gray-600">{mode.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance & Time Preferences */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Walking Distance
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="100"
                      max="2000"
                      step="100"
                      value={localPreferences.maxWalkingDistance}
                      onChange={(e) => updatePreferences({ maxWalkingDistance: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600 text-center">
                      {localPreferences.maxWalkingDistance}m
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Wait Time
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="5"
                      value={localPreferences.maxWaitTime}
                      onChange={(e) => updatePreferences({ maxWaitTime: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600 text-center">
                      {localPreferences.maxWaitTime} min
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Range (GH₵)
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-4">
                    <input
                      type="number"
                      placeholder="Min"
                      value={localPreferences.budgetRange[0]}
                      onChange={(e) => updatePreferences({
                        budgetRange: [parseInt(e.target.value) || 0, localPreferences.budgetRange[1]]
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={localPreferences.budgetRange[1]}
                      onChange={(e) => updatePreferences({
                        budgetRange: [localPreferences.budgetRange[0], parseInt(e.target.value) || 100]
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Priorities */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Journey Priorities</h3>
                <div className="space-y-3">
                  {[
                    { key: 'prioritizeSpeed', label: 'Prioritize Speed', icon: ClockIcon },
                    { key: 'prioritizeCost', label: 'Prioritize Low Cost', icon: BanknotesIcon },
                    { key: 'prioritizeComfort', label: 'Prioritize Comfort', icon: UserGroupIcon },
                    { key: 'avoidTraffic', label: 'Avoid Heavy Traffic', icon: MapPinIcon }
                  ].map((priority) => (
                    <label key={priority.key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localPreferences[priority.key as keyof JourneyPreferences] as boolean}
                        onChange={(e) => updatePreferences({ [priority.key]: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <priority.icon className="h-5 w-5 text-gray-500" />
                      <span className="text-gray-900">{priority.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Accessibility Needs */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Accessibility Needs</h3>
                <div className="grid grid-cols-2 gap-2">
                  {accessibilityOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updatePreferences({
                        accessibilityNeeds: toggleArrayItem(localPreferences.accessibilityNeeds, option.id)
                      })}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        localPreferences.accessibilityNeeds.includes(option.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{option.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{option.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Amenities */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Preferred Amenities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {amenityOptions.map((amenity) => (
                    <button
                      key={amenity.id}
                      onClick={() => updatePreferences({
                        preferredAmenities: toggleArrayItem(localPreferences.preferredAmenities, amenity.id)
                      })}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        localPreferences.preferredAmenities.includes(amenity.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{amenity.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{amenity.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-mobile">
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
