/**
 * 🔌 WebSocket Connection Monitoring Panel
 * Real-time connection status, metrics, and diagnostics
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  RefreshCw,
  Settings,
  Zap,
  TrendingUp,
  Database
} from 'lucide-react'
import { useEnhancedWebSocket } from '../lib/enhancedWebSocketManager'
import { useMemoryLeakPrevention } from '../lib/memoryLeakFixes'

const WebSocketMonitoringPanel: React.FC = () => {
  const {
    connectionState,
    metrics,
    connect,
    disconnect,
    send,
    isConnected
  } = useEnhancedWebSocket({
    maxReconnectAttempts: 10,
    baseReconnectDelay: 1000,
    maxReconnectDelay: 30000,
    heartbeatInterval: 30000,
    enableFallback: true,
    enableMetrics: true
  })

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionHistory, setConnectionHistory] = useState<Array<{
    timestamp: Date
    status: string
    url: string | null
    error?: string
  }>>([])

  const { safeSetInterval } = useMemoryLeakPrevention()

  // Track connection history
  useEffect(() => {
    const newEntry = {
      timestamp: new Date(),
      status: connectionState.status,
      url: connectionState.url,
      error: connectionState.lastError?.message
    }
    
    setConnectionHistory(prev => [newEntry, ...prev.slice(0, 9)]) // Keep last 10 entries
  }, [connectionState.status, connectionState.url, connectionState.lastError])

  // Auto-connect on component mount
  useEffect(() => {
    if (connectionState.status === 'disconnected' && !connectionState.isManualDisconnect) {
      handleConnect()
    }
  }, [])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await connect()
    } catch (error) {
      console.error('Connection failed:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    await disconnect()
  }

  const handleTestConnection = () => {
    send('ping', { timestamp: Date.now() })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800'
      case 'connecting': return 'bg-blue-100 text-blue-800'
      case 'reconnecting': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'fallback': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'connecting': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
      case 'reconnecting': return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'fallback': return <Activity className="w-4 h-4 text-orange-600" />
      default: return <WifiOff className="w-4 h-4 text-gray-600" />
    }
  }

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatDataSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getConnectionQuality = () => {
    const successRate = metrics.totalConnections > 0 
      ? (metrics.successfulConnections / metrics.totalConnections) * 100 
      : 0
    
    if (successRate >= 95) return { label: 'Excellent', color: 'text-green-600' }
    if (successRate >= 85) return { label: 'Good', color: 'text-blue-600' }
    if (successRate >= 70) return { label: 'Fair', color: 'text-yellow-600' }
    return { label: 'Poor', color: 'text-red-600' }
  }

  const quality = getConnectionQuality()

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="w-5 h-5 text-blue-600" />
            <span>WebSocket Connection Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(connectionState.status)}
              <div>
                <Badge className={getStatusColor(connectionState.status)}>
                  {connectionState.status.toUpperCase()}
                </Badge>
                {connectionState.url && (
                  <p className="text-sm text-gray-600 mt-1">
                    Connected to: {connectionState.url}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              {isConnected ? (
                <>
                  <Button
                    onClick={handleTestConnection}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Test</span>
                  </Button>
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <WifiOff className="w-4 h-4" />
                    <span>Disconnect</span>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wifi className="w-4 h-4" />
                  )}
                  <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
                </Button>
              )}
            </div>
          </div>

          {connectionState.lastError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Last Error:</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{connectionState.lastError.message}</p>
            </div>
          )}

          {connectionState.reconnectAttempts > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Reconnection attempts: {connectionState.reconnectAttempts}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span>Connection Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{metrics.totalConnections}</div>
              <div className="text-sm text-blue-600">Total Connections</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{metrics.successfulConnections}</div>
              <div className="text-sm text-green-600">Successful</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{metrics.failedConnections}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{metrics.reconnectionAttempts}</div>
              <div className="text-sm text-purple-600">Reconnections</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Connection Quality</span>
              </div>
              <div className={`text-lg font-bold ${quality.color}`}>
                {quality.label}
              </div>
              <div className="text-sm text-gray-600">
                {metrics.totalConnections > 0 
                  ? `${((metrics.successfulConnections / metrics.totalConnections) * 100).toFixed(1)}% success rate`
                  : 'No data'
                }
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Average Connection Time</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {metrics.averageConnectionTime > 0 
                  ? `${Math.round(metrics.averageConnectionTime)}ms`
                  : 'N/A'
                }
              </div>
              <div className="text-sm text-gray-600">
                {isConnected && metrics.lastConnectionTime
                  ? `Uptime: ${formatUptime(metrics.uptime)}`
                  : 'Not connected'
                }
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Data Transfer</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatDataSize(metrics.dataTransferred)}
              </div>
              <div className="text-sm text-gray-600">
                {metrics.messagesReceived} received, {metrics.messagesSent} sent
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-orange-600" />
            <span>Connection History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {connectionHistory.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(entry.status)}
                  <div>
                    <Badge className={getStatusColor(entry.status)} variant="outline">
                      {entry.status.toUpperCase()}
                    </Badge>
                    {entry.url && (
                      <p className="text-xs text-gray-600 mt-1">{entry.url}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-900">
                    {entry.timestamp.toLocaleTimeString()}
                  </div>
                  {entry.error && (
                    <div className="text-xs text-red-600 max-w-xs truncate">
                      {entry.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {connectionHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No connection history available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default WebSocketMonitoringPanel
