/**
 * 🔔 Notification Service
 * Push notifications and alerts for Ghana commuters
 */

interface NotificationPermission {
  granted: boolean
  denied: boolean
  default: boolean
}

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: any
  actions?: NotificationAction[]
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
  tag?: string
}

interface NotificationAction {
  action: string
  title: string
  icon?: string
}

interface GhanaNotificationTypes {
  ROUTE_DELAY: 'route_delay'
  VEHICLE_ARRIVAL: 'vehicle_arrival'
  FARE_CHANGE: 'fare_change'
  SAFETY_ALERT: 'safety_alert'
  COMMUNITY_UPDATE: 'community_update'
  JOURNEY_REMINDER: 'journey_reminder'
  WEATHER_ALERT: 'weather_alert'
  TRAFFIC_UPDATE: 'traffic_update'
}

class NotificationService {
  private apiUrl: string
  private vapidPublicKey: string
  private subscription: PushSubscription | null = null
  private isSupported: boolean = false

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
    this.isSupported = this.checkSupport()
    
    if (this.isSupported) {
      this.initializeNotifications()
    }
  }

  /**
   * ✅ Check if notifications are supported
   */
  private checkSupport(): boolean {
    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    )
  }

  /**
   * 🚀 Initialize notification system
   */
  private async initializeNotifications() {
    try {
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready
      
      // Check for existing subscription
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        this.subscription = this.formatSubscription(existingSubscription)
      }
      
      console.log('[Notifications] Service initialized')
    } catch (error) {
      console.error('[Notifications] Failed to initialize:', error)
    }
  }

  /**
   * 🔔 Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Notifications not supported')
    }

    const permission = await Notification.requestPermission()
    
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    }
  }

  /**
   * 📱 Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      const permission = await this.requestPermission()
      
      if (!permission.granted) {
        throw new Error('Notification permission not granted')
      }

      const registration = await navigator.serviceWorker.ready
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      })

      this.subscription = this.formatSubscription(subscription)
      
      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription)
      
      return this.subscription
    } catch (error) {
      console.error('[Notifications] Failed to subscribe:', error)
      throw error
    }
  }

  /**
   * 🚫 Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        await this.removeSubscriptionFromServer()
        this.subscription = null
      }
    } catch (error) {
      console.error('[Notifications] Failed to unsubscribe:', error)
      throw error
    }
  }

  /**
   * 📤 Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send subscription to server')
      }
    } catch (error) {
      console.error('[Notifications] Failed to send subscription:', error)
      throw error
    }
  }

  /**
   * 🗑️ Remove subscription from server
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/v1/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })
    } catch (error) {
      console.error('[Notifications] Failed to remove subscription:', error)
    }
  }

  /**
   * 🔔 Show local notification
   */
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported || Notification.permission !== 'granted') {
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        image: payload.image,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        vibrate: payload.vibrate || [200, 100, 200],
        tag: payload.tag
      })
    } catch (error) {
      console.error('[Notifications] Failed to show notification:', error)
    }
  }

  /**
   * 🚌 Ghana-specific notification templates
   */
  async showVehicleArrivalNotification(vehicleId: string, eta: number): Promise<void> {
    await this.showLocalNotification({
      title: 'Vehicle Arriving Soon! 🚐',
      body: `Your tro-tro (${vehicleId}) will arrive in ${eta} minutes`,
      icon: '/icons/trotro-icon.png',
      data: { type: 'vehicle_arrival', vehicleId, eta },
      actions: [
        { action: 'track', title: 'Track Vehicle', icon: '/icons/track-icon.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
      tag: `vehicle_${vehicleId}`
    })
  }

  async showRouteDelayNotification(routeId: string, delay: number): Promise<void> {
    await this.showLocalNotification({
      title: 'Route Delay Alert ⚠️',
      body: `Your route is experiencing ${delay} minutes delay due to traffic`,
      icon: '/icons/delay-icon.png',
      data: { type: 'route_delay', routeId, delay },
      actions: [
        { action: 'alternatives', title: 'Find Alternative', icon: '/icons/route-icon.png' },
        { action: 'dismiss', title: 'OK' }
      ],
      vibrate: [200, 100, 200],
      tag: `delay_${routeId}`
    })
  }

  async showSafetyAlert(location: string, alertType: string): Promise<void> {
    await this.showLocalNotification({
      title: 'Safety Alert 🚨',
      body: `${alertType} reported near ${location}. Stay alert and consider alternative routes.`,
      icon: '/icons/safety-icon.png',
      data: { type: 'safety_alert', location, alertType },
      actions: [
        { action: 'view_details', title: 'View Details', icon: '/icons/info-icon.png' },
        { action: 'report', title: 'Report Issue', icon: '/icons/report-icon.png' }
      ],
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500],
      tag: `safety_${location}`
    })
  }

  async showFareChangeNotification(routeId: string, oldFare: number, newFare: number): Promise<void> {
    const change = newFare > oldFare ? 'increased' : 'decreased'
    const emoji = newFare > oldFare ? '📈' : '📉'
    
    await this.showLocalNotification({
      title: `Fare Update ${emoji}`,
      body: `Route fare ${change} from ₵${oldFare.toFixed(2)} to ₵${newFare.toFixed(2)}`,
      icon: '/icons/fare-icon.png',
      data: { type: 'fare_change', routeId, oldFare, newFare },
      actions: [
        { action: 'view_route', title: 'View Route', icon: '/icons/route-icon.png' },
        { action: 'dismiss', title: 'OK' }
      ],
      tag: `fare_${routeId}`
    })
  }

  async showCommunityUpdateNotification(reportId: string, updateType: string): Promise<void> {
    await this.showLocalNotification({
      title: 'Community Update 👥',
      body: `Your report has been ${updateType}. Thank you for helping improve transport!`,
      icon: '/icons/community-icon.png',
      data: { type: 'community_update', reportId, updateType },
      actions: [
        { action: 'view_report', title: 'View Report', icon: '/icons/view-icon.png' },
        { action: 'dismiss', title: 'Thanks!' }
      ],
      tag: `community_${reportId}`
    })
  }

  async showWeatherAlert(condition: string, impact: string): Promise<void> {
    const weatherEmoji = this.getWeatherEmoji(condition)
    
    await this.showLocalNotification({
      title: `Weather Alert ${weatherEmoji}`,
      body: `${condition} expected. ${impact} on transport services.`,
      icon: '/icons/weather-icon.png',
      data: { type: 'weather_alert', condition, impact },
      actions: [
        { action: 'view_alternatives', title: 'Plan Journey', icon: '/icons/journey-icon.png' },
        { action: 'dismiss', title: 'OK' }
      ],
      tag: `weather_${condition}`
    })
  }

  /**
   * ⚙️ Configure notification preferences
   */
  async updateNotificationPreferences(preferences: {
    vehicleArrivals: boolean
    routeDelays: boolean
    safetyAlerts: boolean
    fareChanges: boolean
    communityUpdates: boolean
    weatherAlerts: boolean
    quietHours: { start: string; end: string } | null
  }): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/v1/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(preferences)
      })
      
      // Store locally for offline access
      localStorage.setItem('notification_preferences', JSON.stringify(preferences))
    } catch (error) {
      console.error('[Notifications] Failed to update preferences:', error)
      throw error
    }
  }

  /**
   * 📊 Get notification statistics
   */
  async getNotificationStats(): Promise<{
    totalSent: number
    totalClicked: number
    clickRate: number
    lastNotification: Date | null
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/notifications/stats`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })
      
      if (response.ok) {
        return await response.json()
      }
      
      throw new Error('Failed to get notification stats')
    } catch (error) {
      console.error('[Notifications] Failed to get stats:', error)
      return { totalSent: 0, totalClicked: 0, clickRate: 0, lastNotification: null }
    }
  }

  /**
   * 🔧 Utility functions
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private formatSubscription(subscription: any): PushSubscription {
    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
      }
    }
  }

  private getWeatherEmoji(condition: string): string {
    const weatherEmojis: { [key: string]: string } = {
      'rain': '🌧️',
      'heavy_rain': '⛈️',
      'storm': '🌩️',
      'sunny': '☀️',
      'cloudy': '☁️',
      'fog': '🌫️',
      'wind': '💨'
    }
    return weatherEmojis[condition] || '🌤️'
  }

  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || ''
  }

  /**
   * 📱 Get current subscription status
   */
  getSubscriptionStatus(): {
    isSubscribed: boolean
    isSupported: boolean
    permission: NotificationPermission
  } {
    return {
      isSubscribed: this.subscription !== null,
      isSupported: this.isSupported,
      permission: {
        granted: Notification.permission === 'granted',
        denied: Notification.permission === 'denied',
        default: Notification.permission === 'default'
      }
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
export default notificationService
