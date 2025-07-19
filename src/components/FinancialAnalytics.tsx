'use client'

import { calculatePercentageChange, formatCurrency, formatPercentage } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { BarChart3, Calculator, CreditCard, DollarSign, PieChart, Target, TrendingDown, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'
import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

// Lazy load recharts components for better performance
const Bar = dynamic(() => import('recharts').then(mod => ({ default: mod.Bar })), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false })
const Cell = dynamic(() => import('recharts').then(mod => ({ default: mod.Cell })), { ssr: false })
const ComposedChart = dynamic(() => import('recharts').then(mod => ({ default: mod.ComposedChart })), { ssr: false })
const Legend = dynamic(() => import('recharts').then(mod => ({ default: mod.Legend })), { ssr: false })
const Line = dynamic(() => import('recharts').then(mod => ({ default: mod.Line })), { ssr: false })
const RechartsPieChart = dynamic(() => import('recharts').then(mod => ({ default: mod.PieChart })), { ssr: false })
const Pie = dynamic(() => import('recharts').then(mod => ({ default: mod.Pie })), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false })

interface FinancialAnalyticsProps {
  className?: string
}

const FinancialAnalytics: React.FC<FinancialAnalyticsProps> = ({ className = '' }) => {
  const { vehicles, routes, connected } = useStore()

  // Generate financial data based on fleet operations
  const financialData = useMemo(() => {
    const activeVehicles = vehicles.length
    const avgOccupancy = vehicles.reduce((sum, v) => sum + (v.occupancy || 0), 0) / Math.max(activeVehicles, 1)
    
    // Daily revenue calculation
    const baseRevenuePerVehicle = 180 // GHS per vehicle per day
    const occupancyMultiplier = avgOccupancy / 100
    const dailyRevenue = activeVehicles * baseRevenuePerVehicle * (0.7 + occupancyMultiplier * 0.6)
    
    // Operating costs
    const fuelCostPerVehicle = 45 // GHS per vehicle per day
    const maintenanceCostPerVehicle = 15 // GHS per vehicle per day
    const driverWagesPerVehicle = 35 // GHS per vehicle per day
    const insuranceAndLicensing = 8 // GHS per vehicle per day
    const adminCosts = 12 // GHS per vehicle per day
    
    const totalDailyCosts = activeVehicles * (
      fuelCostPerVehicle + 
      maintenanceCostPerVehicle + 
      driverWagesPerVehicle + 
      insuranceAndLicensing + 
      adminCosts
    )
    
    const dailyProfit = dailyRevenue - totalDailyCosts
    const profitMargin = (dailyProfit / dailyRevenue) * 100
    
    return {
      dailyRevenue: Math.round(dailyRevenue),
      totalDailyCosts: Math.round(totalDailyCosts),
      dailyProfit: Math.round(dailyProfit),
      profitMargin: Math.round(profitMargin * 10) / 10,
      monthlyProjection: Math.round(dailyRevenue * 30),
      yearlyProjection: Math.round(dailyRevenue * 365),
      costBreakdown: {
        fuel: Math.round(activeVehicles * fuelCostPerVehicle),
        maintenance: Math.round(activeVehicles * maintenanceCostPerVehicle),
        wages: Math.round(activeVehicles * driverWagesPerVehicle),
        insurance: Math.round(activeVehicles * insuranceAndLicensing),
        admin: Math.round(activeVehicles * adminCosts)
      }
    }
  }, [vehicles])

  // Generate monthly revenue trend
  const monthlyTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    
    return months.map((month, index) => {
      const isCurrentOrFuture = index >= currentMonth
      const baseRevenue = 45000 + Math.random() * 15000
      const seasonalFactor = index >= 5 && index <= 8 ? 1.2 : 0.9 // Higher in rainy season
      const revenue = Math.round(baseRevenue * seasonalFactor)
      const costs = Math.round(revenue * 0.75)
      const profit = revenue - costs
      
      return {
        month,
        revenue: isCurrentOrFuture ? Math.round(revenue * 0.8) : revenue,
        costs: isCurrentOrFuture ? Math.round(costs * 0.8) : costs,
        profit: isCurrentOrFuture ? Math.round(profit * 0.8) : profit,
        projected: isCurrentOrFuture
      }
    })
  }, [])

  // Route profitability analysis
  const routeProfitability = useMemo(() => {
    return routes.slice(0, 8).map(route => {
      const routeVehicles = vehicles.filter(v => v.route === route.name)
      const avgOccupancy = routeVehicles.length > 0 
        ? routeVehicles.reduce((sum, v) => sum + (v.occupancy || 0), 0) / routeVehicles.length 
        : 0
      
      const baseRevenue = 2500 + Math.random() * 1500
      const occupancyBonus = (avgOccupancy / 100) * 800
      const revenue = Math.round(baseRevenue + occupancyBonus)
      const costs = Math.round(revenue * (0.65 + Math.random() * 0.15))
      const profit = revenue - costs
      const margin = (profit / revenue) * 100
      
      return {
        route: route.name.replace(' Route', ''),
        revenue,
        costs,
        profit,
        margin: Math.round(margin * 10) / 10,
        vehicles: routeVehicles.length,
        occupancy: Math.round(avgOccupancy)
      }
    })
  }, [routes, vehicles])

  // Cost breakdown for pie chart
  const costBreakdownData = useMemo(() => {
    const { costBreakdown } = financialData
    return [
      { name: 'Fuel', value: costBreakdown.fuel, color: '#EF4444' },
      { name: 'Driver Wages', value: costBreakdown.wages, color: '#3B82F6' },
      { name: 'Maintenance', value: costBreakdown.maintenance, color: '#F59E0B' },
      { name: 'Insurance', value: costBreakdown.insurance, color: '#10B981' },
      { name: 'Administration', value: costBreakdown.admin, color: '#8B5CF6' }
    ]
  }, [financialData])

  // Revenue sources
  const revenueSourcesData = useMemo(() => {
    return [
      { name: 'Passenger Fares', value: 75, amount: Math.round(financialData.dailyRevenue * 0.75), color: '#3B82F6' },
      { name: 'Cargo Services', value: 15, amount: Math.round(financialData.dailyRevenue * 0.15), color: '#10B981' },
      { name: 'Advertising', value: 7, amount: Math.round(financialData.dailyRevenue * 0.07), color: '#F59E0B' },
      { name: 'Other Services', value: 3, amount: Math.round(financialData.dailyRevenue * 0.03), color: '#8B5CF6' }
    ]
  }, [financialData])

  // Key financial metrics
  const keyMetrics = useMemo(() => {
    const yesterdayRevenue = financialData.dailyRevenue * 0.95
    const revenueChange = calculatePercentageChange(yesterdayRevenue, financialData.dailyRevenue)

    const lastMonthProfit = financialData.dailyProfit * 28
    const thisMonthProfit = financialData.dailyProfit * 30
    const profitChange = calculatePercentageChange(lastMonthProfit, thisMonthProfit)

    return {
      revenueChange: isNaN(revenueChange) ? 0 : revenueChange,
      profitChange: isNaN(profitChange) ? 0 : profitChange,
      costEfficiency: 100 - (financialData.totalDailyCosts / Math.max(financialData.dailyRevenue, 1) * 100),
      revenuePerVehicle: Math.round(financialData.dailyRevenue / Math.max(vehicles.length, 1)),
      profitPerVehicle: Math.round(financialData.dailyProfit / Math.max(vehicles.length, 1))
    }
  }, [financialData, vehicles.length])

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span>Financial Analytics Dashboard</span>
            <div className={`w-2 h-2 rounded-full ml-auto ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatCurrency(financialData.dailyRevenue)}
              </div>
              <div className="text-sm text-green-800">Daily Revenue</div>
              <div className="flex items-center justify-center mt-1">
                {keyMetrics.revenueChange > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span className={`text-xs ${keyMetrics.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(Math.abs(keyMetrics.revenueChange))}
                </span>
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {formatCurrency(financialData.dailyProfit)}
              </div>
              <div className="text-sm text-blue-800">Daily Profit</div>
              <div className="flex items-center justify-center mt-1">
                {keyMetrics.profitChange > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span className={`text-xs ${keyMetrics.profitChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(Math.abs(keyMetrics.profitChange))}
                </span>
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {formatPercentage(financialData.profitMargin)}
              </div>
              <div className="text-sm text-purple-800">Profit Margin</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {formatCurrency(keyMetrics.revenuePerVehicle)}
              </div>
              <div className="text-sm text-orange-800">Revenue/Vehicle</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600 mb-1">
                {formatCurrency(financialData.monthlyProjection)}
              </div>
              <div className="text-sm text-indigo-800">Monthly Projection</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Monthly Revenue & Profit Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [formatCurrency(value as number), name]} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                    <Bar dataKey="costs" fill="#EF4444" name="Costs" />
                    <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} name="Profit" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-red-600" />
                  <span>Daily Cost Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {costBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Route Profitability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>Route Profitability Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={routeProfitability}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="route" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'margin' ? formatPercentage(value as number) : formatCurrency(value as number), 
                      name
                    ]} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                    <Bar dataKey="profit" fill="#10B981" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span>Revenue Sources</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={revenueSourcesData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {revenueSourcesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [
                      formatCurrency(props.payload.amount), 
                      `${name} (${formatPercentage(value as number)})`
                    ]} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-green-600" />
                  <span>Cost Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costBreakdownData.map((cost, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cost.color }}
                        />
                        <span className="text-sm text-gray-700">{cost.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(cost.value)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total Daily Costs</span>
                      <span>{formatCurrency(financialData.totalDailyCosts)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Revenue Streams</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueSourcesData.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="text-sm text-gray-700">{source.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(source.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total Daily Revenue</span>
                      <span>{formatCurrency(financialData.dailyRevenue)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span>Financial Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Monthly Target</span>
                      <span>{formatPercentage(75)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Profit Margin Goal</span>
                      <span>{formatPercentage(85)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cost Efficiency</span>
                      <span>{formatPercentage(92)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600">
                      <p>📈 Revenue up {formatPercentage(Math.abs(keyMetrics.revenueChange))} from yesterday</p>
                      <p>💰 Profit margin: {formatPercentage(financialData.profitMargin)}</p>
                      <p>🎯 On track for monthly goals</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FinancialAnalytics
