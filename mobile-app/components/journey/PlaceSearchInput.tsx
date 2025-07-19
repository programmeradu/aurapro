'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { TransportStop, GeoPoint } from '@/types/transport'
import { journeyService } from '@/services/journeyService'
import { searchService, SearchResult } from '@/services/searchService'
import { gtfsService } from '@/services/gtfsService'

interface PlaceSearchInputProps {
  placeholder: string
  value: TransportStop | null
  onChange: (stop: TransportStop | null) => void
  userLocation?: GeoPoint
  className?: string
}

export function PlaceSearchInput({
  placeholder,
  value,
  onChange,
  userLocation,
  className = ''
}: PlaceSearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([])
  const [nearbyStops, setNearbyStops] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Load recent searches and nearby stops
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('recent_places')
        if (saved) {
          setRecentSearches(JSON.parse(saved))
        }
      } catch (error) {
        console.error('Error loading recent searches:', error)
      }
    }

    // Load nearby stops if user location is available (with debouncing)
    if (userLocation) {
      const timer = setTimeout(loadNearbyStops, 1000) // 1 second delay
      return () => clearTimeout(timer)
    }
  }, [userLocation])

  const loadNearbyStops = async () => {
    if (!userLocation) return

    try {
      const suggestions = await searchService.getLocationBasedSuggestions(userLocation)
      setNearbyStops(suggestions.filter(s => s.type === 'stop'))
    } catch (error) {
      // Silently handle error - offline indicator will show status
      setNearbyStops([])
    }
  }

  // Enhanced search for places using new search service
  useEffect(() => {
    const searchPlaces = async () => {
      if (query.length < 2) {
        setResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        // Use the new enhanced search service - prioritize stops and destinations for journey planning
        const searchResults = await searchService.search(query, {
          types: ['stop', 'destination'], // Only stops and destinations for journey planning
          location: userLocation,
          radius: 5,
          limit: 15,
          includeNearby: true
        })
        setResults(searchResults)
      } catch (error) {
        console.error('Error searching places:', error)
        // Fallback to original journey service
        try {
          const places = await journeyService.searchPlaces(query, userLocation, 10)
          const fallbackResults = places.map(place => ({
            id: place.id,
            type: 'stop' as const,
            name: place.name,
            description: place.type,
            location: place.location,
            relevanceScore: 0.5,
            metadata: { stopId: place.id, type: place.type }
          }))
          setResults(fallbackResults)
        } catch (fallbackError) {
          console.error('Fallback search also failed:', fallbackError)
          setResults([])
        }
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchPlaces, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, userLocation])

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPlace = (result: SearchResult) => {
    // Convert SearchResult to TransportStop for compatibility
    const transportStop: TransportStop = {
      id: result.id,
      name: result.name,
      type: result.type === 'stop' ? 'terminal' : 'stop',
      location: result.location || { latitude: 0, longitude: 0 },
      routes: [],
      facilities: []
    }

    onChange(transportStop)
    setQuery('')
    setShowResults(false)

    // Add to recent searches
    const updated = [result, ...recentSearches.filter(p => p.id !== result.id)].slice(0, 8)
    setRecentSearches(updated)

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('recent_places', JSON.stringify(updated))
      } catch (error) {
        console.error('Error saving recent search:', error)
      }
    }
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
    inputRef.current?.focus()
  }

  const handleInputFocus = () => {
    setShowResults(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    if (!showResults) {
      setShowResults(true)
    }
  }

  const getDistanceText = (result: SearchResult) => {
    if (!userLocation || !result.location) return null

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      result.location.latitude,
      result.location.longitude
    )

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`
    }
    return `${distance.toFixed(1)}km away`
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'stop': return '🚏'
      case 'route': return '🛣️'
      case 'landmark': return '🏛️'
      case 'destination': return '📍'
      case 'terminal': return '🚌'
      case 'station': return '🚉'
      case 'junction': return '🛣️'
      default: return '📍'
    }
  }

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'stop': return 'Bus Stop'
      case 'terminal': return 'Terminal'
      case 'station': return 'Station'
      case 'junction': return 'Junction'
      case 'route': return 'Route'
      case 'landmark': return 'Landmark'
      case 'destination': return 'Destination'
      default: return 'Location'
    }
  }

  return (
    <div className="relative">
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={value ? value.name : placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className={`w-full py-3 px-4 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-aura-primary transition-colors ${className}`}
        />
        
        {value ? (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        ) : (
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Selected value display */}
      {value && !showResults && (
        <div className="absolute inset-0 flex items-center px-4 bg-white rounded-xl border border-gray-300 pointer-events-none">
          <div className="flex items-center space-x-2 text-ui-text-primary">
            <span>{getResultIcon(value.type)}</span>
            <span className="font-medium truncate">{value.name}</span>
          </div>
        </div>
      )}

      {/* Search Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-floating border border-ui-border max-h-80 overflow-y-auto z-50"
          >
            {/* Loading */}
            {isSearching && (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-aura-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Searching...</p>
              </div>
            )}

            {/* Search Results */}
            {!isSearching && query.length >= 2 && (
              <div>
                {results.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Search Results ({results.length})
                    </div>
                    {results.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectPlace(result)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 group"
                      >
                        <div className="text-lg">{getResultIcon(result.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-ui-text-primary truncate">
                            {result.name}
                          </div>
                          <div className="text-sm text-ui-text-secondary flex items-center">
                            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs mr-2">
                              {getResultTypeLabel(result.type)}
                            </span>
                            {result.description}
                            {getDistanceText(result) && (
                              <span className="ml-2 text-gray-400">{getDistanceText(result)}</span>
                            )}
                          </div>
                          {result.location && (
                            <div className="text-xs text-gray-400 mt-1">
                              📍 {result.location.latitude.toFixed(4)}, {result.location.longitude.toFixed(4)}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {Math.round(result.relevanceScore * 100)}% match
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No places found for "{query}"</p>
                    <p className="text-xs mt-1">Try searching for stops, routes, or landmarks</p>
                  </div>
                )}
              </div>
            )}

            {/* Nearby Stops */}
            {!isSearching && query.length < 2 && nearbyStops.length > 0 && (
              <div className="py-2 border-b border-gray-100">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Near You
                </div>
                {nearbyStops.slice(0, 4).map((result) => (
                  <button
                    key={`nearby-${result.id}`}
                    onClick={() => handleSelectPlace(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <MapPinIcon className="w-4 h-4 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ui-text-primary truncate">
                        {result.name}
                      </div>
                      <div className="text-sm text-ui-text-secondary flex items-center">
                        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs mr-2">
                          {getResultTypeLabel(result.type)}
                        </span>
                        {getDistanceText(result)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {!isSearching && query.length < 2 && recentSearches.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recent Searches
                </div>
                {recentSearches.slice(0, 5).map((result, index) => (
                  <button
                    key={`recent-${result.id}`}
                    onClick={() => handleSelectPlace(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ui-text-primary truncate">
                        {result.name}
                      </div>
                      <div className="text-sm text-ui-text-secondary flex items-center">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs mr-2">
                          {getResultTypeLabel(result.type)}
                        </span>
                        {result.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isSearching && query.length < 2 && recentSearches.length === 0 && nearbyStops.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <MapPinIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Start typing to search for places</p>
                <p className="text-xs mt-1">Find stops, routes, landmarks, and destinations</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
