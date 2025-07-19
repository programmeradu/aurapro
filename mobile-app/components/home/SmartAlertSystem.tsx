'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline'

interface Alert {
  id: string
  type: 'emergency' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: Date
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
  actionText?: string
  actionUrl?: string
}

interface SmartAlertSystemProps {
  className?: string
}

export function SmartAlertSystem({ className = '' }: SmartAlertSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      // Fetch from your API - NO HARDCODED DATA
      const response = await fetch('/api/alerts/active')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
      // Show no alerts instead of hardcoded fallback
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]))
    // Optionally send dismissal to API
    fetch(`/api/alerts/${alertId}/dismiss`, { method: 'POST' }).catch(console.error)
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return ExclamationTriangleIcon
      case 'warning':
        return ExclamationTriangleIcon
      case 'success':
        return CheckCircleIcon
      default:
        return InformationCircleIcon
    }
  }

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getIconStyles = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'bg-red-500 text-white'
      case 'warning':
        return 'bg-yellow-500 text-white'
      case 'success':
        return 'bg-green-500 text-white'
      default:
        return 'bg-blue-500 text-white'
    }
  }

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id))

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-100 rounded-2xl p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (visibleAlerts.length === 0) {
    return (
      <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/20 ${className}`}>
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-sm font-medium text-gray-900">All Systems Operational</p>
        <p className="text-xs text-gray-600 mt-1">No active alerts or issues</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <BellIcon className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
        <div className="flex-1"></div>
        <span className="text-xs text-gray-500">{visibleAlerts.length} active</span>
      </div>

      <AnimatePresence>
        {visibleAlerts.map((alert) => {
          const IconComponent = getAlertIcon(alert.type)
          
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`rounded-2xl border p-4 ${getAlertStyles(alert.type)}`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconStyles(alert.type)}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                      <p className="text-sm opacity-90 mt-1">{alert.message}</p>
                      
                      {alert.actionable && alert.actionText && (
                        <button className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
                          {alert.actionText}
                        </button>
                      )}
                    </div>
                    
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 text-xs opacity-75">
                    <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    <span className="capitalize">{alert.priority} priority</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}