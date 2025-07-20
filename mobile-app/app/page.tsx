'use client'

import { AppleLocationCard } from '@/components/home/AppleLocationCard'
import { AppleWeatherWidget } from '@/components/home/AppleWeatherWidget'
import AdvancedPersonalizedRecommendations from '@/components/home/AdvancedPersonalizedRecommendations'
import SmartInsights from '@/components/home/SmartInsights'
import EnhancedQuickActions from '@/components/home/EnhancedQuickActions'
import { UberLevelJourneyPlannerV2 } from '@/components/journey/UberLevelJourneyPlannerV2'
import { EnhancedHeader } from '@/components/navigation/EnhancedHeader'
import { EnhancedFooter } from '@/components/navigation/EnhancedFooter'
import { GeminiAIAssistant } from '@/components/home/GeminiAIAssistant'
import OfflineIndicator from '@/components/ui/OfflineIndicator'
import { apiService } from '@/services/apiService'
import {
    BellIcon,
    ExclamationTriangleIcon,
    Cog6ToothIcon,
    UserCircleIcon,
    SparklesIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'

interface Location {
  latitude: number
  longitude: number
}

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [locationName, setLocationName] = useState('Getting location...')
  const [homeData, setHomeData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showJourneyPlanner, setShowJourneyPlanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Generate or get user ID (in a real app, this would come from authentication)
  const userId = useMemo(() => 'user-' + Math.random().toString(36).substr(2, 9), [])

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Get user location and initialize app
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }
              setUserLocation(location)

              // Get location name (simplified for demo)
              setLocationName('Accra, Ghana')

              // Initialize backend connection silently
              await initializeBackend()
            },
            (error) => {
              console.error('Error getting location:', error)
              // Use default Accra location
              const defaultLocation = { latitude: 5.6037, longitude: -0.1870 }
              setUserLocation(defaultLocation)
              setLocationName('Accra, Ghana')
              initializeBackend()
            }
          )
        } else {
          // Use default location
          const defaultLocation = { latitude: 5.6037, longitude: -0.1870 }
          setUserLocation(defaultLocation)
          setLocationName('Accra, Ghana')
          initializeBackend()
        }
      } catch (error) {
        console.error('Location error:', error)
        setIsLoading(false)
      }
    }

    getUserLocation()
  }, [])

  const initializeBackend = async () => {
    try {
      // Silently connect to backend to power ML features
      const modelsResponse = await apiService.getMLModelsStatus()
      if (modelsResponse.success) {
        console.log('✅ Backend connected - ML models ready')
      }
    } catch (error) {
      console.log('⚠️ Backend offline - using fallback features')
    } finally {
      setIsLoading(false)
    }
  }



  // Utility functions
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }



  return (
    <div className="min-h-screen-safe bg-gradient-to-br from-aura-primary/3 via-white to-aura-secondary/3">
      <OfflineIndicator />

      {/* Enhanced Header */}
      <EnhancedHeader
        currentTime={currentTime}
        locationName={locationName}
        onSettingsClick={() => setShowSettings(true)}
        className="sticky top-0 z-50"
      />

      {/* Main Content */}
      <main className="px-4 pb-20 space-y-6">
        {/* Apple-style Location Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AppleLocationCard
            currentTime={currentTime}
            locationName={locationName}
            userLocation={userLocation}
            className="mb-6"
          />
        </motion.div>

        {/* Advanced Personalized Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AdvancedPersonalizedRecommendations
            userId={userId}
            userLocation={userLocation || undefined}
            className="mb-6"
            maxRecommendations={5}
            enableRealtime={true}
            enableAnalytics={true}
            enableOptimization={true}
          />
        </motion.div>

        {/* Enhanced Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <EnhancedQuickActions className="mb-6" />
        </motion.div>

        {/* Smart Insights & Weather - Side by Side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6"
        >
          <div className="lg:col-span-2">
            <SmartInsights
              userId={userId}
              userLocation={userLocation || undefined}
            />
          </div>
          <div className="lg:col-span-1">
            <AppleWeatherWidget
              className="h-full"
            />
          </div>
        </motion.div>

        {/* Journey Planner - Core Feature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <UberLevelJourneyPlannerV2
            userLocation={userLocation}
            className="mb-6"
          />
        </motion.div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                App settings and preferences
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Enhanced Footer */}
      <EnhancedFooter />

      {/* Gemini AI Assistant */}
      <GeminiAIAssistant userLocation={userLocation} />
    </div>
  )
}
