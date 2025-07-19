import React from 'react'
import Navigation from '../components/Navigation'
import { AlertTriangle, Shield, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

const Crisis: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      <Navigation />

      <div className="flex-1 flex flex-col">
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/50 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <span>Crisis Management</span>
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Emergency response and crisis management for Ghana transport network
                </p>
              </div>
              <Badge variant="default" size="sm" className="bg-green-100 text-green-800">
                All Systems Normal
              </Badge>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Crisis Management Dashboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Crisis Management System</h3>
                <p className="text-gray-600">
                  Emergency response protocols and crisis management tools will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

export default Crisis
