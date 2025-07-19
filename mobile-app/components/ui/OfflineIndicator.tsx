'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  WifiIcon, 
  CloudIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'
import { gtfsService } from '@/services/gtfsService'

interface OfflineIndicatorProps {
  className?: string
  showWhenOnline?: boolean
}

export default function OfflineIndicator({ 
  className = '', 
  showWhenOnline = false 
}: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(false)
  const [showIndicator, setShowIndicator] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    const checkStatus = () => {
      const offline = gtfsService.isUsingOfflineData()
      setIsOffline(offline)
      setLastChecked(new Date())
      
      // Show indicator if offline, or if online and showWhenOnline is true
      setShowIndicator(offline || showWhenOnline)
    }

    // Check immediately
    checkStatus()

    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000)

    return () => clearInterval(interval)
  }, [showWhenOnline])

  if (!showIndicator) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-safe-area-top left-4 right-4 z-50 ${className}`}
      >
        <div className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium
          ${isOffline 
            ? 'bg-amber-50 border border-amber-200 text-amber-800' 
            : 'bg-green-50 border border-green-200 text-green-800'
          }
        `}>
          <div className="flex-shrink-0">
            {isOffline ? (
              <CloudIcon className="w-4 h-4" />
            ) : (
              <WifiIcon className="w-4 h-4" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <span className="block truncate">
              {isOffline 
                ? '📱 Using offline data' 
                : '🌐 Connected to live data'
              }
            </span>
          </div>

          {lastChecked && (
            <div className="text-xs opacity-75">
              {lastChecked.toLocaleTimeString('en-GH', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Compact version for status bars
export function OfflineStatusBadge({ className = '' }: { className?: string }) {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const checkStatus = () => {
      setIsOffline(gtfsService.isUsingOfflineData())
    }

    checkStatus()
    const interval = setInterval(checkStatus, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [])

  if (!isOffline) return null

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium ${className}`}
    >
      <CloudIcon className="w-3 h-3" />
      <span>Offline</span>
    </motion.div>
  )
}

// Toast notification for status changes
export function useOfflineStatusToast() {
  const [previousStatus, setPreviousStatus] = useState<boolean | null>(null)

  useEffect(() => {
    const checkStatus = () => {
      const isOffline = gtfsService.isUsingOfflineData()
      
      if (previousStatus !== null && previousStatus !== isOffline) {
        // Status changed, could show a toast notification here
        if (isOffline) {
          console.log('🔄 AURA: Switched to offline mode')
        } else {
          console.log('🌐 AURA: Connected to live data')
        }
      }
      
      setPreviousStatus(isOffline)
    }

    checkStatus()
    const interval = setInterval(checkStatus, 15000)

    return () => clearInterval(interval)
  }, [previousStatus])

  return { isOffline: previousStatus }
}
