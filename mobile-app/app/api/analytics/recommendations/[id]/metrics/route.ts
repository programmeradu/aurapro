import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recommendationId } = await params
    
    // Mock recommendation metrics (in production, this would come from your analytics database)
    const mockMetrics = {
      id: recommendationId,
      impressions: Math.floor(Math.random() * 1000) + 100,
      clicks: Math.floor(Math.random() * 200) + 20,
      accepts: Math.floor(Math.random() * 150) + 15,
      dismissals: Math.floor(Math.random() * 50) + 5,
      ratings: Math.floor(Math.random() * 30) + 10,
      conversions: Math.floor(Math.random() * 100) + 10,
      ctr: Math.random() * 0.3 + 0.1, // 10-40%
      acceptance_rate: Math.random() * 0.4 + 0.2, // 20-60%
      conversion_rate: Math.random() * 0.3 + 0.15, // 15-45%
      avg_rating: Math.random() * 2 + 3, // 3-5 stars
      avg_position: Math.random() * 3 + 1, // 1-4
      last_updated: new Date().toISOString(),
      performance_score: Math.random() * 40 + 60 // 60-100
    }
    
    return NextResponse.json(mockMetrics)
  } catch (error) {
    console.error('Error fetching recommendation metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendation metrics' },
      { status: 500 }
    )
  }
}