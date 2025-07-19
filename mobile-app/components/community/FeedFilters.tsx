'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FunnelIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

interface FeedFiltersProps {
  filters: {
    type: string[]
    severity: string[]
    status: string[]
    location: string
    timeRange: string
    sortBy: string
  }
  onFiltersChange: (filters: any) => void
  onClearFilters: () => void
}

const filterOptions = {
  type: [
    { id: 'traffic', name: 'Traffic', icon: '🚦' },
    { id: 'breakdown', name: 'Breakdown', icon: '🚌' },
    { id: 'accident', name: 'Accident', icon: '🚨' },
    { id: 'construction', name: 'Construction', icon: '🚧' },
    { id: 'weather', name: 'Weather', icon: '🌧️' },
    { id: 'security', name: 'Security', icon: '🛡️' }
  ],
  severity: [
    { id: 'low', name: 'Low', color: 'bg-blue-100 text-blue-800' },
    { id: 'medium', name: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'high', name: 'High', color: 'bg-orange-100 text-orange-800' },
    { id: 'critical', name: 'Critical', color: 'bg-red-100 text-red-800' }
  ],
  status: [
    { id: 'active', name: 'Active', color: 'bg-red-100 text-red-800' },
    { id: 'investigating', name: 'Investigating', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'resolved', name: 'Resolved', color: 'bg-green-100 text-green-800' }
  ],
  timeRange: [
    { id: 'last-hour', name: 'Last Hour' },
    { id: 'last-6-hours', name: 'Last 6 Hours' },
    { id: 'today', name: 'Today' },
    { id: 'last-3-days', name: 'Last 3 Days' },
    { id: 'this-week', name: 'This Week' },
    { id: 'all', name: 'All Time' }
  ],
  sortBy: [
    { id: 'newest', name: 'Newest First' },
    { id: 'oldest', name: 'Oldest First' },
    { id: 'severity', name: 'By Severity' },
    { id: 'location', name: 'By Location' },
    { id: 'most-liked', name: 'Most Liked' },
    { id: 'most-verified', name: 'Most Verified' }
  ]
}

export function FeedFilters({ filters, onFiltersChange, onClearFilters }: FeedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const toggleFilter = (category: string, value: string) => {
    const currentValues = filters[category as keyof typeof filters]
    
    if (Array.isArray(currentValues)) {
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      
      onFiltersChange({
        ...filters,
        [category]: newValues
      })
    } else {
      onFiltersChange({
        ...filters,
        [category]: value
      })
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.type.length > 0) count += filters.type.length
    if (filters.severity.length > 0) count += filters.severity.length
    if (filters.status.length > 0) count += filters.status.length
    if (filters.location) count += 1
    if (filters.timeRange !== 'all') count += 1
    if (filters.sortBy !== 'newest') count += 1
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="bg-white rounded-mobile shadow-mobile p-4 mb-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
        >
          <FunnelIcon className="h-5 w-5" />
          <span className="font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
        
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={onClearFilters}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {filterOptions.type.slice(0, 4).map((type) => (
          <button
            key={type.id}
            onClick={() => toggleFilter('type', type.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filters.type.includes(type.id)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{type.icon}</span>
            <span>{type.name}</span>
          </button>
        ))}
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Alert Types */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Alert Types</h4>
              <div className="grid grid-cols-2 gap-2">
                {filterOptions.type.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleFilter('type', type.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.type.includes(type.id)
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span>{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Severity</h4>
              <div className="flex flex-wrap gap-2">
                {filterOptions.severity.map((severity) => (
                  <button
                    key={severity.id}
                    onClick={() => toggleFilter('severity', severity.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.severity.includes(severity.id)
                        ? severity.color + ' border-2 border-current'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {severity.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Status</h4>
              <div className="flex flex-wrap gap-2">
                {filterOptions.status.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => toggleFilter('status', status.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.status.includes(status.id)
                        ? status.color + ' border-2 border-current'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Location</h4>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={filters.location}
                  onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Time Range */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Time Range</h4>
              <div className="grid grid-cols-2 gap-2">
                {filterOptions.timeRange.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => toggleFilter('timeRange', range.id)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.timeRange === range.id
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {range.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Sort By</h4>
              <select
                value={filters.sortBy}
                onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {filterOptions.sortBy.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
            </span>
            <button
              onClick={onClearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
