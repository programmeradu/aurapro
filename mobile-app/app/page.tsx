'use client'

import { LiveUpdates } from '@/components/home/LiveUpdates'
import { LocationCard } from '@/components/home/LocationCard'
import { NearbyTransport } from '@/components/home/NearbyTransport'
import { NewsUpdates } from '@/components/home/NewsUpdates'
import { QuickActions } from '@/components/home/QuickActions'
import { WeatherWidget } from '@/components/home/WeatherWidget'
import BudgetTracker from '@/components/budget/BudgetTracker'
import CrowdsourcingHub from '@/components/crowdsourcing/CrowdsourcingHub'
import OfflineIndicator from '@/components/ui/OfflineIndicator'
import {
    BellIcon,
    ChartBarIcon,
    ExclamationTriangleIcon,
    MapPinIcon,
    TruckIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [locationName, setLocationName] = useState('Getting location...')

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

  const quickActionItems = [
    {
      title: 'Plan Journey',
      description: 'Smart route planning',
      icon: MagnifyingGlassIcon,
      href: '/journey',
      color: 'bg-blue-500',
    },
    {
      title: 'Track Vehicle',
      description: 'Real-time tracking',
      icon: TruckIcon,
      href: '/track',
      color: 'bg-transport-bus',
    },
    {
      title: 'Budget Tracker',
      description: 'Manage transport costs',
      icon: CurrencyDollarIcon,
      href: '/journey?tab=budget',
      color: 'bg-green-500',
    },
    {
      title: 'Community',
      description: 'Live crowd reports',
      icon: UserGroupIcon,
      href: '/journey?tab=community',
      color: 'bg-purple-500',
    },
    {
      title: 'Report Issue',
      description: 'Help improve service',
      icon: ExclamationTriangleIcon,
      href: '/community',
      color: 'bg-red-500',
    },
    {
      title: 'View Analytics',
      description: 'Transport insights',
      icon: ChartBarIcon,
      href: '/analytics',
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="min-h-screen-safe bg-gradient-to-br from-aura-primary/5 to-aura-secondary/5">
      {/* Offline Status Indicator */}
      <OfflineIndicator />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-mobile border-b border-ui-border safe-area-top"
      >
        <div className="px-mobile py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-responsive-xl font-bold font-display text-aura-primary truncate">
                AURA Commuter
              </h1>
              <p className="text-responsive-sm text-ui-text-secondary truncate">
                {formatDate(currentTime)}
              </p>
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

              <button className="tap-target p-2 rounded-full bg-aura-primary/10 text-aura-primary active:scale-95 transition-transform">
                <BellIcon className="w-5 h-5" />
              </button>
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

        {/* Weather Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <WeatherWidget />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-ui-text-primary mb-2">
              Quick Actions
            </h2>
          </div>
          <QuickActions items={quickActionItems} />
        </motion.div>

        {/* Nearby Transport */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ui-text-primary">
              Nearby Transport
            </h2>
            <Link
              href="/track"
              className="text-sm text-aura-primary font-medium"
            >
              View All
            </Link>
          </div>
          <NearbyTransport />
        </motion.div>

        {/* Budget Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ui-text-primary">
              Budget Overview
            </h2>
            <Link
              href="/journey?tab=budget"
              className="text-sm text-aura-primary font-medium"
            >
              Manage
            </Link>
          </div>
          <BudgetTracker />
        </motion.div>

        {/* Community Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ui-text-primary">
              Community Reports
            </h2>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-ui-text-secondary">Live</span>
            </div>
          </div>
          <CrowdsourcingHub userLocation={userLocation || undefined} />
        </motion.div>

        {/* Live Updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ui-text-primary">
              System Updates
            </h2>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-ui-text-secondary">Live</span>
            </div>
          </div>
          <LiveUpdates />
        </motion.div>

        {/* News & Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ui-text-primary">
              Transport News
            </h2>
            <Link
              href="/news"
              className="text-sm text-aura-primary font-medium"
            >
              View All
            </Link>
          </div>
          <NewsUpdates />
        </motion.div>

        {/* Emergency Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Emergency Contact</h3>
              <p className="text-sm text-red-600">
                For transport emergencies, call 191 or 112
              </p>
            </div>
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium tap-target">
              Call
            </button>
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="text-center py-4"
        >
          <p className="text-xs text-ui-text-muted">
            AURA Commuter v1.0.0 • Made for Ghana 🇬🇭
          </p>
          <p className="text-xs text-ui-text-muted mt-1">
            Featuring smart budgeting, crowdsourced updates & GTFS integration
          </p>
        </motion.div>
      </main>
    </div>
  )
}
