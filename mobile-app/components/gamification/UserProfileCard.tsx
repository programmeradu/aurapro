'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  StarIcon,
  TrophyIcon,
  FireIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { gamificationService, UserProfile, Badge, Achievement } from '@/services/gamificationService'

interface UserProfileCardProps {
  userId?: string
  className?: string
  showFullProfile?: boolean
}

export default function UserProfileCard({ 
  userId, 
  className = '', 
  showFullProfile = false 
}: UserProfileCardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'achievements'>('overview')

  useEffect(() => {
    loadUserProfile()
  }, [userId])

  const loadUserProfile = async () => {
    setIsLoading(true)
    try {
      const userProfile = await gamificationService.getUserProfile(userId)
      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getProgressPercentage = () => {
    if (!profile) return 0
    return profile.reputation.nextLevelProgress
  }

  const getStreakColor = (days: number) => {
    if (days >= 30) return 'text-purple-600'
    if (days >= 14) return 'text-orange-600'
    if (days >= 7) return 'text-blue-600'
    return 'text-gray-600'
  }

  const getBadgeRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400 bg-yellow-50'
      case 'epic': return 'border-purple-400 bg-purple-50'
      case 'rare': return 'border-blue-400 bg-blue-50'
      case 'uncommon': return 'border-green-400 bg-green-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <UserGroupIcon className="h-8 w-8 mx-auto mb-2" />
          <p>Profile not found</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
              {profile.avatar || '👤'}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${profile.reputation.level.color.replace('#', 'bg-')}`}>
              {profile.stats.level}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">{profile.displayName}</h3>
              <span className="text-sm text-gray-500">@{profile.username}</span>
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              <span 
                className={`px-2 py-1 rounded-full text-xs font-medium text-white`}
                style={{ backgroundColor: profile.reputation.level.color }}
              >
                {profile.reputation.level.icon} {profile.reputation.level.name}
              </span>
              <span className="text-sm text-gray-600">
                {profile.reputation.score.toLocaleString()} points
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Progress to next level</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
            />
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-gray-600 mt-3">{profile.bio}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{profile.stats.reportsSubmitted}</div>
            <div className="text-xs text-gray-600">Reports</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{profile.stats.reportsVerified}</div>
            <div className="text-xs text-gray-600">Verified</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{profile.stats.accuracyRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Accuracy</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold flex items-center justify-center ${getStreakColor(profile.stats.streakDays)}`}>
              <FireIcon className="h-5 w-5 mr-1" />
              {profile.stats.streakDays}
            </div>
            <div className="text-xs text-gray-600">Day Streak</div>
          </div>
        </div>
      </div>

      {showFullProfile && (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { key: 'overview', label: 'Overview', icon: ChartBarIcon },
                { key: 'badges', label: 'Badges', icon: StarIcon },
                { key: 'achievements', label: 'Achievements', icon: TrophyIcon }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === key
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Recent Activity */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    {profile.reputation.recentChanges.slice(0, 3).map((change, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${change.amount > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{change.reason}</div>
                            <div className="text-xs text-gray-600">
                              {change.timestamp.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${change.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {change.amount > 0 ? '+' : ''}{change.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reputation Trend */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Reputation Trend</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">This Week</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">+{profile.reputation.weeklyChange}</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">This Month</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">+{profile.reputation.monthlyChange}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'badges' && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Earned Badges ({profile.badges.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {profile.badges.map((badge) => (
                    <motion.div
                      key={badge.id}
                      whileHover={{ scale: 1.05 }}
                      className={`p-3 rounded-lg border-2 ${getBadgeRarityColor(badge.rarity)} cursor-pointer`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{badge.icon}</div>
                        <div className="text-sm font-medium text-gray-900">{badge.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{badge.description}</div>
                        {badge.earnedDate && (
                          <div className="text-xs text-gray-500 mt-2">
                            {badge.earnedDate.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Achievements ({profile.achievements.length})
                </h4>
                <div className="space-y-3">
                  {profile.achievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                    >
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{achievement.title}</div>
                        <div className="text-sm text-gray-600">{achievement.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Unlocked {achievement.unlockedDate.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-orange-600">
                          {achievement.points} pts
                        </div>
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto mt-1" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
