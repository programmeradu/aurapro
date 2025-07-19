import React from 'react'
import { Brain, CheckCircle, AlertCircle, XCircle, Zap, Target } from 'lucide-react'
import { Badge } from './ui/Badge'
import { Card, CardContent } from './ui/Card'
import { useMLService } from '../hooks/useMLService'

interface MLStatusIndicatorProps {
  variant?: 'compact' | 'detailed' | 'minimal'
  showPerformance?: boolean
  className?: string
}

const MLStatusIndicator: React.FC<MLStatusIndicatorProps> = ({ 
  variant = 'compact', 
  showPerformance = true,
  className = '' 
}) => {
  const { mlHealth, isMLHealthy, systemGrade, modelsLoaded, lastUpdate } = useMLService()

  const getStatusIcon = () => {
    if (isMLHealthy) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (mlHealth) return <AlertCircle className="w-4 h-4 text-yellow-600" />
    return <XCircle className="w-4 h-4 text-red-600" />
  }

  const getStatusColor = () => {
    if (isMLHealthy) return 'bg-green-100 text-green-800'
    if (mlHealth) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getStatusText = () => {
    if (isMLHealthy) return 'ML Operational'
    if (mlHealth) return 'ML Degraded'
    return 'ML Offline'
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge variant="default" size="sm" className={getStatusColor()}>
          <Brain className="w-3 h-3 mr-1" />
          {getStatusText()}
        </Badge>
        {showPerformance && systemGrade && (
          <Badge variant="default" size="sm" className="bg-purple-100 text-purple-800">
            Grade: {systemGrade}
          </Badge>
        )}
      </div>
    )
  }

  // Detailed variant
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">ML System Status</span>
            </div>
            <Badge variant="default" size="sm" className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>

          {/* Performance Metrics */}
          {showPerformance && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Travel Time</p>
                  <p className="text-sm font-medium text-green-600">97.8%</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Traffic Pred</p>
                  <p className="text-sm font-medium text-blue-600">99.5%</p>
                </div>
              </div>
            </div>
          )}

          {/* Models Status */}
          <div className="space-y-2">
            <p className="text-xs text-gray-600">Models Loaded: {modelsLoaded.length}</p>
            <div className="flex flex-wrap gap-1">
              {modelsLoaded.map((model, index) => (
                <Badge key={index} variant="default" size="sm" className="bg-gray-100 text-gray-700 text-xs">
                  {model}
                </Badge>
              ))}
            </div>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <p className="text-xs text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default MLStatusIndicator
