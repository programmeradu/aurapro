'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookmarkIcon,
  ClockIcon,
  MapPinIcon,
  TrashIcon,
  PencilIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface SavedJourney {
  id: string
  name: string
  origin: {
    name: string
    address: string
    coordinates: [number, number]
  }
  destination: {
    name: string
    address: string
    coordinates: [number, number]
  }
  frequency: 'daily' | 'weekly' | 'occasional'
  isFavorite: boolean
  lastUsed: Date
  createdAt: Date
  estimatedDuration: number
  estimatedCost: number
  preferredMode: 'bus' | 'trotro' | 'taxi' | 'mixed'
  tags: string[]
}

const mockSavedJourneys: SavedJourney[] = [
  {
    id: '1',
    name: 'Home to Work',
    origin: {
      name: 'Home',
      address: 'East Legon, Accra',
      coordinates: [5.6037, -0.1870]
    },
    destination: {
      name: 'Office',
      address: 'Osu, Accra',
      coordinates: [5.5560, -0.1969]
    },
    frequency: 'daily',
    isFavorite: true,
    lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    estimatedDuration: 35,
    estimatedCost: 8.50,
    preferredMode: 'trotro',
    tags: ['work', 'commute']
  },
  {
    id: '2',
    name: 'Weekend Shopping',
    origin: {
      name: 'Home',
      address: 'East Legon, Accra',
      coordinates: [5.6037, -0.1870]
    },
    destination: {
      name: 'Accra Mall',
      address: 'Tetteh Quarshie, Accra',
      coordinates: [5.6108, -0.1821]
    },
    frequency: 'weekly',
    isFavorite: false,
    lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    estimatedDuration: 25,
    estimatedCost: 12.00,
    preferredMode: 'taxi',
    tags: ['shopping', 'weekend']
  },
  {
    id: '3',
    name: 'Airport Route',
    origin: {
      name: 'Hotel',
      address: 'Airport Residential Area',
      coordinates: [5.6052, -0.1719]
    },
    destination: {
      name: 'Kotoka International Airport',
      address: 'Airport, Accra',
      coordinates: [5.6052, -0.1719]
    },
    frequency: 'occasional',
    isFavorite: true,
    lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    estimatedDuration: 15,
    estimatedCost: 25.00,
    preferredMode: 'taxi',
    tags: ['travel', 'airport']
  }
]

interface SavedJourneysProps {
  onJourneySelect?: (journey: SavedJourney) => void
  onJourneyEdit?: (journey: SavedJourney) => void
  onJourneyDelete?: (journeyId: string) => void
}

export function SavedJourneys({ onJourneySelect, onJourneyEdit, onJourneyDelete }: SavedJourneysProps) {
  const [journeys, setJourneys] = useState<SavedJourney[]>(mockSavedJourneys)
  const [filter, setFilter] = useState<'all' | 'favorites' | 'recent'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'lastUsed' | 'frequency'>('lastUsed')

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-green-100 text-green-800'
      case 'weekly': return 'bg-blue-100 text-blue-800'
      case 'occasional': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'bus': return '🚌'
      case 'trotro': return '🚐'
      case 'taxi': return '🚕'
      case 'mixed': return '🚌🚐'
      default: return '🚌'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes}m ago`
    }
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    
    return date.toLocaleDateString()
  }

  const toggleFavorite = (journeyId: string) => {
    setJourneys(prev => prev.map(journey => 
      journey.id === journeyId 
        ? { ...journey, isFavorite: !journey.isFavorite }
        : journey
    ))
  }

  const deleteJourney = (journeyId: string) => {
    setJourneys(prev => prev.filter(journey => journey.id !== journeyId))
    onJourneyDelete?.(journeyId)
  }

  const filteredJourneys = journeys
    .filter(journey => {
      switch (filter) {
        case 'favorites': return journey.isFavorite
        case 'recent': return new Date().getTime() - journey.lastUsed.getTime() < 7 * 24 * 60 * 60 * 1000
        default: return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'frequency': 
          const frequencyOrder = { daily: 3, weekly: 2, occasional: 1 }
          return frequencyOrder[b.frequency] - frequencyOrder[a.frequency]
        case 'lastUsed':
        default:
          return b.lastUsed.getTime() - a.lastUsed.getTime()
      }
    })

  return (
    <div className="bg-white rounded-mobile shadow-mobile p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <BookmarkIcon className="h-5 w-5 mr-2 text-blue-600" />
          Saved Journeys
        </h2>
        <span className="text-sm text-gray-500">{filteredJourneys.length} journeys</span>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-4 overflow-x-auto">
        {[
          { id: 'all', name: 'All', icon: '📋' },
          { id: 'favorites', name: 'Favorites', icon: '⭐' },
          { id: 'recent', name: 'Recent', icon: '🕒' }
        ].map((filterOption) => (
          <button
            key={filterOption.id}
            onClick={() => setFilter(filterOption.id as any)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === filterOption.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{filterOption.icon}</span>
            <span>{filterOption.name}</span>
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm text-gray-600">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="lastUsed">Last Used</option>
          <option value="name">Name</option>
          <option value="frequency">Frequency</option>
        </select>
      </div>

      {/* Journey List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredJourneys.map((journey, index) => (
            <motion.div
              key={journey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900">{journey.name}</h3>
                    <button
                      onClick={() => toggleFavorite(journey.id)}
                      className="text-yellow-500 hover:text-yellow-600"
                    >
                      {journey.isFavorite ? (
                        <StarIconSolid className="h-4 w-4" />
                      ) : (
                        <StarIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(journey.frequency)}`}>
                      {journey.frequency}
                    </span>
                    <span className="text-lg">{getModeIcon(journey.preferredMode)}</span>
                    <span>{journey.preferredMode}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onJourneyEdit?.(journey)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteJourney(journey.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{journey.origin.name}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{journey.origin.address}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium">{journey.destination.name}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{journey.destination.address}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>{journey.estimatedDuration}min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>💰</span>
                    <span>GH₵{journey.estimatedCost.toFixed(2)}</span>
                  </div>
                </div>
                <span className="text-xs">Last used {formatTime(journey.lastUsed)}</span>
              </div>

              {journey.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {journey.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => onJourneySelect?.(journey)}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Use This Journey</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredJourneys.length === 0 && (
        <div className="text-center py-8">
          <BookmarkIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-2">No saved journeys found</p>
          <p className="text-sm text-gray-500">
            {filter === 'all' 
              ? 'Save your frequent routes for quick access'
              : `No ${filter} journeys available`
            }
          </p>
        </div>
      )}
    </div>
  )
}
