'use client'

import React, { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { apiService } from '../services/apiService'

interface GTFSDataLoaderProps {
  children: React.ReactNode
}

const GTFSDataLoader: React.FC<GTFSDataLoaderProps> = ({ children }) => {
  const { setGTFSData, setGTFSError, gtfsLoaded, gtfsError } = useStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadGTFSData = async () => {
      if (gtfsLoaded) return // Already loaded

      setLoading(true)
      console.log('🚌 Loading Ghana GTFS data...')

      try {
        // Load all GTFS data from our backend
        const [routesResponse, stopsResponse, stopTimesResponse, tripsResponse] = await Promise.all([
          apiService.getRoutes(),
          apiService.getStops(),
          apiService.getStopTimes(),
          apiService.getTrips()
        ])

        // Transform the data to match our GTFS interfaces
        const gtfsData = {
          routes: routesResponse.routes || [],
          stops: stopsResponse.stops || [],
          stop_times: stopTimesResponse.stop_times || [],
          shapes: [], // Will be populated from routes if available
          trips: tripsResponse.trips || []
        }

        // Extract shapes from routes if available
        const shapes: any[] = []
        if (routesResponse.shapes) {
          shapes.push(...routesResponse.shapes)
        }
        gtfsData.shapes = shapes

        console.log('✅ Ghana GTFS data loaded successfully:', {
          routes: gtfsData.routes.length,
          stops: gtfsData.stops.length,
          stop_times: gtfsData.stop_times.length,
          trips: gtfsData.trips.length,
          shapes: gtfsData.shapes.length
        })

        setGTFSData(gtfsData)
      } catch (error) {
        console.error('❌ Failed to load GTFS data:', error)
        setGTFSError(error instanceof Error ? error.message : 'Failed to load GTFS data')
      } finally {
        setLoading(false)
      }
    }

    loadGTFSData()
  }, [gtfsLoaded, setGTFSData, setGTFSError])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Ghana Transport Data</h2>
          <p className="text-gray-600">Fetching routes, stops, and schedules...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (gtfsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Transport Data</h2>
          <p className="text-gray-600 mb-4">{gtfsError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Render children when data is loaded successfully
  return <>{children}</>
}

export default GTFSDataLoader
