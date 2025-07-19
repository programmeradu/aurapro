'use client'

import { LiveUpdates } from '@/components/home/LiveUpdates'
import { LocationCard } from '@/components/home/LocationCard'
import { NearbyTransport } from '@/components/home/NearbyTransport'
import { NewsUpdates } from '@/components/home/NewsUpdates'
import { WeatherWidget } from '@/components/home/WeatherWidget'
import PersonalizedRecommendations from '@/components/home/PersonalizedRecommendations'
import SmartInsights from '@/components/home/SmartInsights'
import EnhancedQuickActions from '@/components/home/EnhancedQuickActions'
import BudgetTracker from '@/components/budget/BudgetTracker'
import CrowdsourcingHub from '@/components/crowdsourcing/CrowdsourcingHub'
import OfflineIndicator from '@/components/ui/OfflineIndicator'
import {
    BellIcon,
    ExclamationTriangleIcon,
    Cog6ToothIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function EnhancedHomePage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [locationName, setLocationName] = useState('Getting location...')
  const [userId] = useState('user_123') // In real app, get from auth context

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
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg shadow-mobile border-b border-ui-border/50 safe-area-top sticky top-0 z-50"
      >
        <div className="px-mobile py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-aura-primary to-aura-secondary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <h1 className="text-responsive-lg font-bold font-display text-aura-primary">
                    {getGreeting()}!
                  </h1>
                  <p className="text-responsive-sm text-ui-text-secondary">
                    {formatDate(currentTime)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <div className="text-right hidden xs:block">
                <div className="text-responsive-base font-semibold text-ui-text-primary">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs-mobile text-ui-text-secondary">
                  Local Time
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button className="tap-target p-2 rounded-full bg-aura-primary/10 text-aura-primary active:scale-95 transition-transform relative">
                  <BellIcon className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </button>
                
                <Link href="/profile">
                  <button className="tap-target p-2 rounded-full bg-gray-100 text-gray-600 active:scale-95 transition-transform">
                    <UserCircleIcon className="w-5 h-5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

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

        {/* Personalized Recommendations - High Priority */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PersonalizedRecommendations
            userId={userId}
            userLocation={userLocation || undefined}
            className="mb-6"
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

        {/* Smart Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SmartInsights
            userId={userId}
            userLocation={userLocation || undefined}
            className="mb-6"
          />
        </motion.div>

        {/* Weather Widget - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <WeatherWidget />
        </motion.div>

        {/* Nearby Transport - Improved */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ui-text-primary">
              Nearby Transport
            </h2>
            <Link
              href="/track"
              className="text-sm text-aura-primary font-medium hover:text-aura-primary/80 transition-colors"
            >
              View All
            </Link>
          </div>
          <NearbyTransport />
        </motion.div>

        {/* Budget Overview - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ui-text-primary">
              Budget Overview
            </h2>
            <Link
              href="/journey?tab=budget"
              className="text-sm text-aura-primary font-medium hover:text-aura-primary/80 transition-colors"
            >
              Manage
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-mobile border border-ui-border p-4">
            <BudgetTracker />
          </div>
        </motion.div>

        {/* Community Reports - Improved */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ui-text-primary">
              Community Updates
            </h2>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-ui-text-secondary">Live</span>
              </div>
              <Link
                href="/community"
                className="text-sm text-aura-primary font-medium hover:text-aura-primary/80 transition-colors"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-mobile border border-ui-border overflow-hidden">
            <CrowdsourcingHub userLocation={userLocation || undefined} />
          </div>
        </motion.div>

        {/* System Updates - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ui-text-primary">
              System Status
            </h2>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-ui-text-secondary">Live</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-mobile border border-ui-border overflow-hidden">
            <LiveUpdates />
          </div>
        </motion.div>

        {/* News & Announcements - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ui-text-primary">
              Latest News
            </h2>
            <Link
              href="/news"
              className="text-sm text-aura-primary font-medium hover:text-aura-primary/80 transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-mobile border border-ui-border overflow-hidden">
            <NewsUpdates />
          </div>
        </motion.div>

        {/* Emergency Contact - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-800">Emergency Contacts</h3>
              <p className="text-sm text-red-600">
                Police: 191 • Fire: 192 • Ambulance: 193
              </p>
            </div>
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium tap-target transition-colors shadow-lg">
              Call
            </button>
          </div>
        </motion.div>

        {/* App Info - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center py-6"
        >
          <div className="bg-gradient-to-r from-aura-primary/5 to-aura-secondary/5 rounded-2xl p-4">
            <p className="text-sm font-medium text-ui-text-primary mb-1">
              AURA Commuter v2.0.0 • Made for Ghana 🇬🇭
            </p>
            <p className="text-xs text-ui-text-secondary">
              Featuring AI recommendations, smart budgeting & real-time insights
            </p>
            <div className="flex items-center justify-center space-x-4 mt-3 text-xs text-ui-text-muted">
              <span>✨ AI-Powered</span>
              <span>📊 Smart Analytics</span>
              <span>🚌 GTFS Integration</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}