'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface LocationCardProps {
  location: string
  coordinates: { latitude: number; longitude: number } | null
  onLocationUpdate: (location: string) => void
}

export function LocationCard({ location, coordinates, onLocationUpdate }: LocationCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshLocation = async () => {
    setIsRefreshing(true)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          // In a real app, you'd reverse geocode these coordinates
          onLocationUpdate('Updated Location, Accra')
          setIsRefreshing(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          setIsRefreshing(false)
        }
      )
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-gradient-to-r from-aura-primary to-aura-primary/80 rounded-2xl p-4 text-white shadow-mobile-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MapPinIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Current Location</h3>
            <p className="text-sm opacity-90">{location}</p>
          </div>
        </div>
        
        <button
          onClick={handleRefreshLocation}
          disabled={isRefreshing}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors tap-target"
        >
          <ArrowPathIcon 
            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>
      
      {coordinates && (
        <div className="mt-3 text-xs opacity-75">
          {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
        </div>
      )}
    </motion.div>
  )
}
