'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  SunIcon,
  CloudIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface WeatherData {
  temperature: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'partly-cloudy'
  humidity: number
  windSpeed: number
  visibility: number
  uvIndex: number
  location: string
  lastUpdated: Date
}

const mockWeatherData: WeatherData = {
  temperature: 28,
  condition: 'partly-cloudy',
  humidity: 75,
  windSpeed: 12,
  visibility: 8,
  uvIndex: 6,
  location: 'Accra, Ghana',
  lastUpdated: new Date()
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData>(mockWeatherData)
  const [loading, setLoading] = useState(false)

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <SunIcon className="h-8 w-8 text-yellow-500" />
      case 'cloudy':
      case 'partly-cloudy':
        return <CloudIcon className="h-8 w-8 text-gray-500" />
      case 'rainy':
        return <div className="text-2xl">🌧️</div>
      case 'stormy':
        return <div className="text-2xl">⛈️</div>
      default:
        return <SunIcon className="h-8 w-8 text-yellow-500" />
    }
  }

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'sunny': return 'Sunny'
      case 'cloudy': return 'Cloudy'
      case 'partly-cloudy': return 'Partly Cloudy'
      case 'rainy': return 'Rainy'
      case 'stormy': return 'Stormy'
      default: return 'Clear'
    }
  }

  const getUVLevel = (uvIndex: number) => {
    if (uvIndex <= 2) return { level: 'Low', color: 'text-green-600' }
    if (uvIndex <= 5) return { level: 'Moderate', color: 'text-yellow-600' }
    if (uvIndex <= 7) return { level: 'High', color: 'text-orange-600' }
    if (uvIndex <= 10) return { level: 'Very High', color: 'text-red-600' }
    return { level: 'Extreme', color: 'text-purple-600' }
  }

  const refreshWeather = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      // In real app, fetch fresh weather data here
      setWeather({
        ...weather,
        temperature: Math.round(25 + Math.random() * 10),
        lastUpdated: new Date()
      })
      setLoading(false)
    }, 1000)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const uvLevel = getUVLevel(weather.uvIndex)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-mobile shadow-mobile p-4 mb-4 text-white"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Weather</h2>
        <button
          onClick={refreshWeather}
          disabled={loading}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getWeatherIcon(weather.condition)}
          <div>
            <div className="text-3xl font-bold">{weather.temperature}°C</div>
            <div className="text-blue-100 text-sm">{getConditionText(weather.condition)}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-blue-100 text-sm">{weather.location}</div>
          <div className="text-blue-200 text-xs">
            Updated {formatTime(weather.lastUpdated)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="text-lg">💧</div>
            <span className="text-sm text-blue-100">Humidity</span>
          </div>
          <div className="text-xl font-semibold">{weather.humidity}%</div>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="text-lg">💨</div>
            <span className="text-sm text-blue-100">Wind</span>
          </div>
          <div className="text-xl font-semibold">{weather.windSpeed} km/h</div>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <EyeIcon className="h-4 w-4 text-blue-100" />
            <span className="text-sm text-blue-100">Visibility</span>
          </div>
          <div className="text-xl font-semibold">{weather.visibility} km</div>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="text-lg">☀️</div>
            <span className="text-sm text-blue-100">UV Index</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-semibold">{weather.uvIndex}</span>
            <span className={`text-xs px-2 py-1 rounded-full bg-white/20 ${uvLevel.color.replace('text-', 'text-white/')}`}>
              {uvLevel.level}
            </span>
          </div>
        </div>
      </div>

      {/* Weather Impact on Transport */}
      <div className="mt-4 p-3 bg-white/10 rounded-lg">
        <h3 className="text-sm font-medium text-blue-100 mb-2">Transport Impact</h3>
        <div className="text-sm text-white">
          {weather.condition === 'rainy' && (
            <div className="flex items-center space-x-2">
              <span>🚌</span>
              <span>Expect delays due to rain. Allow extra travel time.</span>
            </div>
          )}
          {weather.condition === 'sunny' && weather.temperature > 30 && (
            <div className="flex items-center space-x-2">
              <span>🌡️</span>
              <span>Hot weather. Stay hydrated during travel.</span>
            </div>
          )}
          {weather.condition === 'stormy' && (
            <div className="flex items-center space-x-2">
              <span>⚠️</span>
              <span>Severe weather. Consider postponing non-essential travel.</span>
            </div>
          )}
          {weather.condition === 'partly-cloudy' && (
            <div className="flex items-center space-x-2">
              <span>✅</span>
              <span>Good conditions for travel.</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
