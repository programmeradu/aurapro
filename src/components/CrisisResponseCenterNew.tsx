'use client'

import { useStore } from '@/store/useStore'
import { formatGhanaTime } from '@/lib/utils'
import { AlertTriangle, Shield, Zap, Users, Clock, Phone, Radio, Activity, MapPin, Truck } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'

interface CrisisScenario {
  id: string
  type: 'accident' | 'breakdown' | 'weather' | 'security' | 'medical' | 'traffic'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  location: string
  affectedRoutes: string[]
  affectedVehicles: string[]
  timestamp: Date
  status: 'active' | 'responding' | 'resolved'
  responseTeam?: string
  estimatedResolution?: Date
}

interface EmergencyContact {
  name: string
  role: string
  phone: string
  status: 'available' | 'busy' | 'offline'
}

interface CrisisResponseCenterProps {
  className?: string
}

const CrisisResponseCenterNew: React.FC<CrisisResponseCenterProps> = ({ className = '' }) => {
  const { vehicles, routes, connected } = useStore()
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [activeScenarios, setActiveScenarios] = useState<CrisisScenario[]>([])
  const [systemStatus, setSystemStatus] = useState({
    overall: 'operational' as 'operational' | 'warning' | 'critical',
    lastUpdate: new Date(),
    activeIncidents: 0,
    responseTeams: 3,
    emergencyContacts: 8
  })
  const [emergencyContacts] = useState<EmergencyContact[]>([
    { name: 'Kwame Asante', role: 'Emergency Coordinator', phone: '+233 24 123 4567', status: 'available' },
    { name: 'Ama Osei', role: 'Medical Response', phone: '+233 20 987 6543', status: 'available' },
    { name: 'Kofi Mensah', role: 'Security Chief', phone: '+233 26 555 0123', status: 'busy' },
    { name: 'Akosua Boateng', role: 'Traffic Control', phone: '+233 24 777 8888', status: 'available' }
  ])

  // Generate realistic crisis scenarios
  useEffect(() => {
    const generateScenarios = () => {
      const scenarios: CrisisScenario[] = []
      const now = new Date()

      // Simulate random crisis events
      if (Math.random() > 0.7) {
        scenarios.push({
          id: 'crisis-001',
          type: 'breakdown',
          severity: 'medium',
          title: 'Vehicle Breakdown - Route Circle',
          description: 'Vehicle GH-2847-23 experiencing engine failure on Circle-Kaneshie route. Passengers evacuated safely.',
          location: 'Circle Interchange, Accra',
          affectedRoutes: ['Circle-Kaneshie', 'Circle-Tema'],
          affectedVehicles: ['GH-2847-23'],
          timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
          status: 'responding',
          responseTeam: 'Technical Team Alpha',
          estimatedResolution: new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now
        })
      }

      if (Math.random() > 0.8) {
        scenarios.push({
          id: 'crisis-002',
          type: 'weather',
          severity: 'high',
          title: 'Heavy Rainfall Alert',
          description: 'Severe thunderstorm affecting Tema-Accra corridor. Reduced visibility and flooding reported.',
          location: 'Tema Motorway',
          affectedRoutes: ['Tema-Accra', 'Tema-Circle'],
          affectedVehicles: ['GH-1234-20', 'GH-5678-21', 'GH-9012-22'],
          timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
          status: 'active',
          responseTeam: 'Weather Response Unit',
          estimatedResolution: new Date(now.getTime() + 120 * 60 * 1000) // 2 hours from now
        })
      }

      if (Math.random() > 0.9) {
        scenarios.push({
          id: 'crisis-003',
          type: 'accident',
          severity: 'critical',
          title: 'Traffic Accident - Spintex Road',
          description: 'Multi-vehicle collision blocking two lanes. Emergency services dispatched. No serious injuries reported.',
          location: 'Spintex Road, near Airport Junction',
          affectedRoutes: ['Airport-Spintex', 'Spintex-Tema'],
          affectedVehicles: [],
          timestamp: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
          status: 'active',
          responseTeam: 'Emergency Response Team',
          estimatedResolution: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
        })
      }

      setActiveScenarios(scenarios)
      setSystemStatus(prev => ({
        ...prev,
        activeIncidents: scenarios.length,
        lastUpdate: now,
        overall: scenarios.some(s => s.severity === 'critical') ? 'critical' : 
                scenarios.some(s => s.severity === 'high') ? 'warning' : 'operational'
      }))
    }

    generateScenarios()
    const interval = setInterval(generateScenarios, 45000) // Update every 45 seconds

    return () => clearInterval(interval)
  }, [])

  const getSeverityColor = (severity: CrisisScenario['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 border-green-200'
    }
  }

  const getStatusColor = (status: CrisisScenario['status']) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100'
      case 'responding': return 'text-yellow-600 bg-yellow-100'
      case 'resolved': return 'text-green-600 bg-green-100'
    }
  }

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const resolveScenario = (scenarioId: string) => {
    setActiveScenarios(prev => 
      prev.map(scenario => 
        scenario.id === scenarioId 
          ? { ...scenario, status: 'resolved' as const }
          : scenario
      )
    )
  }

  const activateEmergencyProtocol = () => {
    setIsMonitoring(true)
    // In a real system, this would:
    // 1. Alert all emergency contacts
    // 2. Activate backup systems
    // 3. Reroute traffic
    // 4. Deploy emergency resources
    console.log('🚨 Emergency Protocol Activated')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-red-600" />
            <span>Crisis Response Center</span>
            <div className={`w-2 h-2 rounded-full ml-auto ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* System Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">{systemStatus.activeIncidents}</div>
              <div className="text-sm text-red-800">Active Incidents</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">{systemStatus.responseTeams}</div>
              <div className="text-sm text-blue-800">Response Teams</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">{systemStatus.emergencyContacts}</div>
              <div className="text-sm text-green-800">Emergency Contacts</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className={`text-2xl font-bold mb-1 ${systemStatus.overall === 'operational' ? 'text-green-600' : systemStatus.overall === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                {systemStatus.overall.toUpperCase()}
              </div>
              <div className="text-sm text-purple-800">System Status</div>
            </div>
          </div>

          {/* Emergency Controls */}
          <div className="flex items-center space-x-4 mb-6">
            <Button
              onClick={activateEmergencyProtocol}
              className={`${isMonitoring ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className={`w-4 h-4 ${isMonitoring ? 'animate-pulse' : ''}`} />
                <span>{isMonitoring ? 'Emergency Active' : 'Activate Emergency'}</span>
              </div>
            </Button>
            
            <div className="text-sm text-gray-600">
              Last Update: {formatGhanaTime(systemStatus.lastUpdate)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Crisis Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>Active Crisis Scenarios</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {activeScenarios.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No active crisis scenarios</p>
                      <p className="text-sm">System monitoring normally</p>
                    </div>
                  ) : (
                    activeScenarios.map((scenario, index) => (
                      <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(scenario.severity)}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-medium text-sm">{scenario.title}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(scenario.severity)}`}>
                              {scenario.severity}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(scenario.status)}`}>
                              {scenario.status}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-3">{scenario.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <span className="font-medium">Location:</span>
                            <div>{scenario.location}</div>
                          </div>
                          <div>
                            <span className="font-medium">Time:</span>
                            <div>{formatGhanaTime(scenario.timestamp)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Affected Routes:</span>
                            <div>{scenario.affectedRoutes.join(', ')}</div>
                          </div>
                          <div>
                            <span className="font-medium">Response Team:</span>
                            <div>{scenario.responseTeam || 'Assigning...'}</div>
                          </div>
                        </div>
                        
                        {scenario.status !== 'resolved' && (
                          <Button
                            onClick={() => resolveScenario(scenario.id)}
                            size="sm"
                            variant="outline"
                            className="w-full"
                          >
                            Mark as Resolved
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span>Emergency Contacts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emergencyContacts.map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Users className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="font-medium text-sm">{contact.name}</div>
                          <div className="text-xs text-gray-600">{contact.role}</div>
                          <div className="text-xs text-gray-600">{contact.phone}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          contact.status === 'available' ? 'text-green-600 bg-green-100' :
                          contact.status === 'busy' ? 'text-yellow-600 bg-yellow-100' :
                          'text-gray-600 bg-gray-100'
                        }`}>
                          {contact.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Radio className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Emergency Hotline</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900">+233 30 123 4567</p>
                  <p className="text-xs text-blue-700">24/7 Crisis Response Center</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CrisisResponseCenterNew
