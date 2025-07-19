'use client'

import { CommunityFeed } from '@/components/community/CommunityFeed'
import { CommunityStats } from '@/components/community/CommunityStats'
import { ReportForm } from '@/components/community/ReportForm'
import { UserProfile } from '@/components/community/UserProfile'
import { communityService } from '@/services/communityService'
import { CommunityStats as CommunityStatsType } from '@/types/community'
import { GeoPoint } from '@/types/transport'
import {
    ChartBarIcon,
    ExclamationTriangleIcon,
    PlusIcon,
    TrophyIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function CommunityPage() {
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null)
  const [activeTab, setActiveTab] = useState<'feed' | 'stats' | 'profile'>('feed')
  const [showReportForm, setShowReportForm] = useState(false)
  const [communityStats, setCommunityStats] = useState<CommunityStatsType | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: GeoPoint = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          }
          setUserLocation(location)
        },
        (error) => {
          console.error('Error getting location:', error)
          // Default to Accra
          setUserLocation({
            latitude: 5.6037,
            longitude: -0.1870,
            timestamp: new Date()
          })
        }
      )
    }
  }, [])

  // Load community stats and user profile
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingStats(true)
        
        const [stats, profile] = await Promise.all([
          communityService.getCommunityStats(),
          communityService.getUserProfile()
        ])
        
        setCommunityStats(stats)
        setUserProfile(profile)
      } catch (error) {
        console.error('Error loading community data:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    loadData()
  }, [])

  const handleReportSubmit = (report: any) => {
    setShowReportForm(false)
    toast.success('Report submitted successfully!')
    
    // Refresh stats
    communityService.getCommunityStats().then(setCommunityStats)
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'feed': return 'Community Feed'
      case 'stats': return 'Community Stats'
      case 'profile': return 'My Profile'
      default: return 'Community'
    }
  }

  const getTabDescription = () => {
    switch (activeTab) {
      case 'feed': return 'Latest reports and updates from commuters'
      case 'stats': return 'Community activity and insights'
      case 'profile': return 'Your contributions and achievements'
      default: return 'Connect with fellow commuters'
    }
  }

  return (
    <div className="min-h-screen-safe bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-mobile border-b border-ui-border safe-area-top"
      >
        <div className="px-mobile py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-responsive-xl font-bold font-display text-aura-primary truncate">
                {getTabTitle()}
              </h1>
              <p className="text-responsive-sm text-ui-text-secondary truncate">
                {getTabDescription()}
              </p>
            </div>

            <button
              onClick={() => setShowReportForm(true)}
              className="tap-target-large w-12 h-12 bg-aura-primary text-white rounded-full flex items-center justify-center shadow-floating transition-all duration-200 active:scale-95 ml-4"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Stats */}
          {!isLoadingStats && communityStats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-4 gap-3 mb-4"
            >
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-blue-600">
                  {communityStats.totalReports}
                </div>
                <div className="text-xs text-blue-600">Reports</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-green-600">
                  {communityStats.resolvedReports}
                </div>
                <div className="text-xs text-green-600">Resolved</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-purple-600">
                  {communityStats.activeUsers}
                </div>
                <div className="text-xs text-purple-600">Active</div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-yellow-600">
                  {communityStats.averageRating.toFixed(1)}
                </div>
                <div className="text-xs text-yellow-600">Rating</div>
              </div>
            </motion.div>
          )}

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                activeTab === 'feed'
                  ? 'bg-white text-aura-primary shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <UserGroupIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Feed</span>
            </button>
            
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                activeTab === 'stats'
                  ? 'bg-white text-aura-primary shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <ChartBarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Stats</span>
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-white text-aura-primary shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <TrophyIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Profile</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <CommunityFeed />
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <CommunityStats />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <UserProfile />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Report Form Modal */}
      <AnimatePresence>
        {showReportForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowReportForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <ReportForm
                userLocation={userLocation || undefined}
                onSubmitSuccess={handleReportSubmit}
                onCancel={() => setShowReportForm(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Guidelines Banner */}
      <div className="fixed bottom-20 left-4 right-4 md:hidden">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-aura-primary text-white p-3 rounded-xl shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Community Guidelines</p>
              <p className="text-xs opacity-90">
                Be respectful and help build a better transport system for Ghana
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
