'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  PlusIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { budgetService, TransportBudget, BudgetInsight } from '@/services/budgetService'

interface BudgetTrackerProps {
  className?: string
}

export default function BudgetTracker({ className = '' }: BudgetTrackerProps) {
  const [budget, setBudget] = useState<TransportBudget | null>(null)
  const [insights, setInsights] = useState<BudgetInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [monthlyLimit, setMonthlyLimit] = useState('')

  useEffect(() => {
    loadBudgetData()
  }, [])

  const loadBudgetData = async () => {
    setIsLoading(true)
    try {
      const currentBudget = await budgetService.getCurrentBudget()
      setBudget(currentBudget)
      
      if (currentBudget) {
        const budgetInsights = await budgetService.getBudgetInsights()
        setInsights(budgetInsights)
      } else {
        setShowSetupModal(true)
      }
    } catch (error) {
      console.error('Error loading budget data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetupBudget = async () => {
    if (!monthlyLimit || parseFloat(monthlyLimit) <= 0) return

    try {
      const newBudget = await budgetService.createBudget({
        monthlyLimit: parseFloat(monthlyLimit),
        currency: 'GHS'
      })
      setBudget(newBudget)
      setShowSetupModal(false)
      setMonthlyLimit('')
      
      // Load insights for new budget
      const budgetInsights = await budgetService.getBudgetInsights()
      setInsights(budgetInsights)
    } catch (error) {
      console.error('Error creating budget:', error)
    }
  }

  const getSpendingPercentage = () => {
    if (!budget) return 0
    return Math.min((budget.currentSpent / budget.monthlyLimit) * 100, 100)
  }

  const getSpendingColor = () => {
    const percentage = getSpendingPercentage()
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-orange-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getProgressBarColor = () => {
    const percentage = getSpendingPercentage()
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-orange-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
      case 'saving': return <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
      case 'tip': return <LightBulbIcon className="h-5 w-5 text-blue-500" />
      default: return <ChartBarIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getDaysRemaining = () => {
    if (!budget) return 0
    const now = new Date()
    const endDate = new Date(budget.endDate)
    const diffTime = endDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (showSetupModal) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className="text-center">
          <CurrencyDollarIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Set Your Monthly Transport Budget
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Based on community feedback, setting a budget helps you plan better and avoid overspending on transport.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Budget (GHS)
              </label>
              <input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="e.g., 200"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSetupBudget}
                disabled={!monthlyLimit || parseFloat(monthlyLimit) <= 0}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Budget
              </button>
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (!budget) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <ChartBarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No budget set up</p>
          <button
            onClick={() => setShowSetupModal(true)}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Set up budget
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Transport Budget</h3>
          <p className="text-sm text-gray-600">
            {getDaysRemaining()} days remaining this month
          </p>
        </div>
        <button
          onClick={() => setShowSetupModal(true)}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Budget Overview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {budget.currentSpent.toFixed(2)} GHS
          </span>
          <span className="text-sm text-gray-600">
            of {budget.monthlyLimit.toFixed(2)} GHS
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getSpendingPercentage()}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-2 rounded-full ${getProgressBarColor()}`}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className={`font-medium ${getSpendingColor()}`}>
            {getSpendingPercentage().toFixed(1)}% spent
          </span>
          <span className="text-gray-600">
            {(budget.monthlyLimit - budget.currentSpent).toFixed(2)} GHS remaining
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
        <div className="space-y-2">
          {budget.categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>{category.icon}</span>
                <span className="text-sm text-gray-700">{category.name}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">{category.spentAmount.toFixed(0)}</span>
                <span className="text-gray-500">/{category.allocatedAmount.toFixed(0)} GHS</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Insights & Tips</h4>
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-gray-900">{insight.title}</h5>
                  <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                  {insight.impact > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Potential impact: {insight.impact.toFixed(2)} GHS
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button className="flex-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
            Add Expense
          </button>
          <button className="flex-1 text-sm text-gray-600 hover:text-gray-700 font-medium">
            View Analytics
          </button>
        </div>
      </div>
    </div>
  )
}
