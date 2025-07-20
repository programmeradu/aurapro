'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  SunIcon,
  CloudIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { apiService, WeatherData } from '@/services/apiService'

interface WeatherWidgetProps {
  className?: string
}

export function WeatherWidget({ className = '' }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWeatherData = async () => {
    try {
      setIsRefreshing(true)
      setError(null)
      
      const response = await apiService.getAccraWeather()
      
      if (response.success && response.data) {
        setWeather(response.data)
      } else {
        throw new Error(response.error || 'Failed to fetch weather data')
      }
    } catch (err) {
      console.error('Weather fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load weather')
      
      // Fallback to default data if API fails
      setWeather({
        temperature: 28,
        condition: 'Partly Cloudy',
        humidity: 75,
        wind_speed: 12,
        visibility: 8,
        transport_impact: {
          level: 'low',
          message: 'Good conditions for travel'
        }
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchWeatherData()

    // Update weather every 10 minutes
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const refreshWeather = async () => {
    await fetchWeatherData()
  }

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase()
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return '☀️'
    } else if (lowerCondition.includes('partly') || lowerCondition.includes('partial')) {
      return '⛅'
    } else if (lowerCondition.includes('cloudy') || lowerCondition.includes('overcast')) {
      return '☁️'
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return '🌧️'
    } else if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) {
      return '⛈️'
    } else if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) {
      return '🌫️'
    }
    return '☀️'
  }

  const getTransportImpactColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'high':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-blue-600 bg-blue-50'
    }
  }

  // Loading state
  if (isRefreshing && !weather) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-3xl p-4 text-white shadow-lg overflow-hidden relative ${className}`}
      >
        <div className="flex items-center justify-center h-32">
          <ArrowPathIcon className="w-8 h-8 animate-spin opacity-70" />
        </div>
      </motion.div>
    )
  }

  // Error state
  if (error && !weather) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-br from-red-400 via-red-500 to-red-600 rounded-3xl p-4 text-white shadow-lg overflow-hidden relative ${className}`}
      >
        <div className="flex items-center justify-center h-32 text-center">
          <div>
            <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2 opacity-70" />
            <p className="text-sm opacity-90">Weather data unavailable</p>
            <button
              onClick={refreshWeather}
              className="mt-2 px-3 py-1 bg-white/20 rounded-full text-xs hover:bg-white/30 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (!weather) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-3xl p-4 text-white shadow-lg overflow-hidden relative ${className}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-20 h-20 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-white rounded-full blur-lg"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">{getWeatherIcon(weather.condition)}</div>
            <div>
              <p className="text-xs font-medium opacity-90">Weather</p>
              <p className="text-sm font-semibold">{weather.condition}</p>
            </div>
          </div>
          
          <button
            onClick={refreshWeather}
            disabled={isRefreshing}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ArrowPathIcon 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </button>
        </div>

        {/* Temperature */}
        <div className="flex items-baseline space-x-1 mb-3">
          <span className="text-3xl font-light">{Math.round(weather.temperature)}</span>
          <span className="text-lg font-light opacity-80">°C</span>
        </div>

        {/* Transport Impact */}
        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getTransportImpactColor(weather.transport_impact.level)} mb-3`}>
          <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
          {weather.transport_impact.message}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <div className="opacity-70">Humidity</div>
            <div className="font-semibold">{Math.round(weather.humidity)}%</div>
          </div>
          <div className="text-center">
            <div className="opacity-70">Wind</div>
            <div className="font-semibold">{Math.round(weather.wind_speed)} km/h</div>
          </div>
          <div className="text-center">
            <div className="opacity-70">Visibility</div>
            <div className="font-semibold">{weather.visibility} km</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Export as AppleWeatherWidget for compatibility
export const AppleWeatherWidget = WeatherWidget
export default WeatherWidget