'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CpuChipIcon,
  BellIcon,
  Cog6ToothIcon,
  SignalIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid'

interface BackendStatus {
  connected: boolean
  modelsLoaded: number
  totalModels: number
  activeVehicles: number
  mlAccuracy: string
  gtfsStops: number
  responseTime: number
}

interface PremiumHeaderProps {
  currentTime: Date
  locationName: string
  backendStatus: BackendStatus
  onSettingsClick: () => void
  className?: string
}

export function PremiumHeader({
  currentTime,
  locationName,
  backendStatus,
  onSettingsClick,
  className = ''
}: PremiumHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications] = useState([
    {
      id: 1,
      type: 'ml_update',
      title: 'ML Models Updated',
      message: 'Travel time prediction accuracy improved to 97.8%',
      time: '2 min ago',
      icon: CpuChipIcon,
      color: 'text-purple-500'
    },
    {
      id: 2,
      type: 'traffic',
      title: 'Traffic Alert',
      message: 'Heavy traffic detected on N1 Highway',
      time: '5 min ago',
      icon: ExclamationTriangleIcon,
      color: 'text-orange-500'
    },
    {
      id: 3,
      type: 'system',
      title: 'Real-time Data Active',
      message: `${backendStatus.activeVehicles} vehicles being tracked`,
      time: '1 min ago',
      icon: SignalIcon,
      color: 'text-green-500'
    }
  ])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getStatusColor = () => {
    if (!backendStatus.connected) return 'text-red-500'
    if (backendStatus.modelsLoaded === backendStatus.totalModels) return 'text-green-500'
    return 'text-yellow-500'
  }

  const getStatusIcon = () => {
    if (!backendStatus.connected) return ExclamationTriangleIcon
    if (backendStatus.modelsLoaded === backendStatus.totalModels) return CheckCircleIcon
    return BoltIcon
  }

  const StatusIcon = getStatusIcon()

  return (
    <header className={`bg-white/80 backdrop-blur-xl border-b border-gray-200/50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Time & Location */}
          <div className="flex items-center space-x-4">
            <div className="text-left">
              <div className="text-2xl font-bold text-gray-900">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-gray-600 flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                {locationName}
              </div>
            </div>
          </div>

          {/* Center Section - Backend Status */}
          <div className="hidden md:flex items-center space-x-3">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2"
            >
              <StatusIcon className={`w-5 h-5 ${getStatusColor()}`} />
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {backendStatus.modelsLoaded}/{backendStatus.totalModels} Models
                </div>
                <div className="text-xs text-gray-500">
                  {backendStatus.connected ? `${backendStatus.responseTime}ms` : 'Offline'}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-2 bg-blue-50 rounded-full px-4 py-2"
            >
              <CpuChipIcon className="w-5 h-5 text-blue-500" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {backendStatus.mlAccuracy}
                </div>
                <div className="text-xs text-gray-500">
                  ML Accuracy
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {notifications.length > 0 ? (
                  <BellIconSolid className="w-6 h-6 text-blue-500" />
                ) : (
                  <BellIcon className="w-6 h-6 text-gray-600" />
                )}
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => {
                        const IconComponent = notification.icon
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              <IconComponent className={`w-5 h-5 mt-0.5 ${notification.color}`} />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 text-sm">
                                  {notification.title}
                                </h4>
                                <p className="text-gray-600 text-sm mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-gray-400 text-xs mt-2">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button className="w-full text-center text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors">
                        View All Notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSettingsClick}
              className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Cog6ToothIcon className="w-6 h-6 text-gray-600" />
            </motion.button>
          </div>
        </div>

        {/* Mobile Backend Status */}
        <div className="md:hidden mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1">
            <StatusIcon className={`w-4 h-4 ${getStatusColor()}`} />
            <span className="text-sm font-medium text-gray-900">
              {backendStatus.modelsLoaded}/{backendStatus.totalModels} Models
            </span>
          </div>
          
          <div className="flex items-center space-x-2 bg-blue-50 rounded-full px-3 py-1">
            <CpuChipIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-900">
              {backendStatus.mlAccuracy}
            </span>
          </div>
        </div>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </header>
  )
}
