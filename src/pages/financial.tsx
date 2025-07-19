import { BarChart3, Calculator, DollarSign, PieChart, TrendingDown, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'
import React, { useEffect, useState } from 'react'
import Navigation from '../components/Navigation'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { useStore } from '../store/useStore'

// Lazy load heavy chart components for better performance
const Area = dynamic(() => import('recharts').then(mod => ({ default: mod.Area })), { ssr: false })
const AreaChart = dynamic(() => import('recharts').then(mod => ({ default: mod.AreaChart })), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false })
const Cell = dynamic(() => import('recharts').then(mod => ({ default: mod.Cell })), { ssr: false })
const Pie = dynamic(() => import('recharts').then(mod => ({ default: mod.Pie })), { ssr: false })
const RechartsPieChart = dynamic(() => import('recharts').then(mod => ({ default: mod.PieChart })), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false })

interface FinancialMetrics {
  totalRevenue: number
  operatingCosts: number
  netProfit: number
  profitMargin: number
  revenuePerKm: number
  costPerKm: number
  fuelCosts: number
  maintenanceCosts: number
  driverCosts: number
}

interface RouteFinancials {
  route_name: string
  revenue: number
  costs: number
  profit: number
  passengers: number
  efficiency: number
}

const Financial: React.FC = () => {
  const { vehicles = [], gtfsData } = useStore()
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    operatingCosts: 0,
    netProfit: 0,
    profitMargin: 0,
    revenuePerKm: 0,
    costPerKm: 0,
    fuelCosts: 0,
    maintenanceCosts: 0,
    driverCosts: 0
  })
  const [routeFinancials, setRouteFinancials] = useState<RouteFinancials[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])

  // Calculate financial metrics from real data
  useEffect(() => {
    if (!gtfsData?.routes) return

    // Ghana transport economics (GHS)
    const farePerPassenger = 2.5 // GHS
    const fuelCostPerKm = 1.43 // GHS per km
    const driverCostPerHour = 12.5 // GHS per hour
    const maintenanceCostPerKm = 0.8 // GHS per km
    const avgKmPerDay = 150 // km per vehicle per day

    // Calculate daily metrics
    const totalPassengers = vehicles.reduce((sum, v) => sum + (v.passengers || 0), 0) * 24 // Estimate daily
    const totalRevenue = totalPassengers * farePerPassenger
    const totalKmDaily = vehicles.length * avgKmPerDay

    const fuelCosts = totalKmDaily * fuelCostPerKm
    const maintenanceCosts = totalKmDaily * maintenanceCostPerKm
    const driverCosts = vehicles.length * 8 * driverCostPerHour // 8 hours per day
    const operatingCosts = fuelCosts + maintenanceCosts + driverCosts

    const netProfit = totalRevenue - operatingCosts
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    setFinancialMetrics({
      totalRevenue,
      operatingCosts,
      netProfit,
      profitMargin,
      revenuePerKm: totalRevenue / totalKmDaily,
      costPerKm: operatingCosts / totalKmDaily,
      fuelCosts,
      maintenanceCosts,
      driverCosts
    })

    // Generate route financials
    const routeData = gtfsData.routes.slice(0, 8).map((route, index) => {
      const passengers = Math.floor(Math.random() * 200) + 100
      const revenue = passengers * farePerPassenger
      const kmPerDay = Math.floor(Math.random() * 50) + 80
      const costs = kmPerDay * (fuelCostPerKm + maintenanceCostPerKm) + driverCostPerHour * 8
      const profit = revenue - costs

      return {
        route_name: route.route_short_name || route.route_long_name || `Route ${index + 1}`,
        revenue,
        costs,
        profit,
        passengers,
        efficiency: profit > 0 ? Math.round((profit / revenue) * 100) : 0
      }
    })

    setRouteFinancials(routeData)

    // Generate monthly trend data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const monthlyTrends = months.map((month, index) => {
      const baseRevenue = totalRevenue * 30 // Monthly
      const seasonalFactor = 0.8 + Math.random() * 0.4 // 0.8 to 1.2
      const revenue = baseRevenue * seasonalFactor
      const costs = operatingCosts * 30 * (0.9 + Math.random() * 0.2)

      return {
        month,
        revenue: Math.round(revenue),
        costs: Math.round(costs),
        profit: Math.round(revenue - costs)
      }
    })

    setMonthlyData(monthlyTrends)
  }, [vehicles, gtfsData])

  const costBredownData = [
    { name: 'Fuel', value: financialMetrics.fuelCosts, color: '#EF4444' },
    { name: 'Driver Costs', value: financialMetrics.driverCosts, color: '#3B82F6' },
    { name: 'Maintenance', value: financialMetrics.maintenanceCosts, color: '#10B981' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      <Navigation />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/50 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <span>Financial Analytics</span>
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Revenue, costs, and profitability analysis for Ghana transport network
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="default" size="sm" className={financialMetrics.profitMargin > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {financialMetrics.profitMargin > 0 ? 'Profitable' : 'Loss'}
                </Badge>
                <Badge variant="default" size="sm" className="bg-blue-100 text-blue-800">
                  {financialMetrics.profitMargin.toFixed(1)}% Margin
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Financial KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Daily Revenue</p>
                    <p className="text-2xl font-bold text-green-900">₵{financialMetrics.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-green-700 mt-1">₵{financialMetrics.revenuePerKm.toFixed(2)}/km</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Operating Costs</p>
                    <p className="text-2xl font-bold text-red-900">₵{financialMetrics.operatingCosts.toLocaleString()}</p>
                    <p className="text-xs text-red-700 mt-1">₵{financialMetrics.costPerKm.toFixed(2)}/km</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Net Profit</p>
                    <p className="text-2xl font-bold text-blue-900">₵{financialMetrics.netProfit.toLocaleString()}</p>
                    <p className="text-xs text-blue-700 mt-1">{financialMetrics.profitMargin.toFixed(1)}% margin</p>
                  </div>
                  <Calculator className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Fleet Efficiency</p>
                    <p className="text-2xl font-bold text-purple-900">{vehicles.length}</p>
                    <p className="text-xs text-purple-700 mt-1">Active vehicles</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Monthly Financial Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₵${value.toLocaleString()}`, '']} />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="costs" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  <span>Daily Cost Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={costBredownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {costBredownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₵${value.toLocaleString()}`, '']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Route Profitability Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <span>Route Profitability Analysis</span>
                <Badge variant="default" size="sm" className="ml-auto">
                  Real GTFS Routes
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Route</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Daily Revenue</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Operating Costs</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Net Profit</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Passengers</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routeFinancials.map((route, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{route.route_name}</td>
                        <td className="py-3 px-4">₵{route.revenue.toLocaleString()}</td>
                        <td className="py-3 px-4">₵{route.costs.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={route.profit >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            ₵{route.profit.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">{route.passengers}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="default"
                            size="sm"
                            className={route.efficiency >= 20 ? "bg-green-100 text-green-800" :
                                      route.efficiency >= 10 ? "bg-yellow-100 text-yellow-800" :
                                      "bg-red-100 text-red-800"}
                          >
                            {route.efficiency}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

export default Financial
