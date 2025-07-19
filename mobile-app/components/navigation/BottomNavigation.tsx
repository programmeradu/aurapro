'use client'

import {
    HomeIcon,
    MagnifyingGlassIcon,
    MapIcon,
    UserGroupIcon,
    UserIcon,
} from '@heroicons/react/24/outline'
import {
    HomeIcon as HomeIconSolid,
    MagnifyingGlassIcon as MagnifyingGlassIconSolid,
    MapIcon as MapIconSolid,
    UserGroupIcon as UserGroupIconSolid,
    UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigationItems = [
  {
    name: 'Home',
    href: '/',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    name: 'Track',
    href: '/track',
    icon: MapIcon,
    activeIcon: MapIconSolid,
  },
  {
    name: 'Journey',
    href: '/journey',
    icon: MagnifyingGlassIcon,
    activeIcon: MagnifyingGlassIconSolid,
  },
  {
    name: 'Community',
    href: '/community',
    icon: UserGroupIcon,
    activeIcon: UserGroupIconSolid,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: UserIcon,
    activeIcon: UserIconSolid,
  },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-ui-border safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = isActive ? item.activeIcon : item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 tap-target-large rounded-xl transition-all duration-200 active:scale-95"
            >
              <div className="relative">
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -inset-3 bg-aura-primary/10 rounded-xl"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}

                {/* Icon */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`p-1 rounded-lg transition-all duration-200 ${
                    isActive ? 'bg-aura-primary/10' : ''
                  }`}>
                    <Icon
                      className={`w-6 h-6 transition-colors ${
                        isActive
                          ? 'text-aura-primary'
                          : 'text-gray-500'
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-xs font-medium mt-1 transition-colors leading-tight ${
                      isActive
                        ? 'text-aura-primary'
                        : 'text-gray-500'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Home indicator for devices with home indicator */}
      <div className="h-1 bg-transparent" />
    </nav>
  )
}
