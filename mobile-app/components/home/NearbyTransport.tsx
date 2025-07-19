'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPinIcon, 
  ClockIcon,
  UserGroupIcon,
  ArrowRightIcon,
  WifiIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

interface TransportOption {
  id: string
  type: 'bus' | 'trotro' | 'taxi' | 'uber'
  route: string
  destination: string
  estimatedTime: number
  distance: number
  price: number
  capacity: number
  currentPassengers: number
  amenities: string[]
  nextArrival: Date
  frequency: number // minutes between arrivals
}

const mockTransportOptions: TransportOption[] = [
  {
    id: '1',
    type: 'trotro',
    route: 'Circle - Kaneshie',
    destination: 'Kaneshie Market',
    estimatedTime: 25,
    distance: 8.5,
    price: 3.50,
    capacity: 18,
    currentPassengers: 12,
    amenities: ['Music'],
    nextArrival: new Date(Date.now() + 5 * 60 * 1000),
    frequency: 10
  },
  {
    id: '2',
    type: 'bus',
    route: 'Accra - Kumasi',
    destination: 'Kumasi Central',
    estimatedTime: 240,
    distance: 250,
    price: 45.00,
    capacity: 45,
    currentPassengers: 23,
    amenities: ['AC', 'WiFi', 'Charging'],
    nextArrival: new Date(Date.now() + 15 * 60 * 1000),
    frequency: 60
  },
  {
    id: '3',
    type: 'taxi',
    route: 'Local Area',
    destination: 'Airport Terminal',
    estimatedTime: 35,
    distance: 15.2,
    price: 25.00,
    capacity: 4,
    currentPassengers: 0,
    amenities: ['AC'],
    nextArrival: new Date(Date.now() + 2 * 60 * 1000),
    frequency: 5
  }
]

export function NearbyTransport() {
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>(mockTransportOptions)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  const transportTypes = [
    { id: 'all', name: 'All', icon: '🚌' },
    { id: 'bus', name: 'Bus', icon: '🚌' },
    { id: 'trotro', name: 'Trotro', icon: '🚐' },
    { id: 'taxi', name: 'Taxi', icon: '🚕' },
    { id: 'uber', name: 'Ride', icon: '🚗' }
  ]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bus': return '🚌'
      case 'trotro': return '🚐'
      case 'taxi': return '🚕'
      case 'uber': return '🚗'
      default: return '🚌'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bus': return 'bg-blue-100 text-blue-800'
      case 'trotro': return 'bg-green-100 text-green-800'
      case 'taxi': return 'bg-yellow-100 text-yellow-800'
      case 'uber': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes <= 0) return 'Now'
    if (minutes < 60) return `${minutes}m`
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getCapacityColor = (current: number, total: number) => {
    const percentage = (current / total) * 100
    if (percentage < 50) return 'text-green-600'
    if (percentage < 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredOptions = selectedType === 'all' 
    ? transportOptions 
    : transportOptions.filter(option => option.type === selectedType)

  const refreshData = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      // In real app, fetch fresh data here
    }, 1000)
  }

  return (
    <div className="bg-white rounded-mobile shadow-mobile p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Nearby Transport</h2>
        <button
          onClick={refreshData}
          disabled={loading}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
        >
          <ArrowRightIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Transport Type Filter */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {transportTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedType === type.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{type.icon}</span>
            <span>{type.name}</span>
          </button>
        ))}
      </div>

      {/* Transport Options */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getTypeIcon(option.type)}</div>
                  <div>
                    <h3 className="font-medium text-gray-900">{option.route}</h3>
                    <p className="text-sm text-gray-600">{option.destination}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(option.type)}`}>
                  {option.type.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {formatTime(option.nextArrival)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <BanknotesIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    GH₵{option.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="h-4 w-4 text-gray-500" />
                  <span className={`text-sm ${getCapacityColor(option.currentPassengers, option.capacity)}`}>
                    {option.currentPassengers}/{option.capacity}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {option.distance}km
                  </span>
                </div>
              </div>

              {option.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {option.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                    >
                      {amenity === 'WiFi' && <WifiIcon className="h-3 w-3 mr-1" />}
                      {amenity}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Every {option.frequency} minutes
                </span>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                  Track
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredOptions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🚌</div>
          <p className="text-gray-600 mb-2">No transport options found</p>
          <p className="text-sm text-gray-500">Try selecting a different transport type</p>
        </div>
      )}
    </div>
  )
}
