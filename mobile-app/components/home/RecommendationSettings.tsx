'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cog6ToothIcon,
  XMarkIcon,
  CheckIcon,
  InformationCircleIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TruckIcon,
  UserGroupIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { useUserPreferences } from '@/hooks/usePersonalizedRecommendations'

interface RecommendationSettingsProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export default function RecommendationSettings({
  userId,
  isOpen,
  onClose
}: RecommendationSettingsProps) {
  const { preferences, loading, updatePreferences } = useUserPreferences(userId)
  const [localPreferences, setLocalPreferences] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences)
    }
  }, [preferences])

  const handlePreferenceChange = (key: string, value: any) => {
    setLocalPreferences((prev: any) => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
  }

  const handleNestedPreferenceChange = (parentKey: string, key: string, value: any) => {
    setLocalPreferences((prev: any) => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!localPreferences || !hasChanges) return

    try {
      setSaving(true)
      await updatePreferences(localPreferences)
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setLocalPreferences(preferences)
    setHasChanges(false)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-aura-primary to-aura-secondary p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SparklesIcon className="w-6 h-6" />
                <h2 className="text-xl font-bold">Recommendation Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/80 text-sm mt-2">
              Customize your AI-powered recommendations
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading || !localPreferences ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Transport Mode Preferences */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <TruckIcon className="w-5 h-5 text-aura-primary" />
                    <h3 className="font-semibold text-ui-text-primary">Preferred Transport</h3>
                  </div>
                  <div className="space-y-2">
                    {['trotro', 'bus', 'taxi', 'shared_taxi', 'walking'].map(mode => (
                      <label key={mode} className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localPreferences.preferredTransportModes?.includes(mode)}
                          onChange={(e) => {
                            const modes = localPreferences.preferredTransportModes || []
                            if (e.target.checked) {
                              handlePreferenceChange('preferredTransportModes', [...modes, mode])
                            } else {
                              handlePreferenceChange('preferredTransportModes', modes.filter((m: string) => m !== mode))
                            }
                          }}
                          className="w-4 h-4 text-aura-primary rounded focus:ring-aura-primary"
                        />
                        <span className="capitalize text-sm font-medium">{mode.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Budget Constraints */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-ui-text-primary">Budget Limits</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-ui-text-secondary mb-2">
                        Daily Budget (GHS)
                      </label>
                      <input
                        type="number"
                        value={localPreferences.budgetConstraints?.dailyLimit || 20}
                        onChange={(e) => handleNestedPreferenceChange('budgetConstraints', 'dailyLimit', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-ui-border focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                        min="1"
                        max="200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ui-text-secondary mb-2">
                        Monthly Budget (GHS)
                      </label>
                      <input
                        type="number"
                        value={localPreferences.budgetConstraints?.monthlyLimit || 400}
                        onChange={(e) => handleNestedPreferenceChange('budgetConstraints', 'monthlyLimit', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-ui-border focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                        min="50"
                        max="2000"
                      />
                    </div>
                  </div>
                </div>

                {/* Time Preferences */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <ClockIcon className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-ui-text-primary">Time Preferences</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-ui-text-secondary mb-2">
                        Max Walking Distance (meters)
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="1000"
                        step="50"
                        value={localPreferences.timePreferences?.maxWalkingDistance || 500}
                        onChange={(e) => handleNestedPreferenceChange('timePreferences', 'maxWalkingDistance', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-ui-text-secondary mt-1">
                        <span>100m</span>
                        <span>{localPreferences.timePreferences?.maxWalkingDistance || 500}m</span>
                        <span>1000m</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ui-text-secondary mb-2">
                        Max Waiting Time (minutes)
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        step="5"
                        value={localPreferences.timePreferences?.maxWaitingTime || 15}
                        onChange={(e) => handleNestedPreferenceChange('timePreferences', 'maxWaitingTime', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-ui-text-secondary mt-1">
                        <span>5 min</span>
                        <span>{localPreferences.timePreferences?.maxWaitingTime || 15} min</span>
                        <span>30 min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route Preferences */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPinIcon className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-ui-text-primary">Route Preferences</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'avoidHighTraffic', label: 'Avoid High Traffic', description: 'Prefer routes with less congestion' },
                      { key: 'prioritizeSpeed', label: 'Prioritize Speed', description: 'Faster routes over other factors' },
                      { key: 'prioritizeCost', label: 'Prioritize Cost', description: 'Cheaper options preferred' },
                      { key: 'prioritizeComfort', label: 'Prioritize Comfort', description: 'More comfortable transport modes' }
                    ].map(pref => (
                      <label key={pref.key} className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localPreferences.routePreferences?.[pref.key] || false}
                          onChange={(e) => handleNestedPreferenceChange('routePreferences', pref.key, e.target.checked)}
                          className="w-4 h-4 text-aura-primary rounded focus:ring-aura-primary mt-0.5"
                        />
                        <div>
                          <div className="font-medium text-sm">{pref.label}</div>
                          <div className="text-xs text-ui-text-secondary">{pref.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 text-sm">How it works</h4>
                      <p className="text-blue-700 text-xs mt-1">
                        Our AI learns from your preferences and travel patterns to provide personalized recommendations. 
                        The more you use the app, the better the suggestions become.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-ui-border p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={handleReset}
                disabled={!hasChanges || saving}
                className="px-4 py-2 text-sm font-medium text-ui-text-secondary hover:text-ui-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reset
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-ui-text-secondary hover:text-ui-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="flex items-center space-x-2 bg-aura-primary hover:bg-aura-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-medium transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}