'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HomeIcon,
  MapIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  MapIcon as MapIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
  badge?: number
  color: string
}

const navItems: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
    color: 'text-aura-primary',
  },
  {
    name: 'Track',
    href: '/track',
    icon: MapIcon,
    activeIcon: MapIconSolid,
    color: 'text-transport-bus',
  },
  {
    name: 'Journey',
    href: '/journey',
    icon: MagnifyingGlassIcon,
    activeIcon: MagnifyingGlassIconSolid,
    color: 'text-transport-route',
  },
  {
    name: 'Community',
    href: '/community',
    icon: ChatBubbleLeftRightIcon,
    activeIcon: ChatBubbleLeftRightIconSolid,
    badge: 3, // Example badge count
    color: 'text-transport-trotro',
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: UserIcon,
    activeIcon: UserIconSolid,
    color: 'text-aura-accent',
  },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const [showQuickAction, setShowQuickAction] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Hide/show navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false)
      } else {
        // Scrolling up
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const quickActions = [
    {
      name: 'Report Issue',
      href: '/report',
      icon: '🚨',
      color: 'bg-red-500',
    },
    {
      name: 'Share Location',
      href: '/share-location',
      icon: '📍',
      color: 'bg-blue-500',
    },
    {
      name: 'Emergency',
      href: '/emergency',
      icon: '🆘',
      color: 'bg-red-600',
    },
    {
      name: 'Feedback',
      href: '/feedback',
      icon: '💬',
      color: 'bg-green-500',
    },
  ]

  return (
    <>
      {/* Quick Action Overlay */}
      <AnimatePresence>
        {showQuickAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowQuickAction(false)}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute bottom-24 right-4 bg-white rounded-2xl shadow-floating p-4 min-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.name}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={action.href}
                      className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors tap-target"
                      onClick={() => setShowQuickAction(false)}
                    >
                      <div className={`w-10 h-10 ${action.color} rounded-full flex items-center justify-center text-white text-lg mb-2`}>
                        {action.icon}
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center">
                        {action.name}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Navigation */}
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-ui-border z-50 safe-area-bottom"
      >
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href
            const Icon = isActive ? item.activeIcon : item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center relative tap-target group"
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-aura-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Icon container */}
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 transition-colors duration-200 ${
                      isActive
                        ? item.color
                        : 'text-gray-400 group-active:text-gray-600'
                    }`}
                  />
                  
                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </motion.div>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                    isActive
                      ? item.color
                      : 'text-gray-400 group-active:text-gray-600'
                  }`}
                >
                  {item.name}
                </span>

                {/* Ripple effect */}
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                />
              </Link>
            )
          })}
        </div>
      </motion.nav>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: isVisible ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={() => setShowQuickAction(!showQuickAction)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-aura-primary text-white rounded-full shadow-floating flex items-center justify-center z-40 tap-target"
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={{ rotate: showQuickAction ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <PlusIcon className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </>
  )
}

export default MobileNavigation
