'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClockIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  UserIcon,
  TruckIcon,
  StarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { JourneyOption, JourneyLeg, TransportMode } from '@/types/journey'
import { VEHICLE_TYPE_COLORS } from '@/types/transport'

interface JourneyOptionsProps {
  options: JourneyOption[]
  onSelectOption: (option: JourneyOption) => void
  isLoading?: boolean
}

export function JourneyOptions({ options, onSelectOption, isLoading }: JourneyOptionsProps) {
  const [expandedOption, setExpandedOption] = useState<string | null>(null)

  const getTransportIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'walking': return '🚶'
      case 'trotro': return '🚐'
      case 'metro_mass': return '🚌'
      case 'stc': return '🚍'
      case 'bus': return '🚌'
      case 'taxi': return '🚕'
      case 'shared_taxi': return '🚕'
      case 'uber': return '🚗'
      case 'bolt': return '🚗'
      case 'okada': return '🏍️'
      case 'bicycle': return '🚲'
      default: return '🚐'
    }
  }

  const getTransportColor = (mode: TransportMode) => {
    const colorMap: Record<TransportMode, string> = {
      walking: '#10B981',
      trotro: '#F59E0B',
      metro_mass: '#3B82F6',
      stc: '#10B981',
      bus: '#8B5CF6',
      taxi: '#EF4444',
      shared_taxi: '#EF4444',
      uber: '#000000',
      bolt: '#34D399',
      okada: '#F97316',
      bicycle: '#059669'
    }
    return colorMap[mode] || '#6B7280'
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-GH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 0.8) return 'text-green-600'
    if (reliability >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getReliabilityText = (reliability: number) => {
    if (reliability >= 0.8) return 'High'
    if (reliability >= 0.6) return 'Medium'
    return 'Low'
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-mobile border border-ui-border">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="h-6 bg-gray-200 rounded w-6" />
                <div className="h-4 bg-gray-200 rounded flex-1" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div className="text-center py-8">
        <TruckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No routes found</h3>
        <p className="text-sm text-gray-500">
          Try adjusting your preferences or selecting different locations
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {options.map((option, index) => (
        <motion.div
          key={option.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl shadow-mobile border border-ui-border overflow-hidden"
        >
          {/* Option Header */}
          <div
            className="p-4 cursor-pointer"
            onClick={() => setExpandedOption(
              expandedOption === option.id ? null : option.id
            )}
          >
            {/* Recommended badge with ML info */}
            {index === 0 && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  <StarIconSolid className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-medium text-yellow-700">AI Optimized</span>
                </div>
                {option.ml_confidence && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 font-medium">
                      {Math.round(option.ml_confidence * 100)}% confidence
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Main info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-ui-text-primary">
                    {formatDuration(option.totalDuration)}
                  </div>
                  <div className="text-xs text-ui-text-secondary">Duration</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    ₵{option.totalFare.toFixed(2)}
                  </div>
                  <div className="text-xs text-ui-text-secondary">Fare</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium text-ui-text-primary">
                  {formatTime(option.departureTime)} → {formatTime(option.arrivalTime)}
                </div>
                <div className={`text-xs ${getReliabilityColor(option.reliability)}`}>
                  {getReliabilityText(option.reliability)} reliability
                </div>
              </div>
            </div>

            {/* Transport modes */}
            <div className="flex items-center space-x-2 mb-3">
              {(option.legs || []).map((leg, legIndex) => (
                <div key={legIndex} className="flex items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: getTransportColor(leg.mode) }}
                  >
                    {getTransportIcon(leg.mode)}
                  </div>
                  {legIndex < (option.legs || []).length - 1 && (
                    <ArrowRightIcon className="w-3 h-3 text-gray-400 mx-1" />
                  )}
                </div>
              ))}
              
              {option.transferCount > 0 && (
                <div className="ml-2 text-xs text-ui-text-secondary">
                  {option.transferCount} transfer{option.transferCount > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* ML and Algorithm Info */}
            {option.algorithm_used && (
              <div className="bg-blue-50 rounded-lg p-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    <InformationCircleIcon className="w-3 h-3 text-blue-500" />
                    <span className="text-blue-700 font-medium">{option.algorithm_used}</span>
                  </div>
                  {option.co2Emissions && (
                    <span className="text-green-600">
                      {option.co2Emissions}kg CO₂
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="flex items-center justify-between text-xs text-ui-text-secondary">
              <div className="flex items-center space-x-4">
                {(option.totalWalkingTime || 0) > 0 && (
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-3 h-3" />
                    <span>{formatDuration(option.totalWalkingTime || 0)} walk</span>
                  </div>
                )}

                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>{Math.round((option.reliability || 0) * 100)}% reliable</span>
                </div>
              </div>

              {(option.currentDelay || 0) > 0 && (
                <div className="flex items-center space-x-1 text-amber-600">
                  <ExclamationTriangleIcon className="w-3 h-3" />
                  <span>{option.currentDelay}m delay</span>
                </div>
              )}
            </div>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {expandedOption === option.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-ui-border"
              >
                <div className="p-4 space-y-4">
                  {/* Journey legs */}
                  {(option.legs || []).map((leg, legIndex) => (
                    <div key={legIndex} className="flex space-x-3">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                          style={{ backgroundColor: getTransportColor(leg.mode) }}
                        >
                          {getTransportIcon(leg.mode)}
                        </div>
                        {legIndex < (option.legs || []).length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-300 my-1" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm text-ui-text-primary capitalize">
                            {leg.mode.replace('_', ' ')}
                            {leg.route && ` - ${leg.route.name}`}
                          </h4>
                          <span className="text-xs text-ui-text-secondary">
                            {formatDuration(leg.duration)}
                          </span>
                        </div>

                        <div className="text-xs text-ui-text-secondary space-y-1">
                          <div className="flex items-center justify-between">
                            <span>From: {leg.origin.name}</span>
                            <span>{formatTime(leg.departureTime)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>To: {leg.destination.name}</span>
                            <span>{formatTime(leg.arrivalTime)}</span>
                          </div>
                          
                          {leg.fare > 0 && (
                            <div className="flex items-center justify-between">
                              <span>Fare:</span>
                              <span className="font-medium">₵{leg.fare.toFixed(2)}</span>
                            </div>
                          )}

                          {leg.walkingDistance && leg.walkingDistance > 0 && (
                            <div className="flex items-center space-x-1 text-blue-600">
                              <UserIcon className="w-3 h-3" />
                              <span>{leg.walkingDistance}m walk</span>
                            </div>
                          )}

                          {leg.crowdingLevel !== 'low' && (
                            <div className={`text-xs ${
                              leg.crowdingLevel === 'high' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {leg.crowdingLevel === 'high' ? '🔴' : '🟡'} {leg.crowdingLevel} crowding
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Additional info */}
                  {((option.trafficImpact || 'none') !== 'none' || (option.weatherImpact || 'none') !== 'none') && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-1 mb-2">
                        <InformationCircleIcon className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-ui-text-primary">Conditions</span>
                      </div>
                      
                      <div className="space-y-1 text-xs text-ui-text-secondary">
                        {(option.trafficImpact || 'none') !== 'none' && (
                          <div>Traffic: {option.trafficImpact} impact</div>
                        )}
                        {(option.weatherImpact || 'none') !== 'none' && (
                          <div>Weather: {option.weatherImpact} impact</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Select button */}
                  <button
                    onClick={() => onSelectOption(option)}
                    className="w-full bg-aura-primary text-white py-3 px-4 rounded-xl font-medium tap-target"
                  >
                    Select This Route
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}
