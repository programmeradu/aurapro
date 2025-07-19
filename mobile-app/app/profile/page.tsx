'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  UserCircleIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

export default function ProfilePage() {
  const [user] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+233 24 123 4567',
    avatar: null,
    joinDate: '2024-01-15',
    totalJourneys: 127,
    totalSavings: 45.50
  })

  const menuItems = [
    {
      icon: CogIcon,
      title: 'Account Settings',
      subtitle: 'Manage your account preferences',
      href: '/profile/settings'
    },
    {
      icon: BellIcon,
      title: 'Notifications',
      subtitle: 'Configure your notification preferences',
      href: '/profile/notifications'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      href: '/profile/privacy'
    },
    {
      icon: QuestionMarkCircleIcon,
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      href: '/profile/help'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-aura-primary rounded-full flex items-center justify-center">
              <UserCircleIcon className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">Member since {new Date(user.joinDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-aura-primary">{user.totalJourneys}</div>
              <div className="text-sm text-gray-600">Total Journeys</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₵{user.totalSavings}</div>
              <div className="text-sm text-gray-600">Money Saved</div>
            </div>
          </div>
        </motion.div>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.subtitle}</p>
                </div>
                <div className="w-6 h-6 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Sign Out */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full bg-red-50 rounded-2xl p-4 shadow-sm hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center justify-center space-x-3">
            <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-600">Sign Out</span>
          </div>
        </motion.button>
      </div>
    </div>
  )
}