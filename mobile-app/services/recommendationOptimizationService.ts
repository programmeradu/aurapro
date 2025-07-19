/**
 * 🧠 Recommendation Optimization Service
 * Advanced ML-based optimization for recommendation performance
 */

import { PersonalizedRecommendation, RecommendationContext } from './personalizedRecommendationService'
import { recommendationAnalyticsService } from './recommendationAnalyticsService'

interface OptimizationConfig {
  learningRate: number
  explorationRate: number
  decayRate: number
  minExplorationRate: number
  batchSize: number
  updateFrequency: number
}

interface ModelWeights {
  collaborative: number
  contentBased: number
  contextual: number
  popularity: number
  diversity: number
  recency: number
}

interface OptimizationResult {
  recommendationId: string
  originalScore: number
  optimizedScore: number
  adjustments: Record<string, number>
  confidence: number
  reason: string
}

interface ABTestConfig {
  testId: string
  variants: Array<{
    id: string
    name: string
    weights: ModelWeights
    trafficAllocation: number
  }>
  duration: number
  successMetric: 'ctr' | 'acceptance_rate' | 'conversion_rate' | 'user_satisfaction'
  minSampleSize: number
}

class RecommendationOptimizationService {
  private config: OptimizationConfig = {
    learningRate: 0.01,
    explorationRate: 0.1,
    decayRate: 0.995,
    minExplorationRate: 0.01,
    batchSize: 100,
    updateFrequency: 3600000 // 1 hour
  }

  private modelWeights: ModelWeights = {
    collaborative: 0.3,
    contentBased: 0.25,
    contextual: 0.2,
    popularity: 0.1,
    diversity: 0.1,
    recency: 0.05
  }

  private userSegmentWeights: Map<string, ModelWeights> = new Map()
  private contextualWeights: Map<string, ModelWeights> = new Map()
  private abTests: Map<string, ABTestConfig> = new Map()
  private optimizationHistory: OptimizationResult[] = []

  constructor() {
    this.initializeSegmentWeights()
    this.startOptimizationLoop()
  }

  /**
   * Optimize recommendations using multi-armed bandit approach
   */
  async optimizeRecommendations(
    recommendations: PersonalizedRecommendation[],
    userId: string,
    context: RecommendationContext
  ): Promise<PersonalizedRecommendation[]> {
    try {
      // Get user segment and contextual weights
      const userSegment = await this.getUserSegment(userId)
      const contextKey = this.getContextKey(context)
      
      const segmentWeights = this.userSegmentWeights.get(userSegment) || this.modelWeights
      const contextWeights = this.contextualWeights.get(contextKey) || this.modelWeights

      // Apply optimization to each recommendation
      const optimizedRecommendations = await Promise.all(
        recommendations.map(async (rec, index) => {
          const optimizationResult = await this.optimizeRecommendation(
            rec,
            userId,
            context,
            segmentWeights,
            contextWeights,
            index
          )

          return {
            ...rec,
            confidence: optimizationResult.optimizedScore,
            optimizationMetadata: {
              originalScore: optimizationResult.originalScore,
              adjustments: optimizationResult.adjustments,
              reason: optimizationResult.reason
            }
          }
        })
      )

      // Re-rank based on optimized scores
      const reranked = optimizedRecommendations.sort((a, b) => b.confidence - a.confidence)

      // Apply diversity and exploration
      return this.applyDiversityAndExploration(reranked, context)

    } catch (error) {
      console.error('Error optimizing recommendations:', error)
      return recommendations
    }
  }

  /**
   * Optimize individual recommendation
   */
  private async optimizeRecommendation(
    recommendation: PersonalizedRecommendation,
    userId: string,
    context: RecommendationContext,
    segmentWeights: ModelWeights,
    contextWeights: ModelWeights,
    position: number
  ): Promise<OptimizationResult> {
    const originalScore = recommendation.confidence

    // Get historical performance for this type of recommendation
    const historicalMetrics = await recommendationAnalyticsService.getRecommendationMetrics(
      recommendation.id
    )

    // Calculate component scores
    const collaborativeScore = await this.calculateCollaborativeScore(recommendation, userId)
    const contentScore = this.calculateContentScore(recommendation, context)
    const contextualScore = this.calculateContextualScore(recommendation, context)
    const popularityScore = this.calculatePopularityScore(recommendation, historicalMetrics)
    const diversityScore = this.calculateDiversityScore(recommendation, position)
    const recencyScore = this.calculateRecencyScore(recommendation)

    // Combine weights (segment + context + base)
    const combinedWeights = this.combineWeights([this.modelWeights, segmentWeights, contextWeights])

    // Calculate optimized score
    const optimizedScore = 
      collaborativeScore * combinedWeights.collaborative +
      contentScore * combinedWeights.contentBased +
      contextualScore * combinedWeights.contextual +
      popularityScore * combinedWeights.popularity +
      diversityScore * combinedWeights.diversity +
      recencyScore * combinedWeights.recency

    // Apply position bias correction
    const positionBiasCorrection = this.calculatePositionBiasCorrection(position, historicalMetrics)
    const finalScore = optimizedScore * positionBiasCorrection

    const adjustments = {
      collaborative: collaborativeScore * combinedWeights.collaborative,
      contentBased: contentScore * combinedWeights.contentBased,
      contextual: contextualScore * combinedWeights.contextual,
      popularity: popularityScore * combinedWeights.popularity,
      diversity: diversityScore * combinedWeights.diversity,
      recency: recencyScore * combinedWeights.recency,
      positionBias: positionBiasCorrection
    }

    const result: OptimizationResult = {
      recommendationId: recommendation.id,
      originalScore,
      optimizedScore: finalScore,
      adjustments,
      confidence: Math.min(Math.max(finalScore, 0), 1),
      reason: this.generateOptimizationReason(adjustments, combinedWeights)
    }

    this.optimizationHistory.push(result)
    return result
  }

  /**
   * Calculate collaborative filtering score
   */
  private async calculateCollaborativeScore(
    recommendation: PersonalizedRecommendation,
    userId: string
  ): Promise<number> {
    try {
      // This would typically call the ML service for collaborative filtering
      // For now, we'll use a simplified approach based on recommendation type and user history
      
      const userHistory = await this.getUserHistory(userId)
      const similarUsers = await this.findSimilarUsers(userId)
      
      // Calculate score based on similar users' preferences
      let score = 0.5 // Base score
      
      if (similarUsers.length > 0) {
        const typePreference = this.calculateTypePreference(recommendation.type, similarUsers)
        score = (score + typePreference) / 2
      }

      return Math.min(Math.max(score, 0), 1)
    } catch (error) {
      console.error('Error calculating collaborative score:', error)
      return 0.5
    }
  }

  /**
   * Calculate content-based score
   */
  private calculateContentScore(
    recommendation: PersonalizedRecommendation,
    context: RecommendationContext
  ): number {
    let score = 0.5

    // Budget alignment
    if (context.budgetStatus && recommendation.actionData?.estimatedCost) {
      const budgetAlignment = this.calculateBudgetAlignment(
        recommendation.actionData.estimatedCost,
        context.budgetStatus
      )
      score = (score + budgetAlignment) / 2
    }

    // Time preference alignment
    if (context.timeOfDay !== undefined) {
      const timeAlignment = this.calculateTimeAlignment(recommendation, context.timeOfDay)
      score = (score + timeAlignment) / 2
    }

    // Transport mode preference
    if (context.preferredModes && recommendation.actionData?.transportMode) {
      const modeAlignment = context.preferredModes.includes(recommendation.actionData.transportMode) ? 1 : 0.3
      score = (score + modeAlignment) / 2
    }

    return Math.min(Math.max(score, 0), 1)
  }

  /**
   * Calculate contextual score
   */
  private calculateContextualScore(
    recommendation: PersonalizedRecommendation,
    context: RecommendationContext
  ): number {
    let score = 0.5

    // Weather impact
    if (context.weather) {
      const weatherScore = this.calculateWeatherScore(recommendation, context.weather)
      score = (score + weatherScore) / 2
    }

    // Traffic conditions
    if (context.trafficConditions) {
      const trafficScore = this.calculateTrafficScore(recommendation, context.trafficConditions)
      score = (score + trafficScore) / 2
    }

    // Location relevance
    if (context.currentLocation && recommendation.actionData?.origin) {
      const locationScore = this.calculateLocationRelevance(
        context.currentLocation,
        recommendation.actionData.origin
      )
      score = (score + locationScore) / 2
    }

    return Math.min(Math.max(score, 0), 1)
  }

  /**
   * Calculate popularity score
   */
  private calculatePopularityScore(
    recommendation: PersonalizedRecommendation,
    metrics: any
  ): number {
    if (!metrics || metrics.impressions === 0) return 0.5

    // Combine acceptance rate and conversion rate
    const acceptanceWeight = 0.6
    const conversionWeight = 0.4
    
    const score = 
      metrics.acceptance_rate * acceptanceWeight +
      metrics.conversion_rate * conversionWeight

    return Math.min(Math.max(score, 0), 1)
  }

  /**
   * Calculate diversity score
   */
  private calculateDiversityScore(
    recommendation: PersonalizedRecommendation,
    position: number
  ): number {
    // Encourage diversity by giving higher scores to different types in later positions
    const diversityBonus = position > 0 ? 0.1 * position : 0
    const baseScore = 0.5
    
    return Math.min(baseScore + diversityBonus, 1)
  }

  /**
   * Calculate recency score
   */
  private calculateRecencyScore(recommendation: PersonalizedRecommendation): number {
    const now = Date.now()
    const createdTime = new Date(recommendation.createdAt || now).getTime()
    const ageHours = (now - createdTime) / (1000 * 60 * 60)
    
    // Fresher recommendations get higher scores
    const recencyScore = Math.exp(-ageHours / 24) // Decay over 24 hours
    return Math.min(Math.max(recencyScore, 0.1), 1)
  }

  /**
   * Apply diversity and exploration
   */
  private applyDiversityAndExploration(
    recommendations: PersonalizedRecommendation[],
    context: RecommendationContext
  ): PersonalizedRecommendation[] {
    const result = [...recommendations]
    
    // Apply exploration (epsilon-greedy)
    if (Math.random() < this.config.explorationRate) {
      // Randomly promote a lower-ranked recommendation
      const explorationIndex = Math.floor(Math.random() * Math.min(result.length, 5)) + 2
      if (explorationIndex < result.length) {
        const exploredRec = result.splice(explorationIndex, 1)[0]
        result.splice(1, 0, {
          ...exploredRec,
          explorationFlag: true,
          confidence: exploredRec.confidence * 0.9 // Slightly reduce confidence to indicate exploration
        })
      }
    }

    // Ensure type diversity in top recommendations
    const topRecommendations = result.slice(0, 3)
    const types = new Set(topRecommendations.map(r => r.type))
    
    if (types.size < Math.min(3, result.length)) {
      // Find recommendations of different types to promote
      for (let i = 3; i < result.length && types.size < 3; i++) {
        if (!types.has(result[i].type)) {
          const diverseRec = result.splice(i, 1)[0]
          result.splice(types.size, 0, diverseRec)
          types.add(diverseRec.type)
        }
      }
    }

    return result
  }

  /**
   * Update model weights based on performance feedback
   */
  async updateModelWeights(userId: string, feedback: any): Promise<void> {
    try {
      const userSegment = await this.getUserSegment(userId)
      const currentWeights = this.userSegmentWeights.get(userSegment) || this.modelWeights

      // Calculate weight adjustments based on feedback
      const adjustments = this.calculateWeightAdjustments(feedback, currentWeights)
      
      // Apply learning rate
      const updatedWeights: ModelWeights = {
        collaborative: currentWeights.collaborative + adjustments.collaborative * this.config.learningRate,
        contentBased: currentWeights.contentBased + adjustments.contentBased * this.config.learningRate,
        contextual: currentWeights.contextual + adjustments.contextual * this.config.learningRate,
        popularity: currentWeights.popularity + adjustments.popularity * this.config.learningRate,
        diversity: currentWeights.diversity + adjustments.diversity * this.config.learningRate,
        recency: currentWeights.recency + adjustments.recency * this.config.learningRate
      }

      // Normalize weights
      const normalizedWeights = this.normalizeWeights(updatedWeights)
      
      // Update segment weights
      this.userSegmentWeights.set(userSegment, normalizedWeights)

      // Decay exploration rate
      this.config.explorationRate = Math.max(
        this.config.explorationRate * this.config.decayRate,
        this.config.minExplorationRate
      )

    } catch (error) {
      console.error('Error updating model weights:', error)
    }
  }

  /**
   * Start A/B test
   */
  startABTest(config: ABTestConfig): void {
    this.abTests.set(config.testId, config)
    console.log(`🧪 Started A/B test: ${config.testId}`)
  }

  /**
   * Get A/B test variant for user
   */
  getABTestVariant(testId: string, userId: string): string | null {
    const test = this.abTests.get(testId)
    if (!test) return null

    // Simple hash-based assignment
    const hash = this.hashUserId(userId)
    let cumulativeAllocation = 0
    
    for (const variant of test.variants) {
      cumulativeAllocation += variant.trafficAllocation
      if (hash < cumulativeAllocation) {
        return variant.id
      }
    }

    return test.variants[0]?.id || null
  }

  /**
   * Helper methods
   */
  private initializeSegmentWeights(): void {
    // Initialize different weight configurations for different user segments
    this.userSegmentWeights.set('budget_conscious', {
      collaborative: 0.2,
      contentBased: 0.4,
      contextual: 0.2,
      popularity: 0.1,
      diversity: 0.05,
      recency: 0.05
    })

    this.userSegmentWeights.set('time_sensitive', {
      collaborative: 0.25,
      contentBased: 0.3,
      contextual: 0.3,
      popularity: 0.1,
      diversity: 0.03,
      recency: 0.02
    })

    this.userSegmentWeights.set('exploratory', {
      collaborative: 0.2,
      contentBased: 0.2,
      contextual: 0.2,
      popularity: 0.05,
      diversity: 0.25,
      recency: 0.1
    })
  }

  private async getUserSegment(userId: string): Promise<string> {
    // This would typically call the analytics service to determine user segment
    // For now, return a default segment
    return 'general'
  }

  private getContextKey(context: RecommendationContext): string {
    const timeSlot = this.getTimeSlot(context.timeOfDay || 12)
    const dayType = this.getDayType(context.dayOfWeek || 1)
    const weather = context.weather?.condition || 'clear'
    
    return `${timeSlot}_${dayType}_${weather}`
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 10) return 'morning_rush'
    if (hour >= 10 && hour < 16) return 'midday'
    if (hour >= 16 && hour < 20) return 'evening_rush'
    return 'off_peak'
  }

  private getDayType(dayOfWeek: number): string {
    return dayOfWeek >= 1 && dayOfWeek <= 5 ? 'weekday' : 'weekend'
  }

  private combineWeights(weightArrays: ModelWeights[]): ModelWeights {
    const combined: ModelWeights = {
      collaborative: 0,
      contentBased: 0,
      contextual: 0,
      popularity: 0,
      diversity: 0,
      recency: 0
    }

    weightArrays.forEach(weights => {
      Object.keys(combined).forEach(key => {
        combined[key as keyof ModelWeights] += weights[key as keyof ModelWeights] / weightArrays.length
      })
    })

    return this.normalizeWeights(combined)
  }

  private normalizeWeights(weights: ModelWeights): ModelWeights {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0)
    if (sum === 0) return weights

    return {
      collaborative: weights.collaborative / sum,
      contentBased: weights.contentBased / sum,
      contextual: weights.contextual / sum,
      popularity: weights.popularity / sum,
      diversity: weights.diversity / sum,
      recency: weights.recency / sum
    }
  }

  private calculatePositionBiasCorrection(position: number, metrics: any): number {
    // Correct for position bias - higher positions get more clicks naturally
    const positionBias = 1 / Math.log2(position + 2)
    return Math.min(Math.max(positionBias, 0.5), 1.5)
  }

  private generateOptimizationReason(adjustments: any, weights: ModelWeights): string {
    const maxAdjustment = Object.entries(adjustments).reduce((max, [key, value]) => 
      Math.abs(value as number) > Math.abs(max.value) ? { key, value: value as number } : max,
      { key: '', value: 0 }
    )

    const reasons = {
      collaborative: 'Similar users prefer this option',
      contentBased: 'Matches your preferences',
      contextual: 'Good for current conditions',
      popularity: 'Popular among users',
      diversity: 'Adds variety to recommendations',
      recency: 'Fresh recommendation',
      positionBias: 'Position-adjusted score'
    }

    return reasons[maxAdjustment.key as keyof typeof reasons] || 'Optimized based on multiple factors'
  }

  private hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647 // Normalize to 0-1
  }

  private startOptimizationLoop(): void {
    setInterval(async () => {
      try {
        await this.performBatchOptimization()
      } catch (error) {
        console.error('Error in optimization loop:', error)
      }
    }, this.config.updateFrequency)
  }

  private async performBatchOptimization(): Promise<void> {
    // This would perform batch optimization based on accumulated feedback
    console.log('🔄 Performing batch optimization...')
    
    // Update exploration rate
    this.config.explorationRate = Math.max(
      this.config.explorationRate * this.config.decayRate,
      this.config.minExplorationRate
    )
  }

  // Placeholder methods that would be implemented with real data
  private async getUserHistory(userId: string): Promise<any[]> { return [] }
  private async findSimilarUsers(userId: string): Promise<any[]> { return [] }
  private calculateTypePreference(type: string, users: any[]): number { return 0.5 }
  private calculateBudgetAlignment(cost: number, budgetStatus: string): number { return 0.5 }
  private calculateTimeAlignment(rec: PersonalizedRecommendation, hour: number): number { return 0.5 }
  private calculateWeatherScore(rec: PersonalizedRecommendation, weather: any): number { return 0.5 }
  private calculateTrafficScore(rec: PersonalizedRecommendation, traffic: any): number { return 0.5 }
  private calculateLocationRelevance(current: any, target: any): number { return 0.5 }
  private calculateWeightAdjustments(feedback: any, weights: ModelWeights): ModelWeights { return weights }
}

// Export singleton instance
export const recommendationOptimizationService = new RecommendationOptimizationService()
export default recommendationOptimizationService