'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  EllipsisHorizontalIcon,
  BellIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../design-system/utils'

interface HeaderAction {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  badge?: number
  variant?: 'default' | 'primary' | 'ghost'
}

interface HeaderProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  onBackPress?: () => void
  actions?: HeaderAction[]
  variant?: 'default' | 'transparent' | 'blur'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
}

export function Header({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  actions = [],
  variant = 'default',
  size = 'md',
  className,
  children
}: HeaderProps) {
  const router = useRouter()

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress()
    } else {
      router.back()
    }
  }

  const headerVariants = {
    default: 'bg-white border-b border-gray-200',
    transparent: 'bg-transparent',
    blur: 'bg-white/95 backdrop-blur-xl border-b border-gray-200/50'
  }

  const sizeVariants = {
    sm: 'h-14',
    md: 'h-16',
    lg: 'h-20'
  }

  return (
    <motion.header
      className={cn(
        'fixed top-0 left-0 right-0 z-40',
        'flex items-center justify-between',
        'px-4 safe-area-pt',
        headerVariants[variant],
        sizeVariants[size],
        className
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
    >
      {/* Left Section */}
      <div className="flex items-center flex-1 min-w-0">
        {/* Back Button */}
        {showBackButton && (
          <motion.button
            onClick={handleBackPress}
            className="mr-3 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </motion.button>
        )}

        {/* Title Section */}
        {(title || subtitle) && (
          <div className="flex-1 min-w-0">
            {title && (
              <motion.h1
                className={cn(
                  'font-bold text-gray-900 truncate',
                  size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {title}
              </motion.h1>
            )}
            {subtitle && (
              <motion.p
                className="text-sm text-gray-600 truncate"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        )}

        {/* Custom Content */}
        {children && !title && !subtitle && (
          <div className="flex-1 min-w-0">
            {children}
          </div>
        )}
      </div>

      {/* Right Section - Actions */}
      {actions.length > 0 && (
        <div className="flex items-center space-x-2 ml-4">
          {actions.map((action, index) => (
            <HeaderActionButton
              key={action.id}
              action={action}
              index={index}
            />
          ))}
        </div>
      )}
    </motion.header>
  )
}

// Header Action Button Component
interface HeaderActionButtonProps {
  action: HeaderAction
  index: number
}

function HeaderActionButton({ action, index }: HeaderActionButtonProps) {
  const { icon: Icon, label, onClick, badge, variant = 'default' } = action

  const buttonVariants = {
    default: 'text-gray-700 hover:bg-gray-100',
    primary: 'text-blue-600 hover:bg-blue-50',
    ghost: 'text-gray-500 hover:bg-gray-50'
  }

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-full transition-colors',
        buttonVariants[variant]
      )}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: 0.1 + (index * 0.05),
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
      aria-label={label}
    >
      <Icon className="w-6 h-6" />
      
      {/* Badge */}
      {badge && badge > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
        >
          <span className="text-xs font-bold text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        </motion.div>
      )}
    </motion.button>
  )
}

// Predefined Header Configurations
export function HomeHeader() {
  const actions: HeaderAction[] = [
    {
      id: 'search',
      icon: MagnifyingGlassIcon,
      label: 'Search',
      onClick: () => console.log('Search pressed')
    },
    {
      id: 'notifications',
      icon: BellIcon,
      label: 'Notifications',
      onClick: () => console.log('Notifications pressed'),
      badge: 3,
      variant: 'primary'
    }
  ]

  return (
    <Header
      title="AURA"
      subtitle="Ghana Transport"
      actions={actions}
      variant="blur"
    />
  )
}

export function MapHeader() {
  const actions: HeaderAction[] = [
    {
      id: 'settings',
      icon: Cog6ToothIcon,
      label: 'Settings',
      onClick: () => console.log('Settings pressed')
    }
  ]

  return (
    <Header
      title="Live Map"
      actions={actions}
      variant="transparent"
    />
  )
}

export function JourneyPlanHeader() {
  const actions: HeaderAction[] = [
    {
      id: 'share',
      icon: ShareIcon,
      label: 'Share',
      onClick: () => console.log('Share pressed')
    },
    {
      id: 'more',
      icon: EllipsisHorizontalIcon,
      label: 'More options',
      onClick: () => console.log('More pressed')
    }
  ]

  return (
    <Header
      title="Plan Journey"
      showBackButton
      actions={actions}
    />
  )
}

export function ProfileHeader() {
  const actions: HeaderAction[] = [
    {
      id: 'settings',
      icon: Cog6ToothIcon,
      label: 'Settings',
      onClick: () => console.log('Settings pressed')
    }
  ]

  return (
    <Header
      title="Profile"
      actions={actions}
    />
  )
}

// Search Header Component
interface SearchHeaderProps {
  value: string
  onChange: (value: string) => void
  onCancel: () => void
  placeholder?: string
}

export function SearchHeader({ 
  value, 
  onChange, 
  onCancel, 
  placeholder = "Search destinations..." 
}: SearchHeaderProps) {
  return (
    <Header variant="blur" className="px-2">
      <div className="flex items-center space-x-3 w-full">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            autoFocus
          />
        </div>

        {/* Cancel Button */}
        <motion.button
          onClick={onCancel}
          className="text-blue-600 font-medium px-2"
          whileTap={{ scale: 0.95 }}
        >
          Cancel
        </motion.button>
      </div>
    </Header>
  )
}

// Hook for header height calculation
export function useHeaderHeight(size: 'sm' | 'md' | 'lg' = 'md') {
  const heights = {
    sm: 'pt-14',
    md: 'pt-16', 
    lg: 'pt-20'
  }
  return heights[size]
}
