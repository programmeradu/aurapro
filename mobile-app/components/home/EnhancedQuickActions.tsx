'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  MagnifyingGlassIcon,
  TruckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  MapPinIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { 
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  TruckIcon as TruckIconSolid 
} from '@heroicons/react/24/solid'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  solidIcon?: any
  href: string
  color: string
  priority: 'primary' | 'secondary' | 'tertiary'
  badge?: string
  isNew?: boolean
  estimatedTime?: string
}

interface EnhancedQuickActionsProps {
  className?: string
}

export default function EnhancedQuickActions({ className = '' }: EnhancedQuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      id: 'plan_journey',
      title: 'Plan Journey',
      description: 'Smart AI-powered route planning',
      icon: MagnifyingGlassIcon,
      solidIcon: MagnifyingGlassIconSolid,
      href: '/journey',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      priority: 'primary',
      badge: 'AI',
      estimatedTime: '2 min'
    },
    {
      id: 'track_vehicle',
      title: 'Track Live',
      description: 'Real-time vehicle tracking',
      icon: TruckIcon,
      solidIcon: TruckIconSolid,
      href: '/track',
      color: 'bg-gradient-to-br from-transport-bus to-green-600',
      priority: 'primary',
      estimatedTime: '1 min'
    },
    {
      id: 'budget_tracker',
      title: 'Budget',
      description: 'Smart expense tracking',
      icon: CurrencyDollarIcon,
      href: '/journey?tab=budget',
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      priority: 'secondary',
      badge: 'Smart'
    },
    {
      id: 'community',
      title: 'Community',
      description: 'Live crowd reports',
      icon: UserGroupIcon,
      href: '/community',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      priority: 'secondary',
      badge: 'Live'
    },
    {
      id: 'nearby_stops',
      title: 'Nearby Stops',
      description: 'Find transport nearby',
      icon: MapPinIcon,
      href: '/journey?action=nearby',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      priority: 'tertiary'
    },
    {
      id: 'schedule',
      title: 'Schedules',
      description: 'Transport timetables',
      icon: ClockIcon,
      href: '/journey?tab=schedule',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      priority: 'tertiary'
    },
    {
      id: 'report_issue',
      title: 'Report',
      description: 'Help improve service',
      icon: ExclamationTriangleIcon,
      href: '/community?action=report',
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      priority: 'tertiary'
    },
    {
      id: 'analytics',
      title: 'Insights',
      description: 'Your travel analytics',
      icon: ChartBarIcon,
      href: '/analytics',
      color: 'bg-gradient-to-br from-teal-500 to-teal-600',
      priority: 'tertiary',
      isNew: true
    }
  ]

  const primaryActions = quickActions.filter(action => action.priority === 'primary')
  const secondaryActions = quickActions.filter(action => action.priority === 'secondary')
  const tertiaryActions = quickActions.filter(action => action.priority === 'tertiary')

  const ActionCard = ({ action, size = 'normal' }: { action: QuickAction; size?: 'large' | 'normal' | 'small' }) => {
    const Icon = action.solidIcon || action.icon
    
    const sizeClasses = {
      large: 'p-6 min-h-[120px]',
      normal: 'p-4 min-h-[100px]',
      small: 'p-3 min-h-[80px]'
    }

    const iconSizes = {
      large: 'w-8 h-8',
      normal: 'w-6 h-6',
      small: 'w-5 h-5'
    }

    const textSizes = {
      large: 'text-base',
      normal: 'text-sm',
      small: 'text-xs'
    }

    return (
      <Link href={action.href}>
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`${action.color} ${sizeClasses[size]} rounded-2xl shadow-mobile text-white relative overflow-hidden group cursor-pointer`}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/20"></div>
            <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-full bg-white/10"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <Icon className={`${iconSizes[size]} text-white`} />
              
              {/* Badges */}
              <div className="flex flex-col items-end space-y-1">
                {action.badge && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {action.badge}
                  </span>
                )}
                {action.isNew && (
                  <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold">
                    NEW
                  </span>
                )}
              </div>
            </div>

            {/* Title and description */}
            <div className="flex-1 flex flex-col justify-end">
              <h3 className={`font-bold text-white mb-1 ${textSizes[size]}`}>
                {action.title}
              </h3>
              <p className={`text-white/80 ${size === 'small' ? 'text-xs' : 'text-xs'} line-clamp-2`}>
                {action.description}
              </p>
              
              {/* Estimated time */}
              {action.estimatedTime && size !== 'small' && (
                <div className="mt-2 flex items-center space-x-1">
                  <ClockIcon className="w-3 h-3 text-white/60" />
                  <span className="text-xs text-white/60">{action.estimatedTime}</span>
                </div>
              )}
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </div>
        </motion.div>
      </Link>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-5 h-5 text-aura-primary" />
          <h2 className="text-lg font-semibold text-ui-text-primary">
            Quick Actions
          </h2>
        </div>
        <div className="text-xs text-ui-text-secondary">
          Tap to get started
        </div>
      </div>

      {/* Primary Actions - Large cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {primaryActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ActionCard action={action} size="large" />
          </motion.div>
        ))}
      </div>

      {/* Secondary Actions - Medium cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {secondaryActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (primaryActions.length + index) * 0.1 }}
          >
            <ActionCard action={action} size="normal" />
          </motion.div>
        ))}
      </div>

      {/* Tertiary Actions - Small cards in grid */}
      <div className="grid grid-cols-4 gap-2">
        {tertiaryActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (primaryActions.length + secondaryActions.length + index) * 0.05 }}
          >
            <ActionCard action={action} size="small" />
          </motion.div>
        ))}
      </div>

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6 bg-gradient-to-r from-aura-primary/5 to-aura-secondary/5 rounded-2xl p-4"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-aura-primary">12</div>
            <div className="text-xs text-ui-text-secondary">Routes Saved</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">GHS 45</div>
            <div className="text-xs text-ui-text-secondary">Saved This Month</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">8.5</div>
            <div className="text-xs text-ui-text-secondary">Avg Rating</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}