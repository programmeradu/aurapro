'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface QuickActionItem {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
}

interface QuickActionsProps {
  items: QuickActionItem[]
}

export function QuickActions({ items }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, index) => {
        const Icon = item.icon
        
        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href={item.href}
              className="block bg-white rounded-2xl p-4 shadow-mobile border border-ui-border hover:shadow-mobile-lg transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ui-text-primary text-sm">
                    {item.title}
                  </h3>
                  <p className="text-xs text-ui-text-secondary truncate">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
