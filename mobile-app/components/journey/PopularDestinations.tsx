'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPinIcon,
  ClockIcon,
  StarIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ShoppingBagIcon,
  AcademicCapIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'

interface PopularDestination {
  id: string
  name: string
  address: string
  coordinates: [number, number]
  category: 'business' | 'shopping' | 'education' | 'transport' | 'entertainment' | 'government'
  popularity: number
  averageJourneyTime: number
  estimatedCost: number
  description: string
  tags: string[]
  isFavorite: boolean
  isFrequentDestination: boolean
  lastVisited?: Date
  visitCount: number
  nearbyTransportOptions: string[]
}

const mockDestinations: PopularDestination[] = [
  {
    id: '1',
    name: 'Accra Mall',
    address: 'Tetteh Quarshie Interchange, Accra',
    coordinates: [5.6108, -0.1821],
    category: 'shopping',
    popularity: 95,
    averageJourneyTime: 25,
    estimatedCost: 8.50,
    description: 'Premier shopping destination with restaurants, cinema, and retail stores',
    tags: ['shopping', 'entertainment', 'food', 'cinema'],
    isFavorite: true,
    isFrequentDestination: true,
    lastVisited: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    visitCount: 15,
    nearbyTransportOptions: ['bus', 'trotro', 'taxi']
  },
  {
    id: '2',
    name: 'Kotoka International Airport',
    address: 'Airport, Accra',
    coordinates: [5.6052, -0.1719],
    category: 'transport',
    popularity: 88,
    averageJourneyTime: 35,
    estimatedCost: 25.00,
    description: 'Ghana\'s main international airport',
    tags: ['airport', 'travel', 'international'],
    isFavorite: false,
    isFrequentDestination: false,
    visitCount: 3,
    nearbyTransportOptions: ['taxi', 'uber', 'bus']
  },
  {
    id: '3',
    name: 'University of Ghana',
    address: 'Legon, Accra',
    coordinates: [5.6519, -0.1870],
    category: 'education',
    popularity: 82,
    averageJourneyTime: 30,
    estimatedCost: 6.00,
    description: 'Premier university in Ghana with multiple campuses',
    tags: ['university', 'education', 'students'],
    isFavorite: true,
    isFrequentDestination: true,
    lastVisited: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    visitCount: 45,
    nearbyTransportOptions: ['trotro', 'bus', 'taxi']
  },
  {
    id: '4',
    name: 'Osu Oxford Street',
    address: 'Osu, Accra',
    coordinates: [5.5560, -0.1969],
    category: 'entertainment',
    popularity: 78,
    averageJourneyTime: 20,
    estimatedCost: 5.50,
    description: 'Vibrant nightlife and entertainment district',
    tags: ['nightlife', 'restaurants', 'bars', 'entertainment'],
    isFavorite: false,
    isFrequentDestination: false,
    visitCount: 8,
    nearbyTransportOptions: ['trotro', 'taxi', 'walking']
  },
  {
    id: '5',
    name: 'Makola Market',
    address: 'Central Accra',
    coordinates: [5.5500, -0.2070],
    category: 'shopping',
    popularity: 85,
    averageJourneyTime: 18,
    estimatedCost: 4.00,
    description: 'Largest traditional market in Accra',
    tags: ['market', 'traditional', 'wholesale', 'local'],
    isFavorite: true,
    isFrequentDestination: false,
    visitCount: 12,
    nearbyTransportOptions: ['trotro', 'bus', 'walking']
  },
  {
    id: '6',
    name: 'Flagstaff House',
    address: 'Kanda, Accra',
    coordinates: [5.5731, -0.1969],
    category: 'government',
    popularity: 65,
    averageJourneyTime: 22,
    estimatedCost: 7.00,
    description: 'Seat of government of Ghana',
    tags: ['government', 'official', 'politics'],
    isFavorite: false,
    isFrequentDestination: false,
    visitCount: 2,
    nearbyTransportOptions: ['taxi', 'bus']
  }
]

interface PopularDestinationsProps {
  onDestinationSelect?: (destination: PopularDestination) => void
  selectedCategory?: string
  showFavoritesOnly?: boolean
}

export function PopularDestinations({ 
  onDestinationSelect, 
  selectedCategory = 'all',
  showFavoritesOnly = false 
}: PopularDestinationsProps) {
  const [destinations, setDestinations] = useState<PopularDestination[]>(mockDestinations)
  const [filter, setFilter] = useState<string>(selectedCategory)
  const [sortBy, setSortBy] = useState<'popularity' | 'distance' | 'cost' | 'recent'>('popularity')

  const categories = [
    { id: 'all', name: 'All', icon: MapPinIcon, color: 'text-gray-600' },
    { id: 'shopping', name: 'Shopping', icon: ShoppingBagIcon, color: 'text-purple-600' },
    { id: 'business', name: 'Business', icon: BuildingOfficeIcon, color: 'text-blue-600' },
    { id: 'education', name: 'Education', icon: AcademicCapIcon, color: 'text-green-600' },
    { id: 'transport', name: 'Transport', icon: MapPinIcon, color: 'text-orange-600' },
    { id: 'entertainment', name: 'Entertainment', icon: StarIcon, color: 'text-pink-600' },
    { id: 'government', name: 'Government', icon: BuildingOfficeIcon, color: 'text-red-600' }
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'shopping': return '🛍️'
      case 'business': return '🏢'
      case 'education': return '🎓'
      case 'transport': return '✈️'
      case 'entertainment': return '🎭'
      case 'government': return '🏛️'
      default: return '📍'
    }
  }

  const toggleFavorite = (destinationId: string) => {
    setDestinations(prev => prev.map(dest => 
      dest.id === destinationId 
        ? { ...dest, isFavorite: !dest.isFavorite }
        : dest
    ))
  }

  const filteredDestinations = destinations
    .filter(dest => {
      if (showFavoritesOnly && !dest.isFavorite) return false
      if (filter !== 'all' && dest.category !== filter) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity
        case 'cost':
          return a.estimatedCost - b.estimatedCost
        case 'recent':
          if (!a.lastVisited && !b.lastVisited) return 0
          if (!a.lastVisited) return 1
          if (!b.lastVisited) return -1
          return b.lastVisited.getTime() - a.lastVisited.getTime()
        case 'distance':
        default:
          return a.averageJourneyTime - b.averageJourneyTime
      }
    })

  const formatLastVisited = (date?: Date) => {
    if (!date) return 'Never visited'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
          Popular Destinations
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="popularity">Most Popular</option>
          <option value="distance">Nearest</option>
          <option value="cost">Cheapest</option>
          <option value="recent">Recently Visited</option>
        </select>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setFilter(category.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <category.icon className="h-4 w-4" />
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Destinations List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredDestinations.map((destination, index) => (
            <motion.div
              key={destination.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onDestinationSelect?.(destination)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getCategoryIcon(destination.category)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{destination.name}</h4>
                      {destination.isFrequentDestination && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Frequent
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{destination.address}</p>
                    <p className="text-xs text-gray-500">{destination.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(destination.id)
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  {destination.isFavorite ? (
                    <HeartIconSolid className="h-5 w-5 text-red-500" />
                  ) : (
                    <HeartIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                <div className="flex items-center space-x-1 text-gray-600">
                  <ClockIcon className="h-4 w-4" />
                  <span>{destination.averageJourneyTime}min</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <span>💰</span>
                  <span>GH₵{destination.estimatedCost.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <StarIcon className="h-4 w-4" />
                  <span>{destination.popularity}%</span>
                </div>
              </div>

              {destination.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {destination.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {destination.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{destination.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  <span>Transport:</span>
                  <div className="flex space-x-1">
                    {destination.nearbyTransportOptions.map((option, idx) => (
                      <span key={idx} className="px-1 py-0.5 bg-gray-200 rounded">
                        {option === 'trotro' ? '🚐' : 
                         option === 'bus' ? '🚌' : 
                         option === 'taxi' ? '🚕' : 
                         option === 'uber' ? '🚗' : '🚶'}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  {destination.visitCount > 0 && (
                    <span>Visited {destination.visitCount} times • {formatLastVisited(destination.lastVisited)}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredDestinations.length === 0 && (
        <div className="text-center py-8">
          <MapPinIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-2">No destinations found</p>
          <p className="text-sm text-gray-500">
            {showFavoritesOnly 
              ? 'No favorite destinations yet. Add some by tapping the heart icon!'
              : 'Try adjusting your filters or search for a specific location.'
            }
          </p>
        </div>
      )}
    </div>
  )
}
