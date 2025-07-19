'use client'

import { useState, useEffect } from 'react'
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
} from '@heroicons/react/24/outline'
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid,
} from '@heroicons/react/24/solid'
import { CommunityReport, CommunityAlert, ReportFilter } from '@/types/community'
import { communityService } from '@/services/communityService'
import { ReportCard } from './ReportCard'
import { AlertCard } from './AlertCard'
import { FeedFilters } from './FeedFilters'
import toast from 'react-hot-toast'

interface CommunityFeedProps {
  initialFilter?: ReportFilter
  showFilters?: boolean
  maxItems?: number
}

export function CommunityFeed({
  initialFilter,
  showFilters = true,
  maxItems
}: CommunityFeedProps) {
  const [reports, setReports] = useState<CommunityReport[]>([])
  const [alerts, setAlerts] = useState<CommunityAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | undefined>()
  const [filter, setFilter] = useState<ReportFilter>(initialFilter || {})
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Load initial feed
  useEffect(() => {
    loadFeed(true)
  }, [filter])

  const loadFeed = async (reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true)
        setCursor(undefined)
      }

      const feedData = await communityService.getCommunityFeed(
        filter,
        reset ? undefined : cursor
      )

      if (reset) {
        setReports(feedData.reports)
        setAlerts(feedData.alerts)
      } else {
        setReports(prev => [...prev, ...feedData.reports])
        setAlerts(prev => [...prev, ...feedData.alerts])
      }

      setHasMore(feedData.hasMore)
      setCursor(feedData.nextCursor)
    } catch (error) {
      console.error('Error loading community feed:', error)
      toast.error('Failed to load community feed')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadFeed(true)
  }

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadFeed(false)
    }
  }

  const handleVote = async (reportId: string, voteType: 'upvote' | 'downvote') => {
    try {
      await communityService.voteOnReport(reportId, voteType)
      
      // Update local state
      setReports(prev => prev.map(report => {
        if (report.id === reportId) {
          return {
            ...report,
            upvotes: voteType === 'upvote' ? report.upvotes + 1 : report.upvotes,
            downvotes: voteType === 'downvote' ? report.downvotes + 1 : report.downvotes
          }
        }
        return report
      }))
      
      toast.success('Vote recorded')
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to record vote')
    }
  }

  const handleVerify = async (reportId: string) => {
    try {
      await communityService.voteOnReport(reportId, 'verify')
      
      setReports(prev => prev.map(report => {
        if (report.id === reportId) {
          return {
            ...report,
            verificationCount: report.verificationCount + 1
          }
        }
        return report
      }))
      
      toast.success('Report verified')
    } catch (error) {
      console.error('Error verifying:', error)
      toast.error('Failed to verify report')
    }
  }

  const handleShare = async (report: CommunityReport) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: report.title,
          text: report.description,
          url: window.location.href
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(
          `${report.title}\n\n${report.description}\n\nShared from AURA Commuter`
        )
        toast.success('Report copied to clipboard')
      } catch (error) {
        toast.error('Failed to share report')
      }
    }
  }

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

  // Combine and sort reports and alerts
  const feedItems = [
    ...reports.map(r => ({ ...r, itemType: 'report' as const })),
    ...alerts.map(a => ({ ...a, itemType: 'alert' as const }))
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxItems)

  if (isLoading && reports.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-mobile border border-ui-border">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <FeedFilters
          filters={{
            type: [],
            severity: [],
            status: [],
            location: '',
            timeRange: 'all',
            sortBy: 'newest'
          }}
          onFiltersChange={(newFilters) => {
            console.log('Filters changed:', newFilters)
          }}
          onClearFilters={() => {
            console.log('Filters cleared')
          }}
        />
      )}

      {/* Feed Items */}
      <div className="space-y-4">
        <AnimatePresence>
          {feedItems.map((item, index) => (
            <motion.div
              key={`${item.itemType}-${item.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              {item.itemType === 'report' ? (
                <ReportCard
                  report={item as CommunityReport}
                  onVote={handleVote}
                  onVerify={handleVerify}
                  onShare={handleShare}
                />
              ) : (
                <AlertCard
                  alert={{
                    id: item.id,
                    type: 'traffic',
                    title: 'Traffic Alert',
                    description: 'Traffic congestion reported in the area',
                    location: 'Accra, Ghana',
                    severity: 'medium',
                    timestamp: new Date(),
                    author: {
                      id: '1',
                      name: 'Community User',
                      verified: false
                    },
                    stats: {
                      likes: 0,
                      comments: 0,
                      shares: 0,
                      verifications: 0
                    },
                    isLiked: false,
                    isVerified: false,
                    status: 'active'
                  }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {hasMore && !maxItems && (
        <div className="text-center py-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="bg-aura-primary text-white py-2 px-6 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && feedItems.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChatBubbleLeftIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No reports yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Be the first to share what&apos;s happening in your area
          </p>
          <button className="bg-aura-primary text-white py-2 px-4 rounded-xl font-medium">
            Submit Report
          </button>
        </div>
      )}
    </div>
  )
}
