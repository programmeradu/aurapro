'use client'

import { LiveUpdates } from '@/components/home/LiveUpdates'
import { LocationCard } from '@/components/home/AppleLocationCard'
import { NearbyTransport } from '@/components/home/NearbyTransport'
import { NewsUpdates } from '@/components/home/NewsUpdates'
import { WeatherWidget } from '@/components/home/AppleWeatherWidget'
import AdvancedPersonalizedRecommendations from '@/components/home/AdvancedPersonalizedRecommendations'
import SmartInsights from '@/components/home/SmartInsights'
import EnhancedQuickActions from '@/components/home/EnhancedQuickActions'
import RecommendationSettings from '@/components/home/RecommendationSettings'
import { CompactInfoGrid } from '@/components/home/CompactInfoGrid'
import { TabbedContent } from '@/components/home/TabbedContent'
import { SmartAlertSystem } from '@/components/home/SmartAlertSystem'
import { EnhancedSystemMetrics } from '@/components/home/EnhancedSystemMetrics'
import { EnhancedLiveTracking } from '@/components/tracking/EnhancedLiveTracking'
import { EnhancedJourneyPlanner } from '@/components/journey/EnhancedJourneyPlanner'
import BudgetTracker from '@/components/budget/BudgetTracker'
import CrowdsourcingHub from '@/components/crowdsourcing/CrowdsourcingHub'
import OfflineIndicator from '@/components/ui/OfflineIndicator'
import { EnhancedHeader } from '@/components/navigation/EnhancedHeader'
import { EnhancedFooter } from '@/components/navigation/EnhancedFooter'
import {
    BellIcon,
    ExclamationTriangleIcon,
    Cog6ToothIcon,
    UserCircleIcon,
    SparklesIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [locationName, setLocationName] = useState('Getting location...')
  const [userId] = useState('user_123') // In real app, get from auth context
  const [showSettings, setShowSettings] = useState(false)

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Get user location with Ghana defaults
  useEffect(() => {
    // Default to Accra, Ghana coordinates for transport app context
    const defaultLocation = { latitude: 5.6037, longitude: -0.1870 }
    const defaultLocationName = 'Accra, Ghana'

    // Set defaults immediately
    setUserLocation(defaultLocation)
    setLocationName(defaultLocationName)

    // Try to get actual location, but fallback gracefully
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords

          // Check if coordinates are within Ghana bounds (roughly)
          const isInGhana = latitude >= 4.5 && latitude <= 11.5 &&
                           longitude >= -3.5 && longitude <= 1.5

          if (isInGhana) {
            setUserLocation({ latitude, longitude })
            setLocationName('Current Location, Ghana')
          } else {
            // Keep Ghana defaults if user is not in Ghana
            console.log('Location outside Ghana, using default Accra coordinates')
          }
        },
        (error) => {
          console.log('Geolocation not available, using default Ghana location')
          // Keep the default Ghana location already set
        },
        {
          timeout: 5000,
          enableHighAccuracy: false,
          maximumAge: 300000 // 5 minutes cache
        }
      )
    }
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
      {/* Offline Status Indicator */}
      <OfflineIndicator />

      {/* Enhanced Header */}
      <EnhancedHeader 
        onSettingsClick={() => setShowSettings(true)}
        onNotificationsClick={() => {/* Handle notifications */}}
      />

      {/* Main Content */}
      <main className="px-mobile py-6 space-mobile max-w-md mx-auto">
        {/* Location Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <LocationCard
            location={locationName}
            coordinates={userLocation}
            onLocationUpdate={setLocationName}
          />
        </motion.div>

        {/* Advanced Personalized Recommendations - High Priority */}
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
            <WeatherWidget className="h-full" />
          </div>
        </motion.div>

        {/* Compact Info Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <CompactInfoGrid />
        </motion.div>

        {/* Tabbed Content - Transport, News, Live Updates, Community */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <TabbedContent />
        </motion.div>

        {/* Enhanced Journey Planner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-6"
        >
          <EnhancedJourneyPlanner />
        </motion.div>

        {/* Enhanced System Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-6"
        >
          <EnhancedSystemMetrics />
        </motion.div>

        {/* Enhanced Live Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-6"
        >
          <EnhancedLiveTracking userLocation={userLocation || undefined} />
        </motion.div>

        {/* Smart Alert System - Apple Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mb-6"
        >
          <SmartAlertSystem />
        </motion.div>
      </main>

      {/* Recommendation Settings Modal */}
      <RecommendationSettings
        userId={userId}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}
