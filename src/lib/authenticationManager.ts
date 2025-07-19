/**
 * 🔐 User Authentication & Authorization Manager
 * Comprehensive security system with role-based access control
 */

import { apiService } from '@/services/apiService'

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  permissions: Permission[]
  department: string
  isActive: boolean
  lastLogin: Date | null
  createdAt: Date
  profileImage?: string
  phoneNumber?: string
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: 'en' | 'tw' | 'ga' // English, Twi, Ga
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  dashboard: {
    defaultView: string
    refreshInterval: number
    showAdvancedMetrics: boolean
  }
}

export interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
}

export interface AuthSession {
  token: string
  refreshToken: string
  expiresAt: Date
  user: User
}

export type UserRole = 
  | 'super_admin'     // Full system access
  | 'admin'           // Administrative access
  | 'fleet_manager'   // Fleet management
  | 'dispatcher'      // Route and schedule management
  | 'analyst'         // Analytics and reporting
  | 'maintenance'     // Vehicle maintenance
  | 'driver'          // Driver portal access
  | 'viewer'          // Read-only access

export type Permission = 
  | 'view_dashboard'
  | 'manage_vehicles'
  | 'manage_routes'
  | 'manage_users'
  | 'view_analytics'
  | 'export_data'
  | 'manage_maintenance'
  | 'view_financial'
  | 'manage_settings'
  | 'emergency_override'

export interface AuthConfig {
  tokenStorageKey: string
  refreshTokenKey: string
  sessionTimeout: number // minutes
  maxLoginAttempts: number
  lockoutDuration: number // minutes
  passwordRequirements: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
  }
}

export class AuthenticationManager {
  private config: AuthConfig
  private currentSession: AuthSession | null = null
  private loginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map()
  private eventHandlers: Map<string, Function[]> = new Map()

  // Role-based permissions mapping
  private rolePermissions: Map<UserRole, Permission[]> = new Map([
    ['super_admin', [
      'view_dashboard', 'manage_vehicles', 'manage_routes', 'manage_users',
      'view_analytics', 'export_data', 'manage_maintenance', 'view_financial',
      'manage_settings', 'emergency_override'
    ]],
    ['admin', [
      'view_dashboard', 'manage_vehicles', 'manage_routes', 'manage_users',
      'view_analytics', 'export_data', 'manage_maintenance', 'view_financial',
      'manage_settings'
    ]],
    ['fleet_manager', [
      'view_dashboard', 'manage_vehicles', 'manage_routes', 'view_analytics',
      'export_data', 'manage_maintenance', 'view_financial'
    ]],
    ['dispatcher', [
      'view_dashboard', 'manage_routes', 'view_analytics', 'manage_maintenance'
    ]],
    ['analyst', [
      'view_dashboard', 'view_analytics', 'export_data'
    ]],
    ['maintenance', [
      'view_dashboard', 'manage_maintenance', 'manage_vehicles'
    ]],
    ['driver', [
      'view_dashboard'
    ]],
    ['viewer', [
      'view_dashboard'
    ]]
  ])

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = {
      tokenStorageKey: 'aura_auth_token',
      refreshTokenKey: 'aura_refresh_token',
      sessionTimeout: 480, // 8 hours
      maxLoginAttempts: 5,
      lockoutDuration: 30, // 30 minutes
      passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      ...config
    }

    this.initializeFromStorage()
    this.startSessionMonitoring()
  }

  private initializeFromStorage(): void {
    try {
      const token = localStorage.getItem(this.config.tokenStorageKey)
      const refreshToken = localStorage.getItem(this.config.refreshTokenKey)
      
      if (token && refreshToken) {
        // Validate stored session
        this.validateStoredSession(token, refreshToken)
      }
    } catch (error) {
      console.warn('🔐 Failed to initialize from storage:', error)
      this.clearStoredSession()
    }
  }

  private async validateStoredSession(token: string, refreshToken: string): Promise<void> {
    try {
      // Verify token with backend
      const response = await apiService.request('/api/v1/auth/verify', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.success) {
        this.currentSession = {
          token,
          refreshToken,
          expiresAt: new Date(response.data.expiresAt),
          user: response.data.user
        }
        this.emit('session_restored', this.currentSession.user)
      } else {
        throw new Error('Invalid stored session')
      }
    } catch (error) {
      console.warn('🔐 Stored session invalid, clearing:', error)
      this.clearStoredSession()
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Check for account lockout
      const lockoutCheck = this.checkAccountLockout(credentials.username)
      if (!lockoutCheck.allowed) {
        return {
          success: false,
          error: `Account locked. Try again in ${lockoutCheck.remainingMinutes} minutes.`
        }
      }

      // Attempt login
      const response = await apiService.request('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          rememberMe: credentials.rememberMe || false
        })
      })

      if (response.success) {
        // Clear login attempts on success
        this.loginAttempts.delete(credentials.username)

        // Store session
        this.currentSession = {
          token: response.data.token,
          refreshToken: response.data.refreshToken,
          expiresAt: new Date(response.data.expiresAt),
          user: response.data.user
        }

        // Store in localStorage if remember me
        if (credentials.rememberMe) {
          localStorage.setItem(this.config.tokenStorageKey, this.currentSession.token)
          localStorage.setItem(this.config.refreshTokenKey, this.currentSession.refreshToken)
        }

        this.emit('login_success', this.currentSession.user)
        return { success: true, user: this.currentSession.user }

      } else {
        // Track failed attempt
        this.trackFailedLogin(credentials.username)
        return { success: false, error: response.message || 'Invalid credentials' }
      }

    } catch (error) {
      this.trackFailedLogin(credentials.username)
      console.error('🔐 Login failed:', error)
      return { success: false, error: 'Login failed. Please try again.' }
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.currentSession) {
        // Notify backend of logout
        await apiService.request('/api/v1/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.currentSession.token}` }
        })
      }
    } catch (error) {
      console.warn('🔐 Logout notification failed:', error)
    } finally {
      this.clearSession()
      this.emit('logout')
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      if (!this.currentSession?.refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await apiService.request('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: this.currentSession.refreshToken
        })
      })

      if (response.success) {
        this.currentSession = {
          ...this.currentSession,
          token: response.data.token,
          expiresAt: new Date(response.data.expiresAt)
        }

        // Update stored token
        localStorage.setItem(this.config.tokenStorageKey, this.currentSession.token)
        this.emit('session_refreshed', this.currentSession.user)
        return true
      } else {
        throw new Error('Refresh failed')
      }

    } catch (error) {
      console.error('🔐 Session refresh failed:', error)
      this.clearSession()
      this.emit('session_expired')
      return false
    }
  }

  private checkAccountLockout(username: string): { allowed: boolean; remainingMinutes?: number } {
    const attempts = this.loginAttempts.get(username)
    if (!attempts || attempts.count < this.config.maxLoginAttempts) {
      return { allowed: true }
    }

    const lockoutEnd = new Date(attempts.lastAttempt.getTime() + this.config.lockoutDuration * 60000)
    const now = new Date()

    if (now < lockoutEnd) {
      const remainingMs = lockoutEnd.getTime() - now.getTime()
      const remainingMinutes = Math.ceil(remainingMs / 60000)
      return { allowed: false, remainingMinutes }
    } else {
      // Lockout expired, reset attempts
      this.loginAttempts.delete(username)
      return { allowed: true }
    }
  }

  private trackFailedLogin(username: string): void {
    const attempts = this.loginAttempts.get(username) || { count: 0, lastAttempt: new Date() }
    attempts.count++
    attempts.lastAttempt = new Date()
    this.loginAttempts.set(username, attempts)
  }

  private clearSession(): void {
    this.currentSession = null
    this.clearStoredSession()
  }

  private clearStoredSession(): void {
    localStorage.removeItem(this.config.tokenStorageKey)
    localStorage.removeItem(this.config.refreshTokenKey)
  }

  private startSessionMonitoring(): void {
    setInterval(() => {
      if (this.currentSession) {
        const now = new Date()
        const timeUntilExpiry = this.currentSession.expiresAt.getTime() - now.getTime()
        
        // Refresh if expiring within 5 minutes
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          this.refreshSession()
        } else if (timeUntilExpiry <= 0) {
          this.clearSession()
          this.emit('session_expired')
        }
      }
    }, 60000) // Check every minute
  }

  // Permission checking
  hasPermission(permission: Permission): boolean {
    if (!this.currentSession?.user) return false
    
    const userPermissions = this.rolePermissions.get(this.currentSession.user.role) || []
    return userPermissions.includes(permission)
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission))
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission))
  }

  canAccessRoute(routePath: string): boolean {
    // Route-based access control
    const routePermissions: Record<string, Permission[]> = {
      '/admin': ['manage_users', 'manage_settings'],
      '/analytics': ['view_analytics'],
      '/maintenance': ['manage_maintenance'],
      '/financial': ['view_financial'],
      '/settings': ['manage_settings']
    }

    const requiredPermissions = routePermissions[routePath]
    if (!requiredPermissions) return true // Public route

    return this.hasAnyPermission(requiredPermissions)
  }

  // User management
  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      if (!this.currentSession) throw new Error('Not authenticated')

      const response = await apiService.request('/api/v1/auth/preferences', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${this.currentSession.token}` },
        body: JSON.stringify(preferences)
      })

      if (response.success) {
        this.currentSession.user.preferences = { ...this.currentSession.user.preferences, ...preferences }
        this.emit('preferences_updated', this.currentSession.user.preferences)
        return true
      }
      return false

    } catch (error) {
      console.error('🔐 Failed to update preferences:', error)
      return false
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentSession) throw new Error('Not authenticated')

      // Validate new password
      const validation = this.validatePassword(newPassword)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      const response = await apiService.request('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.currentSession.token}` },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      if (response.success) {
        this.emit('password_changed')
        return { success: true }
      } else {
        return { success: false, error: response.message || 'Password change failed' }
      }

    } catch (error) {
      console.error('🔐 Password change failed:', error)
      return { success: false, error: 'Password change failed. Please try again.' }
    }
  }

  validatePassword(password: string): { valid: boolean; error?: string } {
    const req = this.config.passwordRequirements

    if (password.length < req.minLength) {
      return { valid: false, error: `Password must be at least ${req.minLength} characters long` }
    }

    if (req.requireUppercase && !/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one uppercase letter' }
    }

    if (req.requireLowercase && !/[a-z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one lowercase letter' }
    }

    if (req.requireNumbers && !/\d/.test(password)) {
      return { valid: false, error: 'Password must contain at least one number' }
    }

    if (req.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one special character' }
    }

    return { valid: true }
  }

  // Event system
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler?: Function): void {
    if (!this.eventHandlers.has(event)) return
    
    if (handler) {
      const handlers = this.eventHandlers.get(event)!
      const index = handlers.indexOf(handler)
      if (index > -1) handlers.splice(index, 1)
    } else {
      this.eventHandlers.delete(event)
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`🔐 Error in auth event handler for ${event}:`, error)
        }
      })
    }
  }

  // Getters
  getCurrentUser(): User | null {
    return this.currentSession?.user || null
  }

  isAuthenticated(): boolean {
    return this.currentSession !== null && new Date() < this.currentSession.expiresAt
  }

  getAuthToken(): string | null {
    return this.currentSession?.token || null
  }

  getUserRole(): UserRole | null {
    return this.currentSession?.user.role || null
  }

  getSessionTimeRemaining(): number {
    if (!this.currentSession) return 0
    return Math.max(0, this.currentSession.expiresAt.getTime() - Date.now())
  }
}

// React hooks for authentication
import { useCallback, useEffect, useState } from 'react'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(authManager.getCurrentUser())
  const [isAuthenticated, setIsAuthenticated] = useState(authManager.isAuthenticated())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const handleLoginSuccess = (user: User) => {
      setUser(user)
      setIsAuthenticated(true)
    }

    const handleLogout = () => {
      setUser(null)
      setIsAuthenticated(false)
    }

    const handleSessionExpired = () => {
      setUser(null)
      setIsAuthenticated(false)
    }

    authManager.on('login_success', handleLoginSuccess)
    authManager.on('logout', handleLogout)
    authManager.on('session_expired', handleSessionExpired)
    authManager.on('session_restored', handleLoginSuccess)

    return () => {
      authManager.off('login_success', handleLoginSuccess)
      authManager.off('logout', handleLogout)
      authManager.off('session_expired', handleSessionExpired)
      authManager.off('session_restored', handleLoginSuccess)
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const result = await authManager.login(credentials)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authManager.logout()
    } finally {
      setIsLoading(false)
    }
  }, [])

  const hasPermission = useCallback((permission: Permission) => {
    return authManager.hasPermission(permission)
  }, [user])

  const hasAnyPermission = useCallback((permissions: Permission[]) => {
    return authManager.hasAnyPermission(permissions)
  }, [user])

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    canAccessRoute: authManager.canAccessRoute.bind(authManager),
    updatePreferences: authManager.updateUserPreferences.bind(authManager),
    changePassword: authManager.changePassword.bind(authManager)
  }
}

export const usePermissions = (requiredPermissions: Permission[]) => {
  const { hasAnyPermission, hasAllPermissions } = useAuth()

  return {
    hasAny: hasAnyPermission(requiredPermissions),
    hasAll: authManager.hasAllPermissions(requiredPermissions),
    canAccess: hasAnyPermission(requiredPermissions)
  }
}

// Singleton instance
export const authManager = new AuthenticationManager()
export default authManager
