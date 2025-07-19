'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BellIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  SparklesIcon,
  SignalIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { apiService } from '@/services/apiService'

interface EnhancedHeaderProps {
  className?: string
  onSettingsClick?: () => void
  onNotificationsClick?: () => void
}

interface SystemStatus {
  status: 'online' | 'offline' | 'degraded'
  activeVehicles: number
  systemReliability: number
  lastUpdate: Date
}

export function EnhancedHeader({ 
  className = '', 
  onSettingsClick,
  onNotificationsClick 
}: EnhancedHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'online',
    activeVehicles: 0,
    systemReliability: 0,
    lastUpdate: new Date()
  })
  const [notifications, setNotifications] = useState(3)
  const [isOnline, setIsOnline] = useState(true)

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Fetch system status
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const [healthResponse, metricsResponse] = await Promise.all([
          apiService.getHealthStatus(),
          apiService.getSystemMetrics()
        ])

        if (healthResponse.success && metricsResponse.success) {
          setSystemStatus({
            status: 'online',
            activeVehicles: metricsResponse.data.active_vehicles || 0,
            systemReliability: metricsResponse.data.service_reliability || 0,
            lastUpdate: new Date()
          })
        } else {
          setSystemStatus(prev => ({ ...prev, status: 'degraded' }))
        }
      } catch (error) {
        setSystemStatus(prev => ({ ...prev, status: 'offline' }))
      }
    }

    fetchSystemStatus()
    const interval = setInterval(fetchSystemStatus, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
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

  const getSystemStatusColor = () => {
    switch (systemStatus.status) {
      case 'online':
        return 'text-green-500'
      case 'degraded':
        return 'text-yellow-500'
      case 'offline':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getSystemStatusIcon = () => {
    switch (systemStatus.status) {
      case 'online':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'degraded':
        return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'offline':
        return <ExclamationTriangleIcon className="w-4 h-4" />
      default:
        return <SignalIcon className="w-4 h-4" />
    }
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-50 ${className}`}
    >
      <div className="px-4 py-4">
        {/* Main Header Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              {/* App Icon */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-aura-primary to-aura-secondary rounded-2xl flex items-center justify-center shadow-lg">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                {/* Status Indicator */}
                <div className={`absolute -top-1 -right-1 w-4 h-4 ${
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                } rounded-full border-2 border-white shadow-sm`}></div>
              </div>
              
              {/* Greeting and Date */}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold font-display text-gray-900 truncate">
                  {getGreeting()}!
                </h1>
                <p className="text-sm text-gray-600 truncate">
                  {formatDate(currentTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Time and Actions */}
          <div className="flex items-center space-x-3 ml-4">
            {/* Current Time */}
            <div className="text-right hidden sm:block">
              <div className="text-lg font-bold text-gray-900">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-gray-500">
                Local Time
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Settings */}
              <button 
                onClick={onSettingsClick}
                className="p-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95 transition-all duration-200"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
              
              {/* Notifications */}
              <button 
                onClick={onNotificationsClick}
                className="relative p-2.5 rounded-xl bg-aura-primary/10 text-aura-primary hover:bg-aura-primary/20 active:scale-95 transition-all duration-200"
              >
                <BellIcon className="w-5 h-5" />
                {notifications > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-xs font-bold text-white">
                      {notifications > 9 ? '9+' : notifications}
                    </span>
                  </motion.div>
                )}
              </button>
              
              {/* Profile */}
              <Link href="/profile">
                <button className="p-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95 transition-all duration-200">
                  <UserCircleIcon className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* System Status Bar */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            {/* Network Status */}
            <div className="flex items-center space-x-1">
              <WifiIcon className={`w-3 h-3 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* System Status */}
            <div className={`flex items-center space-x-1 ${getSystemStatusColor()}`}>
              {getSystemStatusIcon()}
              <span className="capitalize">{systemStatus.status}</span>
            </div>

            {/* Active Vehicles */}
            {systemStatus.activeVehicles > 0 && (
              <div className="flex items-center space-x-1 text-blue-600">
                <TruckIcon className="w-3 h-3" />
                <span>{systemStatus.activeVehicles.toLocaleString()} vehicles</span>
              </div>
            )}
          </div>

          {/* System Reliability */}
          {systemStatus.systemReliability > 0 && (
            <div className="flex items-center space-x-1 text-gray-600">
              <SignalIcon className="w-3 h-3" />
              <span>{systemStatus.systemReliability.toFixed(1)}% reliability</span>
            </div>
          )}
        </div>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-50 border-t border-red-200 px-4 py-2"
        >
          <div className="flex items-center space-x-2 text-red-700">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              You're offline. Some features may not be available.
            </span>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}

// Import TruckIcon for the active vehicles display
import { TruckIcon } from '@heroicons/react/24/outline'