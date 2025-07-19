import * as React from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent } from "./Card"
import { cn, formatNumber, formatPercentage } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  color?: 'primary' | 'success' | 'warning' | 'error' | 'ghana'
  loading?: boolean
  className?: string
  onClick?: () => void
}

const colorVariants = {
  primary: {
    bg: 'bg-primary-50',
    text: 'text-primary-600',
    icon: 'text-primary-500',
    trend: 'text-primary-600',
  },
  success: {
    bg: 'bg-success-50',
    text: 'text-success-600',
    icon: 'text-success-500',
    trend: 'text-success-600',
  },
  warning: {
    bg: 'bg-warning-50',
    text: 'text-warning-600',
    icon: 'text-warning-500',
    trend: 'text-warning-600',
  },
  error: {
    bg: 'bg-error-50',
    text: 'text-error-600',
    icon: 'text-error-500',
    trend: 'text-error-600',
  },
  ghana: {
    bg: 'bg-gradient-to-br from-ghana-gold/10 to-ghana-green/10',
    text: 'text-ghana-green',
    icon: 'text-ghana-gold',
    trend: 'text-ghana-green',
  },
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend,
  color = 'primary',
  loading = false,
  className,
  onClick,
}) => {
  const colors = colorVariants[color]
  
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4" />
    if (trend === 'down') return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success-600'
    if (trend === 'down') return 'text-error-600'
    return 'text-gray-500'
  }

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return formatNumber(val)
    }
    return val
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-250 hover:shadow-large",
          colors.bg,
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                {icon && (
                  <div className={cn("p-2 rounded-xl", colors.bg)}>
                    <div className={colors.icon}>{icon}</div>
                  </div>
                )}
              </div>

              {/* Value */}
              <div className="space-y-1">
                <motion.p 
                  className={cn("text-3xl font-bold", colors.text)}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  {formatValue(value)}
                </motion.p>

                {/* Change Indicator */}
                {(change !== undefined || changeLabel) && (
                  <div className="flex items-center space-x-2">
                    {change !== undefined && (
                      <div className={cn("flex items-center space-x-1", getTrendColor())}>
                        {getTrendIcon()}
                        <span className="text-sm font-medium">
                          {change > 0 ? '+' : ''}{formatPercentage(change)}
                        </span>
                      </div>
                    )}
                    {changeLabel && (
                      <span className="text-sm text-gray-500">{changeLabel}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { KPICard }
