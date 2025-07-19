import { Activity } from 'lucide-react'
import React from 'react'
import EnhancedPerformanceMonitor from '../components/EnhancedPerformanceMonitor'
import Navigation from '../components/Navigation'
import { Badge } from '../components/ui/Badge'

const Monitoring: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      <Navigation />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/50 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <Activity className="w-6 h-6 text-blue-600" />
                  <span>System Monitoring</span>
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Real-time system health and performance monitoring
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="default" size="sm" className="bg-green-100 text-green-800">
                  All Systems Operational
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <EnhancedPerformanceMonitor />
        </main>
      </div>
    </div>
  )
}

export default Monitoring
