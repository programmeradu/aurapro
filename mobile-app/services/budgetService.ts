/**
 * 💰 Budget Tracking Service
 * Smart transport budgeting based on Reddit community feedback
 */

export interface TransportBudget {
  id: string
  userId: string
  monthlyLimit: number
  currentSpent: number
  currency: string
  startDate: Date
  endDate: Date
  categories: BudgetCategory[]
  alerts: BudgetAlert[]
}

export interface BudgetCategory {
  id: string
  name: string
  allocatedAmount: number
  spentAmount: number
  color: string
  icon: string
}

export interface BudgetAlert {
  id: string
  type: 'warning' | 'limit' | 'suggestion'
  message: string
  threshold: number
  isActive: boolean
  createdAt: Date
}

export interface TransportExpense {
  id: string
  amount: number
  currency: string
  category: string
  route?: string
  fromStop?: string
  toStop?: string
  timestamp: Date
  paymentMethod: string
  notes?: string
}

export interface BudgetInsight {
  type: 'saving' | 'warning' | 'tip' | 'trend'
  title: string
  description: string
  impact: number // potential savings or cost
  actionable: boolean
  priority: 'low' | 'medium' | 'high'
}

export interface FareEstimate {
  route: string
  estimatedFare: number
  confidence: number
  factors: string[]
  alternatives: AlternativeRoute[]
}

export interface AlternativeRoute {
  description: string
  estimatedFare: number
  timeDifference: number
  savings: number
}

class BudgetService {
  private apiUrl: string
  private cache: Map<string, any> = new Map()

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }

  /**
   * 💰 Create or update monthly budget
   */
  async createBudget(budget: Partial<TransportBudget>): Promise<TransportBudget> {
    const defaultCategories: BudgetCategory[] = [
      {
        id: 'daily_commute',
        name: 'Daily Commute',
        allocatedAmount: budget.monthlyLimit ? budget.monthlyLimit * 0.6 : 0,
        spentAmount: 0,
        color: '#3B82F6',
        icon: '🚌'
      },
      {
        id: 'weekend_travel',
        name: 'Weekend Travel',
        allocatedAmount: budget.monthlyLimit ? budget.monthlyLimit * 0.2 : 0,
        spentAmount: 0,
        color: '#10B981',
        icon: '🚗'
      },
      {
        id: 'emergency_transport',
        name: 'Emergency Transport',
        allocatedAmount: budget.monthlyLimit ? budget.monthlyLimit * 0.15 : 0,
        spentAmount: 0,
        color: '#F59E0B',
        icon: '🚨'
      },
      {
        id: 'miscellaneous',
        name: 'Miscellaneous',
        allocatedAmount: budget.monthlyLimit ? budget.monthlyLimit * 0.05 : 0,
        spentAmount: 0,
        color: '#8B5CF6',
        icon: '📦'
      }
    ]

    const newBudget: TransportBudget = {
      id: budget.id || this.generateId(),
      userId: budget.userId || 'current_user',
      monthlyLimit: budget.monthlyLimit || 0,
      currentSpent: 0,
      currency: budget.currency || 'GHS',
      startDate: budget.startDate || new Date(),
      endDate: budget.endDate || this.getMonthEnd(new Date()),
      categories: budget.categories || defaultCategories,
      alerts: []
    }

    // Save to local storage for now
    this.saveBudgetLocally(newBudget)
    return newBudget
  }

  /**
   * 📊 Get current budget status
   */
  async getCurrentBudget(): Promise<TransportBudget | null> {
    return this.getBudgetFromLocal()
  }

  /**
   * 💸 Record a transport expense
   */
  async recordExpense(expense: Omit<TransportExpense, 'id'>): Promise<TransportExpense> {
    const newExpense: TransportExpense = {
      id: this.generateId(),
      ...expense,
      timestamp: expense.timestamp || new Date()
    }

    // Save expense
    this.saveExpenseLocally(newExpense)

    // Update budget
    await this.updateBudgetWithExpense(newExpense)

    return newExpense
  }

  /**
   * 📈 Get budget insights and recommendations
   */
  async getBudgetInsights(): Promise<BudgetInsight[]> {
    const budget = await this.getCurrentBudget()
    const expenses = this.getExpensesFromLocal()
    
    if (!budget) return []

    const insights: BudgetInsight[] = []

    // Spending trend analysis
    const spendingRate = budget.currentSpent / budget.monthlyLimit
    const daysIntoMonth = this.getDaysIntoMonth()
    const expectedSpendingRate = daysIntoMonth / 30

    if (spendingRate > expectedSpendingRate * 1.2) {
      insights.push({
        type: 'warning',
        title: 'Spending Above Average',
        description: `You're spending ${Math.round((spendingRate - expectedSpendingRate) * 100)}% faster than expected this month.`,
        impact: budget.monthlyLimit * (spendingRate - expectedSpendingRate),
        actionable: true,
        priority: 'high'
      })
    }

    // Route optimization suggestions
    const routeAnalysis = this.analyzeRouteEfficiency(expenses)
    if (routeAnalysis.potentialSavings > 0) {
      insights.push({
        type: 'saving',
        title: 'Route Optimization Opportunity',
        description: `Consider alternative routes to save approximately ${routeAnalysis.potentialSavings} GHS per month.`,
        impact: routeAnalysis.potentialSavings,
        actionable: true,
        priority: 'medium'
      })
    }

    // Budget buffer recommendation (from Reddit feedback)
    const bufferRecommendation = this.calculateBufferRecommendation(budget, expenses)
    if (bufferRecommendation.recommended) {
      insights.push({
        type: 'tip',
        title: 'Budget Buffer Recommendation',
        description: bufferRecommendation.message,
        impact: bufferRecommendation.amount,
        actionable: true,
        priority: 'medium'
      })
    }

    return insights
  }

  /**
   * 💡 Get fare estimate for a journey
   */
  async getFareEstimate(
    fromStop: string, 
    toStop: string, 
    timeOfDay?: string
  ): Promise<FareEstimate> {
    // This would integrate with the backend fare calculation
    // For now, return mock estimate based on distance and time
    
    const basefare = this.calculateBaseFare(fromStop, toStop)
    const timeMultiplier = this.getTimeMultiplier(timeOfDay)
    const estimatedFare = basefare * timeMultiplier

    return {
      route: `${fromStop} → ${toStop}`,
      estimatedFare,
      confidence: 0.85,
      factors: ['Distance', 'Time of day', 'Vehicle type'],
      alternatives: this.generateAlternatives(fromStop, toStop, estimatedFare)
    }
  }

  /**
   * 📊 Get spending analytics
   */
  async getSpendingAnalytics(period: 'week' | 'month' | 'year' = 'month') {
    const expenses = this.getExpensesFromLocal()
    const filteredExpenses = this.filterExpensesByPeriod(expenses, period)

    return {
      totalSpent: filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
      averagePerTrip: filteredExpenses.length > 0 
        ? filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0) / filteredExpenses.length 
        : 0,
      categoryBreakdown: this.getCategoryBreakdown(filteredExpenses),
      dailyTrends: this.getDailyTrends(filteredExpenses),
      topRoutes: this.getTopRoutes(filteredExpenses)
    }
  }

  // Helper methods
  private async updateBudgetWithExpense(expense: TransportExpense): Promise<void> {
    const budget = await this.getCurrentBudget()
    if (!budget) return

    budget.currentSpent += expense.amount

    // Update category spending
    const category = budget.categories.find(cat => cat.id === expense.category)
    if (category) {
      category.spentAmount += expense.amount
    }

    // Check for alerts
    this.checkBudgetAlerts(budget)

    this.saveBudgetLocally(budget)
  }

  private checkBudgetAlerts(budget: TransportBudget): void {
    const spendingPercentage = budget.currentSpent / budget.monthlyLimit

    // 80% warning
    if (spendingPercentage >= 0.8 && !budget.alerts.find(a => a.type === 'warning')) {
      budget.alerts.push({
        id: this.generateId(),
        type: 'warning',
        message: 'You\'ve spent 80% of your monthly transport budget',
        threshold: 0.8,
        isActive: true,
        createdAt: new Date()
      })
    }

    // 100% limit
    if (spendingPercentage >= 1.0 && !budget.alerts.find(a => a.type === 'limit')) {
      budget.alerts.push({
        id: this.generateId(),
        type: 'limit',
        message: 'You\'ve exceeded your monthly transport budget',
        threshold: 1.0,
        isActive: true,
        createdAt: new Date()
      })
    }
  }

  private analyzeRouteEfficiency(expenses: TransportExpense[]) {
    // Analyze common routes for potential savings
    const routeCosts = new Map<string, number[]>()
    
    expenses.forEach(expense => {
      if (expense.fromStop && expense.toStop) {
        const route = `${expense.fromStop}-${expense.toStop}`
        if (!routeCosts.has(route)) {
          routeCosts.set(route, [])
        }
        routeCosts.get(route)!.push(expense.amount)
      }
    })

    let potentialSavings = 0
    routeCosts.forEach((costs, route) => {
      if (costs.length > 5) { // Only analyze frequently used routes
        const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length
        const minCost = Math.min(...costs)
        const savings = (avgCost - minCost) * costs.length
        potentialSavings += savings
      }
    })

    return { potentialSavings }
  }

  private calculateBufferRecommendation(budget: TransportBudget, expenses: TransportExpense[]) {
    // Based on Reddit feedback about transportation unpredictability
    const volatility = this.calculateSpendingVolatility(expenses)
    const recommendedBuffer = budget.monthlyLimit * 0.15 // 15% buffer
    
    return {
      recommended: volatility > 0.2,
      amount: recommendedBuffer,
      message: `Consider adding a ${Math.round(recommendedBuffer)} GHS buffer for unexpected transport costs and price fluctuations.`
    }
  }

  private calculateSpendingVolatility(expenses: TransportExpense[]): number {
    if (expenses.length < 5) return 0
    
    const amounts = expenses.map(e => e.amount)
    const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length
    
    return Math.sqrt(variance) / mean // Coefficient of variation
  }

  private calculateBaseFare(fromStop: string, toStop: string): number {
    // Mock fare calculation - would integrate with real fare data
    return Math.random() * 5 + 2 // 2-7 GHS range
  }

  private getTimeMultiplier(timeOfDay?: string): number {
    if (!timeOfDay) return 1
    
    const hour = parseInt(timeOfDay.split(':')[0])
    
    // Rush hour pricing
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 1.2
    }
    
    return 1
  }

  private generateAlternatives(fromStop: string, toStop: string, baseFare: number): AlternativeRoute[] {
    return [
      {
        description: 'Shared taxi route',
        estimatedFare: baseFare * 0.8,
        timeDifference: 10,
        savings: baseFare * 0.2
      },
      {
        description: 'Walking + public transport',
        estimatedFare: baseFare * 0.6,
        timeDifference: 20,
        savings: baseFare * 0.4
      }
    ]
  }

  // Local storage methods
  private saveBudgetLocally(budget: TransportBudget): void {
    localStorage.setItem('transport_budget', JSON.stringify(budget))
  }

  private getBudgetFromLocal(): TransportBudget | null {
    const stored = localStorage.getItem('transport_budget')
    return stored ? JSON.parse(stored) : null
  }

  private saveExpenseLocally(expense: TransportExpense): void {
    const expenses = this.getExpensesFromLocal()
    expenses.push(expense)
    localStorage.setItem('transport_expenses', JSON.stringify(expenses))
  }

  private getExpensesFromLocal(): TransportExpense[] {
    const stored = localStorage.getItem('transport_expenses')
    return stored ? JSON.parse(stored) : []
  }

  private filterExpensesByPeriod(expenses: TransportExpense[], period: string): TransportExpense[] {
    const now = new Date()
    const cutoff = new Date()
    
    switch (period) {
      case 'week':
        cutoff.setDate(now.getDate() - 7)
        break
      case 'month':
        cutoff.setMonth(now.getMonth() - 1)
        break
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1)
        break
    }
    
    return expenses.filter(exp => new Date(exp.timestamp) >= cutoff)
  }

  private getCategoryBreakdown(expenses: TransportExpense[]) {
    const breakdown = new Map<string, number>()
    expenses.forEach(exp => {
      breakdown.set(exp.category, (breakdown.get(exp.category) || 0) + exp.amount)
    })
    return Object.fromEntries(breakdown)
  }

  private getDailyTrends(expenses: TransportExpense[]) {
    const trends = new Map<string, number>()
    expenses.forEach(exp => {
      const date = new Date(exp.timestamp).toDateString()
      trends.set(date, (trends.get(date) || 0) + exp.amount)
    })
    return Object.fromEntries(trends)
  }

  private getTopRoutes(expenses: TransportExpense[]) {
    const routes = new Map<string, { count: number, totalCost: number }>()
    
    expenses.forEach(exp => {
      if (exp.fromStop && exp.toStop) {
        const route = `${exp.fromStop} → ${exp.toStop}`
        const current = routes.get(route) || { count: 0, totalCost: 0 }
        routes.set(route, {
          count: current.count + 1,
          totalCost: current.totalCost + exp.amount
        })
      }
    })
    
    return Array.from(routes.entries())
      .map(([route, data]) => ({
        route,
        trips: data.count,
        totalCost: data.totalCost,
        averageCost: data.totalCost / data.count
      }))
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 5)
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private getMonthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  }

  private getDaysIntoMonth(): number {
    const now = new Date()
    return now.getDate()
  }
}

// Export singleton instance
export const budgetService = new BudgetService()
export default budgetService
