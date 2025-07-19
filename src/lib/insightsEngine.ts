// Actionable Insights Engine for Accra Transport Optimization
import { gtfsAnalyzer } from './gtfsAnalyzer'
import { routeOptimizer } from './routeOptimizer'
import { emissionsCalculator } from './emissionsCalculator'

interface ActionableInsight {
  id: string
  title: string
  description: string
  category: 'route_optimization' | 'schedule_improvement' | 'emission_reduction' | 'cost_saving' | 'service_expansion'
  priority: 'critical' | 'high' | 'medium' | 'low'
  impact: {
    timeReduction: number // minutes per day
    costSaving: number // GHS per month
    emissionReduction: number // kg CO2 per day
    passengerBenefit: number // additional passengers served
    efficiencyGain: number // percentage improvement
  }
  implementation: {
    timeline: string
    cost: number // GHS
    complexity: 'low' | 'medium' | 'high'
    resources: string[]
    stakeholders: string[]
    risks: string[]
    dependencies: string[]
  }
  validation: {
    dataConfidence: number // 0-100%
    historicalEvidence: string[]
    similarCases: string[]
    successProbability: number // 0-100%
  }
  monitoring: {
    kpis: string[]
    measurementPlan: string
    reviewFrequency: string
    successCriteria: string[]
  }
}

interface ImplementationRoadmap {
  phase: number
  name: string
  duration: string
  insights: ActionableInsight[]
  totalCost: number
  totalBenefit: number
  roi: number
  prerequisites: string[]
  deliverables: string[]
}

interface ROIAnalysis {
  insightId: string
  investmentCost: number // GHS
  annualBenefit: number // GHS per year
  paybackPeriod: number // years
  npv: number // Net Present Value
  irr: number // Internal Rate of Return
  riskAdjustedROI: number
  sensitivityAnalysis: {
    optimistic: number
    realistic: number
    pessimistic: number
  }
}

export class InsightsEngine {
  private currentBaseline: any
  private optimizationResults: any
  private emissionAnalysis: any

  constructor() {
    this.currentBaseline = null
    this.optimizationResults = null
    this.emissionAnalysis = null
  }

  // Generate comprehensive actionable insights
  async generateActionableInsights(): Promise<ActionableInsight[]> {
    console.log('🔍 Generating actionable insights for Accra transport system...')

    // Analyze current system
    this.currentBaseline = gtfsAnalyzer.calculateSystemBaseline()
    const routePerformance = gtfsAnalyzer.analyzeRoutePerformance()
    const serviceGaps = gtfsAnalyzer.identifyServiceGaps()
    const optimizationOpportunities = gtfsAnalyzer.identifyOptimizationOpportunities()

    const insights: ActionableInsight[] = []

    // Route optimization insights
    insights.push(...this.generateRouteOptimizationInsights(routePerformance))

    // Service gap insights
    insights.push(...this.generateServiceExpansionInsights(serviceGaps))

    // Emission reduction insights
    insights.push(...this.generateEmissionReductionInsights(routePerformance))

    // Cost optimization insights
    insights.push(...this.generateCostOptimizationInsights(routePerformance))

    // Schedule optimization insights
    insights.push(...this.generateScheduleOptimizationInsights(routePerformance))

    // Sort by priority and impact
    return insights.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 }
      const aPriority = priorityWeight[a.priority]
      const bPriority = priorityWeight[b.priority]
      
      if (aPriority !== bPriority) return bPriority - aPriority
      
      // If same priority, sort by total impact score
      const aImpact = a.impact.timeReduction + a.impact.costSaving/100 + a.impact.emissionReduction + a.impact.efficiencyGain
      const bImpact = b.impact.timeReduction + b.impact.costSaving/100 + b.impact.emissionReduction + b.impact.efficiencyGain
      
      return bImpact - aImpact
    })
  }

  // Generate implementation roadmap
  generateImplementationRoadmap(insights: ActionableInsight[]): ImplementationRoadmap[] {
    const phases: ImplementationRoadmap[] = []

    // Phase 1: Quick wins (0-6 months)
    const quickWins = insights.filter(i => 
      i.implementation.complexity === 'low' && 
      i.implementation.cost < 100000 &&
      (i.priority === 'critical' || i.priority === 'high')
    )

    phases.push({
      phase: 1,
      name: 'Quick Wins & Foundation',
      duration: '0-6 months',
      insights: quickWins,
      totalCost: quickWins.reduce((sum, i) => sum + i.implementation.cost, 0),
      totalBenefit: quickWins.reduce((sum, i) => sum + i.impact.costSaving * 6, 0),
      roi: this.calculatePhaseROI(quickWins, 6),
      prerequisites: ['Management approval', 'Basic data collection'],
      deliverables: ['Optimized schedules', 'Route adjustments', 'Performance baseline']
    })

    // Phase 2: Medium-term improvements (6-18 months)
    const mediumTerm = insights.filter(i => 
      i.implementation.complexity === 'medium' && 
      i.implementation.cost < 500000 &&
      !quickWins.includes(i)
    )

    phases.push({
      phase: 2,
      name: 'System Optimization',
      duration: '6-18 months',
      insights: mediumTerm,
      totalCost: mediumTerm.reduce((sum, i) => sum + i.implementation.cost, 0),
      totalBenefit: mediumTerm.reduce((sum, i) => sum + i.impact.costSaving * 12, 0),
      roi: this.calculatePhaseROI(mediumTerm, 12),
      prerequisites: ['Phase 1 completion', 'Technology infrastructure', 'Staff training'],
      deliverables: ['New route implementations', 'Fleet optimization', 'Emission reductions']
    })

    // Phase 3: Long-term transformation (18+ months)
    const longTerm = insights.filter(i => 
      !quickWins.includes(i) && !mediumTerm.includes(i)
    )

    phases.push({
      phase: 3,
      name: 'System Transformation',
      duration: '18+ months',
      insights: longTerm,
      totalCost: longTerm.reduce((sum, i) => sum + i.implementation.cost, 0),
      totalBenefit: longTerm.reduce((sum, i) => sum + i.impact.costSaving * 24, 0),
      roi: this.calculatePhaseROI(longTerm, 24),
      prerequisites: ['Phase 2 completion', 'Major infrastructure investment', 'Policy changes'],
      deliverables: ['Complete system overhaul', 'Smart transport integration', 'Sustainability goals']
    })

    return phases
  }

  // Calculate comprehensive ROI analysis
  calculateROIAnalysis(insights: ActionableInsight[]): ROIAnalysis[] {
    return insights.map(insight => {
      const investmentCost = insight.implementation.cost
      const annualBenefit = insight.impact.costSaving * 12
      const paybackPeriod = investmentCost / annualBenefit
      
      // Calculate NPV with 10% discount rate over 5 years
      const discountRate = 0.10
      const years = 5
      let npv = -investmentCost
      
      for (let year = 1; year <= years; year++) {
        npv += annualBenefit / Math.pow(1 + discountRate, year)
      }

      // Calculate IRR (simplified)
      const irr = (annualBenefit / investmentCost) - 1

      // Risk adjustment based on complexity and confidence
      const riskFactor = this.calculateRiskFactor(insight)
      const riskAdjustedROI = (annualBenefit * riskFactor) / investmentCost

      return {
        insightId: insight.id,
        investmentCost,
        annualBenefit,
        paybackPeriod,
        npv,
        irr,
        riskAdjustedROI,
        sensitivityAnalysis: {
          optimistic: riskAdjustedROI * 1.3,
          realistic: riskAdjustedROI,
          pessimistic: riskAdjustedROI * 0.7
        }
      }
    })
  }

  // Generate route optimization insights
  private generateRouteOptimizationInsights(routePerformance: any[]): ActionableInsight[] {
    const insights: ActionableInsight[] = []

    // Identify inefficient routes
    const inefficientRoutes = routePerformance.filter(route => route.efficiency < 50)
    
    if (inefficientRoutes.length > 0) {
      insights.push({
        id: 'route_efficiency_improvement',
        title: 'Optimize Low-Efficiency Routes',
        description: `${inefficientRoutes.length} routes show efficiency below 50%. Consolidating stops and adjusting frequencies could improve performance by 25-40%.`,
        category: 'route_optimization',
        priority: 'high',
        impact: {
          timeReduction: 15 * inefficientRoutes.length,
          costSaving: 8000 * inefficientRoutes.length,
          emissionReduction: 200 * inefficientRoutes.length,
          passengerBenefit: 500 * inefficientRoutes.length,
          efficiencyGain: 30
        },
        implementation: {
          timeline: '3-6 months',
          cost: 50000,
          complexity: 'medium',
          resources: ['Route planners', 'Data analysts', 'Field supervisors'],
          stakeholders: ['Transport operators', 'Passengers', 'Local communities'],
          risks: ['Passenger resistance', 'Operator pushback', 'Initial service disruption'],
          dependencies: ['Route performance data', 'Passenger feedback', 'Operator cooperation']
        },
        validation: {
          dataConfidence: 85,
          historicalEvidence: ['Lagos BRT optimization (2019)', 'Nairobi matatu reforms (2020)'],
          similarCases: ['Cape Town MyCiTi improvements', 'Dar es Salaam BRT Phase 2'],
          successProbability: 75
        },
        monitoring: {
          kpis: ['Route efficiency', 'Passenger satisfaction', 'Operating costs', 'Travel times'],
          measurementPlan: 'Monthly performance reviews with GPS tracking data',
          reviewFrequency: 'Monthly',
          successCriteria: ['25% efficiency improvement', '15% cost reduction', '90% passenger satisfaction']
        }
      })
    }

    return insights
  }

  // Generate service expansion insights
  private generateServiceExpansionInsights(serviceGaps: any[]): ActionableInsight[] {
    const insights: ActionableInsight[] = []

    const highPriorityGaps = serviceGaps.filter(gap => gap.severity === 'high')
    
    if (highPriorityGaps.length > 0) {
      const totalUnderserved = highPriorityGaps.reduce((sum, gap) => sum + gap.population, 0)
      
      insights.push({
        id: 'service_gap_expansion',
        title: 'Address Critical Service Gaps',
        description: `${highPriorityGaps.length} areas with ${totalUnderserved.toLocaleString()} residents lack adequate transport access. New routes or extensions could serve these communities.`,
        category: 'service_expansion',
        priority: 'critical',
        impact: {
          timeReduction: 30,
          costSaving: 0, // Initial investment, savings come later
          emissionReduction: -100, // May increase initially
          passengerBenefit: totalUnderserved * 0.3, // 30% adoption rate
          efficiencyGain: 15
        },
        implementation: {
          timeline: '6-12 months',
          cost: 200000 * highPriorityGaps.length,
          complexity: 'high',
          resources: ['New vehicles', 'Drivers', 'Route infrastructure', 'Stops/stations'],
          stakeholders: ['Underserved communities', 'Local government', 'Transport operators'],
          risks: ['High initial costs', 'Low initial ridership', 'Infrastructure challenges'],
          dependencies: ['Community engagement', 'Infrastructure development', 'Regulatory approval']
        },
        validation: {
          dataConfidence: 70,
          historicalEvidence: ['Accra BRT expansion (2016)', 'Kumasi metro bus (2018)'],
          similarCases: ['Kigali bus network expansion', 'Addis Ababa light rail'],
          successProbability: 65
        },
        monitoring: {
          kpis: ['Ridership growth', 'Service coverage', 'Community satisfaction', 'Revenue per km'],
          measurementPlan: 'Quarterly ridership surveys and GPS tracking',
          reviewFrequency: 'Quarterly',
          successCriteria: ['50% ridership target within 12 months', '80% community satisfaction']
        }
      })
    }

    return insights
  }

  // Generate emission reduction insights
  private generateEmissionReductionInsights(routePerformance: any[]): ActionableInsight[] {
    const insights: ActionableInsight[] = []

    const highEmissionRoutes = routePerformance.filter(route => route.emissions > 500)
    
    if (highEmissionRoutes.length > 0) {
      insights.push({
        id: 'emission_reduction_fleet',
        title: 'Transition to Low-Emission Vehicles',
        description: `${highEmissionRoutes.length} routes have high emissions. Transitioning to CNG or electric buses could reduce emissions by 40-60%.`,
        category: 'emission_reduction',
        priority: 'high',
        impact: {
          timeReduction: 0,
          costSaving: 5000, // Fuel savings
          emissionReduction: 300 * highEmissionRoutes.length,
          passengerBenefit: 0,
          efficiencyGain: 10
        },
        implementation: {
          timeline: '12-24 months',
          cost: 800000 * highEmissionRoutes.length,
          complexity: 'high',
          resources: ['New vehicles', 'Charging/fueling infrastructure', 'Driver training'],
          stakeholders: ['Government', 'Transport operators', 'Environmental agencies'],
          risks: ['High capital costs', 'Technology reliability', 'Infrastructure requirements'],
          dependencies: ['Government incentives', 'Infrastructure development', 'Financing']
        },
        validation: {
          dataConfidence: 80,
          historicalEvidence: ['Santiago electric bus fleet', 'Shenzhen full electric transition'],
          similarCases: ['Bogotá CNG buses', 'Mexico City electric pilot'],
          successProbability: 70
        },
        monitoring: {
          kpis: ['CO2 emissions', 'Fuel costs', 'Vehicle reliability', 'Air quality'],
          measurementPlan: 'Monthly emissions monitoring and cost tracking',
          reviewFrequency: 'Monthly',
          successCriteria: ['40% emission reduction', '20% fuel cost savings', '95% vehicle availability']
        }
      })
    }

    return insights
  }

  // Helper methods
  private generateCostOptimizationInsights(routePerformance: any[]): ActionableInsight[] {
    // Implementation for cost optimization insights
    return []
  }

  private generateScheduleOptimizationInsights(routePerformance: any[]): ActionableInsight[] {
    // Implementation for schedule optimization insights
    return []
  }

  private calculatePhaseROI(insights: ActionableInsight[], months: number): number {
    const totalCost = insights.reduce((sum, i) => sum + i.implementation.cost, 0)
    const totalBenefit = insights.reduce((sum, i) => sum + i.impact.costSaving * months, 0)
    return totalCost > 0 ? (totalBenefit / totalCost) * 100 : 0
  }

  private calculateRiskFactor(insight: ActionableInsight): number {
    let riskFactor = 1.0

    // Adjust for complexity
    if (insight.implementation.complexity === 'high') riskFactor *= 0.8
    else if (insight.implementation.complexity === 'medium') riskFactor *= 0.9

    // Adjust for data confidence
    riskFactor *= insight.validation.dataConfidence / 100

    // Adjust for success probability
    riskFactor *= insight.validation.successProbability / 100

    return riskFactor
  }
}

export const insightsEngine = new InsightsEngine()
