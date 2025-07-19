/**
 * 🚦 Real-time Traffic Monitoring Panel
 * Live traffic data, congestion alerts, and route optimization
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { 
  Navigation, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  MapPin,
  Zap,
  Activity,
  BarChart3,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { 
  realTimeTrafficManager, 
  TrafficDataPoint, 
  TrafficAlert, 
  TrafficIncident,
  TrafficPrediction
} from '../lib/realTimeTrafficManager'
import { useMemoryLeakPrevention } from '../lib/memoryLeakFixes'

const RealTimeTrafficPanel: React.FC = () => {
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>([])
  const [alerts, setAlerts] = useState<TrafficAlert[]>([])
  const [incidents, setIncidents] = useState<TrafficIncident[]>([])
  const [predictions, setPredictions] = useState<TrafficPrediction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [showPredictions, setShowPredictions] = useState(false)

  const { safeSetInterval } = useMemoryLeakPrevention()

  useEffect(() => {
    // Set up event listeners
    const handleTrafficUpdate = (data: any) => {
      setTrafficData(realTimeTrafficManager.getTrafficData())
      setIsLoading(false)
    }

    const handleAlertCreated = (alert: TrafficAlert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 19)]) // Keep last 20 alerts
    }

    const handlePredictionsUpdate = () => {
      setPredictions(realTimeTrafficManager.getTrafficPredictions())
    }

    realTimeTrafficManager.on('traffic_updated', handleTrafficUpdate)
    realTimeTrafficManager.on('alert_created', handleAlertCreated)
    realTimeTrafficManager.on('predictions_updated', handlePredictionsUpdate)

    // Initial data load
    setTrafficData(realTimeTrafficManager.getTrafficData())
    setAlerts(realTimeTrafficManager.getRecentAlerts())
    setIncidents(realTimeTrafficManager.getActiveIncidents())
    setPredictions(realTimeTrafficManager.getTrafficPredictions())
    setIsLoading(false)

    // Update data periodically
    const updateInterval = safeSetInterval(() => {
      setTrafficData(realTimeTrafficManager.getTrafficData())
      setAlerts(realTimeTrafficManager.getRecentAlerts())
      setIncidents(realTimeTrafficManager.getActiveIncidents())
    }, 30000) // Every 30 seconds

    return () => {
      realTimeTrafficManager.off('traffic_updated', handleTrafficUpdate)
      realTimeTrafficManager.off('alert_created', handleAlertCreated)
      realTimeTrafficManager.off('predictions_updated', handlePredictionsUpdate)
    }
  }, [safeSetInterval])

  const getCongestionColor = (level: number) => {
    if (level < 0.3) return 'bg-green-100 text-green-800'
    if (level < 0.6) return 'bg-yellow-100 text-yellow-800'
    if (level < 0.8) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getCongestionLabel = (level: number) => {
    if (level < 0.3) return 'Light'
    if (level < 0.6) return 'Moderate'
    if (level < 0.8) return 'Heavy'
    return 'Severe'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-orange-100 text-orange-800'
      case 'info': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getIncidentTypeIcon = (type: string) => {
    switch (type) {
      case 'accident': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'construction': return <Activity className="w-4 h-4 text-orange-600" />
      case 'closure': return <AlertCircle className="w-4 h-4 text-red-600" />
      default: return <MapPin className="w-4 h-4 text-gray-600" />
    }
  }

  const formatSegmentName = (segmentId: string) => {
    return segmentId.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' → ')
  }

  const getAverageMetrics = () => {
    if (trafficData.length === 0) return { avgCongestion: 0, avgSpeed: 0, totalIncidents: 0 }
    
    const avgCongestion = trafficData.reduce((sum, data) => sum + data.congestionLevel, 0) / trafficData.length
    const avgSpeed = trafficData.reduce((sum, data) => sum + data.currentSpeed, 0) / trafficData.length
    const totalIncidents = incidents.length
    
    return {
      avgCongestion: Math.round(avgCongestion * 100),
      avgSpeed: Math.round(avgSpeed),
      totalIncidents
    }
  }

  const metrics = getAverageMetrics()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading traffic data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Traffic Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            <span>Real-time Traffic Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{trafficData.length}</div>
              <div className="text-sm text-blue-600">Monitored Routes</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">{metrics.avgCongestion}%</div>
              <div className="text-sm text-orange-600">Avg Congestion</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{metrics.avgSpeed}</div>
              <div className="text-sm text-green-600">Avg Speed (km/h)</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{metrics.totalIncidents}</div>
              <div className="text-sm text-red-600">Active Incidents</div>
            </div>
          </div>

          <div className="mt-4 flex space-x-3">
            <Button
              onClick={() => setShowPredictions(!showPredictions)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{showPredictions ? 'Hide' : 'Show'} Predictions</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Traffic Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span>Live Traffic Conditions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trafficData.map((data) => (
              <div 
                key={data.segmentId} 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedSegment === data.segmentId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedSegment(
                  selectedSegment === data.segmentId ? null : data.segmentId
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {formatSegmentName(data.segmentId)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Updated: {data.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge className={getCongestionColor(data.congestionLevel)}>
                    {getCongestionLabel(data.congestionLevel)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Current Speed:</span>
                    <div className="font-medium">{data.currentSpeed} km/h</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Travel Time:</span>
                    <div className="font-medium">{data.travelTime.toFixed(1)} min</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Congestion:</span>
                    <div className="font-medium">{(data.congestionLevel * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Confidence:</span>
                    <div className="font-medium">{(data.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>

                {data.incidents.length > 0 && (
                  <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {data.incidents.length} incident(s) reported
                      </span>
                    </div>
                  </div>
                )}

                {selectedSegment === data.segmentId && showPredictions && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Traffic Predictions</h5>
                    {predictions
                      .filter(p => p.segmentId === data.segmentId)
                      .map(prediction => (
                        <div key={prediction.segmentId} className="space-y-2">
                          {prediction.timeHorizons.map((horizon, index) => (
                            <div key={horizon} className="flex justify-between text-sm">
                              <span className="text-gray-600">+{horizon} min:</span>
                              <span className={`font-medium ${getCongestionColor(prediction.predictedCongestion[index]).replace('bg-', 'text-').replace('-100', '-800')}`}>
                                {(prediction.predictedCongestion[index] * 100).toFixed(0)}% congestion
                              </span>
                            </div>
                          ))}
                          <div className="text-xs text-gray-500 mt-2">
                            Confidence: {(prediction.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Traffic Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span>Traffic Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <span>Routes: {alert.affectedRoutes.join(', ')}</span>
                      <span>Duration: {alert.estimatedDuration} min</span>
                    </div>
                    <span>{alert.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Incidents */}
      {incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>Active Incidents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div key={incident.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start space-x-3">
                    {getIncidentTypeIcon(incident.type)}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-gray-900 capitalize">
                          {incident.type} - {incident.severity}
                        </h4>
                        <span className="text-sm text-gray-600">
                          {incident.startTime.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Delay: {incident.delayMinutes} min</span>
                        <span>Impact: {incident.impactRadius}m radius</span>
                        {incident.estimatedEndTime && (
                          <span>
                            Estimated end: {incident.estimatedEndTime.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {trafficData.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Traffic Data Available</h3>
            <p className="text-gray-600">
              Traffic monitoring is starting up. Data will appear shortly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RealTimeTrafficPanel
