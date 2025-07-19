'use client'

import { formatGhanaTime, formatPercentage } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { AlertTriangle, Award, CheckCircle, Clock, MapPin, Phone, Star, Users } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

interface Driver {
  id: string
  name: string
  phone: string
  licenseNumber: string
  vehicleId: string
  route: string
  rating: number
  totalTrips: number
  hoursWorked: number
  earnings: number
  status: 'active' | 'break' | 'offline' | 'emergency'
  lastSeen: Date
  experience: number // years
  violations: number
  onTimePerformance: number
  customerRating: number
  fuelEfficiency: number
  profileImage?: string
}

interface DriverManagementProps {
  className?: string
}

const DriverManagement: React.FC<DriverManagementProps> = ({ className = '' }) => {
  const { vehicles, routes, connected } = useStore()
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'break' | 'offline'>('all')

  // Generate realistic driver data
  const drivers = useMemo<Driver[]>(() => {
    const ghanaNames = [
      'Kwame Asante', 'Akosua Mensah', 'Kofi Boateng', 'Ama Osei', 'Yaw Adjei',
      'Efua Darko', 'Kwaku Owusu', 'Adwoa Frimpong', 'Kojo Antwi', 'Abena Gyasi',
      'Fiifi Tetteh', 'Akua Bonsu', 'Kwesi Appiah', 'Maame Serwaa', 'Nana Okyere',
      'Esi Amoah', 'Kwabena Ofori', 'Akosua Badu', 'Yaw Mensah', 'Adwoa Asante'
    ]

    return vehicles.map((vehicle, index) => {
      const baseRating = 3.5 + Math.random() * 1.5
      const experience = 1 + Math.random() * 15
      const violations = Math.floor(Math.random() * 5)
      
      return {
        id: `driver-${index + 1}`,
        name: ghanaNames[index] || `Driver ${index + 1}`,
        phone: `+233${Math.floor(200000000 + Math.random() * 100000000)}`,
        licenseNumber: `GH-${Math.floor(100000 + Math.random() * 900000)}`,
        vehicleId: vehicle.id,
        route: vehicle.route || routes[index % routes.length]?.name || 'Unassigned',
        rating: Math.round(baseRating * 10) / 10,
        totalTrips: Math.floor(50 + Math.random() * 500),
        hoursWorked: Math.floor(6 + Math.random() * 10),
        earnings: Math.floor(150 + Math.random() * 300),
        status: (vehicle.speed || 0) > 5 ? 'active' : 
                Math.random() > 0.7 ? 'break' : 
                Math.random() > 0.5 ? 'offline' : 'active',
        lastSeen: new Date(Date.now() - Math.random() * 3600000),
        experience: Math.round(experience),
        violations,
        onTimePerformance: Math.round(75 + Math.random() * 25),
        customerRating: Math.round((baseRating + Math.random() * 0.5) * 10) / 10,
        fuelEfficiency: Math.round((12 + Math.random() * 4) * 10) / 10
      }
    })
  }, [vehicles, routes])

  const filteredDrivers = drivers.filter(driver => 
    filterStatus === 'all' || driver.status === filterStatus
  )

  const driverStats = useMemo(() => {
    const active = drivers.filter(d => d.status === 'active').length
    const onBreak = drivers.filter(d => d.status === 'break').length
    const offline = drivers.filter(d => d.status === 'offline').length
    const avgRating = drivers.length > 0 ? drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length : 0
    const totalEarnings = drivers.reduce((sum, d) => sum + d.earnings, 0)
    const avgOnTime = drivers.length > 0 ? drivers.reduce((sum, d) => sum + d.onTimePerformance, 0) / drivers.length : 0

    return {
      active,
      onBreak,
      offline,
      avgRating: Math.round((avgRating || 0) * 10) / 10,
      totalEarnings,
      avgOnTime: Math.round(avgOnTime || 0)
    }
  }, [drivers])

  const getStatusColor = (status: Driver['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'break': return 'text-yellow-600 bg-yellow-100'
      case 'offline': return 'text-gray-600 bg-gray-100'
      case 'emergency': return 'text-red-600 bg-red-100'
    }
  }

  const getStatusIcon = (status: Driver['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'break': return <Clock className="w-4 h-4" />
      case 'offline': return <Users className="w-4 h-4" />
      case 'emergency': return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  const selectedDriverData = selectedDriver ? drivers.find(d => d.id === selectedDriver) : null

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Driver Management System</span>
            <div className={`w-2 h-2 rounded-full ml-auto ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Driver Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">{driverStats.active}</div>
              <div className="text-sm text-green-800">Active</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{driverStats.onBreak}</div>
              <div className="text-sm text-yellow-800">On Break</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
              <div className="text-2xl font-bold text-gray-600 mb-1">{driverStats.offline}</div>
              <div className="text-sm text-gray-800">Offline</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">{driverStats.avgRating}</div>
              <div className="text-sm text-blue-800">Avg Rating</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">GHS {driverStats.totalEarnings}</div>
              <div className="text-sm text-purple-800">Total Earnings</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600 mb-1">{formatPercentage(driverStats.avgOnTime)}</div>
              <div className="text-sm text-indigo-800">On-Time Avg</div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All ({drivers.length})
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('active')}
            >
              Active ({driverStats.active})
            </Button>
            <Button
              variant={filterStatus === 'break' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('break')}
            >
              Break ({driverStats.onBreak})
            </Button>
            <Button
              variant={filterStatus === 'offline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('offline')}
            >
              Offline ({driverStats.offline})
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Driver List */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver List</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedDriver === driver.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedDriver(driver.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {driver.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-600">{driver.route}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          {getRatingStars(driver.rating)}
                          <span className="text-sm text-gray-600 ml-1">{driver.rating}</span>
                        </div>
                        
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(driver.status)}`}>
                          {getStatusIcon(driver.status)}
                          <span>{driver.status}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Trips:</span>
                        <span className="font-medium ml-1">{driver.totalTrips}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Hours:</span>
                        <span className="font-medium ml-1">{driver.hoursWorked}h</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Earnings:</span>
                        <span className="font-medium ml-1">GHS {driver.earnings}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Driver Details Panel */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Details</h3>
              {selectedDriverData ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2">
                        {selectedDriverData.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <h4 className="font-semibold text-gray-900">{selectedDriverData.name}</h4>
                      <p className="text-sm text-gray-600">{selectedDriverData.route}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{selectedDriverData.phone}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">License: {selectedDriverData.licenseNumber}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Vehicle: {selectedDriverData.vehicleId}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Last seen: {formatGhanaTime(selectedDriverData.lastSeen)}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h5 className="font-medium text-gray-900 mb-3">Performance Metrics</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Experience:</span>
                          <span className="text-sm font-medium">{selectedDriverData.experience} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">On-Time Performance:</span>
                          <span className="text-sm font-medium">{formatPercentage(selectedDriverData.onTimePerformance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Customer Rating:</span>
                          <span className="text-sm font-medium">{selectedDriverData.customerRating}/5.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Fuel Efficiency:</span>
                          <span className="text-sm font-medium">{selectedDriverData.fuelEfficiency} km/l</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Violations:</span>
                          <span className={`text-sm font-medium ${selectedDriverData.violations > 2 ? 'text-red-600' : 'text-green-600'}`}>
                            {selectedDriverData.violations}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h5 className="font-medium text-gray-900 mb-3">Today's Summary</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-lg font-bold text-blue-600">{selectedDriverData.totalTrips}</div>
                          <div className="text-xs text-blue-800">Total Trips</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="text-lg font-bold text-green-600">{selectedDriverData.hoursWorked}h</div>
                          <div className="text-xs text-green-800">Hours Worked</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Button className="w-full" size="sm">
                        Contact Driver
                      </Button>
                      <Button variant="outline" className="w-full" size="sm">
                        View Full Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a driver to view details</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DriverManagement
