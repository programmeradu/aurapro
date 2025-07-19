'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrophyIcon,
  StarIcon
} from '@heroicons/react/24/outline'

interface CommunityStatsData {
  totalUsers: number
  activeReports: number
  resolvedReports: number
  topContributors: Array<{
    id: string
    name: string
    points: number
    avatar?: string
  }>
  recentActivity: Array<{
    id: string
    type: 'report' | 'resolution' | 'verification'
    description: string
    timestamp: Date
    user: string
  }>
}

const mockStats: CommunityStatsData = {
  totalUsers: 12847,
  activeReports: 23,
  resolvedReports: 156,
  topContributors: [
    { id: '1', name: 'Kwame A.', points: 2450 },
    { id: '2', name: 'Ama S.', points: 1890 },
    { id: '3', name: 'Kofi M.', points: 1650 },
  ],
  recentActivity: [
    {
      id: '1',
      type: 'report',
      description: 'Traffic jam reported on Spintex Road',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      user: 'Kwame A.'
    },
    {
      id: '2',
      type: 'resolution',
      description: 'Bus breakdown cleared at Circle',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      user: 'Ama S.'
    },
    {
      id: '3',
      type: 'verification',
      description: 'Route delay verified by 3 users',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      user: 'Kofi M.'
    }
  ]
}

export function CommunityStats() {
  const [stats, setStats] = useState<CommunityStatsData>(mockStats)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'report':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
      case 'resolution':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'verification':
        return <StarIcon className="h-4 w-4 text-blue-500" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />
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

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="bg-white rounded-mobile shadow-mobile p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Community Overview</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 rounded-lg p-4 text-center"
          >
            <UserGroupIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-sm text-blue-700">Active Users</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-orange-50 rounded-lg p-4 text-center"
          >
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-900">{stats.activeReports}</div>
            <div className="text-sm text-orange-700">Active Reports</div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-green-50 rounded-lg p-4 text-center"
        >
          <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-900">{stats.resolvedReports}</div>
          <div className="text-sm text-green-700">Resolved This Week</div>
        </motion.div>
      </div>

      {/* Top Contributors */}
      <div className="bg-white rounded-mobile shadow-mobile p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" />
            Top Contributors
          </h3>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div className="space-y-3">
          {stats.topContributors.map((contributor, index) => (
            <motion.div
              key={contributor.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 
                  'bg-orange-400'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{contributor.name}</div>
                  <div className="text-sm text-gray-600">{contributor.points} points</div>
                </div>
              </div>
              {index === 0 && <TrophyIcon className="h-5 w-5 text-yellow-500" />}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-mobile shadow-mobile p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        
        <div className="space-y-3">
          {stats.recentActivity.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-600">by {activity.user}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
          View All Activity
        </button>
      </div>
    </div>
  )
}
