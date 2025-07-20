'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPinIcon, 
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { MapPinIcon as MapPinIconSolid } from '@heroicons/react/24/solid'
import { apiService, Location } from '@/services/apiService'

interface LocationCardProps {
  location: string
  coordinates: { latitude: number; longitude: number } | null
  onLocationUpdate: (location: string) => void
  className?: string
}

interface LocationSuggestion {
  name: string
  subtitle: string
  type: 'current' | 'recent' | 'popular' | 'search'
  coordinates?: { latitude: number; longitude: number }
  isRecent?: boolean
  isPopular?: boolean
}

export function LocationCard({
  location,
  coordinates,
  onLocationUpdate,
  className = ''
}: LocationCardProps) {
  const [currentLocation, setCurrentLocation] = useState(location)
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [popularDestinations, setPopularDestinations] = useState<LocationSuggestion[]>([])

  // Fetch popular destinations from API
  useEffect(() => {
    const fetchPopularDestinations = async () => {
      try {
        const response = await apiService.getPopularDestinations()
        if (response.success && response.data) {
          const popular = response.data.map(dest => ({
            name: dest.name,
            subtitle: `${dest.category} • ${dest.estimated_travel_time} min away`,
            type: 'popular' as const,
            coordinates: dest.coordinates,
            isPopular: true
          }))
          setPopularDestinations(popular)
          setSuggestions(popular)
        }
      } catch (error) {
        console.error('Failed to fetch popular destinations:', error)
        // Fallback to default suggestions
        const fallbackSuggestions: LocationSuggestion[] = [
          {
            name: 'Accra Central',
            subtitle: 'Greater Accra Region',
            type: 'current',
            coordinates: { latitude: 5.6037, longitude: -0.1870 },
            isRecent: true
          },
          {
            name: 'Kotoka Airport',
            subtitle: 'Airport • 12 km away',
            type: 'popular',
            coordinates: { latitude: 5.6052, longitude: -0.1668 },
            isPopular: true
          },
          {
            name: 'University of Ghana',
            subtitle: 'Education • 15 km away',
            type: 'popular',
            coordinates: { latitude: 5.6519, longitude: -0.1830 },
            isPopular: true
          }
        ]
        setSuggestions(fallbackSuggestions)
      }
    }

    fetchPopularDestinations()
  }, [])

  // Search places using API
  const searchPlaces = async (query: string) => {
    if (query.length < 2) {
      setSuggestions(popularDestinations)
      return
    }

    setIsSearching(true)
    try {
      const response = await apiService.searchPlaces(query)
      if (response.success && response.data) {
        const searchResults = response.data.map((place: any) => ({
          name: place.name || place.display_name,
          subtitle: place.address || place.display_name,
          type: 'search' as const,
          coordinates: {
            latitude: place.lat || place.latitude,
            longitude: place.lon || place.longitude
          }
        }))
        setSuggestions(searchResults)
      }
    } catch (error) {
      console.error('Search error:', error)
      // Fallback to local filtering
      const filtered = popularDestinations.filter(suggestion =>
        suggestion.name.toLowerCase().includes(query.toLowerCase()) ||
        suggestion.subtitle.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchPlaces(searchQuery)
      } else {
        setSuggestions(popularDestinations)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, popularDestinations])

  const filteredSuggestions = suggestions

  useEffect(() => {
    setCurrentLocation(location)
  }, [location])

  const handleLocationChange = (suggestion: LocationSuggestion) => {
    setCurrentLocation(suggestion.name)
    onLocationUpdate(suggestion.name)
    setIsExpanded(false)
    setSearchQuery('')
    setIsSearching(false)
  }

  const handleSearchFocus = () => {
    setIsSearching(true)
  }

  const handleSearchBlur = () => {
    setTimeout(() => setIsSearching(false), 200)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/95 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)'
      }}
    >
      {/* Main Location Display */}
      <div className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MapPinIconSolid className="w-6 h-6 text-white" />
              </div>
              {/* Live indicator */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm">
                <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <div className="text-left">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Current Location
              </p>
              <p className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {currentLocation}
              </p>
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="p-2 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors"
          >
            <ChevronDownIcon className="w-4 h-4 text-gray-600" />
          </motion.div>
        </button>
      </div>

      {/* Expanded Location Picker */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-gray-100"
          >
            {/* Search Bar */}
            <div className="p-4 bg-gray-50/50">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium placeholder-gray-500"
                />
              </div>
            </div>

            {/* Location Suggestions */}
            <div className="max-h-80 overflow-y-auto">
              {!isSearching && (
                <>
                  {/* Recent Locations */}
                  <div className="px-4 py-2">
                    <div className="flex items-center space-x-2 mb-3">
                      <ClockIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Recent
                      </span>
                    </div>
                    <div className="space-y-1">
                      {suggestions.filter(s => s.isRecent).map((suggestion, index) => (
                        <LocationSuggestionItem
                          key={`recent-${index}`}
                          suggestion={suggestion}
                          onSelect={handleLocationChange}
                          isSelected={suggestion.name === currentLocation}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Popular Locations */}
                  <div className="px-4 py-2">
                    <div className="flex items-center space-x-2 mb-3">
                      <StarIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Popular
                      </span>
                    </div>
                    <div className="space-y-1">
                      {suggestions.filter(s => s.isPopular).map((suggestion, index) => (
                        <LocationSuggestionItem
                          key={`popular-${index}`}
                          suggestion={suggestion}
                          onSelect={handleLocationChange}
                          isSelected={suggestion.name === currentLocation}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Search Results */}
              {isSearching && (
                <div className="px-4 py-2">
                  <div className="space-y-1">
                    {filteredSuggestions.map((suggestion, index) => (
                      <LocationSuggestionItem
                        key={`search-${index}`}
                        suggestion={suggestion}
                        onSelect={handleLocationChange}
                        isSelected={suggestion.name === currentLocation}
                        showDistance={true}
                      />
                    ))}
                    {filteredSuggestions.length === 0 && (
                      <div className="py-8 text-center">
                        <p className="text-gray-500 text-sm">No locations found</p>
                        <p className="text-gray-400 text-xs mt-1">Try a different search term</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Location Suggestion Item Component
function LocationSuggestionItem({
  suggestion,
  onSelect,
  isSelected,
  showDistance = false
}: {
  suggestion: LocationSuggestion
  onSelect: (suggestion: LocationSuggestion) => void
  isSelected: boolean
  showDistance?: boolean
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(suggestion)}
      className={`w-full flex items-center space-x-3 p-3 rounded-2xl transition-all ${
        isSelected
          ? 'bg-blue-500 text-white shadow-lg'
          : 'hover:bg-gray-100 text-gray-900'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        isSelected 
          ? 'bg-white/20' 
          : 'bg-gray-100'
      }`}>
        <MapPinIcon className={`w-5 h-5 ${
          isSelected ? 'text-white' : 'text-gray-600'
        }`} />
      </div>
      
      <div className="flex-1 text-left">
        <p className={`font-semibold text-sm ${
          isSelected ? 'text-white' : 'text-gray-900'
        }`}>
          {suggestion.name}
        </p>
        <p className={`text-xs ${
          isSelected ? 'text-white/80' : 'text-gray-500'
        }`}>
          {suggestion.subtitle}
        </p>
      </div>

      {suggestion.isRecent && (
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isSelected 
            ? 'bg-white/20 text-white' 
            : 'bg-blue-100 text-blue-600'
        }`}>
          Recent
        </div>
      )}

      {suggestion.isPopular && (
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isSelected 
            ? 'bg-white/20 text-white' 
            : 'bg-orange-100 text-orange-600'
        }`}>
          Popular
        </div>
      )}
    </motion.button>
  )
}

// Export as AppleLocationCard for compatibility
export const AppleLocationCard = LocationCard
export default LocationCard