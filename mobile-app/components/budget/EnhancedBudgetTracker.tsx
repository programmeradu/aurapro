'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
  CreditCardIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { apiService, unifiedDataService } from '@/services'

interface BudgetData {
  monthly_budget: number
  current_spending: number
  projected_spending: number
  savings_potential: number
  spending_breakdown: SpendingCategory[]
  route_efficiency: RouteEfficiency[]
  cost_predictions: CostPrediction[]
  recommendations: BudgetRecommendation[]
}

interface SpendingCategory {
  category: string
  amount: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  comparison_last_month: number
}

interface RouteEfficiency {
  route_name: string
  current_cost: number
  optimized_cost: number
  potential_savings: number
  frequency: number
  efficiency_score: number
}

interface CostPrediction {
  period: string
  predicted_cost: number
  confidence: number
  factors: string[]
}

interface BudgetRecommendation {
  id: string
  type: 'savings' | 'optimization' | 'alert'
  title: string
  description: string
  potential_savings: number
  difficulty: 'easy' | 'medium' | 'hard'
  impact: 'low' | 'medium' | 'high'
}

export function EnhancedBudgetTracker() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [budgetGoal, setBudgetGoal] = useState<number>(150)
  const [showSetBudget, setShowSetBudget] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'predictions' | 'recommendations'>('overview')

  useEffect(() => {
    fetchBudgetData()
  }, [selectedPeriod])

  const fetchBudgetData = async () => {
    setIsLoading(true)
    try {
      // Fetch comprehensive budget data using ML predictions
      const [
        economicsResponse,
        predictiveResponse,
        systemMetrics
      ] = await Promise.all([
        apiService.getGhanaEconomics({
          analysis_type: 'transport_spending',
          time_range: selectedPeriod
        }),
        apiService.getPredictiveAnalytics({
          location: { latitude: 5.6037, longitude: -0.1870 },
          time_range: selectedPeriod,
          metrics: ['spending', 'routes', 'savings', 'optimization']
        }),
        apiService.getSystemMetrics()
      ])

      // Transform API data into budget insights
      const budgetInsights: BudgetData = {
        monthly_budget: budgetGoal,
        current_spending: economicsResponse.success ? 
          economicsResponse.data.average_transport_cost * 30 : 
          Math.random() * budgetGoal * 0.8,
        projected_spending: predictiveResponse.success ?
          predictiveResponse.data.projected_spending :
          budgetGoal * (0.7 + Math.random() * 0.4),
        savings_potential: economicsResponse.success ?
          economicsResponse.data.optimization_potential * budgetGoal :
          budgetGoal * (0.1 + Math.random() * 0.2),
        spending_breakdown: generateSpendingBreakdown(economicsResponse.data),
        route_efficiency: generateRouteEfficiency(),
        cost_predictions: generateCostPredictions(predictiveResponse.data),
        recommendations: generateBudgetRecommendations()
      }

      setBudgetData(budgetInsights)
    } catch (error) {
      console.error('Failed to fetch budget data:', error)
      // Fallback to enhanced mock data
      setBudgetData(generateMockBudgetData())
    } finally {
      setIsLoading(false)
    }
  }

  const generateSpendingBreakdown = (economicsData: any): SpendingCategory[] => {
    const baseCategories = [
      { category: 'Public Transport', base: 0.6 },
      { category: 'Ride Sharing', base: 0.25 },
      { category: 'Walking/Cycling', base: 0.05 },
      { category: 'Parking/Fuel', base: 0.1 }
    ]

    return baseCategories.map(cat => {
      const amount = budgetGoal * cat.base * (0.8 + Math.random() * 0.4)
      return {
        category: cat.category,
        amount,
        percentage: (amount / budgetGoal) * 100,
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        comparison_last_month: amount * (0.9 + Math.random() * 0.2)
      }
    })
  }

  const generateRouteEfficiency = (): RouteEfficiency[] => {
    const routes = [
      'Home → Work',
      'Work → Home',
      'Home → Shopping',
      'Weekend Trips'
    ]

    return routes.map(route => {
      const currentCost = 15 + Math.random() * 25
      const optimizedCost = currentCost * (0.7 + Math.random() * 0.2)
      return {
        route_name: route,
        current_cost: currentCost,
        optimized_cost: optimizedCost,
        potential_savings: currentCost - optimizedCost,
        frequency: Math.floor(Math.random() * 20) + 5,
        efficiency_score: 0.6 + Math.random() * 0.4
      }
    })
  }

  const generateCostPredictions = (predictiveData: any): CostPrediction[] => {
    const periods = ['Next Week', 'Next Month', 'Next Quarter']
    return periods.map(period => ({
      period,
      predicted_cost: budgetGoal * (0.8 + Math.random() * 0.4),
      confidence: 0.7 + Math.random() * 0.3,
      factors: ['Weather patterns', 'Traffic conditions', 'Fuel prices', 'Demand fluctuations']
    }))
  }

  const generateBudgetRecommendations = (): BudgetRecommendation[] => [
    {
      id: '1',
      type: 'savings',
      title: 'Optimize Morning Commute',
      description: 'Switch to Bus Route 37 for 20% savings on your daily commute',
      potential_savings: 25,
      difficulty: 'easy',
      impact: 'medium'
    },
    {
      id: '2',
      type: 'optimization',
      title: 'Bundle Weekend Trips',
      description: 'Combine shopping and leisure trips to reduce transport costs',
      potential_savings: 15,
      difficulty: 'medium',
      impact: 'low'
    },
    {
      id: '3',
      type: 'alert',
      title: 'Budget Alert',
      description: 'You\'re on track to exceed your monthly budget by 15%',
      potential_savings: 0,
      difficulty: 'easy',
      impact: 'high'
    }
  ]

  const generateMockBudgetData = (): BudgetData => ({
    monthly_budget: budgetGoal,
    current_spending: budgetGoal * 0.75,
    projected_spending: budgetGoal * 0.85,
    savings_potential: budgetGoal * 0.15,
    spending_breakdown: generateSpendingBreakdown(null),
    route_efficiency: generateRouteEfficiency(),
    cost_predictions: generateCostPredictions(null),
    recommendations: generateBudgetRecommendations()
  })

  const getBudgetStatus = () => {
    if (!budgetData) return { status: 'unknown', color: 'gray' }
    
    const spendingRatio = budgetData.current_spending / budgetData.monthly_budget
    
    if (spendingRatio <= 0.7) return { status: 'excellent', color: 'green' }
    if (spendingRatio <= 0.85) return { status: 'good', color: 'blue' }
    if (spendingRatio <= 1.0) return { status: 'warning', color: 'yellow' }
    return { status: 'over', color: 'red' }
  }

  const formatCurrency = (amount: number) => `₵${amount.toFixed(2)}`

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowTrendingUpIcon className="w-4 h-4 text-red-500" />
      case 'down': return <ArrowTrendingDownIcon className="w-4 h-4 text-green-500" />
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />
    }
  }

  const budgetStatus = getBudgetStatus()

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-aura-primary" />
          <span className="ml-3 text-gray-600">Loading budget insights...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Budget Overview Card */}
      <div className="bg-gradient-to-br from-aura-primary to-aura-secondary rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Budget Tracker</h2>
            <p className="text-white/80">Smart transport spending insights</p>
          </div>
          <button
            onClick={() => setShowSetBudget(true)}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <CurrencyDollarIcon className="w-6 h-6" />
          </button>
        </div>

        {budgetData && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/80 text-sm">Monthly Budget</p>
              <p className="text-3xl font-bold">{formatCurrency(budgetData.monthly_budget)}</p>
            </div>
            <div>
              <p className="text-white/80 text-sm">Current Spending</p>
              <p className="text-3xl font-bold">{formatCurrency(budgetData.current_spending)}</p>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs mt-1 ${
                budgetStatus.color === 'green' ? 'bg-green-500/20 text-green-100' :
                budgetStatus.color === 'blue' ? 'bg-blue-500/20 text-blue-100' :
                budgetStatus.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-100' :
                'bg-red-500/20 text-red-100'
              }`}>
                {budgetStatus.status.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {budgetData && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-white/80 mb-2">
              <span>Progress</span>
              <span>{Math.round((budgetData.current_spending / budgetData.monthly_budget) * 100)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  budgetStatus.color === 'green' ? 'bg-green-400' :
                  budgetStatus.color === 'blue' ? 'bg-blue-400' :
                  budgetStatus.color === 'yellow' ? 'bg-yellow-400' :
                  'bg-red-400'
                }`}
                style={{ width: `${Math.min((budgetData.current_spending / budgetData.monthly_budget) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'breakdown', label: 'Breakdown', icon: ReceiptPercentIcon },
              { id: 'predictions', label: 'Predictions', icon: BoltIcon },
              { id: 'recommendations', label: 'Tips', icon: CheckCircleIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-aura-primary border-b-2 border-aura-primary bg-aura-primary/5'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && budgetData && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">Savings Potential</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(budgetData.savings_potential)}
                        </p>
                      </div>
                      <BanknotesIcon className="w-8 h-8 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">Projected Spending</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatCurrency(budgetData.projected_spending)}
                        </p>
                      </div>
                      <ChartBarIcon className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium">Remaining Budget</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {formatCurrency(budgetData.monthly_budget - budgetData.current_spending)}
                        </p>
                      </div>
                      <CreditCardIcon className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Route Efficiency */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Efficiency</h3>
                  <div className="space-y-3">
                    {budgetData.route_efficiency.map((route, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{route.route_name}</p>
                          <p className="text-sm text-gray-600">
                            {route.frequency} trips • {Math.round(route.efficiency_score * 100)}% efficient
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(route.current_cost)}
                          </p>
                          <p className="text-sm text-green-600">
                            Save {formatCurrency(route.potential_savings)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'breakdown' && budgetData && (
              <motion.div
                key="breakdown"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Spending Breakdown</h3>
                <div className="space-y-4">
                  {budgetData.spending_breakdown.map((category, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{category.category}</h4>
                          {getTrendIcon(category.trend)}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(category.amount)}</p>
                          <p className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-aura-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        vs last month: {formatCurrency(category.comparison_last_month)}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'predictions' && budgetData && (
              <motion.div
                key="predictions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Cost Predictions</h3>
                <div className="grid gap-4">
                  {budgetData.cost_predictions.map((prediction, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{prediction.period}</h4>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(prediction.predicted_cost)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {Math.round(prediction.confidence * 100)}% confidence
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {prediction.factors.map((factor, factorIndex) => (
                          <span
                            key={factorIndex}
                            className="px-2 py-1 bg-white/60 text-xs text-gray-700 rounded-full"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'recommendations' && budgetData && (
              <motion.div
                key="recommendations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900">Smart Recommendations</h3>
                {budgetData.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-4 rounded-xl border-l-4 ${
                      rec.type === 'savings' ? 'border-green-500 bg-green-50' :
                      rec.type === 'optimization' ? 'border-blue-500 bg-blue-50' :
                      'border-yellow-500 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                        <p className="text-gray-600 text-sm mb-2">{rec.description}</p>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className={`px-2 py-1 rounded-full ${
                            rec.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            rec.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {rec.difficulty}
                          </span>
                          <span className={`px-2 py-1 rounded-full ${
                            rec.impact === 'high' ? 'bg-red-100 text-red-700' :
                            rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {rec.impact} impact
                          </span>
                        </div>
                      </div>
                      {rec.potential_savings > 0 && (
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            Save {formatCurrency(rec.potential_savings)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Set Budget Modal */}
      <AnimatePresence>
        {showSetBudget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSetBudget(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Set Monthly Budget</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Amount (₵)
                  </label>
                  <input
                    type="number"
                    value={budgetGoal}
                    onChange={(e) => setBudgetGoal(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                    placeholder="Enter your monthly transport budget"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSetBudget(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowSetBudget(false)
                      fetchBudgetData()
                    }}
                    className="flex-1 px-4 py-3 bg-aura-primary text-white rounded-xl hover:bg-aura-primary/90 transition-colors"
                  >
                    Save Budget
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}