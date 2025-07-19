import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'
    
    // Mock system metrics (in production, this would come from your analytics database)
    const mockMetrics = {
      overall: {
        impressions: Math.floor(Math.random() * 10000) + 5000,
        clicks: Math.floor(Math.random() * 2000) + 1000,
        accepts: Math.floor(Math.random() * 1500) + 800,
        dismissals: Math.floor(Math.random() * 500) + 200,
        ratings: Math.floor(Math.random() * 300) + 150,
        conversions: Math.floor(Math.random() * 800) + 400,
        ctr: Math.random() * 0.3 + 0.15, // 15-45%
        acceptance_rate: Math.random() * 0.4 + 0.3, // 30-70%
        conversion_rate: Math.random() * 0.3 + 0.2, // 20-50%
        avg_rating: Math.random() * 2 + 3, // 3-5 stars
        avg_position: Math.random() * 2 + 1 // 1-3
      },
      byType: {
        route: {
          impressions: Math.floor(Math.random() * 3000) + 1500,
          ctr: Math.random() * 0.3 + 0.2,
          acceptance_rate: Math.random() * 0.4 + 0.35,
          avg_rating: Math.random() * 1.5 + 3.5
        },
        budget: {
          impressions: Math.floor(Math.random() * 2000) + 1000,
          ctr: Math.random() * 0.25 + 0.15,
          acceptance_rate: Math.random() * 0.35 + 0.25,
          avg_rating: Math.random() * 1.5 + 3.2
        },
        time: {
          impressions: Math.floor(Math.random() * 2500) + 1200,
          ctr: Math.random() * 0.35 + 0.25,
          acceptance_rate: Math.random() * 0.45 + 0.3,
          avg_rating: Math.random() * 1.5 + 3.8
        },
        mode: {
          impressions: Math.floor(Math.random() * 1800) + 900,
          ctr: Math.random() * 0.3 + 0.18,
          acceptance_rate: Math.random() * 0.4 + 0.28,
          avg_rating: Math.random() * 1.5 + 3.3
        },
        community: {
          impressions: Math.floor(Math.random() * 1500) + 700,
          ctr: Math.random() * 0.25 + 0.12,
          acceptance_rate: Math.random() * 0.35 + 0.22,
          avg_rating: Math.random() * 1.5 + 3.1
        }
      },
      byPosition: {
        1: { ctr: Math.random() * 0.4 + 0.3, acceptance_rate: Math.random() * 0.5 + 0.4 },
        2: { ctr: Math.random() * 0.3 + 0.2, acceptance_rate: Math.random() * 0.4 + 0.3 },
        3: { ctr: Math.random() * 0.25 + 0.15, acceptance_rate: Math.random() * 0.35 + 0.25 },
        4: { ctr: Math.random() * 0.2 + 0.1, acceptance_rate: Math.random() * 0.3 + 0.2 },
        5: { ctr: Math.random() * 0.15 + 0.08, acceptance_rate: Math.random() * 0.25 + 0.15 }
      },
      trends: generateTrendData(timeRange)
    }
    
    return NextResponse.json(mockMetrics)
  } catch (error) {
    console.error('Error fetching system metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system metrics' },
      { status: 500 }
    )
  }
}

function generateTrendData(timeRange: string) {
  const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
  const trends = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    trends.push({
      date: date.toISOString().split('T')[0],
      metrics: {
        impressions: Math.floor(Math.random() * 1000) + 500,
        clicks: Math.floor(Math.random() * 200) + 100,
        accepts: Math.floor(Math.random() * 150) + 80,
        ctr: Math.random() * 0.3 + 0.15,
        acceptance_rate: Math.random() * 0.4 + 0.3,
        avg_rating: Math.random() * 2 + 3
      }
    })
  }
  
  return trends
}