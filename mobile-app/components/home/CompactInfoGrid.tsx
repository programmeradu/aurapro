'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BoltIcon
} from '@heroicons/react/24/outline'

interface InfoCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  delay: number
}

function InfoCard({ title, value, subtitle, icon: Icon, color, delay }: InfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-white/20"
    >
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-lg font-bold text-gray-900 truncate">
            {value}
          </p>
          <p className="text-xs text-gray-600 truncate">
            {subtitle}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

interface CompactInfoGridProps {
  className?: string
}

export function CompactInfoGrid({ className = '' }: CompactInfoGridProps) {
  const [infoCards, setInfoCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch real data from your APIs - NO HARDCODED VALUES
      const [nextTrip, budget, community, aiTips] = await Promise.all([
        fetch('/api/user/next-trip').then(r => r.ok ? r.json() : null),
        fetch('/api/user/budget/remaining').then(r => r.ok ? r.json() : null),
        fetch('/api/community/active-reports').then(r => r.ok ? r.json() : null),
        fetch('/api/ai/pending-suggestions').then(r => r.ok ? r.json() : null)
      ])

      const cards = []

      if (nextTrip?.data) {
        cards.push({
          title: 'Next Trip',
          value: nextTrip.data.timeToNext || '--',
          subtitle: nextTrip.data.destination || 'No trips planned',
          icon: ClockIcon,
          color: 'bg-gradient-to-br from-blue-500 to-blue-600',
          delay: 0.1
        })
      }

      if (budget?.data) {
        cards.push({
          title: 'Budget',
          value: budget.data.remaining ? `₵${budget.data.remaining}` : '--',
          subtitle: budget.data.period || 'No budget set',
          icon: CurrencyDollarIcon,
          color: 'bg-gradient-to-br from-green-500 to-green-600',
          delay: 0.2
        })
      }

      if (community?.data) {
        cards.push({
          title: 'Community',
          value: community.data.activeReports?.toString() || '0',
          subtitle: 'Active reports',
          icon: UserGroupIcon,
          color: 'bg-gradient-to-br from-purple-500 to-purple-600',
          delay: 0.3
        })
      }

      if (aiTips?.data) {
        cards.push({
          title: 'AI Tips',
          value: aiTips.data.pendingCount?.toString() || '0',
          subtitle: 'New suggestions',
          icon: BoltIcon,
          color: 'bg-gradient-to-br from-orange-500 to-orange-600',
          delay: 0.4
        })
      }

      setInfoCards(cards)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // Show empty state instead of hardcoded fallback
      setInfoCards([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`grid grid-cols-2 gap-3 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-100 rounded-2xl p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (infoCards.length === 0) {
    return (
      <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/20 ${className}`}>
        <p className="text-sm text-gray-600">Dashboard data will appear here once configured</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {infoCards.map((card, index) => (
        <InfoCard key={index} {...card} />
      ))}
    </div>
  )
}