'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X,
  Bell,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'
import { useStore } from '@/store/useStore'
import { cn, formatGhanaTime } from '@/lib/utils'

interface AlertsPanelProps {
  className?: string
  maxAlerts?: number
}

const alertIcons = {
  info: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  error: <AlertTriangle className="h-4 w-4" />,
  success: <CheckCircle className="h-4 w-4" />,
}

const alertColors = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-600',
  },
  warning: {
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    text: 'text-warning-800',
    icon: 'text-warning-600',
  },
  error: {
    bg: 'bg-error-50',
    border: 'border-error-200',
    text: 'text-error-800',
    icon: 'text-error-600',
  },
  success: {
    bg: 'bg-success-50',
    border: 'border-success-200',
    text: 'text-success-800',
    icon: 'text-success-600',
  },
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({
  className,
  maxAlerts = 5
}) => {
  const { alerts, markAlertRead, clearAlerts } = useStore()
  
  const unreadAlerts = alerts.filter(alert => !alert.read)
  const displayAlerts = alerts.slice(0, maxAlerts)

  const handleMarkRead = (alertId: string) => {
    markAlertRead(alertId)
  }

  const handleClearAll = () => {
    clearAlerts()
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary-500" />
            <span>Live Alerts</span>
            {unreadAlerts.length > 0 && (
              <Badge variant="destructive" size="sm">
                {unreadAlerts.length}
              </Badge>
            )}
          </CardTitle>
          {alerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {displayAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <CheckCircle className="h-12 w-12 text-success-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">All Clear!</p>
              <p className="text-sm text-gray-400">No active alerts</p>
            </motion.div>
          ) : (
            displayAlerts.map((alert, index) => {
              const colors = alertColors[alert.type as keyof typeof alertColors]
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                  layout
                >
                  <div
                    className={cn(
                      "relative p-4 rounded-xl border-l-4 transition-all duration-200",
                      colors.bg,
                      colors.border,
                      !alert.read && "shadow-sm",
                      alert.read && "opacity-60"
                    )}
                  >
                    {/* Alert Content */}
                    <div className="flex items-start space-x-3">
                      <div className={cn("mt-0.5", colors.icon)}>
                        {alertIcons[alert.type as keyof typeof alertIcons]}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={cn("font-semibold text-sm", colors.text)}>
                              {alert.title}
                            </h4>
                            <p className={cn("text-sm mt-1", colors.text, "opacity-90")}>
                              {alert.message}
                            </p>
                          </div>
                          
                          {!alert.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkRead(alert.id)}
                              className="ml-2 p-1 h-6 w-6"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Timestamp */}
                        <div className="flex items-center space-x-1 mt-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatGhanaTime(new Date(alert.timestamp))}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Unread Indicator */}
                    {!alert.read && (
                      <motion.div
                        className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      />
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
        
        {/* Show More Indicator */}
        {alerts.length > maxAlerts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-2"
          >
            <p className="text-sm text-gray-500">
              +{alerts.length - maxAlerts} more alerts
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

export { AlertsPanel }
