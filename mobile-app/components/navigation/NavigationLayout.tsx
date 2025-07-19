'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { TabBar, TabBarProvider } from './TabBar'
import { cn } from '../../design-system/utils'

interface NavigationLayoutProps {
  children: React.ReactNode
  showTabBar?: boolean
  showHeader?: boolean
  headerProps?: React.ComponentProps<typeof Header>
  className?: string
}

export function NavigationLayout({
  children,
  showTabBar = true,
  showHeader = true,
  headerProps,
  className
}: NavigationLayoutProps) {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll for header blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Determine header configuration based on route
  const getHeaderConfig = () => {
    switch (pathname) {
      case '/':
        return {
          title: 'AURA',
          subtitle: 'Ghana Transport',
          variant: isScrolled ? 'blur' : 'transparent' as const
        }
      case '/explore':
        return {
          title: 'Explore',
          subtitle: 'Discover Ghana',
          variant: 'blur' as const
        }
      case '/plan':
        return {
          title: 'Plan Journey',
          showBackButton: false,
          variant: 'default' as const
        }
      case '/saved':
        return {
          title: 'Saved',
          subtitle: 'Your bookmarks',
          variant: 'default' as const
        }
      case '/profile':
        return {
          title: 'Profile',
          variant: 'default' as const
        }
      default:
        return {
          title: 'AURA',
          variant: 'default' as const
        }
    }
  }

  const headerConfig = { ...getHeaderConfig(), ...headerProps }

  return (
    <TabBarProvider>
      <div className={cn('min-h-screen bg-gray-50', className)}>
        {/* Header */}
        <AnimatePresence>
          {showHeader && (
            <Header {...headerConfig} />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main 
          className={cn(
            'relative',
            showHeader && 'pt-16', // Header height
            showTabBar && 'pb-20'   // Tab bar height
          )}
        >
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17
            }}
          >
            {children}
          </motion.div>
        </main>

        {/* Tab Bar */}
        <AnimatePresence>
          {showTabBar && <TabBar />}
        </AnimatePresence>

        {/* Safe Area Spacer for iOS */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </TabBarProvider>
  )
}

// Page-specific layout components
export function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationLayout
      showTabBar={true}
      showHeader={true}
      headerProps={{
        actions: [
          {
            id: 'search',
            icon: ({ className }) => (
              <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            ),
            label: 'Search',
            onClick: () => console.log('Search')
          },
          {
            id: 'notifications',
            icon: ({ className }) => (
              <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v2.25l2.25 2.25v.75H2.25v-.75L4.5 12V9.75a6 6 0 0 1 6-6z" />
              </svg>
            ),
            label: 'Notifications',
            onClick: () => console.log('Notifications'),
            badge: 3,
            variant: 'primary'
          }
        ]
      }}
    >
      {children}
    </NavigationLayout>
  )
}

export function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationLayout
      showTabBar={true}
      showHeader={false} // Map usually has its own overlay header
    >
      {children}
    </NavigationLayout>
  )
}

export function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationLayout
      showTabBar={true}
      showHeader={true}
      headerProps={{
        showBackButton: false,
        actions: [
          {
            id: 'help',
            icon: ({ className }) => (
              <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            label: 'Help',
            onClick: () => console.log('Help')
          }
        ]
      }}
    >
      {children}
    </NavigationLayout>
  )
}

export function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationLayout
      showTabBar={true}
      showHeader={true}
      headerProps={{
        actions: [
          {
            id: 'settings',
            icon: ({ className }) => (
              <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
            label: 'Settings',
            onClick: () => console.log('Settings')
          }
        ]
      }}
    >
      {children}
    </NavigationLayout>
  )
}

// Full-screen layout (for modals, onboarding, etc.)
export function FullScreenLayout({ 
  children, 
  showCloseButton = true,
  onClose
}: { 
  children: React.ReactNode
  showCloseButton?: boolean
  onClose?: () => void
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
    >
      {showCloseButton && onClose && (
        <div className="absolute top-4 right-4 z-10">
          <motion.button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full"
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>
      )}
      
      <div className="h-full overflow-auto">
        {children}
      </div>
    </motion.div>
  )
}
