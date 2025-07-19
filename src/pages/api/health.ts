// Health check endpoint for AURA Command Center
import type { NextApiRequest, NextApiResponse } from 'next'

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: {
    database: 'healthy' | 'unhealthy' | 'unknown'
    redis: 'healthy' | 'unhealthy' | 'unknown'
    websocket: 'healthy' | 'unhealthy' | 'unknown'
    external_apis: 'healthy' | 'unhealthy' | 'unknown'
  }
  metrics: {
    memory_usage: number
    cpu_usage: number
    active_connections: number
    response_time: number
  }
}

// Simulate health checks for different services
const checkDatabase = async (): Promise<'healthy' | 'unhealthy' | 'unknown'> => {
  try {
    // In a real implementation, this would check actual database connectivity
    // const result = await db.query('SELECT 1')
    return 'healthy'
  } catch (error) {
    console.error('Database health check failed:', error)
    return 'unhealthy'
  }
}

const checkRedis = async (): Promise<'healthy' | 'unhealthy' | 'unknown'> => {
  try {
    // In a real implementation, this would check Redis connectivity
    // const result = await redis.ping()
    return 'healthy'
  } catch (error) {
    console.error('Redis health check failed:', error)
    return 'unhealthy'
  }
}

const checkWebSocket = async (): Promise<'healthy' | 'unhealthy' | 'unknown'> => {
  try {
    // Check if WebSocket server is responding
    const response = await fetch('http://localhost:8002/health', {
      method: 'GET',
      timeout: 5000
    })
    return response.ok ? 'healthy' : 'unhealthy'
  } catch (error) {
    console.error('WebSocket health check failed:', error)
    return 'unhealthy'
  }
}

const checkExternalAPIs = async (): Promise<'healthy' | 'unhealthy' | 'unknown'> => {
  try {
    // Check critical external APIs
    const checks = await Promise.allSettled([
      // Mapbox API check
      fetch('https://api.mapbox.com/v1/ping', { timeout: 5000 }),
      // Weather API check (if configured)
      // fetch('https://api.openweathermap.org/data/2.5/weather?q=Accra&appid=test', { timeout: 5000 })
    ])
    
    const healthyChecks = checks.filter(check => 
      check.status === 'fulfilled' && check.value.ok
    ).length
    
    // Consider healthy if at least 50% of external APIs are responding
    return healthyChecks >= checks.length * 0.5 ? 'healthy' : 'unhealthy'
  } catch (error) {
    console.error('External APIs health check failed:', error)
    return 'unhealthy'
  }
}

const getSystemMetrics = () => {
  const memoryUsage = process.memoryUsage()
  const cpuUsage = process.cpuUsage()
  
  return {
    memory_usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    cpu_usage: Math.round((cpuUsage.user + cpuUsage.system) / 1000000), // Convert to milliseconds
    active_connections: 0, // Would be tracked by connection pool
    response_time: 0 // Would be measured
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  const startTime = Date.now()
  
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.NEXT_PUBLIC_APP_VERSION || '2.1.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        checks: {
          database: 'unknown',
          redis: 'unknown',
          websocket: 'unknown',
          external_apis: 'unknown'
        },
        metrics: {
          memory_usage: 0,
          cpu_usage: 0,
          active_connections: 0,
          response_time: 0
        }
      } as HealthCheckResponse)
      return
    }

    // Perform health checks in parallel
    const [databaseStatus, redisStatus, websocketStatus, externalAPIsStatus] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkWebSocket(),
      checkExternalAPIs()
    ])

    // Get system metrics
    const metrics = getSystemMetrics()
    metrics.response_time = Date.now() - startTime

    // Determine overall health status
    const checks = {
      database: databaseStatus,
      redis: redisStatus,
      websocket: websocketStatus,
      external_apis: externalAPIsStatus
    }

    const healthyChecks = Object.values(checks).filter(status => status === 'healthy').length
    const totalChecks = Object.values(checks).length
    const overallStatus = healthyChecks >= totalChecks * 0.75 ? 'healthy' : 'unhealthy'

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '2.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks,
      metrics
    }

    // Set appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : 503

    // Add cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    res.status(statusCode).json(response)

  } catch (error) {
    console.error('Health check endpoint error:', error)
    
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '2.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: 'unknown',
        redis: 'unknown',
        websocket: 'unknown',
        external_apis: 'unknown'
      },
      metrics: {
        memory_usage: 0,
        cpu_usage: 0,
        active_connections: 0,
        response_time: Date.now() - startTime
      }
    }

    res.status(503).json(errorResponse)
  }
}
