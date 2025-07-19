'use client'

import { useStore } from '@/store/useStore'
import { formatCurrency, formatPercentage, formatGhanaTime } from '@/lib/utils'
import { Wrench, AlertTriangle, CheckCircle, Clock, TrendingUp, Activity, Zap, Gauge, Settings } from 'lucide-react'
import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface VehicleSensorData {
  vehicleId: string
  timestamp: Date
  engineTemp: number
  oilPressure: number
  brakeWear: number
  tireCondition: number
  batteryVoltage: number
  fuelEfficiency: number
  vibrationLevel: number
  mileage: number
}

interface MaintenancePrediction {
  vehicleId: string
  vehicleName: string
  component: 'engine' | 'brakes' | 'tires' | 'battery' | 'transmission'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  daysUntilFailure: number
  confidence: number
  estimatedCost: number
  description: string
  recommendedAction: string
}

interface MaintenanceSchedule {
  id: string
  vehicleId: string
  vehicleName: string
  type: 'preventive' | 'predictive' | 'emergency'
  component: string
  scheduledDate: Date
  estimatedDuration: number
  estimatedCost: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue'
}

interface PredictiveMaintenanceSystemProps {
  className?: string
}

const PredictiveMaintenanceSystem: React.FC<PredictiveMaintenanceSystemProps> = ({ className = '' }) => {
  const { vehicles, connected } = useStore()
  const [sensorData, setSensorData] = useState<VehicleSensorData[]>([])
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([])
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceSchedule[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Generate realistic sensor data
  useEffect(() => {
    const generateSensorData = () => {
      const newSensorData: VehicleSensorData[] = vehicles.map(vehicle => {
        const baseTemp = 85 + Math.random() * 20 // 85-105°C
        const baseOilPressure = 30 + Math.random() * 20 // 30-50 PSI
        const baseBrakeWear = Math.random() * 100 // 0-100%
        const baseTireCondition = 60 + Math.random() * 40 // 60-100%
        const baseBatteryVoltage = 12 + Math.random() * 2 // 12-14V
        const baseFuelEfficiency = 8 + Math.random() * 6 // 8-14 km/l
        const baseVibration = Math.random() * 10 // 0-10 units
        const baseMileage = 50000 + Math.random() * 100000 // 50k-150k km

        return {
          vehicleId: vehicle.id,
          timestamp: new Date(),
          engineTemp: Math.round(baseTemp * 10) / 10,
          oilPressure: Math.round(baseOilPressure * 10) / 10,
          brakeWear: Math.round(baseBrakeWear),
          tireCondition: Math.round(baseTireCondition),
          batteryVoltage: Math.round(baseBatteryVoltage * 10) / 10,
          fuelEfficiency: Math.round(baseFuelEfficiency * 10) / 10,
          vibrationLevel: Math.round(baseVibration * 10) / 10,
          mileage: Math.round(baseMileage)
        }
      })
      setSensorData(newSensorData)
    }

    generateSensorData()
    const interval = setInterval(generateSensorData, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [vehicles])

  // Generate maintenance predictions using ML simulation
  const generatePredictions = () => {
    setIsAnalyzing(true)
    
    setTimeout(() => {
      const newPredictions: MaintenancePrediction[] = []
      
      sensorData.forEach(data => {
        const vehicle = vehicles.find(v => v.id === data.vehicleId)
        if (!vehicle) return

        // Engine prediction based on temperature and oil pressure
        if (data.engineTemp > 100 || data.oilPressure < 35) {
          newPredictions.push({
            vehicleId: data.vehicleId,
            vehicleName: vehicle.id,
            component: 'engine',
            riskLevel: data.engineTemp > 105 ? 'critical' : 'high',
            daysUntilFailure: data.engineTemp > 105 ? 3 + Math.random() * 7 : 15 + Math.random() * 15,
            confidence: 85 + Math.random() * 10,
            estimatedCost: 2500 + Math.random() * 2000,
            description: 'Engine showing signs of overheating and oil pressure issues',
            recommendedAction: 'Schedule immediate engine inspection and oil change'
          })
        }

        // Brake prediction based on wear level
        if (data.brakeWear > 70) {
          newPredictions.push({
            vehicleId: data.vehicleId,
            vehicleName: vehicle.id,
            component: 'brakes',
            riskLevel: data.brakeWear > 85 ? 'critical' : 'high',
            daysUntilFailure: data.brakeWear > 85 ? 5 + Math.random() * 10 : 20 + Math.random() * 20,
            confidence: 90 + Math.random() * 8,
            estimatedCost: 800 + Math.random() * 600,
            description: `Brake pads at ${data.brakeWear}% wear level`,
            recommendedAction: 'Replace brake pads and inspect brake system'
          })
        }

        // Battery prediction based on voltage
        if (data.batteryVoltage < 12.5) {
          newPredictions.push({
            vehicleId: data.vehicleId,
            vehicleName: vehicle.id,
            component: 'battery',
            riskLevel: data.batteryVoltage < 12.2 ? 'critical' : 'medium',
            daysUntilFailure: data.batteryVoltage < 12.2 ? 2 + Math.random() * 5 : 10 + Math.random() * 20,
            confidence: 80 + Math.random() * 15,
            estimatedCost: 300 + Math.random() * 200,
            description: `Battery voltage low at ${data.batteryVoltage}V`,
            recommendedAction: 'Test battery and charging system, replace if necessary'
          })
        }

        // Tire prediction based on condition
        if (data.tireCondition < 75) {
          newPredictions.push({
            vehicleId: data.vehicleId,
            vehicleName: vehicle.id,
            component: 'tires',
            riskLevel: data.tireCondition < 60 ? 'high' : 'medium',
            daysUntilFailure: data.tireCondition < 60 ? 10 + Math.random() * 15 : 30 + Math.random() * 30,
            confidence: 75 + Math.random() * 20,
            estimatedCost: 1200 + Math.random() * 800,
            description: `Tire condition at ${data.tireCondition}%`,
            recommendedAction: 'Inspect tires for wear patterns and replace if needed'
          })
        }
      })

      setPredictions(newPredictions)
      setIsAnalyzing(false)
    }, 2000)
  }

  // Generate maintenance schedule
  const generateMaintenanceSchedule = () => {
    const schedule: MaintenanceSchedule[] = predictions.map((prediction, index) => {
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + Math.max(1, prediction.daysUntilFailure - 5))
      
      return {
        id: `maintenance-${index}`,
        vehicleId: prediction.vehicleId,
        vehicleName: prediction.vehicleName,
        type: prediction.riskLevel === 'critical' ? 'emergency' : 'predictive',
        component: prediction.component,
        scheduledDate,
        estimatedDuration: prediction.component === 'engine' ? 8 : prediction.component === 'brakes' ? 4 : 2,
        estimatedCost: prediction.estimatedCost,
        priority: prediction.riskLevel,
        status: 'scheduled'
      }
    })

    // Add some preventive maintenance
    vehicles.slice(0, 3).forEach((vehicle, index) => {
      const preventiveDate = new Date()
      preventiveDate.setDate(preventiveDate.getDate() + 30 + index * 10)
      
      schedule.push({
        id: `preventive-${index}`,
        vehicleId: vehicle.id,
        vehicleName: vehicle.id,
        type: 'preventive',
        component: 'general',
        scheduledDate: preventiveDate,
        estimatedDuration: 6,
        estimatedCost: 500 + Math.random() * 300,
        priority: 'low',
        status: 'scheduled'
      })
    })

    setMaintenanceSchedule(schedule)
  }

  useEffect(() => {
    if (predictions.length > 0) {
      generateMaintenanceSchedule()
    }
  }, [predictions])

  const getRiskColor = (risk: MaintenancePrediction['riskLevel']) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
    }
  }

  const getStatusColor = (status: MaintenanceSchedule['status']) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100'
      case 'in-progress': return 'text-yellow-600 bg-yellow-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'overdue': return 'text-red-600 bg-red-100'
    }
  }

  const selectedVehicleData = selectedVehicle ? sensorData.find(d => d.vehicleId === selectedVehicle) : null
  const criticalPredictions = predictions.filter(p => p.riskLevel === 'critical').length
  const totalMaintenanceCost = predictions.reduce((sum, p) => sum + p.estimatedCost, 0)
  const avgConfidence = predictions.length > 0 
    ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
    : 0

  // Sensor trend data for charts
  const sensorTrendData = useMemo(() => {
    if (!selectedVehicleData) return []
    
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      engineTemp: 85 + Math.sin(i * 0.3) * 10 + Math.random() * 5,
      oilPressure: 40 + Math.cos(i * 0.2) * 8 + Math.random() * 3,
      batteryVoltage: 12.8 + Math.sin(i * 0.1) * 0.5 + Math.random() * 0.2,
      vibration: 2 + Math.random() * 3
    }))
  }, [selectedVehicleData])

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span>Predictive Maintenance System</span>
            <div className={`w-2 h-2 rounded-full ml-auto ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">{criticalPredictions}</div>
              <div className="text-sm text-red-800">Critical Issues</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">{predictions.length}</div>
              <div className="text-sm text-blue-800">Total Predictions</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(totalMaintenanceCost)}</div>
              <div className="text-sm text-green-800">Est. Maintenance Cost</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">{formatPercentage(avgConfidence)}</div>
              <div className="text-sm text-purple-800">Avg Confidence</div>
            </div>
          </div>

          {/* Analysis Controls */}
          <div className="flex items-center space-x-4 mb-6">
            <Button
              onClick={generatePredictions}
              disabled={isAnalyzing}
              className="flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Run ML Analysis</span>
                </>
              )}
            </Button>
            
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Vehicle for Details</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.id}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maintenance Predictions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span>Maintenance Predictions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {predictions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No predictions available</p>
                      <p className="text-sm">Run ML analysis to generate predictions</p>
                    </div>
                  ) : (
                    predictions.map((prediction, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Settings className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-sm">{prediction.vehicleName}</span>
                            <span className="text-xs text-gray-600">({prediction.component})</span>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(prediction.riskLevel)}`}>
                            {prediction.riskLevel}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2">{prediction.description}</p>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Days until failure:</span>
                            <div className="font-medium">{Math.round(prediction.daysUntilFailure)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Confidence:</span>
                            <div className="font-medium">{formatPercentage(prediction.confidence)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Est. Cost:</span>
                            <div className="font-medium">{formatCurrency(prediction.estimatedCost)}</div>
                          </div>
                        </div>
                        
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                          <strong>Action:</strong> {prediction.recommendedAction}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Sensor Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Gauge className="w-5 h-5 text-green-600" />
                  <span>Real-time Sensor Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedVehicleData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600">Engine Temp</div>
                        <div className="text-lg font-bold">{selectedVehicleData.engineTemp}°C</div>
                        <div className={`text-xs ${selectedVehicleData.engineTemp > 100 ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedVehicleData.engineTemp > 100 ? 'High' : 'Normal'}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600">Oil Pressure</div>
                        <div className="text-lg font-bold">{selectedVehicleData.oilPressure} PSI</div>
                        <div className={`text-xs ${selectedVehicleData.oilPressure < 35 ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedVehicleData.oilPressure < 35 ? 'Low' : 'Normal'}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600">Brake Wear</div>
                        <div className="text-lg font-bold">{selectedVehicleData.brakeWear}%</div>
                        <div className={`text-xs ${selectedVehicleData.brakeWear > 70 ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedVehicleData.brakeWear > 70 ? 'High Wear' : 'Good'}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600">Battery</div>
                        <div className="text-lg font-bold">{selectedVehicleData.batteryVoltage}V</div>
                        <div className={`text-xs ${selectedVehicleData.batteryVoltage < 12.5 ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedVehicleData.batteryVoltage < 12.5 ? 'Low' : 'Good'}
                        </div>
                      </div>
                    </div>

                    {/* Sensor Trends Chart */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">24-Hour Sensor Trends</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={sensorTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="engineTemp" stroke="#EF4444" strokeWidth={2} name="Engine Temp (°C)" />
                          <Line type="monotone" dataKey="oilPressure" stroke="#3B82F6" strokeWidth={2} name="Oil Pressure (PSI)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Gauge className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a vehicle to view sensor data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Schedule */}
          {maintenanceSchedule.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Maintenance Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenanceSchedule.slice(0, 8).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Wrench className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="font-medium text-sm">{item.vehicleName} - {item.component}</div>
                          <div className="text-xs text-gray-600">
                            {formatGhanaTime(item.scheduledDate)} • {item.estimatedDuration}h • {formatCurrency(item.estimatedCost)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PredictiveMaintenanceSystem
