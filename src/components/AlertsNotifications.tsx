'use client'

import { useStore } from '@/store/useStore'
import { formatGhanaTime } from '@/lib/utils'
import { AlertTriangle, CheckCircle, Info, XCircle, Bell, Filter, X } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'

interface Alert {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: Date
  source: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  acknowledged: boolean
}

interface AlertsNotificationsProps {
  className?: string
}

const AlertsNotifications: React.FC<AlertsNotificationsProps> = ({ className = '' }) => {
  const { connected, vehicles, alerts: storeAlerts } = useStore()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Generate dynamic alerts based on system state
  useEffect(() => {
    const generateSystemAlerts = () => {
      const newAlerts: Alert[] = []
      const now = new Date()

      // Connection status alert
      if (!connected) {
        newAlerts.push({
          id: 'connection-lost',
          type: 'error',
          title: 'Connection Lost',
          message: 'Real-time data connection has been interrupted',
          timestamp: now,
          source: 'System',
          priority: 'critical',
          acknowledged: false
        })
      }

      // Vehicle alerts
      const lowBatteryVehicles = vehicles.filter(v => (v.battery || 100) < 20)
      if (lowBatteryVehicles.length > 0) {
        newAlerts.push({
          id: 'low-battery',
          type: 'warning',
          title: 'Low Battery Alert',
          message: `${lowBatteryVehicles.length} vehicle(s) have low battery levels`,
          timestamp: now,
          source: 'Fleet Management',
          priority: 'medium',
          acknowledged: false
        })
      }

      // High occupancy alert
      const highOccupancyVehicles = vehicles.filter(v => (v.occupancy || 0) > 90)
      if (highOccupancyVehicles.length > 0) {
        newAlerts.push({
          id: 'high-occupancy',
          type: 'info',
          title: 'High Occupancy',
          message: `${highOccupancyVehicles.length} vehicle(s) are at high capacity`,
          timestamp: now,
          source: 'Operations',
          priority: 'low',
          acknowledged: false
        })
      }

      // Speed alerts
      const speedingVehicles = vehicles.filter(v => (v.speed || 0) > 60)
      if (speedingVehicles.length > 0) {
        newAlerts.push({
          id: 'speeding',
          type: 'warning',
          title: 'Speed Limit Exceeded',
          message: `${speedingVehicles.length} vehicle(s) exceeding speed limits`,
          timestamp: now,
          source: 'Safety',
          priority: 'high',
          acknowledged: false
        })
      }

      // Weather alerts from store
      if (storeAlerts && storeAlerts.length > 0) {
        storeAlerts.forEach((alert, index) => {
          newAlerts.push({
            id: `weather-${index}`,
            type: 'warning',
            title: 'Weather Alert',
            message: alert.message || 'Weather conditions may affect operations',
            timestamp: new Date(alert.timestamp || now),
            source: 'Weather Service',
            priority: 'medium',
            acknowledged: false
          })
        })
      }

      // Performance alerts
      if (vehicles.length > 0) {
        const avgSpeed = vehicles.reduce((sum, v) => sum + (v.speed || 0), 0) / vehicles.length
        if (avgSpeed < 15) {
          newAlerts.push({
            id: 'low-performance',
            type: 'warning',
            title: 'Performance Alert',
            message: 'Average fleet speed is below optimal levels',
            timestamp: now,
            source: 'Analytics',
            priority: 'medium',
            acknowledged: false
          })
        }
      }

      return newAlerts
    }

    const systemAlerts = generateSystemAlerts()
    setAlerts(prev => {
      // Merge with existing alerts, avoiding duplicates
      const existingIds = prev.map(a => a.id)
      const newAlerts = systemAlerts.filter(a => !existingIds.includes(a.id))
      return [...prev, ...newAlerts].slice(-20) // Keep last 20 alerts
    })
  }, [connected, vehicles, storeAlerts])

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />
      case 'info': return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50'
      case 'high': return 'border-l-orange-500 bg-orange-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-blue-500 bg-blue-50'
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'unread': return !alert.acknowledged
      case 'critical': return alert.priority === 'critical' || alert.priority === 'high'
      default: return true
    }
  })

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
  }

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const unreadCount = alerts.filter(a => !a.acknowledged).length
  const criticalCount = alerts.filter(a => (a.priority === 'critical' || a.priority === 'high') && !a.acknowledged).length

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-orange-600" />
              <span>Alerts & Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-1"
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({alerts.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'critical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('critical')}
              >
                Critical ({criticalCount})
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <div className="text-sm text-red-800">Critical Alerts</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{unreadCount}</div>
              <div className="text-sm text-yellow-800">Unread Alerts</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{alerts.length - unreadCount}</div>
              <div className="text-sm text-green-800">Acknowledged</div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No alerts to display</p>
                <p className="text-sm">System is running smoothly</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border-l-4 p-4 rounded-r-lg ${getPriorityColor(alert.priority)} ${
                    alert.acknowledged ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            alert.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.priority}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{alert.message}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{alert.source}</span>
                          <span>{formatGhanaTime(alert.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!alert.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-xs"
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissAlert(alert.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AlertsNotifications
