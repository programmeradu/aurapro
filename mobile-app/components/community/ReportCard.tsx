'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid,
} from '@heroicons/react/24/solid'
import { CommunityReport } from '@/types/community'

interface ReportCardProps {
  report: CommunityReport
  onVote: (reportId: string, voteType: 'upvote' | 'downvote') => void
  onVerify: (reportId: string) => void
  onShare: (report: CommunityReport) => void
  showActions?: boolean
}

export function ReportCard({
  report,
  onVote,
  onVerify,
  onShare,
  showActions = true
}: ReportCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null)
  const [hasVerified, setHasVerified] = useState(false)

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircleIcon className="w-4 h-4 text-green-500" />
      case 'investigating': return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
      default: return <ClockIcon className="w-4 h-4 text-gray-400" />
    }
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'service_issue': return '🚌'
      case 'safety_concern': return '⚠️'
      case 'fare_dispute': return '💰'
      case 'vehicle_condition': return '🔧'
      case 'driver_behavior': return '👨‍✈️'
      case 'positive_feedback': return '👍'
      case 'suggestion': return '💡'
      case 'emergency': return '🚨'
      default: return '📝'
    }
  }

  const handleVote = (voteType: 'upvote' | 'downvote') => {
    if (userVote === voteType) return // Already voted
    
    setUserVote(voteType)
    onVote(report.id, voteType)
  }

  const handleVerify = () => {
    if (hasVerified) return
    
    setHasVerified(true)
    onVerify(report.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-mobile border border-ui-border overflow-hidden"
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-aura-primary/10 rounded-full flex items-center justify-center">
            <span className="text-lg">{getReportTypeIcon(report.type)}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-ui-text-primary truncate">
                {report.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                {report.severity}
              </span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm text-ui-text-secondary">
              <div className="flex items-center space-x-1">
                {getStatusIcon(report.status)}
                <span className="capitalize">{report.status.replace('_', ' ')}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4" />
                <span>{formatTimeAgo(report.createdAt)}</span>
              </div>
              
              {report.verificationCount > 0 && (
                <div className="flex items-center space-x-1">
                  <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">{report.verificationCount} verified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-ui-text-primary leading-relaxed">
          {report.description}
        </p>

        {/* Location */}
        {report.location && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-ui-text-secondary">
            <MapPinIcon className="w-4 h-4" />
            <span>
              {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
            </span>
          </div>
        )}

        {/* Photos */}
        {report.photos && report.photos.length > 0 && (
          <div className="mt-3">
            <div className="grid grid-cols-3 gap-2">
              {report.photos.slice(0, 3).map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Report photo ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
              ))}
              {report.photos.length > 3 && (
                <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-600">
                  +{report.photos.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="border-t border-ui-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Upvote */}
              <button
                onClick={() => handleVote('upvote')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  userVote === 'upvote'
                    ? 'bg-green-100 text-green-600'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {userVote === 'upvote' ? (
                  <HandThumbUpIconSolid className="w-4 h-4" />
                ) : (
                  <HandThumbUpIcon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{report.upvotes}</span>
              </button>

              {/* Downvote */}
              <button
                onClick={() => handleVote('downvote')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  userVote === 'downvote'
                    ? 'bg-red-100 text-red-600'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {userVote === 'downvote' ? (
                  <HandThumbDownIconSolid className="w-4 h-4" />
                ) : (
                  <HandThumbDownIcon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{report.downvotes}</span>
              </button>

              {/* Comments */}
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{report.comments.length}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {/* Verify */}
              <button
                onClick={handleVerify}
                disabled={hasVerified}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  hasVerified
                    ? 'bg-green-100 text-green-600 cursor-not-allowed'
                    : 'hover:bg-blue-100 text-blue-600'
                }`}
              >
                <ShieldCheckIcon className="w-4 h-4" />
              </button>

              {/* Share */}
              <button
                onClick={() => onShare(report)}
                className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Views */}
          <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
            <EyeIcon className="w-3 h-3" />
            <span>{report.views} views</span>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-ui-border"
          >
            <div className="p-4 bg-gray-50">
              <h4 className="font-medium text-ui-text-primary mb-3">
                Comments ({report.comments.length})
              </h4>
              
              {report.comments.length > 0 ? (
                <div className="space-y-3">
                  {report.comments.slice(0, 3).map((comment) => (
                    <div key={comment.id} className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-ui-text-primary">{comment.content}</p>
                      <div className="mt-2 text-xs text-ui-text-secondary">
                        {formatTimeAgo(comment.createdAt)}
                      </div>
                    </div>
                  ))}
                  
                  {report.comments.length > 3 && (
                    <button className="text-sm text-aura-primary font-medium">
                      View all {report.comments.length} comments
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No comments yet</p>
              )}
              
              {/* Add Comment */}
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-aura-primary"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
