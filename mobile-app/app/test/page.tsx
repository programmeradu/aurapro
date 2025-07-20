'use client'

import { useState, useEffect } from 'react'
import { apiService, unifiedDataService } from '@/services'

export default function TestPage() {
  const [status, setStatus] = useState('Loading...')
  const [services, setServices] = useState<any>({})

  useEffect(() => {
    const testServices = async () => {
      try {
        setStatus('Testing services...')
        
        // Test basic service imports
        const serviceTests = {
          apiService: typeof apiService,
          unifiedDataService: typeof unifiedDataService,
          apiServiceMethods: Object.keys(apiService).length,
          unifiedServiceMethods: Object.keys(unifiedDataService).length
        }
        
        setServices(serviceTests)
        setStatus('✅ All services loaded successfully!')
        
      } catch (error) {
        setStatus(`❌ Error: ${error}`)
        console.error('Service test error:', error)
      }
    }

    testServices()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          AURA Services Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Service Status</h2>
          <p className="text-lg mb-4">{status}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">API Service</h3>
              <p>Type: {services.apiService}</p>
              <p>Methods: {services.apiServiceMethods}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Unified Data Service</h3>
              <p>Type: {services.unifiedDataService}</p>
              <p>Methods: {services.unifiedServiceMethods}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-4"
            >
              Go to Home Page
            </button>
            <button 
              onClick={() => window.location.href = '/journey'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mr-4"
            >
              Journey Planner
            </button>
            <button 
              onClick={() => window.location.href = '/community'}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Community Hub
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}