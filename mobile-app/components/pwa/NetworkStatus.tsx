'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  WifiIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { offlineService } from '@/services/offlineService'

interface NetworkStatusProps {
  showDetails?: boolean
  className?: string
}

export function NetworkStatus({ showDetails = false, className = '' }: NetworkStatusProps) {
  const [networkStatus, setNetworkStatus] = useState(offlineService.getNetworkStatus())
  const [offlineStats, setOfflineStats] = useState({
    queuedItems: 0,
    cachedRoutes: 0,
    storageUsed: 0,
    lastSync: null as Date | null
  })
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    // Listen for network status changes
    const handleNetworkChange = (event: CustomEvent) => {
      setNetworkStatus(event.detail)
      
      if (!event.detail.isOnline) {
        setShowOfflineMessage(true)
        setTimeout(() => setShowOfflineMessage(false), 5000)
      }
    }

    window.addEventListener('networkStatusChange', handleNetworkChange as EventListener)
    
    // Update offline stats periodically
    const updateStats = async () => {
      const stats = await offlineService.getOfflineStats()
      setOfflineStats(stats)
    }
    
    updateStats()
    const statsInterval = setInterval(updateStats, 30000) // Every 30 seconds

    return () => {
      window.removeEventListener('networkStatusChange', handleNetworkChange as EventListener)
      clearInterval(statsInterval)
    }
  }, [])

  const getConnectionIcon = () => {
    if (!networkStatus.isOnline) {
      return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
    }

    switch (networkStatus.effectiveType) {
      case 'slow-2g':
      case '2g':
        return <SignalIcon className="w-4 h-4 text-yellow-500" />
      case '3g':
        return <SignalIcon className="w-4 h-4 text-orange-500" />
      case '4g':
        return <WifiIcon className="w-4 h-4 text-green-500" />
      default:
        return <WifiIcon className="w-4 h-4 text-gray-500" />
    }
  }

  const getConnectionText = () => {
    if (!networkStatus.isOnline) {
      return 'Offline'
    }

    const type = networkStatus.effectiveType.toUpperCase()
    return `${type} ${networkStatus.connectionType !== 'unknown' ? `(${networkStatus.connectionType})` : ''}`
  }

  const getConnectionColor = () => {
    if (!networkStatus.isOnline) return 'text-red-600 bg-red-50'
    
    switch (networkStatus.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'text-yellow-600 bg-yellow-50'
      case '3g':
        return 'text-orange-600 bg-orange-50'
      case '4g':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never'
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className={className}>
      {/* Compact Status Indicator */}
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getConnectionColor()}`}>
        {getConnectionIcon()}
        <span>{getConnectionText()}</span>
        {offlineStats.queuedItems > 0 && (
          <div className="flex items-center space-x-1">
            <CloudArrowUpIcon className="w-3 h-3" />
            <span>{offlineStats.queuedItems}</span>
          </div>
        )}
      </div>

      {/* Detailed Status */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-3 bg-white rounded-xl border border-ui-border"
        >
          <h4 className="font-medium text-ui-text-primary mb-3">Network Status</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ui-text-secondary">Connection:</span>
              <span className="font-medium">{getConnectionText()}</span>
            </div>
            
            {networkStatus.isOnline && (
              <>
                <div className="flex justify-between">
                  <span className="text-ui-text-secondary">Speed:</span>
                  <span className="font-medium">{networkStatus.downlink} Mbps</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-ui-text-secondary">Latency:</span>
                  <span className="font-medium">{networkStatus.rtt}ms</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between">
              <span className="text-ui-text-secondary">Queued Items:</span>
              <span className="font-medium">{offlineStats.queuedItems}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-ui-text-secondary">Cached Routes:</span>
              <span className="font-medium">{offlineStats.cachedRoutes}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-ui-text-secondary">Storage Used:</span>
              <span className="font-medium">{formatBytes(offlineStats.storageUsed)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-ui-text-secondary">Last Sync:</span>
              <span className="font-medium">{formatLastSync(offlineStats.lastSync)}</span>
            </div>
          </div>

          {/* Ghana Network Tips */}
          {!networkStatus.isOnline && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Offline Mode:</strong> You can still submit reports and plan journeys. 
                Data will sync when connection is restored.
              </p>
            </div>
          )}

          {networkStatus.effectiveType === 'slow-2g' || networkStatus.effectiveType === '2g' && (
            <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-700">
                <strong>Slow Connection:</strong> Using data-saving mode. 
                Some features may load slower to preserve your data.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Offline Message Toast */}
      <AnimatePresence>
        {showOfflineMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80"
          >
            <div className="bg-orange-500 text-white p-4 rounded-xl shadow-floating">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-6 h-6" />
                <div className="flex-1">
                  <h4 className="font-medium">You're now offline</h4>
                  <p className="text-sm opacity-90">
                    Don't worry! You can still use the app. Data will sync when you're back online.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Success Message */}
      <AnimatePresence>
        {networkStatus.isOnline && offlineStats.queuedItems === 0 && offlineStats.lastSync && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80"
          >
            <div className="bg-green-500 text-white p-3 rounded-xl shadow-floating">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">All data synced!</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
