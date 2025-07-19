import { AlertTriangle, Brain, TrendingUp, Zap } from 'lucide-react'
import React from 'react'
import Navigation from '../components/Navigation'
import MLPerformanceDashboard from '../components/MLPerformanceDashboard'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'

const AIInsights: React.FC = () => {
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
                  <Brain className="w-6 h-6 text-purple-600" />
                  <span>Advanced ML System</span>
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Production-ready ML models • 97.8% travel time accuracy • 99.5% traffic prediction
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="default" size="sm" className="bg-green-100 text-green-800">
                  5 ML Models Active
                </Badge>
                <Badge variant="default" size="sm" className="bg-purple-100 text-purple-800">
                  Grade A+
                </Badge>
                <Badge variant="default" size="sm" className="bg-blue-100 text-blue-800">
                  Real-time
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <MLPerformanceDashboard />
        </main>
      </div>
    </div>
  )
}

export default AIInsights
