'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline'

interface Update {
  id: string
  type: 'alert' | 'info' | 'success' | 'maintenance'
  title: string
  message: string
  timestamp: Date
  route?: string
  severity: 'low' | 'medium' | 'high'
}

const mockUpdates: Update[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Route Delay',
    message: 'Accra-Kumasi route experiencing 30min delays due to traffic',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    route: 'Accra-Kumasi',
    severity: 'medium'
  },
  {
    id: '2',
    type: 'info',
    title: 'New Route Available',
    message: 'Express service now available from Circle to Airport',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    route: 'Circle-Airport',
    severity: 'low'
  },
  {
    id: '3',
    type: 'maintenance',
    title: 'Station Maintenance',
    message: 'Kaneshie station undergoing maintenance 2-4 PM today',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    route: 'Kaneshie',
    severity: 'high'
  }
]

export function LiveUpdates() {
  const [updates, setUpdates] = useState<Update[]>(mockUpdates)
  const [isExpanded, setIsExpanded] = useState(false)

  const getIcon = (type: Update['type']) => {
    switch (type) {
      case 'alert':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'maintenance':
        return <ClockIcon className="h-5 w-5 text-orange-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: Update['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-l-red-500 bg-red-50'
      case 'medium':
        return 'border-l-amber-500 bg-amber-50'
      case 'low':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const displayedUpdates = isExpanded ? updates : updates.slice(0, 2)

  return (
    <div className="bg-white rounded-mobile shadow-mobile p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Live Updates</h2>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">Live</span>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {displayedUpdates.map((update, index) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`border-l-4 p-3 rounded-r-lg ${getSeverityColor(update.severity)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(update.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {update.title}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatTime(update.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {update.message}
                  </p>
                  {update.route && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                      {update.route}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {updates.length > 2 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {isExpanded ? 'Show Less' : `Show ${updates.length - 2} More Updates`}
        </button>
      )}

      {updates.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <InformationCircleIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No updates at the moment</p>
          <p className="text-xs text-gray-400 mt-1">Check back later for live updates</p>
        </div>
      )}
    </div>
  )
}
