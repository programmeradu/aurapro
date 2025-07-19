import React from 'react'

interface MapLegendProps {
  isEnhancedMode?: boolean
}

const MapLegend: React.FC<MapLegendProps> = ({
  isEnhancedMode = true
}) => {

  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
        📊 Transport Network Legend
      </h3>
      
      {/* Horizontal Legend Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Express Bus */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm flex-shrink-0"></div>
          <span className="text-gray-700">🚌 Express Bus (45 km/h)</span>
        </div>

        {/* City Bus */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm flex-shrink-0"></div>
          <span className="text-gray-700">🚐 City Bus (30 km/h)</span>
        </div>

        {/* Mini Bus */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white shadow-sm flex-shrink-0"></div>
          <span className="text-gray-700">🚙 Mini Bus (25 km/h)</span>
        </div>

        {/* Bus Stops */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-white flex-shrink-0"></div>
          <span className="text-gray-700">🚏 Bus Stops (2,565)</span>
        </div>

        {/* Major Terminals */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-4 h-4 rounded-full bg-red-600 border border-white flex-shrink-0"></div>
          <span className="text-gray-700">🏢 Major Terminals</span>
        </div>

        {/* Route Shapes */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-4 h-1 bg-purple-500 rounded shadow-sm flex-shrink-0"></div>
          <span className="text-gray-700">🛤️ GTFS Route Shapes (651)</span>
        </div>

        {/* GTFS Routes */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-4 h-1 bg-green-500 rounded shadow-sm flex-shrink-0"></div>
          <span className="text-gray-700">🚌 GTFS Routes (651)</span>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-500">
          <div>💡 Click vehicles/stops for details</div>
          <div>🚌 3 unique bus types with real schedules</div>
          <div>🚏 Vehicles follow trained GTFS trips</div>
          {isEnhancedMode ? (
            <>
              <div>🌅 Dynamic lighting & 3D buildings</div>
              <div>✨ Enhanced v3 features active</div>
            </>
          ) : (
            <>
              <div>🗺️ Classic 2D view</div>
              <div>📍 Standard map features</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default MapLegend
