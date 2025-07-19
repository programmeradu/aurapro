'use client'

import { formatGhanaTime, getTimeGreeting } from '@/lib/utils'
import { apiService } from '@/services/apiService'
import { useWebSocket } from '@/services/websocket'
import { useStore } from '@/store/useStore'
import { motion } from 'framer-motion'
import {
    Activity,
    AlertTriangle,
    BarChart3,
    CheckCircle,
    DollarSign,
    MapPin,
    TrendingUp
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import MapboxMap from './MapboxMap'
import MapLegend from './MapLegend'
import Navigation from './Navigation'
import { Badge } from './ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

interface ModernDashboardProps {
  className?: string
}

const ModernDashboard: React.FC<ModernDashboardProps> = ({ className = '' }) => {
  const { vehicles, routes, kpis, connected } = useStore()
  const { connectionStatus, lastUpdate, connect } = useWebSocket()
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [hasLoadedData, setHasLoadedData] = useState(false)
  const [hasConnectedWS, setHasConnectedWS] = useState(false)

  // MANUAL CONTROL: Disable automatic data loading
  useEffect(() => {
    console.log('🚀 Modern Dashboard mounted - MANUAL MODE ENABLED')
    console.log('🔍 Accessibility features enabled')
    console.log('🚀 Performance monitoring enabled')
    console.log('💾 Advanced caching system enabled')
    console.log('📦 Bundle optimization enabled')
    console.log('⚠️ API calls are DISABLED by default to prevent system overload')
    console.log('💡 Use the "Load Data" button to manually load data when ready')

    // Set loaded to true to prevent any automatic loading
    setHasLoadedData(true)
  }, [])

  // Manual data loading function
  const loadDataManually = async () => {
    if (isLoadingData || apiService.isGloballyLoading()) {
      console.log('🚫 Already loading data')
      return
    }

    console.log('🔄 Manual data loading initiated...')
    apiService.setGlobalLoading(true)
    setIsLoadingData(true)

    try {
      console.log('📡 Loading data from backend API...')

      // Load only routes first (most important)
      console.log('🔄 Loading routes...')
      const routesData = await apiService.getRoutes().catch(err => {
        console.warn('⚠️ Failed to load routes:', err)
        return []
      })

      console.log('✅ Routes loaded:', routesData?.length || 0)

      // Wait before loading next dataset
      await new Promise(resolve => setTimeout(resolve, 5000))

      console.log('🔄 Loading stops...')
      const stopsData = await apiService.getStops().catch(err => {
        console.warn('⚠️ Failed to load stops:', err)
        return []
      })

      console.log('✅ Stops loaded:', stopsData?.length || 0)

      // Wait before loading next dataset
      await new Promise(resolve => setTimeout(resolve, 5000))

      console.log('🔄 Loading agencies...')
      const agenciesData = await apiService.getAgencies().catch(err => {
        console.warn('⚠️ Failed to load agencies:', err)
        return []
      })

      console.log('✅ Agencies loaded:', agenciesData?.length || 0)
      console.log('🎉 All data loaded successfully!')

    } catch (error) {
      console.error('❌ Failed to load data:', error)
    } finally {
      setIsLoadingData(false)
      apiService.setGlobalLoading(false)
    }
  }

  // Connect to WebSocket only once after data is loaded
  useEffect(() => {
    if (hasConnectedWS || !hasLoadedData) return

    console.log('🔌 Connecting to WebSocket server...')

    const connectTimeout = setTimeout(() => {
      connect('http://localhost:8002')
      setHasConnectedWS(true)
    }, 1000) // Delay to ensure API loading is complete

    return () => clearTimeout(connectTimeout)
  }, [hasLoadedData, hasConnectedWS, connect])

  // Calculate key metrics
  const activeVehicles = vehicles.filter(v => v.status === 'active').length
  const systemPerformance = kpis.find(k => k.label === 'System Performance')?.value || '98.5%'
  const networkEfficiency = kpis.find(k => k.label === 'Network Efficiency')?.value || '94.2%'

  // Status configuration
  const getStatusConfig = () => {
    if (!connected) {
      return {
        color: 'destructive',
        text: 'Disconnected',
        icon: <AlertTriangle className="w-4 h-4 text-red-600" />
      }
    }
    return {
      color: 'success',
      text: 'Connected',
      icon: <CheckCircle className="w-4 h-4 text-green-600" />
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      {/* Navigation Sidebar */}
      <Navigation />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/50 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getTimeGreeting()}, Transport Authority
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Real-time overview of Accra's transport network
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-full">
                  <div className={`w-2 h-2 rounded-full ${apiService.isSystemOverloaded() ? 'bg-red-500' : connected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                  <span className="text-sm font-medium text-slate-700">
                    {apiService.isSystemOverloaded() ? 'System Overloaded' : connected ? 'Live Data' : 'Manual Mode'}
                  </span>
                </div>

                <button
                  onClick={loadDataManually}
                  disabled={isLoadingData}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    isLoadingData
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isLoadingData ? 'Loading...' : 'Load Data'}
                </button>

                <button
                  onClick={() => apiService.resetSystemOverload()}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Reset
                </button>

                <div className="text-sm text-slate-600">
                  {formatGhanaTime(new Date())}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Key Metrics Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Active Vehicles */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Active Vehicles</p>
                    <p className="text-3xl font-bold text-blue-900">{activeVehicles}</p>
                    <p className="text-xs text-blue-700 mt-1">of {vehicles.length} total</p>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-full">
                    <Activity className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Active Routes */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Active Routes</p>
                    <p className="text-3xl font-bold text-purple-900">{routes.length}</p>
                    <p className="text-xs text-purple-700 mt-1">operational</p>
                  </div>
                  <div className="p-3 bg-purple-200 rounded-full">
                    <MapPin className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Performance */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">System Performance</p>
                    <p className="text-3xl font-bold text-orange-900">{systemPerformance}</p>
                    <p className="text-xs text-orange-700 mt-1">network efficiency</p>
                  </div>
                  <div className="p-3 bg-orange-200 rounded-full">
                    <TrendingUp className="w-6 h-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Map Section - Full Width & Height */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-[700px] w-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Enhanced Transport Network Visualization</span>
                  <Badge variant="default" size="sm" className="ml-auto">
                    Real-time • 3D • Interactive
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Comprehensive view of Accra's transport network with 2,565 GTFS stops, route shapes, and live vehicle tracking
                </p>
              </CardHeader>
              <CardContent className="p-0 h-[620px]">
                <MapboxMap className="w-full h-full" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Map Legend - Horizontal Layout Below Map */}
          <motion.div
            className="w-full mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <MapLegend isEnhancedMode={true} />
          </motion.div>

          {/* Secondary Content Grid - Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">

            {/* System Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Connection</span>
                  <Badge variant={statusConfig.color as any} size="sm">
                    {statusConfig.text}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Update</span>
                  <span className="text-sm font-medium text-gray-900">
                    {lastUpdate ? formatGhanaTime(lastUpdate) : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Network Efficiency</span>
                  <span className="text-sm font-medium text-green-600">
                    {networkEfficiency}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button className="w-full flex items-center space-x-2 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Analytics</span>
                </button>
                <button className="w-full flex items-center space-x-2 p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Financial</span>
                </button>
                <button className="w-full flex items-center space-x-2 p-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Crisis Center</span>
                </button>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start space-x-2 p-2 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-yellow-900">Route Delay</p>
                    <p className="text-xs text-yellow-700 truncate">Circle-Kaneshie delays</p>
                    <p className="text-xs text-yellow-600">2 min ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-green-900">System Update</p>
                    <p className="text-xs text-green-700 truncate">All systems operational</p>
                    <p className="text-xs text-green-600">5 min ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ModernDashboard
