'use client'

import {
    Activity,
    AlertTriangle,
    BarChart3,
    Brain,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    LayoutDashboard,
    Map,
    Settings,
    TrendingUp,
    Users
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'

interface NavigationProps {
  className?: string
}

const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navigationItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      path: '/',
      badge: null,
      description: 'Main dashboard overview'
    },
    {
      id: 'live-tracking',
      label: 'Live Tracking',
      icon: Map,
      path: '/live-tracking',
      badge: '20',
      description: 'Real-time vehicle tracking'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      badge: null,
      description: 'Performance analytics'
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      icon: Brain,
      path: '/ai-insights',
      badge: 'NEW',
      description: 'ML predictions & insights'
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: Users,
      path: '/operations',
      badge: null,
      description: 'Driver & fleet management'
    },
    {
      id: 'enhanced-operations',
      label: 'Enhanced Ops',
      icon: Activity,
      path: '/enhanced-operations',
      badge: 'ML',
      description: 'Advanced ML-powered operations center'
    },
    {
      id: 'financial',
      label: 'Financial',
      icon: DollarSign,
      path: '/financial',
      badge: null,
      description: 'Revenue & pricing'
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: Activity,
      path: '/monitoring',
      badge: '3',
      description: 'System health & alerts'
    },
    {
      id: 'crisis',
      label: 'Crisis Center',
      icon: AlertTriangle,
      path: '/crisis',
      badge: null,
      description: 'Emergency management'
    }
  ]

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <nav className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AURA</h1>
                <p className="text-xs text-gray-500">Command Center</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-2">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                
                {!isCollapsed && (
                  <>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                    
                    {item.badge && (
                      <Badge 
                        variant={item.badge === 'NEW' ? 'default' : 'secondary'} 
                        size="sm"
                        className="text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-2 space-y-2">
        {/* ML Status Indicator */}
        {!isCollapsed && (
          <div className="px-2 py-1 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <div className="flex-1">
                <p className="text-xs font-medium text-purple-900">ML System</p>
                <p className="text-xs text-purple-700">97.8% • 99.5% • A+</p>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <button
          onClick={() => handleNavigation('/settings')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors ${
            isActive('/settings') ? 'bg-blue-50 text-blue-700' : ''
          }`}
          title={isCollapsed ? 'Settings' : ''}
        >
          <Settings className="w-5 h-5 text-gray-500" />
          {!isCollapsed && (
            <span className="font-medium text-sm">Settings</span>
          )}
        </button>
      </div>
    </nav>
  )
}

export default Navigation
