'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import {
  HomeIcon,
  MapIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  UserIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  MapIcon as MapIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid'
import { cn } from '../../design-system/utils'

interface TabItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
  badge?: number
  isSpecial?: boolean
}

const tabs: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: HomeIcon,
    activeIcon: HomeIconSolid
  },
  {
    id: 'explore',
    label: 'Explore',
    href: '/explore',
    icon: MapIcon,
    activeIcon: MapIconSolid
  },
  {
    id: 'plan',
    label: 'Plan',
    href: '/plan',
    icon: PlusIcon,
    activeIcon: PlusIcon,
    isSpecial: true
  },
  {
    id: 'saved',
    label: 'Saved',
    href: '/saved',
    icon: BookmarkIcon,
    activeIcon: BookmarkIconSolid,
    badge: 3
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: UserIcon,
    activeIcon: UserIconSolid
  }
]

interface TabBarProps {
  className?: string
}

export function TabBar({ className }: TabBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleTabPress = (tab: TabItem) => {
    // Add haptic feedback if available
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    router.push(tab.href)
  }

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-50',
      'bg-white/95 backdrop-blur-xl',
      'border-t border-gray-200/50',
      'safe-area-pb',
      className
    )}>
      {/* Tab Bar Container */}
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab, index) => {
          const isActive = pathname === tab.href
          const Icon = isActive ? tab.activeIcon : tab.icon

          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabPress(tab)}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'min-w-[60px] py-2 px-3',
                'transition-all duration-200',
                tab.isSpecial ? 'mx-2' : ''
              )}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              initial={false}
              animate={{
                scale: isActive ? 1.1 : 1
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 17
              }}
            >
              {/* Special Tab (Plan Journey) */}
              {tab.isSpecial ? (
                <motion.div
                  className={cn(
                    'w-14 h-14 rounded-2xl',
                    'bg-gradient-to-br from-blue-500 to-blue-600',
                    'flex items-center justify-center',
                    'shadow-lg shadow-blue-500/25',
                    'border-2 border-white'
                  )}
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    boxShadow: isActive 
                      ? '0 8px 25px -5px rgba(59, 130, 246, 0.4)' 
                      : '0 4px 15px -3px rgba(59, 130, 246, 0.25)'
                  }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </motion.div>
              ) : (
                /* Regular Tab */
                <div className="relative">
                  {/* Active Background */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-50 rounded-xl -m-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Icon Container */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative">
                      <Icon 
                        className={cn(
                          'w-6 h-6 transition-colors duration-200',
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        )} 
                      />
                      
                      {/* Badge */}
                      {tab.badge && tab.badge > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                        >
                          <span className="text-xs font-bold text-white">
                            {tab.badge > 99 ? '99+' : tab.badge}
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* Label */}
                    <motion.span
                      className={cn(
                        'text-xs font-medium mt-1 transition-colors duration-200',
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      )}
                      animate={{
                        opacity: isActive ? 1 : 0.8,
                        fontWeight: isActive ? 600 : 500
                      }}
                    >
                      {tab.label}
                    </motion.span>
                  </div>
                </div>
              )}

              {/* Special Tab Label */}
              {tab.isSpecial && (
                <motion.span
                  className="text-xs font-semibold text-blue-600 mt-1"
                  animate={{
                    opacity: isActive ? 1 : 0.8
                  }}
                >
                  {tab.label}
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Home Indicator (iOS style) */}
      <div className="flex justify-center pb-2">
        <div className="w-32 h-1 bg-gray-300 rounded-full" />
      </div>
    </div>
  )
}

// Hook for tab bar height calculation
export function useTabBarHeight() {
  return 'pb-20' // Adjust based on your tab bar height
}

// Tab bar context for managing state
export const TabBarContext = React.createContext<{
  currentTab: string
  setCurrentTab: (tab: string) => void
  badges: Record<string, number>
  setBadge: (tabId: string, count: number) => void
}>({
  currentTab: 'home',
  setCurrentTab: () => {},
  badges: {},
  setBadge: () => {}
})

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const [currentTab, setCurrentTab] = React.useState('home')
  const [badges, setBadges] = React.useState<Record<string, number>>({})

  const setBadge = (tabId: string, count: number) => {
    setBadges(prev => ({
      ...prev,
      [tabId]: count
    }))
  }

  return (
    <TabBarContext.Provider value={{
      currentTab,
      setCurrentTab,
      badges,
      setBadge
    }}>
      {children}
    </TabBarContext.Provider>
  )
}

export function useTabBar() {
  const context = React.useContext(TabBarContext)
  if (!context) {
    throw new Error('useTabBar must be used within a TabBarProvider')
  }
  return context
}
