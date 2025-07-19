'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapIcon,
  NewspaperIcon,
  BoltIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { NearbyTransport } from './NearbyTransport'
import { NewsUpdates } from './NewsUpdates'
import { LiveUpdates } from './LiveUpdates'
import CrowdsourcingHub from '@/components/crowdsourcing/CrowdsourcingHub'

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType
}

const tabs: Tab[] = [
  {
    id: 'transport',
    label: 'Transport',
    icon: MapIcon,
    component: NearbyTransport
  },
  {
    id: 'news',
    label: 'News',
    icon: NewspaperIcon,
    component: NewsUpdates
  },
  {
    id: 'live',
    label: 'Live',
    icon: BoltIcon,
    component: LiveUpdates
  },
  {
    id: 'community',
    label: 'Community',
    icon: UserGroupIcon,
    component: CrowdsourcingHub
  }
]

export function TabbedContent() {
  const [activeTab, setActiveTab] = useState('transport')

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || NearbyTransport

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex bg-gray-50/50 border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 px-3 text-sm font-medium transition-all relative ${
              activeTab === tab.id
                ? 'text-blue-600 bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${
              activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'
            }`} />
            <span className="hidden sm:inline">{tab.label}</span>
            
            {/* Active indicator */}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}