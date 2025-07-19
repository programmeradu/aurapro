/**
 * 🔐 Login Form Component
 * Secure authentication with role-based access control
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle,
  Shield,
  LogIn
} from 'lucide-react'
import { useAuth, LoginCredentials } from '../lib/authenticationManager'

interface LoginFormProps {
  onLoginSuccess?: () => void
  redirectTo?: string
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, redirectTo }) => {
  const { login, isLoading } = useAuth()
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    rememberMe: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Demo users for testing
  const demoUsers = [
    { username: 'admin', role: 'Super Admin', description: 'Full system access' },
    { username: 'fleet_manager', role: 'Fleet Manager', description: 'Vehicle and route management' },
    { username: 'dispatcher', role: 'Dispatcher', description: 'Route scheduling and dispatch' },
    { username: 'analyst', role: 'Analyst', description: 'Analytics and reporting' },
    { username: 'maintenance', role: 'Maintenance', description: 'Vehicle maintenance management' },
    { username: 'viewer', role: 'Viewer', description: 'Read-only dashboard access' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await login(credentials)
      
      if (result.success) {
        onLoginSuccess?.()
        if (redirectTo) {
          window.location.href = redirectTo
        }
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemoLogin = async (username: string) => {
    setCredentials({ username, password: 'demo123', rememberMe: false })
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await login({ username, password: 'demo123', rememberMe: false })
      
      if (result.success) {
        onLoginSuccess?.()
        if (redirectTo) {
          window.location.href = redirectTo
        }
      } else {
        setError(result.error || 'Demo login failed')
      }
    } catch (error) {
      setError('Demo login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super admin': return 'bg-purple-100 text-purple-800'
      case 'fleet manager': return 'bg-blue-100 text-blue-800'
      case 'dispatcher': return 'bg-green-100 text-green-800'
      case 'analyst': return 'bg-orange-100 text-orange-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Login Form */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              AURA Command Center
            </CardTitle>
            <p className="text-gray-600">Secure Access Portal</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your username"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={credentials.rememberMe}
                  onChange={(e) => setCredentials(prev => ({ ...prev, rememberMe: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                  Remember me for 30 days
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !credentials.username || !credentials.password}
                className="w-full py-3 text-lg font-medium"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Secure Connection</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Your connection is encrypted and secure. All login attempts are monitored.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Users */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">
              Demo Access
            </CardTitle>
            <p className="text-gray-600">
              Try different user roles to explore the system capabilities
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {demoUsers.map((user) => (
                <div
                  key={user.username}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{user.username}</h4>
                      <p className="text-sm text-gray-600">{user.description}</p>
                    </div>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </div>
                  
                  <Button
                    onClick={() => handleDemoLogin(user.username)}
                    disabled={isSubmitting}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Login as ' + user.role
                    )}
                  </Button>
                </div>
              ))}
            </div>

            {/* Demo Info */}
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Demo Environment</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                This is a demonstration environment. All demo accounts use the password "demo123".
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginForm
