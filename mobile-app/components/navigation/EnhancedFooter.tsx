'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  MapIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  MapIcon as MapIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  ChartBarIcon as ChartBarIconSolid
} from '@heroicons/react/24/solid'
import { apiService, unifiedDataService } from '@/services'

interface EnhancedFooterProps {
  className?: string
}

interface NavItem {
  id: string
  name: string
  href: string
  icon: React.ReactNode
  activeIcon: React.ReactNode
  badge?: number
  color: string
}

export function EnhancedFooter({ className = '' }: EnhancedFooterProps) {
  const pathname = usePathname()
  const [notifications, setNotifications] = useState(0)
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'degraded'>('online')

  // Fetch notification count and system status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [healthResponse] = await Promise.all([
          apiService.getHealthStatus()
        ])

        if (healthResponse.success) {
          setSystemStatus('online')
        } else {
          setSystemStatus('degraded')
        }

        // Mock notification count - in real app, fetch from notifications API
        setNotifications(3)
      } catch (error) {
        setSystemStatus('offline')
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const navItems: NavItem[] = [
    {
      id: 'home',
      name: 'Home',
      href: '/',
      icon: <HomeIcon className="w-6 h-6" />,
      activeIcon: <HomeIconSolid className="w-6 h-6" />,
      color: 'text-aura-primary'
    },
    {
      id: 'map',
      name: 'Map',
      href: '/map',
      icon: <MapIcon className="w-6 h-6" />,
      activeIcon: <MapIconSolid className="w-6 h-6" />,
      color: 'text-green-500'
    },
    {
      id: 'budget',
      name: 'Budget',
      href: '/budget',
      icon: <CurrencyDollarIcon className="w-6 h-6" />,
      activeIcon: <CurrencyDollarIconSolid className="w-6 h-6" />,
      color: 'text-yellow-500'
    },
    {
      id: 'community',
      name: 'Community',
      href: '/community',
      icon: <UserGroupIcon className="w-6 h-6" />,
      activeIcon: <UserGroupIconSolid className="w-6 h-6" />,
      badge: notifications,
      color: 'text-purple-500'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      href: '/analytics',
      icon: <ChartBarIcon className="w-6 h-6" />,
      activeIcon: <ChartBarIconSolid className="w-6 h-6" />,
      color: 'text-blue-500'
    }
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const getStatusColor = () => {
    switch (systemStatus) {
      case 'online':
        return 'bg-green-500'
      case 'degraded':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/95 backdrop-blur-xl border-t border-gray-200/50 ${className}`}
    >
      {/* System Status Bar */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            <span className="text-gray-600 capitalize">System {systemStatus}</span>
          </div>
          <div className="flex items-center space-x-4 text-gray-500">
            <span>Made with</span>
            <HeartIcon className="w-3 h-3 text-red-500" />
            <span>in Ghana</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-2">
        <nav className="flex items-center justify-around">
          {navItems.map((item) => {
            const active = isActive(item.href)
            
            return (
              <Link key={item.id} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="relative flex flex-col items-center space-y-1 p-2 rounded-xl transition-colors hover:bg-gray-50"
                >
                  {/* Icon */}
                  <div className={`relative ${active ? item.color : 'text-gray-400'}`}>
                    {active ? item.activeIcon : item.icon}
                    
                    {/* Badge */}
                    {item.badge && item.badge > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <span className="text-xs font-bold text-white">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`text-xs font-medium ${
                    active ? item.color : 'text-gray-500'
                  }`}>
                    {item.name}
                  </span>
                  
                  {/* Active Indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute -bottom-1 w-1 h-1 rounded-full ${item.color.replace('text-', 'bg-')}`}
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 bg-gray-50/50">
        <div className="flex items-center justify-center space-x-6">
          <button className="flex items-center space-x-2 px-4 py-2 bg-aura-primary/10 text-aura-primary rounded-full text-sm font-medium hover:bg-aura-primary/20 transition-colors">
            <BellIcon className="w-4 h-4" />
            <span>Alerts</span>
            {notifications > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>
          
          <Link href="/settings">
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
              <Cog6ToothIcon className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </Link>
        </div>
      </div>

      {/* App Info */}
      <div className="px-4 py-2 text-center">
        <p className="text-xs text-gray-400">
          AURA Transport v2.0.0 • Powered by AI
        </p>
      </div>
    </motion.footer>
  )
}