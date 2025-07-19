// Development Data Service
// This simulates real API responses for development/demo purposes
// In production, replace these with actual database/API integrations

export class DevDataService {
  // Simulate user trip data (would come from trip planning database)
  static async getUserNextTrip(userId: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Simulate different user scenarios
    const scenarios = [
      {
        timeToNext: '12 min',
        destination: 'Accra Mall',
        route: 'Trotro Route 1',
        estimatedDuration: '25 min',
        cost: 3.50
      },
      {
        timeToNext: '8 min',
        destination: 'Kotoka Airport',
        route: 'Airport Shuttle',
        estimatedDuration: '45 min',
        cost: 15.00
      },
      null // No upcoming trips
    ]
    
    // Return random scenario to simulate real-world variability
    return scenarios[Math.floor(Math.random() * scenarios.length)]
  }

  // Simulate budget data (would come from budget tracking system)
  static async getUserBudget(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 150))
    
    const budgetScenarios = [
      {
        remaining: 45.20,
        total: 100.00,
        spent: 54.80,
        period: 'weekly',
        currency: 'GHS'
      },
      {
        remaining: 12.50,
        total: 50.00,
        spent: 37.50,
        period: 'daily',
        currency: 'GHS'
      },
      null // No budget set
    ]
    
    return budgetScenarios[Math.floor(Math.random() * budgetScenarios.length)]
  }

  // Simulate community reports (would come from community database)
  static async getCommunityReports() {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return {
      activeReports: Math.floor(Math.random() * 20) + 5,
      categories: {
        traffic: Math.floor(Math.random() * 8) + 2,
        safety: Math.floor(Math.random() * 5) + 1,
        service: Math.floor(Math.random() * 7) + 3
      },
      lastUpdated: new Date().toISOString()
    }
  }

  // Simulate AI suggestions (would come from ML service)
  static async getAISuggestions(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return {
      pendingCount: Math.floor(Math.random() * 5) + 1,
      categories: {
        route: Math.floor(Math.random() * 3),
        budget: Math.floor(Math.random() * 2) + 1,
        general: Math.floor(Math.random() * 2)
      },
      lastGenerated: new Date().toISOString()
    }
  }

  // Simulate system alerts (would come from monitoring systems)
  static async getSystemAlerts() {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const alertTypes = ['info', 'warning', 'success']
    const alertCount = Math.floor(Math.random() * 3)
    
    if (alertCount === 0) return []
    
    return Array.from({ length: alertCount }, (_, i) => ({
      id: `alert_${Date.now()}_${i}`,
      type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
      title: this.getRandomAlertTitle(),
      message: this.getRandomAlertMessage(),
      timestamp: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      actionable: Math.random() > 0.5,
      actionText: Math.random() > 0.5 ? 'View Details' : undefined
    }))
  }

  private static getRandomAlertTitle() {
    const titles = [
      'Route Optimization Available',
      'Traffic Update',
      'Service Improvement',
      'Budget Milestone Reached',
      'New Route Added'
    ]
    return titles[Math.floor(Math.random() * titles.length)]
  }

  private static getRandomAlertMessage() {
    const messages = [
      'We found a faster route for your daily commute.',
      'Heavy traffic reported on your usual route.',
      'Service quality has improved on Route 12.',
      'You\'ve saved 20% on transport costs this week.',
      'New express route now available to Tema.'
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
}

// Environment check - only use dev data in development
export const isDevelopment = process.env.NODE_ENV === 'development'