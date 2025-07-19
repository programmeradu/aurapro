'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  UserIcon,
  StarIcon,
  TrophyIcon,
  MapPinIcon,
  ClockIcon,
  PencilIcon,
  CogIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface UserProfileData {
  id: string
  name: string
  email: string
  avatar?: string
  joinDate: Date
  location: string
  stats: {
    reportsSubmitted: number
    reportsVerified: number
    pointsEarned: number
    rank: number
    badgesEarned: string[]
  }
  preferences: {
    notifications: boolean
    publicProfile: boolean
    shareLocation: boolean
  }
  recentActivity: Array<{
    id: string
    type: 'report' | 'verification' | 'badge'
    description: string
    timestamp: Date
    points?: number
  }>
}

const mockUserProfile: UserProfileData = {
  id: '1',
  name: 'Kwame Asante',
  email: 'kwame.asante@example.com',
  joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  location: 'East Legon, Accra',
  stats: {
    reportsSubmitted: 47,
    reportsVerified: 23,
    pointsEarned: 2450,
    rank: 1,
    badgesEarned: ['Early Adopter', 'Top Reporter', 'Community Helper', 'Verification Expert']
  },
  preferences: {
    notifications: true,
    publicProfile: true,
    shareLocation: false
  },
  recentActivity: [
    {
      id: '1',
      type: 'report',
      description: 'Reported traffic jam on Spintex Road',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      points: 10
    },
    {
      id: '2',
      type: 'verification',
      description: 'Verified bus breakdown at Circle',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      points: 5
    },
    {
      id: '3',
      type: 'badge',
      description: 'Earned "Top Reporter" badge',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      points: 50
    }
  ]
}

export function UserProfile() {
  const [profile, setProfile] = useState<UserProfileData>(mockUserProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: profile.name,
    location: profile.location
  })

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Early Adopter': return 'bg-purple-100 text-purple-800'
      case 'Top Reporter': return 'bg-yellow-100 text-yellow-800'
      case 'Community Helper': return 'bg-green-100 text-green-800'
      case 'Verification Expert': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'report': return '📝'
      case 'verification': return '✅'
      case 'badge': return '🏆'
      default: return '📍'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleSaveProfile = () => {
    setProfile(prev => ({
      ...prev,
      name: editForm.name,
      location: editForm.location
    }))
    setIsEditing(false)
  }

  const togglePreference = (key: keyof UserProfileData['preferences']) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key]
      }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-mobile shadow-mobile p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="text-xl font-bold text-gray-900 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                />
              ) : (
                <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              )}
              <p className="text-gray-600">{profile.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <MapPinIcon className="h-4 w-4 text-gray-500" />
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    className="text-sm text-gray-600 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <span className="text-sm text-gray-600">{profile.location}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveProfile}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4" />
            <span>Joined {profile.joinDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrophyIcon className="h-4 w-4" />
            <span>Rank #{profile.stats.rank}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-mobile shadow-mobile p-4 text-center"
        >
          <div className="text-2xl font-bold text-blue-600">{profile.stats.reportsSubmitted}</div>
          <div className="text-sm text-gray-600">Reports Submitted</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-mobile shadow-mobile p-4 text-center"
        >
          <div className="text-2xl font-bold text-green-600">{profile.stats.reportsVerified}</div>
          <div className="text-sm text-gray-600">Reports Verified</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-mobile shadow-mobile p-4 text-center"
        >
          <div className="text-2xl font-bold text-yellow-600">{profile.stats.pointsEarned}</div>
          <div className="text-sm text-gray-600">Points Earned</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-mobile shadow-mobile p-4 text-center"
        >
          <div className="text-2xl font-bold text-purple-600">{profile.stats.badgesEarned.length}</div>
          <div className="text-sm text-gray-600">Badges Earned</div>
        </motion.div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-mobile shadow-mobile p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Badges</h3>
        <div className="flex flex-wrap gap-2">
          {profile.stats.badgesEarned.map((badge, index) => (
            <motion.span
              key={badge}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor(badge)}`}
            >
              🏆 {badge}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-mobile shadow-mobile p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CogIcon className="h-5 w-5 mr-2" />
          Preferences
        </h3>
        
        <div className="space-y-4">
          {Object.entries(profile.preferences).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-sm text-gray-600">
                  {key === 'notifications' && 'Receive push notifications for updates'}
                  {key === 'publicProfile' && 'Make your profile visible to other users'}
                  {key === 'shareLocation' && 'Share your location for better recommendations'}
                </div>
              </div>
              <button
                onClick={() => togglePreference(key as keyof UserProfileData['preferences'])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-mobile shadow-mobile p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        
        <div className="space-y-3">
          {profile.recentActivity.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-lg">{getActivityIcon(activity.type)}</span>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
                  {activity.points && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-green-600">+{activity.points} points</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
