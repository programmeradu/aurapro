import { NextRequest, NextResponse } from 'next/server'
import { DevDataService, isDevelopment } from '@/lib/dev-data-service'

export async function GET(request: NextRequest) {
  try {
    // In production, this would fetch from your database/external APIs
    // NO HARDCODED DATA - fetch from real sources:
    // 1. System monitoring APIs
    // 2. Transport authority feeds
    // 3. Weather services
    // 4. Traffic management systems
    // 5. Emergency services APIs
    
    const alerts = await fetchActiveAlerts()
    
    return NextResponse.json({
      success: true,
      alerts,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching active alerts:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch alerts',
        alerts: [] // Return empty array instead of hardcoded data
      },
      { status: 500 }
    )
  }
}

async function fetchActiveAlerts() {
  try {
    // In development, use dev data service
    if (isDevelopment) {
      return await DevDataService.getSystemAlerts()
    }
    
    // In production, integrate with real data sources:
    
    // 1. System health monitoring
    // const systemAlerts = await fetch('YOUR_MONITORING_API/alerts')
    
    // 2. Transport authority feeds
    // const transportAlerts = await fetch('GHANA_TRANSPORT_API/alerts')
    
    // 3. Weather-related transport impacts
    // const weatherAlerts = await fetch('WEATHER_API/transport-impacts')
    
    // 4. Traffic management alerts
    // const trafficAlerts = await fetch('TRAFFIC_API/incidents')
    
    // 5. Emergency services
    // const emergencyAlerts = await fetch('EMERGENCY_API/active')
    
    // For production, implement real integrations
    return []
    
  } catch (error) {
    console.error('Error in fetchActiveAlerts:', error)
    return []
  }
}

// Helper function to process and prioritize alerts from multiple sources
function processAndPrioritizeAlerts(rawAlerts: any[]) {
  return rawAlerts
    .filter(alert => alert.active && !alert.expired)
    .map(alert => ({
      id: alert.id || `alert_${Date.now()}_${Math.random()}`,
      type: mapAlertType(alert.severity || alert.type),
      title: alert.title || alert.summary,
      message: alert.description || alert.message,
      timestamp: new Date(alert.timestamp || alert.created_at),
      priority: mapPriority(alert.priority || alert.severity),
      actionable: !!alert.action_url || !!alert.action_text,
      actionText: alert.action_text,
      actionUrl: alert.action_url
    }))
    .sort((a, b) => {
      // Sort by priority: high -> medium -> low
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
    .slice(0, 5) // Limit to 5 most important alerts
}

function mapAlertType(severity: string): 'emergency' | 'warning' | 'info' | 'success' {
  switch (severity?.toLowerCase()) {
    case 'critical':
    case 'emergency':
    case 'severe':
      return 'emergency'
    case 'warning':
    case 'moderate':
      return 'warning'
    case 'success':
    case 'resolved':
      return 'success'
    default:
      return 'info'
  }
}

function mapPriority(priority: string): 'high' | 'medium' | 'low' {
  switch (priority?.toLowerCase()) {
    case 'critical':
    case 'high':
    case 'urgent':
      return 'high'
    case 'medium':
    case 'moderate':
      return 'medium'
    default:
      return 'low'
  }
}