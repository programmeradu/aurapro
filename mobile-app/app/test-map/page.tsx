'use client'

import { useState } from 'react'
import { JourneyMap } from '@/components/journey/JourneyMap'

export default function TestMapPage() {
  const [origin] = useState({
    lat: 5.5502,
    lng: -0.2174,
    name: 'Accra Central'
  })

  const [destination] = useState({
    lat: 5.5731,
    lng: -0.2469,
    name: 'Kaneshie Terminal'
  })

  const [routes] = useState([
    {
      id: 'route-1',
      coordinates: [
        [-0.2174, 5.5502], // Accra Central
        [-0.2300, 5.5600], // Intermediate point
        [-0.2469, 5.5731]  // Kaneshie
      ] as Array<[number, number]>,
      mode: 'trotro' as const,
      duration: 25,
      distance: 12.5,
      color: '#3B82F6'
    },
    {
      id: 'route-2',
      coordinates: [
        [-0.2174, 5.5502], // Accra Central
        [-0.2000, 5.5650], // Different intermediate
        [-0.2469, 5.5731]  // Kaneshie
      ] as Array<[number, number]>,
      mode: 'walking' as const,
      duration: 45,
      distance: 3.2,
      color: '#10B981'
    }
  ])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🗺️ Mapbox Integration Test
          </h1>
          <p className="text-gray-600">
            Testing the new real Mapbox implementation with Ghana transport data
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Map Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Origin:</strong> {origin.name} ({origin.lat}, {origin.lng})
            </div>
            <div>
              <strong>Destination:</strong> {destination.name} ({destination.lat}, {destination.lng})
            </div>
            <div>
              <strong>Routes:</strong> {routes.length} routes configured
            </div>
            <div>
              <strong>Features:</strong> Navigation, Voice Guidance, GPS Tracking
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Interactive Journey Map</h2>
            <p className="text-sm text-gray-600 mt-1">
              Real Mapbox integration with Ghana transport stops and routes
            </p>
          </div>
          
          <JourneyMap
            origin={origin}
            destination={destination}
            routes={routes}
            showNavigation={true}
            enableVoiceGuidance={true}
            showRealTimeTracking={true}
            onLocationSelect={(location) => {
              console.log('Location selected:', location)
              alert(`Selected: ${location.name} (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`)
            }}
            className="h-96"
          />
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">🎯 Expected Features</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ Interactive Mapbox map centered on Accra, Ghana</li>
            <li>✅ Real GPS location tracking with user position</li>
            <li>✅ Route visualization with different colors for transport modes</li>
            <li>✅ Navigation controls with start/stop functionality</li>
            <li>✅ Voice guidance toggle for walking directions</li>
            <li>✅ Markers for origin (Accra Central) and destination (Kaneshie)</li>
            <li>✅ Pan, zoom, and navigation controls</li>
            <li>✅ Click to select locations on the map</li>
          </ul>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Setup Required</h3>
          <p className="text-sm text-yellow-700">
            To see the real Mapbox map, you need to:
          </p>
          <ol className="text-sm text-yellow-700 mt-2 space-y-1 list-decimal list-inside">
            <li>Get a free Mapbox access token from <a href="https://mapbox.com" className="underline">mapbox.com</a></li>
            <li>Add it to your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file as <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code></li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
