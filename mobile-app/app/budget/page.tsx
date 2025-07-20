'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  TruckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  MinusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { EnhancedHeader } from '@/components/navigation/EnhancedHeader'
import { EnhancedFooter } from '@/components/navigation/EnhancedFooter'
import { apiService, Location } from '@/services/apiService'

interface BudgetData {
  monthly_budget: number
  current_spending: number
  remaining_budget: number
  daily_average: number
  projected_monthly: number
  savings_vs_last_month: number
  top_routes: RouteSpending[]
  spending_by_category: CategorySpending[]
  recent_trips: TripRecord[]
  budget_alerts: BudgetAlert[]
}

interface RouteSpending {
  route: string
  amount: number
  trips: number
  average_cost: number
  trend: 'up' | 'down' | 'stable'
}

interface CategorySpending {
  category: string
  amount: number
  percentage: number
  color: string
}

interface TripRecord {
  id: string
  date: string
  route: string
  cost: number
  mode: string
  duration: number
  distance: number
}

interface BudgetAlert {
  id: string
  type: 'warning' | 'danger' | 'info'
  title: string
  message: string
  action?: string
}

export default function BudgetPage() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [showAddTrip, setShowAddTrip] = useState(false)
  const [newBudget, setNewBudget] = useState<number>(0)
  const [showBudgetModal, setShowBudgetModal] = useState(false)

  useEffect(() => {
    fetchBudgetData()
  }, [selectedPeriod])

  const fetchBudgetData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch real budget data from ML analytics
      const analyticsResponse = await apiService.getPredictiveAnalytics({
        location: { latitude: 5.6037, longitude: -0.1870 }, // Accra center
        time_range: selectedPeriod,
        metrics: ['spending', 'routes', 'predictions', 'savings']
      })

      if (analyticsResponse.success && analyticsResponse.data) {
        const data = analyticsResponse.data
        
        // Transform API data to budget format
        const budgetInfo: BudgetData = {
          monthly_budget: data.budget?.monthly_limit || 150,
          current_spending: data.spending?.current_month || 89.50,
          remaining_budget: (data.budget?.monthly_limit || 150) - (data.spending?.current_month || 89.50),
          daily_average: (data.spending?.current_month || 89.50) / new Date().getDate(),
          projected_monthly: (data.spending?.current_month || 89.50) * (30 / new Date().getDate()),
          savings_vs_last_month: data.spending?.savings_vs_last_month || 12.30,
          top_routes: data.routes?.top_spending || [
            { route: 'Circle - Legon', amount: 25.40, trips: 12, average_cost: 2.12, trend: 'up' },
            { route: 'Tema - Accra', amount: 18.60, trips: 8, average_cost: 2.33, trend: 'down' },
            { route: 'Kaneshie - Madina', amount: 15.20, trips: 6, average_cost: 2.53, trend: 'stable' }
          ],
          spending_by_category: data.categories || [
            { category: 'Public Transport', amount: 65.20, percentage: 73, color: '#3B82F6' },
            { category: 'Ride Share', amount: 18.30, percentage: 20, color: '#8B5CF6' },
            { category: 'Taxi', amount: 6.00, percentage: 7, color: '#10B981' }
          ],
          recent_trips: data.recent_trips || [],
          budget_alerts: data.alerts || []
        }

        setBudgetData(budgetInfo)
      }
    } catch (error) {
      console.error('Failed to fetch budget data:', error)
      
      // Fallback to mock data
      setBudgetData({
        monthly_budget: 150,
        current_spending: 89.50,
        remaining_budget: 60.50,
        daily_average: 4.25,
        projected_monthly: 127.50,
        savings_vs_last_month: 12.30,
        top_routes: [
          { route: 'Circle - Legon', amount: 25.40, trips: 12, average_cost: 2.12, trend: 'up' },
          { route: 'Tema - Accra', amount: 18.60, trips: 8, average_cost: 2.33, trend: 'down' },
          { route: 'Kaneshie - Madina', amount: 15.20, trips: 6, average_cost: 2.53, trend: 'stable' }
        ],
        spending_by_category: [
          { category: 'Public Transport', amount: 65.20, percentage: 73, color: '#3B82F6' },
          { category: 'Ride Share', amount: 18.30, percentage: 20, color: '#8B5CF6' },
          { category: 'Taxi', amount: 6.00, percentage: 7, color: '#10B981' }
        ],
        recent_trips: [
          {
            id: '1',
            date: new Date().toISOString(),
            route: 'Circle - Legon',
            cost: 2.50,
            mode: 'Bus',
            duration: 25,
            distance: 8.5
          }
        ],
        budget_alerts: [
          {
            id: '1',
            type: 'warning',
            title: 'Budget Alert',
            message: 'You\'re 60% through your monthly budget with 10 days remaining.',
            action: 'Review spending'
          }
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateBudget = async (newAmount: number) => {
    try {
      // In a real app, this would call an API to update the budget
      setBudgetData(prev => prev ? {
        ...prev,
        monthly_budget: newAmount,
        remaining_budget: newAmount - prev.current_spending
      } : null)
      setShowBudgetModal(false)
    } catch (error) {
      console.error('Failed to update budget:', error)
    }
  }

  const getBudgetStatus = () => {
    if (!budgetData) return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-50' }
    
    const percentage = (budgetData.current_spending / budgetData.monthly_budget) * 100
    
    if (percentage >= 90) {
      return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-50' }
    } else if (percentage >= 75) {
      return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    } else {
      return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-50' }
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-red-500" />
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-green-500" />
      default:
        return <MinusIcon className="w-4 h-4 text-gray-500" />
    }
  }

  const formatCurrency = (amount: number) => `₵${amount.toFixed(2)}`

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EnhancedHeader />
        <main className="p-6">
          <div className="flex items-center justify-center h-64">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-aura-primary" />
          </div>
        </main>
        <EnhancedFooter />
      </div>
    )
  }

  const budgetStatus = getBudgetStatus()

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedHeader />
      
      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget Tracker</h1>
            <p className="text-gray-600">Manage your transport spending</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            
            <button
              onClick={() => setShowBudgetModal(true)}
              className="bg-aura-primary text-white px-4 py-2 rounded-xl hover:bg-aura-primary/90 transition-colors"
            >
              Set Budget
            </button>
          </div>
        </div>

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Current Spending */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border ${budgetStatus.bgColor} ${budgetStatus.color}`}
          >
            <div className="flex items-center justify-between mb-4">
              <CurrencyDollarIcon className="w-8 h-8" />
              <span className="text-sm font-medium">{budgetStatus.status.toUpperCase()}</span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(budgetData?.current_spending || 0)}
            </div>
            <div className="text-sm opacity-80">Current Spending</div>
          </motion.div>

          {/* Remaining Budget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white rounded-2xl border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <BanknotesIcon className="w-8 h-8 text-blue-600" />
              <span className="text-sm font-medium text-gray-500">REMAINING</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(budgetData?.remaining_budget || 0)}
            </div>
            <div className="text-sm text-gray-600">Left this month</div>
          </motion.div>

          {/* Daily Average */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white rounded-2xl border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <CalendarIcon className="w-8 h-8 text-purple-600" />
              <span className="text-sm font-medium text-gray-500">DAILY AVG</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(budgetData?.daily_average || 0)}
            </div>
            <div className="text-sm text-gray-600">Per day</div>
          </motion.div>

          {/* Savings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-green-50 rounded-2xl border border-green-200"
          >
            <div className="flex items-center justify-between mb-4">
              <ArrowTrendingDownIcon className="w-8 h-8 text-green-600" />
              <span className="text-sm font-medium text-green-600">SAVED</span>
            </div>
            <div className="text-2xl font-bold text-green-900 mb-1">
              {formatCurrency(budgetData?.savings_vs_last_month || 0)}
            </div>
            <div className="text-sm text-green-600">vs last month</div>
          </motion.div>
        </div>

        {/* Budget Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Budget Progress</h2>
            <span className="text-sm text-gray-500">
              {budgetData ? Math.round((budgetData.current_spending / budgetData.monthly_budget) * 100) : 0}% used
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                budgetStatus.status === 'critical' ? 'bg-red-500' :
                budgetStatus.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{
                width: `${budgetData ? Math.min((budgetData.current_spending / budgetData.monthly_budget) * 100, 100) : 0}%`
              }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatCurrency(budgetData?.current_spending || 0)} spent</span>
            <span>{formatCurrency(budgetData?.monthly_budget || 0)} budget</span>
          </div>
        </motion.div>

        {/* Top Routes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Routes</h2>
          <div className="space-y-4">
            {budgetData?.top_routes.map((route, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <TruckIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">{route.route}</div>
                    <div className="text-sm text-gray-500">{route.trips} trips</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(route.amount)}
                    </span>
                    {getTrendIcon(route.trend)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(route.average_cost)} avg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Spending Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h2>
          <div className="space-y-4">
            {budgetData?.spending_by_category.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-gray-900">{category.category}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(category.amount)}
                  </div>
                  <div className="text-sm text-gray-500">{category.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Budget Alerts */}
        {budgetData?.budget_alerts && budgetData.budget_alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h2>
            <div className="space-y-3">
              {budgetData.budget_alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border ${
                    alert.type === 'danger' ? 'bg-red-50 border-red-200' :
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {alert.type === 'danger' ? (
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                    ) : alert.type === 'warning' ? (
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                    ) : (
                      <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{alert.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{alert.message}</div>
                      {alert.action && (
                        <button className="text-sm text-aura-primary hover:text-aura-primary/80 mt-2">
                          {alert.action}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Budget Modal */}
      <AnimatePresence>
        {showBudgetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowBudgetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Monthly Budget</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Amount (₵)
                </label>
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(Number(e.target.value))}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateBudget(newBudget)}
                  className="flex-1 px-4 py-3 bg-aura-primary text-white rounded-xl hover:bg-aura-primary/90 transition-colors"
                >
                  Save Budget
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EnhancedFooter />
    </div>
  )
}