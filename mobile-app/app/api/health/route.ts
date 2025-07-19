import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      services: {
        app: 'healthy',
        database: await checkDatabase(),
        external_apis: await checkExternalAPIs(),
        cache: await checkCache(),
      },
      system: {
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    }

    // Check if any service is unhealthy
    const isHealthy = Object.values(healthCheck.services).every(
      (status) => status === 'healthy'
    )

    return NextResponse.json(healthCheck, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

async function checkDatabase(): Promise<string> {
  try {
    // Add database connection check here
    // For now, return healthy
    return 'healthy'
  } catch (error) {
    console.error('Database health check failed:', error)
    return 'unhealthy'
  }
}

async function checkExternalAPIs(): Promise<string> {
  try {
    // Check critical external APIs
    const checks = await Promise.allSettled([
      // Mapbox API check
      fetch('https://api.mapbox.com/v1/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      }),
      // Add other API checks as needed
    ])

    const allHealthy = checks.every(
      (result) => result.status === 'fulfilled' && result.value.ok
    )

    return allHealthy ? 'healthy' : 'degraded'
  } catch (error) {
    console.error('External API health check failed:', error)
    return 'unhealthy'
  }
}

async function checkCache(): Promise<string> {
  try {
    // Add Redis/cache connection check here
    // For now, return healthy
    return 'healthy'
  } catch (error) {
    console.error('Cache health check failed:', error)
    return 'unhealthy'
  }
}
