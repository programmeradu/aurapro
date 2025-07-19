/**
 * 🚀 Enhanced Route Optimization System
 * Real-time traffic APIs, genetic algorithms, and fuel cost optimization
 */

import { apiService } from '@/services/apiService'

// Types and interfaces
export interface RoutePoint {
  id: string
  lat: number
  lng: number
  name: string
  type: 'stop' | 'depot' | 'waypoint'
  demand?: number
  timeWindow?: { start: number; end: number }
}

export interface Vehicle {
  id: string
  capacity: number
  fuelEfficiency: number // km per liter
  costPerKm: number
  maxWorkingHours: number
  currentLocation: RoutePoint
}

export interface TrafficData {
  segmentId: string
  currentSpeed: number
  freeFlowSpeed: number
  congestionLevel: number // 0-1
  travelTime: number
  lastUpdated: Date
}

export interface OptimizationConstraints {
  maxRouteTime: number
  maxRouteDistance: number
  vehicleCapacityConstraint: boolean
  timeWindowConstraint: boolean
  fuelBudgetConstraint?: number
}

export interface GeneticAlgorithmConfig {
  populationSize: number
  generations: number
  mutationRate: number
  crossoverRate: number
  elitismRate: number
  convergenceThreshold: number
}

export interface OptimizedRoute {
  id: string
  vehicleId: string
  points: RoutePoint[]
  totalDistance: number
  totalTime: number
  fuelCost: number
  co2Emissions: number
  efficiency: number
  trafficAware: boolean
}

export interface OptimizationResult {
  routes: OptimizedRoute[]
  totalCost: number
  totalTime: number
  totalDistance: number
  fuelSavings: number
  timeSavings: number
  co2Reduction: number
  algorithm: string
  confidence: number
}

// Real-time traffic integration
export class TrafficDataProvider {
  private cache: Map<string, TrafficData> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  async getTrafficData(routeSegments: string[]): Promise<Map<string, TrafficData>> {
    const trafficData = new Map<string, TrafficData>()
    
    for (const segmentId of routeSegments) {
      // Check cache first
      const cached = this.cache.get(segmentId)
      if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheTimeout) {
        trafficData.set(segmentId, cached)
        continue
      }

      try {
        // Get real-time traffic data from multiple sources
        const data = await this.fetchTrafficData(segmentId)
        this.cache.set(segmentId, data)
        trafficData.set(segmentId, data)
      } catch (error) {
        console.warn(`Failed to get traffic data for ${segmentId}:`, error)
        // Use fallback data
        trafficData.set(segmentId, this.getFallbackTrafficData(segmentId))
      }
    }

    return trafficData
  }

  private async fetchTrafficData(segmentId: string): Promise<TrafficData> {
    // Try multiple traffic data sources
    const sources = [
      () => this.getMapboxTrafficData(segmentId),
      () => this.getGoogleTrafficData(segmentId),
      () => this.getLocalTrafficData(segmentId)
    ]

    for (const source of sources) {
      try {
        return await source()
      } catch (error) {
        console.warn('Traffic source failed, trying next:', error)
      }
    }

    throw new Error(`No traffic data available for ${segmentId}`)
  }

  private async getMapboxTrafficData(segmentId: string): Promise<TrafficData> {
    // Mapbox Traffic API integration
    const response = await fetch(`/api/traffic/mapbox/${segmentId}`)
    if (!response.ok) throw new Error('Mapbox traffic API failed')
    
    const data = await response.json()
    return {
      segmentId,
      currentSpeed: data.current_speed,
      freeFlowSpeed: data.free_flow_speed,
      congestionLevel: data.congestion_level,
      travelTime: data.travel_time,
      lastUpdated: new Date()
    }
  }

  private async getGoogleTrafficData(segmentId: string): Promise<TrafficData> {
    // Google Maps Traffic API integration
    const response = await fetch(`/api/traffic/google/${segmentId}`)
    if (!response.ok) throw new Error('Google traffic API failed')
    
    const data = await response.json()
    return {
      segmentId,
      currentSpeed: data.speed_kmh,
      freeFlowSpeed: data.free_flow_speed,
      congestionLevel: data.congestion_factor,
      travelTime: data.duration_seconds / 60,
      lastUpdated: new Date()
    }
  }

  private async getLocalTrafficData(segmentId: string): Promise<TrafficData> {
    // Local traffic data from backend
    const response = await apiService.request(`/api/v1/traffic/${segmentId}`)
    return {
      segmentId,
      currentSpeed: response.current_speed,
      freeFlowSpeed: response.free_flow_speed,
      congestionLevel: response.congestion_level,
      travelTime: response.travel_time_minutes,
      lastUpdated: new Date()
    }
  }

  private getFallbackTrafficData(segmentId: string): TrafficData {
    // Fallback traffic data based on time of day and historical patterns
    const hour = new Date().getHours()
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
    
    return {
      segmentId,
      currentSpeed: isRushHour ? 25 : 45,
      freeFlowSpeed: 50,
      congestionLevel: isRushHour ? 0.7 : 0.3,
      travelTime: isRushHour ? 20 : 12,
      lastUpdated: new Date()
    }
  }
}

// Genetic Algorithm Implementation
export class GeneticRouteOptimizer {
  private config: GeneticAlgorithmConfig
  private trafficProvider: TrafficDataProvider

  constructor(config: GeneticAlgorithmConfig) {
    this.config = config
    this.trafficProvider = new TrafficDataProvider()
  }

  async optimize(
    vehicles: Vehicle[],
    points: RoutePoint[],
    constraints: OptimizationConstraints
  ): Promise<OptimizationResult> {
    console.log('🧬 Starting genetic algorithm optimization...')
    
    // Initialize population
    let population = this.initializePopulation(vehicles, points)
    let bestSolution: Individual | null = null
    let generationWithoutImprovement = 0

    for (let generation = 0; generation < this.config.generations; generation++) {
      // Evaluate fitness for all individuals
      const evaluatedPopulation = await this.evaluatePopulation(population, constraints)
      
      // Sort by fitness (higher is better)
      evaluatedPopulation.sort((a, b) => b.fitness - a.fitness)
      
      // Check for improvement
      if (!bestSolution || evaluatedPopulation[0].fitness > bestSolution.fitness) {
        bestSolution = evaluatedPopulation[0]
        generationWithoutImprovement = 0
      } else {
        generationWithoutImprovement++
      }

      // Early termination if converged
      if (generationWithoutImprovement > this.config.convergenceThreshold) {
        console.log(`🎯 Converged after ${generation} generations`)
        break
      }

      // Create next generation
      population = this.createNextGeneration(evaluatedPopulation)
      
      if (generation % 10 === 0) {
        console.log(`Generation ${generation}: Best fitness = ${evaluatedPopulation[0].fitness.toFixed(2)}`)
      }
    }

    if (!bestSolution) {
      throw new Error('Optimization failed to find a solution')
    }

    return this.convertToOptimizationResult(bestSolution, 'genetic')
  }

  private initializePopulation(vehicles: Vehicle[], points: RoutePoint[]): Individual[] {
    const population: Individual[] = []
    
    for (let i = 0; i < this.config.populationSize; i++) {
      const individual: Individual = {
        routes: this.generateRandomSolution(vehicles, points),
        fitness: 0
      }
      population.push(individual)
    }
    
    return population
  }

  private generateRandomSolution(vehicles: Vehicle[], points: RoutePoint[]): OptimizedRoute[] {
    const routes: OptimizedRoute[] = []
    const unassignedPoints = [...points.filter(p => p.type !== 'depot')]
    
    for (const vehicle of vehicles) {
      if (unassignedPoints.length === 0) break
      
      const routePoints: RoutePoint[] = []
      const depot = points.find(p => p.type === 'depot') || points[0]
      routePoints.push(depot)
      
      // Randomly assign points to this vehicle
      const numPoints = Math.min(
        Math.floor(Math.random() * 8) + 2, // 2-10 points per route
        unassignedPoints.length
      )
      
      for (let i = 0; i < numPoints; i++) {
        const randomIndex = Math.floor(Math.random() * unassignedPoints.length)
        routePoints.push(unassignedPoints.splice(randomIndex, 1)[0])
      }
      
      routePoints.push(depot) // Return to depot
      
      routes.push({
        id: `route_${vehicle.id}`,
        vehicleId: vehicle.id,
        points: routePoints,
        totalDistance: 0,
        totalTime: 0,
        fuelCost: 0,
        co2Emissions: 0,
        efficiency: 0,
        trafficAware: true
      })
    }
    
    return routes
  }

  private async evaluatePopulation(
    population: Individual[],
    constraints: OptimizationConstraints
  ): Promise<Individual[]> {
    const evaluatedPopulation: Individual[] = []
    
    for (const individual of population) {
      const fitness = await this.calculateFitness(individual.routes, constraints)
      evaluatedPopulation.push({
        ...individual,
        fitness
      })
    }
    
    return evaluatedPopulation
  }

  private async calculateFitness(
    routes: OptimizedRoute[],
    constraints: OptimizationConstraints
  ): Promise<number> {
    let totalCost = 0
    let totalTime = 0
    let totalDistance = 0
    let penaltyScore = 0

    for (const route of routes) {
      // Calculate route metrics with real traffic data
      const routeMetrics = await this.calculateRouteMetrics(route)
      
      totalCost += routeMetrics.cost
      totalTime += routeMetrics.time
      totalDistance += routeMetrics.distance
      
      // Apply constraint penalties
      if (constraints.maxRouteTime && routeMetrics.time > constraints.maxRouteTime) {
        penaltyScore += (routeMetrics.time - constraints.maxRouteTime) * 100
      }
      
      if (constraints.maxRouteDistance && routeMetrics.distance > constraints.maxRouteDistance) {
        penaltyScore += (routeMetrics.distance - constraints.maxRouteDistance) * 50
      }
    }

    // Fitness is inverse of total cost (higher fitness = lower cost)
    // Subtract penalties to discourage constraint violations
    const fitness = 10000 / (totalCost + penaltyScore + 1)
    
    return fitness
  }

  private async calculateRouteMetrics(route: OptimizedRoute): Promise<{
    cost: number
    time: number
    distance: number
  }> {
    let totalDistance = 0
    let totalTime = 0
    
    // Get traffic data for route segments
    const segmentIds = this.getRouteSegmentIds(route.points)
    const trafficData = await this.trafficProvider.getTrafficData(segmentIds)
    
    for (let i = 0; i < route.points.length - 1; i++) {
      const from = route.points[i]
      const to = route.points[i + 1]
      
      // Calculate distance using Haversine formula
      const distance = this.calculateDistance(from, to)
      totalDistance += distance
      
      // Calculate time considering traffic
      const segmentId = `${from.id}_${to.id}`
      const traffic = trafficData.get(segmentId)
      
      if (traffic) {
        totalTime += traffic.travelTime
      } else {
        // Fallback calculation
        const avgSpeed = 35 // km/h average speed in Accra
        totalTime += (distance / avgSpeed) * 60 // minutes
      }
    }
    
    // Calculate fuel cost
    const fuelEfficiency = 8.5 // km per liter for tro-tro
    const fuelPricePerLiter = 14.34 // GHS
    const fuelCost = (totalDistance / fuelEfficiency) * fuelPricePerLiter
    
    // Total cost includes fuel + time cost
    const timeCostPerMinute = 2.5 // GHS per minute
    const totalCost = fuelCost + (totalTime * timeCostPerMinute)
    
    return {
      cost: totalCost,
      time: totalTime,
      distance: totalDistance
    }
  }

  private calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
    // Haversine formula for distance calculation
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(point2.lat - point1.lat)
    const dLng = this.toRadians(point2.lng - point1.lng)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private getRouteSegmentIds(points: RoutePoint[]): string[] {
    const segmentIds: string[] = []
    for (let i = 0; i < points.length - 1; i++) {
      segmentIds.push(`${points[i].id}_${points[i + 1].id}`)
    }
    return segmentIds
  }

  private createNextGeneration(population: Individual[]): Individual[] {
    const nextGeneration: Individual[] = []
    const eliteCount = Math.floor(population.length * this.config.elitismRate)
    
    // Keep elite individuals
    for (let i = 0; i < eliteCount; i++) {
      nextGeneration.push({ ...population[i] })
    }
    
    // Generate offspring through crossover and mutation
    while (nextGeneration.length < this.config.populationSize) {
      const parent1 = this.tournamentSelection(population)
      const parent2 = this.tournamentSelection(population)
      
      let offspring = this.crossover(parent1, parent2)
      offspring = this.mutate(offspring)
      
      nextGeneration.push(offspring)
    }
    
    return nextGeneration
  }

  private tournamentSelection(population: Individual[]): Individual {
    const tournamentSize = 3
    let best = population[Math.floor(Math.random() * population.length)]
    
    for (let i = 1; i < tournamentSize; i++) {
      const candidate = population[Math.floor(Math.random() * population.length)]
      if (candidate.fitness > best.fitness) {
        best = candidate
      }
    }
    
    return best
  }

  private crossover(parent1: Individual, parent2: Individual): Individual {
    if (Math.random() > this.config.crossoverRate) {
      return { ...parent1 }
    }
    
    // Order crossover for route optimization
    const offspring: Individual = {
      routes: [],
      fitness: 0
    }
    
    // Simple crossover: take routes from both parents
    const totalRoutes = Math.max(parent1.routes.length, parent2.routes.length)
    for (let i = 0; i < totalRoutes; i++) {
      if (i < parent1.routes.length && i < parent2.routes.length) {
        // Choose randomly from either parent
        offspring.routes.push(
          Math.random() < 0.5 ? { ...parent1.routes[i] } : { ...parent2.routes[i] }
        )
      } else if (i < parent1.routes.length) {
        offspring.routes.push({ ...parent1.routes[i] })
      } else {
        offspring.routes.push({ ...parent2.routes[i] })
      }
    }
    
    return offspring
  }

  private mutate(individual: Individual): Individual {
    if (Math.random() > this.config.mutationRate) {
      return individual
    }
    
    // Mutation: swap two random points in a random route
    const mutated = { ...individual }
    
    if (mutated.routes.length > 0) {
      const routeIndex = Math.floor(Math.random() * mutated.routes.length)
      const route = { ...mutated.routes[routeIndex] }
      
      if (route.points.length > 3) { // Don't mutate depot points
        const point1 = Math.floor(Math.random() * (route.points.length - 2)) + 1
        const point2 = Math.floor(Math.random() * (route.points.length - 2)) + 1
        
        if (point1 !== point2) {
          [route.points[point1], route.points[point2]] = [route.points[point2], route.points[point1]]
        }
      }
      
      mutated.routes[routeIndex] = route
    }
    
    return mutated
  }

  private convertToOptimizationResult(
    solution: Individual,
    algorithm: string
  ): OptimizationResult {
    let totalCost = 0
    let totalTime = 0
    let totalDistance = 0
    
    solution.routes.forEach(route => {
      totalCost += route.fuelCost
      totalTime += route.totalTime
      totalDistance += route.totalDistance
    })
    
    return {
      routes: solution.routes,
      totalCost,
      totalTime,
      totalDistance,
      fuelSavings: 0, // Calculate based on baseline
      timeSavings: 0, // Calculate based on baseline
      co2Reduction: 0, // Calculate based on baseline
      algorithm,
      confidence: solution.fitness / 100 // Normalize confidence score
    }
  }
}

// Supporting interfaces
interface Individual {
  routes: OptimizedRoute[]
  fitness: number
}

// Export main optimizer class
export class EnhancedRouteOptimizer {
  private geneticOptimizer: GeneticRouteOptimizer
  private trafficProvider: TrafficDataProvider

  constructor(config?: Partial<GeneticAlgorithmConfig>) {
    const defaultConfig: GeneticAlgorithmConfig = {
      populationSize: 50,
      generations: 100,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      elitismRate: 0.2,
      convergenceThreshold: 20
    }
    
    this.geneticOptimizer = new GeneticRouteOptimizer({ ...defaultConfig, ...config })
    this.trafficProvider = new TrafficDataProvider()
  }

  async optimizeRoutes(
    vehicles: Vehicle[],
    points: RoutePoint[],
    constraints: OptimizationConstraints
  ): Promise<OptimizationResult> {
    return this.geneticOptimizer.optimize(vehicles, points, constraints)
  }

  async getTrafficData(segmentIds: string[]): Promise<Map<string, TrafficData>> {
    return this.trafficProvider.getTrafficData(segmentIds)
  }
}

export default EnhancedRouteOptimizer
