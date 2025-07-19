'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'

interface AlertCardProps {
  alert: {
    id: string
    type: 'traffic' | 'breakdown' | 'accident' | 'construction' | 'weather' | 'security'
    title: string
    description: string
    location: string
    coordinates?: [number, number]
    severity: 'low' | 'medium' | 'high' | 'critical'
    timestamp: Date
    author: {
      id: string
      name: string
      avatar?: string
      verified: boolean
    }
    stats: {
      likes: number
      comments: number
      shares: number
      verifications: number
    }
    isLiked: boolean
    isVerified: boolean
    status: 'active' | 'resolved' | 'investigating'
    estimatedDuration?: number
    affectedRoutes?: string[]
    images?: string[]
  }
  onLike?: (alertId: string) => void
  onComment?: (alertId: string) => void
  onShare?: (alertId: string) => void
  onVerify?: (alertId: string) => void
  onResolve?: (alertId: string) => void
}

export function AlertCard({ alert, onLike, onComment, onShare, onVerify, onResolve }: AlertCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-50'
      case 'high': return 'border-l-orange-500 bg-orange-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-blue-500 bg-blue-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'traffic': return '🚦'
      case 'breakdown': return '🚌'
      case 'accident': return '🚨'
      case 'construction': return '🚧'
      case 'weather': return '🌧️'
      case 'security': return '🛡️'
      default: return '⚠️'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'investigating': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-l-4 rounded-r-lg p-4 mb-4 ${getSeverityColor(alert.severity)}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{getTypeIcon(alert.type)}</span>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900">{alert.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                {alert.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">{alert.author.name}</span>
              {alert.author.verified && (
                <CheckCircleIcon className="h-4 w-4 text-blue-500" />
              )}
              <span>•</span>
              <span>{formatTime(alert.timestamp)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
            alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {alert.severity.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center space-x-2 mb-3 text-sm text-gray-700">
        <MapPinIcon className="h-4 w-4" />
        <span>{alert.location}</span>
      </div>

      {/* Description */}
      <div className="mb-3">
        <p className="text-gray-800 text-sm leading-relaxed">
          {showFullDescription ? alert.description : truncateText(alert.description)}
        </p>
        {alert.description.length > 150 && (
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
          >
            {showFullDescription ? 'Show Less' : 'Read More'}
          </button>
        )}
      </div>

      {/* Affected Routes */}
      {alert.affectedRoutes && alert.affectedRoutes.length > 0 && (
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Affected Routes:</div>
          <div className="flex flex-wrap gap-1">
            {alert.affectedRoutes.map((route, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full"
              >
                {route}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Estimated Duration */}
      {alert.estimatedDuration && (
        <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
          <ClockIcon className="h-4 w-4" />
          <span>Estimated duration: {alert.estimatedDuration} minutes</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onLike?.(alert.id)}
            className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
          >
            {alert.isLiked ? (
              <HeartIconSolid className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
            <span className="text-sm">{alert.stats.likes}</span>
          </button>

          <button
            onClick={() => onComment?.(alert.id)}
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
            <span className="text-sm">{alert.stats.comments}</span>
          </button>

          <button
            onClick={() => onShare?.(alert.id)}
            className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors"
          >
            <ShareIcon className="h-5 w-5" />
            <span className="text-sm">{alert.stats.shares}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {alert.status === 'active' && (
            <>
              <button
                onClick={() => onVerify?.(alert.id)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  alert.isVerified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                {alert.isVerified ? 'Verified' : 'Verify'} ({alert.stats.verifications})
              </button>
              
              <button
                onClick={() => onResolve?.(alert.id)}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Mark Resolved
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
