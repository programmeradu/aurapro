/**
 * 🔧 Enhanced Predictive Maintenance Panel
 * Advanced sensor simulation, ML-based failure prediction, and intelligent scheduling
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  Activity,
  Settings,
  Calendar,
  Users,
  Package,
  Zap
} from 'lucide-react'
import { apiService } from '@/services/apiService'
import { useMemoryLeakPrevention } from '@/lib/memoryLeakFixes'

interface SensorData {
  vehicle_id: string
  timestamp: string
  engine_temp: number
  oil_pressure: number
  battery_voltage: number
  brake_pad_thickness: number
  fuel_efficiency: number
  vibration_level: number
  mileage: number
}

interface FailurePrediction {
  vehicle_id: string
  component: string
  risk_level: string
  days_until_failure: number
  confidence: number
  estimated_cost: number
  description: string
  recommended_action: string
}

interface MaintenanceTask {
  id: string
  vehicle_id: string
  component: string
  description: string
  scheduled_date: string
  estimated_duration: number
  estimated_cost: number
  priority: string
  status: string
  assigned_technician: string
}

interface MaintenanceSchedule {
  vehicle_id: string
  tasks: MaintenanceTask[]
  total_cost: number
  total_downtime: number
  maintenance_score: number
  recommendations: string[]
}

const EnhancedPredictiveMaintenancePanel: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [predictions, setPredictions] = useState<FailurePrediction[]>([])
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [fleetMetrics, setFleetMetrics] = useState({
    total_vehicles: 0,
    high_risk_vehicles: 0,
    total_cost: 0,
    average_maintenance_score: 0
  })

  const { safeSetInterval } = useMemoryLeakPrevention()

  // Load sensor data for fleet
  useEffect(() => {
    loadFleetSensorData()
    
    // Update sensor data every 30 seconds
    const sensorInterval = safeSetInterval(loadFleetSensorData, 30000)
    
    return () => {
      // Cleanup handled by useMemoryLeakPrevention
    }
  }, [safeSetInterval])

  const loadFleetSensorData = async () => {
    try {
      const vehicleIds = ['V001', 'V002', 'V003', 'V004', 'V005']
      const sensorPromises = vehicleIds.map(async (vehicleId) => {
        try {
          const response = await apiService.request(`/api/v1/maintenance/sensors/${vehicleId}`)
          return response.data
        } catch (error) {
          console.warn(`Failed to load sensor data for ${vehicleId}:`, error)
          return null
        }
      })

      const results = await Promise.all(sensorPromises)
      const validSensorData = results.filter(data => data !== null)
      setSensorData(validSensorData)
    } catch (error) {
      console.error('Failed to load fleet sensor data:', error)
    }
  }

  const runFailurePrediction = async () => {
    setIsAnalyzing(true)
    
    try {
      const response = await apiService.request('/api/v1/maintenance/predict', {
        method: 'POST',
        body: JSON.stringify({
          sensor_data: sensorData
        })
      })

      setPredictions(response.data.predictions)
      setFleetMetrics(prev => ({
        ...prev,
        total_vehicles: response.data.total_vehicles_analyzed,
        high_risk_vehicles: response.data.high_risk_vehicles
      }))

    } catch (error) {
      console.error('Failure prediction failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateMaintenanceSchedule = async () => {
    setIsScheduling(true)
    
    try {
      const response = await apiService.request('/api/v1/maintenance/schedule', {
        method: 'POST',
        body: JSON.stringify({
          predictions: predictions,
          optimization: {
            objective: 'balanced',
            weights: {
              cost: 0.25,
              downtime: 0.3,
              urgency: 0.3,
              resource_utilization: 0.15
            }
          }
        })
      })

      setSchedules(response.data.schedules)
      setFleetMetrics(prev => ({
        ...prev,
        total_cost: response.data.fleet_metrics.total_cost,
        average_maintenance_score: response.data.fleet_metrics.average_maintenance_score
      }))

    } catch (error) {
      console.error('Maintenance scheduling failed:', error)
    } finally {
      setIsScheduling(false)
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMaintenanceScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Fleet Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Fleet Health Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{sensorData.length}</div>
              <div className="text-sm text-blue-600">Active Vehicles</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{fleetMetrics.high_risk_vehicles}</div>
              <div className="text-sm text-red-600">High Risk</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{fleetMetrics.average_maintenance_score.toFixed(0)}</div>
              <div className="text-sm text-green-600">Avg Health Score</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">GHS {fleetMetrics.total_cost.toFixed(0)}</div>
              <div className="text-sm text-purple-600">Maintenance Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Sensor Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <span>Real-time Sensor Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sensorData.map((data) => (
              <div key={data.vehicle_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">Vehicle {data.vehicle_id}</h4>
                  <Badge variant="outline" className="text-xs">
                    {new Date(data.timestamp).toLocaleTimeString()}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Engine Temp:</span>
                    <span className={data.engine_temp > 100 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {data.engine_temp}°C
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Oil Pressure:</span>
                    <span className={data.oil_pressure < 30 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {data.oil_pressure} PSI
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Battery:</span>
                    <span className={data.battery_voltage < 12.0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {data.battery_voltage}V
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Brake Pads:</span>
                    <span className={data.brake_pad_thickness < 4 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {data.brake_pad_thickness}mm
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fuel Efficiency:</span>
                    <span className="text-gray-900">{data.fuel_efficiency} km/L</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mileage:</span>
                    <span className="text-gray-900">{data.mileage.toLocaleString()} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex space-x-3">
            <Button
              onClick={runFailurePrediction}
              disabled={isAnalyzing || sensorData.length === 0}
              className="flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Run ML Prediction</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Failure Predictions */}
      {predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span>Failure Predictions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.map((prediction, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Vehicle {prediction.vehicle_id}</h4>
                      <p className="text-sm text-gray-600 capitalize">{prediction.component} System</p>
                    </div>
                    <Badge className={getRiskLevelColor(prediction.risk_level)}>
                      {prediction.risk_level.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-gray-600">Days Until Failure</div>
                      <div className="font-medium">{prediction.days_until_failure}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Confidence</div>
                      <div className="font-medium">{prediction.confidence.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Estimated Cost</div>
                      <div className="font-medium">GHS {prediction.estimated_cost.toFixed(0)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Component</div>
                      <div className="font-medium capitalize">{prediction.component}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Description: </span>
                      <span className="text-sm text-gray-600">{prediction.description}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Recommended Action: </span>
                      <span className="text-sm text-gray-600">{prediction.recommended_action}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <Button
                onClick={generateMaintenanceSchedule}
                disabled={isScheduling}
                className="flex items-center space-x-2"
              >
                {isScheduling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Generate Schedule</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Schedules */}
      {schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span>Optimized Maintenance Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {schedules.map((schedule) => (
                <div key={schedule.vehicle_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Vehicle {schedule.vehicle_id}</h4>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>Total Cost: GHS {schedule.total_cost.toFixed(0)}</span>
                        <span>Downtime: {schedule.total_downtime}h</span>
                        <span className={`font-medium ${getMaintenanceScoreColor(schedule.maintenance_score)}`}>
                          Health Score: {schedule.maintenance_score}/100
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {schedule.tasks.map((task) => (
                      <div key={task.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900 capitalize">{task.component} Maintenance</h5>
                            <p className="text-sm text-gray-600">{task.description}</p>
                          </div>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Scheduled:</span>
                            <div className="font-medium">
                              {new Date(task.scheduled_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Duration:</span>
                            <div className="font-medium">{task.estimated_duration}h</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Cost:</span>
                            <div className="font-medium">GHS {task.estimated_cost.toFixed(0)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Technician:</span>
                            <div className="font-medium">{task.assigned_technician}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {schedule.recommendations.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h6 className="font-medium text-blue-900 mb-2">Recommendations:</h6>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {schedule.recommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnhancedPredictiveMaintenancePanel
