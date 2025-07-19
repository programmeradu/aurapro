'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface RouteSegment {
  id: string
  type: 'walking' | 'transport' | 'waiting'
  mode: string
  color: string
  duration: number
  distance: number
}

interface RouteLegendProps {
  routes: Array<{
    id: string
    mode: string
    color: string
    duration: number
    distance: number
    segments?: RouteSegment[]
  }>
  selectedRoute: string | null
  onRouteSelect: (routeId: string) => void
  className?: string
}

// Get transport mode colors
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

// Get transport mode icons
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

// Get line style pattern for display
const getLineStylePattern = (mode: string): string => {
  const patterns = {
    'walking': 'dashed',
    'bus': 'solid',
    'trotro': 'dashed-long',
    'taxi': 'solid',
    'metro': 'solid-thick',
    'train': 'dashed-long',
    'bicycle': 'dotted',
    'motorcycle': 'solid',
    'default': 'solid'
  }
  return patterns[mode] || patterns.default
}

// Format duration
const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)
    return `${hours}h ${remainingMinutes}min`
  }
}

// Format distance
const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`
  } else {
    return `${km.toFixed(1)}km`
  }
}

export function RouteLegend({
  routes,
  selectedRoute,
  onRouteSelect,
  className = ''
}: RouteLegendProps) {
  if (routes.length === 0) return null

  return (
    <div className={`bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Route Options</h4>
      
      <div className="space-y-3">
        {routes.map((route, index) => (
          <motion.button
            key={route.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onRouteSelect(route.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
              selectedRoute === route.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {/* Route Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getTransportModeIcon(route.mode)}</span>
                <span className="font-medium text-gray-900 capitalize">
                  {route.mode} Route
                </span>
                {selectedRoute === route.id && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {formatDuration(route.duration)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDistance(route.distance)}
                </div>
              </div>
            </div>

            {/* Route Segments */}
            {route.segments && route.segments.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-600 mb-1">Route breakdown:</div>
                <div className="flex items-center space-x-1 overflow-x-auto">
                  {route.segments.map((segment, segmentIndex) => (
                    <div
                      key={segmentIndex}
                      className="flex items-center space-x-1 flex-shrink-0"
                    >
                      {/* Segment line */}
                      <div className="flex items-center">
                        <div
                          className={`h-1 w-8 rounded ${
                            getLineStylePattern(segment.mode) === 'dashed' 
                              ? 'border-t-2 border-dashed' 
                              : getLineStylePattern(segment.mode) === 'dotted'
                              ? 'border-t-2 border-dotted'
                              : 'h-2'
                          }`}
                          style={{ 
                            backgroundColor: getTransportModeColor(segment.mode),
                            borderColor: getLineStylePattern(segment.mode).includes('border') 
                              ? getTransportModeColor(segment.mode) 
                              : undefined
                          }}
                        />
                      </div>

                      {/* Segment info */}
                      <div className="text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <span>{getTransportModeIcon(segment.mode)}</span>
                          <span>{formatDuration(segment.duration)}</span>
                        </div>
                      </div>

                      {/* Connector */}
                      {segmentIndex < route.segments.length - 1 && (
                        <div className="w-2 h-2 bg-gray-300 rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Single mode route */
              <div className="flex items-center space-x-2">
                <div
                  className={`h-2 w-12 rounded ${
                    getLineStylePattern(route.mode) === 'dashed' 
                      ? 'border-t-2 border-dashed h-1' 
                      : getLineStylePattern(route.mode) === 'dotted'
                      ? 'border-t-2 border-dotted h-1'
                      : ''
                  }`}
                  style={{ 
                    backgroundColor: route.color || getTransportModeColor(route.mode),
                    borderColor: getLineStylePattern(route.mode).includes('border') 
                      ? (route.color || getTransportModeColor(route.mode))
                      : undefined
                  }}
                />
                <span className="text-xs text-gray-600 capitalize">
                  {route.mode} only
                </span>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600 mb-2">Legend:</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="h-1 w-4 bg-green-500 rounded" />
            <span>Walking</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-4 bg-blue-500 rounded" />
            <span>Bus</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-4 bg-amber-500 rounded border-t-2 border-dashed border-amber-500" />
            <span>Tro-tro</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-4 bg-red-500 rounded" />
            <span>Taxi</span>
          </div>
        </div>
      </div>
    </div>
  )
}
