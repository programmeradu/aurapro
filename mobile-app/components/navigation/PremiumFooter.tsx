'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  HomeIcon,
  MapIcon,
  ChartBarIcon,
  CpuChipIcon,
  UserCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  MapIcon as MapIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CpuChipIcon as CpuChipIconSolid,
  UserCircleIcon as UserCircleIconSolid
} from '@heroicons/react/24/solid'
import { usePathname } from 'next/navigation'

export function PremiumFooter() {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
      color: 'text-blue-500'
    },
    {
      name: 'Map',
      href: '/map',
      icon: MapIcon,
      activeIcon: MapIconSolid,
      color: 'text-green-500'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: ChartBarIcon,
      activeIcon: ChartBarIconSolid,
      color: 'text-purple-500'
    },
    {
      name: 'ML Hub',
      href: '/showcase',
      icon: CpuChipIcon,
      activeIcon: CpuChipIconSolid,
      color: 'text-orange-500'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserCircleIcon,
      activeIcon: UserCircleIconSolid,
      color: 'text-indigo-500'
    }
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50">
      {/* Background with blur effect */}
      <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const active = isActive(item.href)
              const IconComponent = active ? item.activeIcon : item.icon
              
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center py-2 px-3 rounded-2xl transition-all"
                  >
                    <div className={`p-2 rounded-xl transition-all ${
                      active 
                        ? `bg-gray-100 ${item.color}` 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    
                    <span className={`text-xs font-medium mt-1 transition-all ${
                      active 
                        ? item.color 
                        : 'text-gray-400'
                    }`}>
                      {item.name}
                    </span>
                    
                    {/* Active indicator */}
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="w-1 h-1 bg-current rounded-full mt-1"
                      />
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Safe area for devices with home indicator */}
      <div className="bg-white/80 backdrop-blur-xl h-safe-area-inset-bottom" />
    </footer>
  )
}
