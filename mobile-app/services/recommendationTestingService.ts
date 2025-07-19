/**
 * 🧪 Recommendation Testing Service
 * A/B testing, validation, and quality assurance for recommendations
 */

import { PersonalizedRecommendation, RecommendationContext } from './personalizedRecommendationService'
import { recommendationAnalyticsService } from './recommendationAnalyticsService'
import { recommendationOptimizationService } from './recommendationOptimizationService'

interface TestScenario {
  id: string
  name: string
  description: string
  context: RecommendationContext
  expectedOutcomes: {
    minRecommendations: number
    maxRecommendations: number
    expectedTypes: string[]
    minConfidence: number
    maxResponseTime: number
  }
  validationRules: ValidationRule[]
}

interface ValidationRule {
  id: string
  name: string
  type: 'content' | 'performance' | 'business' | 'user_experience'
  severity: 'error' | 'warning' | 'info'
  validator: (recommendations: PersonalizedRecommendation[], context: RecommendationContext) => ValidationResult
}

interface ValidationResult {
  passed: boolean
  message: string
  details?: any
  score?: number
}

interface TestResult {
  scenarioId: string
  timestamp: string
  recommendations: PersonalizedRecommendation[]
  context: RecommendationContext
  responseTime: number
  validationResults: Array<ValidationResult & { ruleId: string; ruleName: string; severity: string }>
  overallScore: number
  passed: boolean
}

interface ABTestResult {
  testId: string
  variantId: string
  metrics: {
    impressions: number
    clicks: number
    accepts: number
    conversions: number
    ctr: number
    acceptance_rate: number
    conversion_rate: number
    avg_rating: number
  }
  statisticalSignificance: number
  confidence: number
}

class RecommendationTestingService {
  private testScenarios: Map<string, TestScenario> = new Map()
  private validationRules: Map<string, ValidationRule> = new Map()
  private testResults: TestResult[] = []
  private abTestResults: Map<string, ABTestResult[]> = new Map()

  constructor() {
    this.initializeTestScenarios()
    this.initializeValidationRules()
  }

  /**
   * Run comprehensive test suite
   */
  async runTestSuite(userId: string = 'test_user'): Promise<{
    overallScore: number
    totalTests: number
    passedTests: number
    failedTests: number
    results: TestResult[]
    summary: {
      performance: number
      content: number
      business: number
      userExperience: number
    }
  }> {
    console.log('🧪 Running recommendation test suite...')
    
    const results: TestResult[] = []
    let totalScore = 0
    let passedTests = 0

    for (const [scenarioId, scenario] of this.testScenarios) {
      try {
        const result = await this.runTestScenario(scenarioId, userId)
        results.push(result)
        totalScore += result.overallScore
        if (result.passed) passedTests++
      } catch (error) {
        console.error(`Error running test scenario ${scenarioId}:`, error)
      }
    }

    const overallScore = results.length > 0 ? totalScore / results.length : 0
    const summary = this.calculateSummaryScores(results)

    return {
      overallScore,
      totalTests: results.length,
      passedTests,
      failedTests: results.length - passedTests,
      results,
      summary
    }
  }

  /**
   * Run individual test scenario
   */
  async runTestScenario(scenarioId: string, userId: string): Promise<TestResult> {
    const scenario = this.testScenarios.get(scenarioId)
    if (!scenario) {
      throw new Error(`Test scenario ${scenarioId} not found`)
    }

    const startTime = Date.now()
    
    // Get recommendations for the test scenario
    const { personalizedRecommendationService } = await import('./personalizedRecommendationService')
    const recommendations = await personalizedRecommendationService.getPersonalizedRecommendations(
      userId,
      scenario.context,
      scenario.expectedOutcomes.maxRecommendations
    )

    const responseTime = Date.now() - startTime

    // Run validation rules
    const validationResults = scenario.validationRules.map(rule => {
      const result = rule.validator(recommendations, scenario.context)
      return {
        ...result,
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity
      }
    })

    // Calculate overall score
    const overallScore = this.calculateOverallScore(validationResults, responseTime, scenario.expectedOutcomes.maxResponseTime)
    
    // Determine if test passed
    const passed = validationResults.every(result => 
      result.severity === 'info' || result.passed
    ) && responseTime <= scenario.expectedOutcomes.maxResponseTime

    const testResult: TestResult = {
      scenarioId,
      timestamp: new Date().toISOString(),
      recommendations,
      context: scenario.context,
      responseTime,
      validationResults,
      overallScore,
      passed
    }

    this.testResults.push(testResult)
    return testResult
  }

  /**
   * Run A/B test
   */
  async runABTest(
    testId: string,
    variants: Array<{ id: string; config: any }>,
    duration: number,
    sampleSize: number
  ): Promise<void> {
    console.log(`🧪 Starting A/B test: ${testId}`)
    
    // Initialize A/B test in optimization service
    const abTestConfig = {
      testId,
      variants: variants.map(v => ({
        id: v.id,
        name: v.id,
        weights: v.config.weights || {},
        trafficAllocation: 1 / variants.length
      })),
      duration,
      successMetric: 'acceptance_rate' as const,
      minSampleSize: sampleSize
    }

    recommendationOptimizationService.startABTest(abTestConfig)

    // Schedule test completion
    setTimeout(async () => {
      await this.completeABTest(testId)
    }, duration)
  }

  /**
   * Complete A/B test and analyze results
   */
  async completeABTest(testId: string): Promise<ABTestResult[]> {
    console.log(`🧪 Completing A/B test: ${testId}`)
    
    try {
      const testResults = await recommendationAnalyticsService.getABTestResults(testId)
      
      const results: ABTestResult[] = testResults.variants.map(variant => ({
        testId,
        variantId: variant.id,
        metrics: {
          impressions: variant.metrics.impressions,
          clicks: variant.metrics.clicks,
          accepts: variant.metrics.accepts,
          conversions: variant.metrics.conversions,
          ctr: variant.metrics.ctr,
          acceptance_rate: variant.metrics.acceptance_rate,
          conversion_rate: variant.metrics.conversion_rate,
          avg_rating: variant.metrics.avg_rating
        },
        statisticalSignificance: variant.statistical_significance || 0,
        confidence: testResults.confidence
      }))

      this.abTestResults.set(testId, results)
      return results
    } catch (error) {
      console.error(`Error completing A/B test ${testId}:`, error)
      return []
    }
  }

  /**
   * Validate recommendation quality
   */
  validateRecommendationQuality(
    recommendations: PersonalizedRecommendation[],
    context: RecommendationContext
  ): {
    score: number
    issues: Array<{ severity: string; message: string }>
    suggestions: string[]
  } {
    const issues: Array<{ severity: string; message: string }> = []
    const suggestions: string[] = []
    let score = 100

    // Check for empty recommendations
    if (recommendations.length === 0) {
      issues.push({ severity: 'error', message: 'No recommendations generated' })
      score -= 50
    }

    // Check confidence scores
    const lowConfidenceRecs = recommendations.filter(r => r.confidence < 0.3)
    if (lowConfidenceRecs.length > 0) {
      issues.push({ 
        severity: 'warning', 
        message: `${lowConfidenceRecs.length} recommendations have low confidence scores` 
      })
      score -= 10 * lowConfidenceRecs.length
      suggestions.push('Consider improving the recommendation model or filtering low-confidence results')
    }

    // Check for diversity
    const types = new Set(recommendations.map(r => r.type))
    if (types.size < Math.min(3, recommendations.length)) {
      issues.push({ severity: 'warning', message: 'Low recommendation diversity' })
      score -= 15
      suggestions.push('Increase diversity in recommendation types')
    }

    // Check for contextual relevance
    if (context.budgetStatus === 'over' && recommendations.some(r => r.type === 'budget')) {
      issues.push({ severity: 'info', message: 'Budget recommendations shown despite over-budget status' })
      suggestions.push('Consider filtering budget recommendations when user is over budget')
    }

    // Check for duplicate recommendations
    const ids = recommendations.map(r => r.id)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      issues.push({ severity: 'error', message: 'Duplicate recommendations found' })
      score -= 25
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<{
    testSummary: {
      totalTests: number
      passedTests: number
      averageScore: number
      averageResponseTime: number
    }
    performanceMetrics: {
      p50ResponseTime: number
      p95ResponseTime: number
      p99ResponseTime: number
      errorRate: number
    }
    qualityMetrics: {
      averageConfidence: number
      diversityScore: number
      relevanceScore: number
    }
    recommendations: string[]
  }> {
    const responseTimes = this.testResults.map(r => r.responseTime).sort((a, b) => a - b)
    const scores = this.testResults.map(r => r.overallScore)
    const passedTests = this.testResults.filter(r => r.passed).length

    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)] || 0
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0

    const allRecommendations = this.testResults.flatMap(r => r.recommendations)
    const averageConfidence = allRecommendations.length > 0 
      ? allRecommendations.reduce((sum, r) => sum + r.confidence, 0) / allRecommendations.length 
      : 0

    const recommendations: string[] = []
    
    if (p95 > 2000) {
      recommendations.push('Consider optimizing recommendation generation for better response times')
    }
    
    if (averageConfidence < 0.6) {
      recommendations.push('Improve model training to increase recommendation confidence')
    }
    
    if (passedTests / this.testResults.length < 0.8) {
      recommendations.push('Review and fix failing test scenarios')
    }

    return {
      testSummary: {
        totalTests: this.testResults.length,
        passedTests,
        averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length || 0,
        averageResponseTime: responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length || 0
      },
      performanceMetrics: {
        p50ResponseTime: p50,
        p95ResponseTime: p95,
        p99ResponseTime: p99,
        errorRate: (this.testResults.length - passedTests) / this.testResults.length
      },
      qualityMetrics: {
        averageConfidence,
        diversityScore: this.calculateDiversityScore(allRecommendations),
        relevanceScore: this.calculateRelevanceScore(this.testResults)
      },
      recommendations
    }
  }

  /**
   * Initialize test scenarios
   */
  private initializeTestScenarios(): void {
    // Morning commute scenario
    this.testScenarios.set('morning_commute', {
      id: 'morning_commute',
      name: 'Morning Commute',
      description: 'Test recommendations for morning rush hour commute',
      context: {
        timeOfDay: 8,
        dayOfWeek: 1, // Monday
        currentLocation: { latitude: 5.6037, longitude: -0.1870 }, // Accra
        budgetStatus: 'under',
        weather: { condition: 'clear', temperature: 28 },
        trafficConditions: 'heavy'
      },
      expectedOutcomes: {
        minRecommendations: 3,
        maxRecommendations: 5,
        expectedTypes: ['route', 'time', 'mode'],
        minConfidence: 0.4,
        maxResponseTime: 2000
      },
      validationRules: [
        this.validationRules.get('response_time')!,
        this.validationRules.get('confidence_threshold')!,
        this.validationRules.get('recommendation_count')!,
        this.validationRules.get('type_diversity')!
      ].filter(Boolean)
    })

    // Budget-conscious scenario
    this.testScenarios.set('budget_conscious', {
      id: 'budget_conscious',
      name: 'Budget Conscious User',
      description: 'Test recommendations for users with tight budget constraints',
      context: {
        timeOfDay: 14,
        dayOfWeek: 3, // Wednesday
        currentLocation: { latitude: 5.6037, longitude: -0.1870 },
        budgetStatus: 'over',
        preferredModes: ['trotro', 'walking']
      },
      expectedOutcomes: {
        minRecommendations: 2,
        maxRecommendations: 4,
        expectedTypes: ['budget', 'mode'],
        minConfidence: 0.3,
        maxResponseTime: 1500
      },
      validationRules: [
        this.validationRules.get('response_time')!,
        this.validationRules.get('budget_relevance')!,
        this.validationRules.get('recommendation_count')!
      ].filter(Boolean)
    })

    // Weekend leisure scenario
    this.testScenarios.set('weekend_leisure', {
      id: 'weekend_leisure',
      name: 'Weekend Leisure',
      description: 'Test recommendations for weekend leisure travel',
      context: {
        timeOfDay: 11,
        dayOfWeek: 6, // Saturday
        currentLocation: { latitude: 5.6037, longitude: -0.1870 },
        budgetStatus: 'under',
        weather: { condition: 'sunny', temperature: 32 }
      },
      expectedOutcomes: {
        minRecommendations: 3,
        maxRecommendations: 5,
        expectedTypes: ['route', 'community', 'mode'],
        minConfidence: 0.3,
        maxResponseTime: 2000
      },
      validationRules: [
        this.validationRules.get('response_time')!,
        this.validationRules.get('confidence_threshold')!,
        this.validationRules.get('weekend_relevance')!
      ].filter(Boolean)
    })
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): void {
    // Response time validation
    this.validationRules.set('response_time', {
      id: 'response_time',
      name: 'Response Time',
      type: 'performance',
      severity: 'error',
      validator: (recommendations, context) => {
        // This will be checked separately in runTestScenario
        return { passed: true, message: 'Response time validation' }
      }
    })

    // Confidence threshold validation
    this.validationRules.set('confidence_threshold', {
      id: 'confidence_threshold',
      name: 'Confidence Threshold',
      type: 'content',
      severity: 'warning',
      validator: (recommendations, context) => {
        const lowConfidenceCount = recommendations.filter(r => r.confidence < 0.3).length
        const passed = lowConfidenceCount === 0
        return {
          passed,
          message: passed 
            ? 'All recommendations meet confidence threshold' 
            : `${lowConfidenceCount} recommendations below confidence threshold`,
          score: passed ? 100 : Math.max(0, 100 - (lowConfidenceCount * 20))
        }
      }
    })

    // Recommendation count validation
    this.validationRules.set('recommendation_count', {
      id: 'recommendation_count',
      name: 'Recommendation Count',
      type: 'content',
      severity: 'error',
      validator: (recommendations, context) => {
        const count = recommendations.length
        const passed = count >= 1 && count <= 10
        return {
          passed,
          message: passed 
            ? `Generated ${count} recommendations` 
            : `Invalid recommendation count: ${count}`,
          score: passed ? 100 : 0
        }
      }
    })

    // Type diversity validation
    this.validationRules.set('type_diversity', {
      id: 'type_diversity',
      name: 'Type Diversity',
      type: 'user_experience',
      severity: 'warning',
      validator: (recommendations, context) => {
        const types = new Set(recommendations.map(r => r.type))
        const diversityScore = types.size / Math.min(recommendations.length, 5) * 100
        const passed = diversityScore >= 60
        return {
          passed,
          message: passed 
            ? `Good type diversity: ${types.size} different types` 
            : `Low type diversity: ${types.size} different types`,
          score: diversityScore
        }
      }
    })

    // Budget relevance validation
    this.validationRules.set('budget_relevance', {
      id: 'budget_relevance',
      name: 'Budget Relevance',
      type: 'business',
      severity: 'warning',
      validator: (recommendations, context) => {
        if (context.budgetStatus === 'over') {
          const budgetRecommendations = recommendations.filter(r => r.type === 'budget')
          const passed = budgetRecommendations.length > 0
          return {
            passed,
            message: passed 
              ? 'Budget recommendations provided for over-budget user' 
              : 'No budget recommendations for over-budget user',
            score: passed ? 100 : 70
          }
        }
        return { passed: true, message: 'Budget status not over', score: 100 }
      }
    })

    // Weekend relevance validation
    this.validationRules.set('weekend_relevance', {
      id: 'weekend_relevance',
      name: 'Weekend Relevance',
      type: 'content',
      severity: 'info',
      validator: (recommendations, context) => {
        const isWeekend = context.dayOfWeek === 0 || context.dayOfWeek === 6
        if (isWeekend) {
          const leisureTypes = ['community', 'route', 'mode']
          const relevantRecs = recommendations.filter(r => leisureTypes.includes(r.type))
          const passed = relevantRecs.length > 0
          return {
            passed,
            message: passed 
              ? 'Weekend-appropriate recommendations provided' 
              : 'No weekend-specific recommendations',
            score: passed ? 100 : 80
          }
        }
        return { passed: true, message: 'Not weekend', score: 100 }
      }
    })
  }

  /**
   * Helper methods
   */
  private calculateOverallScore(
    validationResults: Array<ValidationResult & { severity: string }>,
    responseTime: number,
    maxResponseTime: number
  ): number {
    let score = 100

    // Deduct points for failed validations
    validationResults.forEach(result => {
      if (!result.passed) {
        const deduction = result.severity === 'error' ? 25 : result.severity === 'warning' ? 10 : 5
        score -= deduction
      }
    })

    // Deduct points for slow response time
    if (responseTime > maxResponseTime) {
      const timeoutPenalty = Math.min(30, (responseTime - maxResponseTime) / 100)
      score -= timeoutPenalty
    }

    return Math.max(0, score)
  }

  private calculateSummaryScores(results: TestResult[]): {
    performance: number
    content: number
    business: number
    userExperience: number
  } {
    const categories = {
      performance: results.flatMap(r => r.validationResults.filter(v => v.severity === 'performance')),
      content: results.flatMap(r => r.validationResults.filter(v => v.severity === 'content')),
      business: results.flatMap(r => r.validationResults.filter(v => v.severity === 'business')),
      userExperience: results.flatMap(r => r.validationResults.filter(v => v.severity === 'user_experience'))
    }

    return {
      performance: this.calculateCategoryScore(categories.performance),
      content: this.calculateCategoryScore(categories.content),
      business: this.calculateCategoryScore(categories.business),
      userExperience: this.calculateCategoryScore(categories.userExperience)
    }
  }

  private calculateCategoryScore(validationResults: any[]): number {
    if (validationResults.length === 0) return 100
    
    const scores = validationResults.map(r => r.score || (r.passed ? 100 : 0))
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  private calculateDiversityScore(recommendations: PersonalizedRecommendation[]): number {
    if (recommendations.length === 0) return 0
    
    const types = new Set(recommendations.map(r => r.type))
    return (types.size / Math.min(recommendations.length, 5)) * 100
  }

  private calculateRelevanceScore(testResults: TestResult[]): number {
    const relevanceScores = testResults.map(result => {
      const contextualRules = result.validationResults.filter(v => 
        v.ruleId.includes('relevance') || v.ruleId.includes('budget') || v.ruleId.includes('weekend')
      )
      
      if (contextualRules.length === 0) return 100
      
      const avgScore = contextualRules.reduce((sum, rule) => sum + (rule.score || 0), 0) / contextualRules.length
      return avgScore
    })

    return relevanceScores.length > 0 
      ? relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length 
      : 100
  }
}

// Export singleton instance
export const recommendationTestingService = new RecommendationTestingService()
export default recommendationTestingService