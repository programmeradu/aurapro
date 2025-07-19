/**
 * 🗓️ Intelligent Maintenance Scheduling System
 * Optimizes maintenance schedules based on predictions, resources, and constraints
 */

import { 
  FailurePrediction, 
  MaintenanceTask, 
  MaintenanceSchedule,
  ComponentType,
  MaintenanceType,
  Priority,
  TaskStatus,
  Part
} from './predictiveMaintenanceEngine'

export interface MaintenanceResource {
  id: string
  name: string
  type: 'technician' | 'bay' | 'equipment'
  availability: TimeSlot[]
  skills: string[]
  hourlyRate?: number
  capacity?: number
}

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  reservedFor?: string
}

export interface MaintenanceConstraints {
  maxSimultaneousVehicles: number
  workingHours: { start: number; end: number }
  weekendWork: boolean
  emergencyCapacity: number
  budgetLimit?: number
  partLeadTimes: Map<string, number>
}

export interface ScheduleOptimization {
  objective: 'minimize_cost' | 'minimize_downtime' | 'maximize_availability' | 'balanced'
  weights: {
    cost: number
    downtime: number
    urgency: number
    resource_utilization: number
  }
}

export class MaintenanceScheduler {
  private resources: MaintenanceResource[] = []
  private constraints: MaintenanceConstraints
  private partInventory: Map<string, number> = new Map()

  constructor(constraints: MaintenanceConstraints) {
    this.constraints = constraints
    this.initializeResources()
    this.initializePartInventory()
  }

  async generateOptimalSchedule(
    predictions: FailurePrediction[],
    optimization: ScheduleOptimization = { 
      objective: 'balanced',
      weights: { cost: 0.25, downtime: 0.3, urgency: 0.3, resource_utilization: 0.15 }
    }
  ): Promise<MaintenanceSchedule[]> {
    
    console.log('🗓️ Generating optimal maintenance schedule...')
    
    // Convert predictions to maintenance tasks
    const tasks = this.convertPredictionsToTasks(predictions)
    
    // Add preventive maintenance tasks
    const preventiveTasks = this.generatePreventiveTasks()
    tasks.push(...preventiveTasks)
    
    // Sort tasks by priority and urgency
    const prioritizedTasks = this.prioritizeTasks(tasks)
    
    // Schedule tasks optimally
    const schedules = await this.scheduleTasksOptimally(prioritizedTasks, optimization)
    
    // Validate and optimize schedules
    const optimizedSchedules = this.optimizeSchedules(schedules)
    
    console.log(`✅ Generated schedules for ${optimizedSchedules.length} vehicles`)
    return optimizedSchedules
  }

  private convertPredictionsToTasks(predictions: FailurePrediction[]): MaintenanceTask[] {
    return predictions.map((prediction, index) => {
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + Math.max(1, prediction.daysUntilFailure - 2))
      
      return {
        id: `pred_task_${index}`,
        vehicleId: prediction.vehicleId,
        vehicleName: prediction.vehicleName,
        type: 'predictive',
        category: this.getMaintenanceCategory(prediction.component),
        component: prediction.component,
        description: prediction.description,
        scheduledDate,
        estimatedDuration: prediction.downtime,
        estimatedCost: prediction.estimatedCost,
        priority: this.convertRiskToPriority(prediction.riskLevel),
        status: 'scheduled',
        requiredParts: this.getRequiredParts(prediction.component),
        requiredTools: this.getRequiredTools(prediction.component),
        safetyRequirements: this.getSafetyRequirements(prediction.component),
        completionCriteria: this.getCompletionCriteria(prediction.component)
      }
    })
  }

  private generatePreventiveTasks(): MaintenanceTask[] {
    const preventiveTasks: MaintenanceTask[] = []
    
    // Generate routine maintenance tasks
    const routineMaintenanceTypes = [
      { component: 'engine' as ComponentType, interval: 90, description: 'Engine oil change and filter replacement' },
      { component: 'brakes' as ComponentType, interval: 180, description: 'Brake system inspection and adjustment' },
      { component: 'tires' as ComponentType, interval: 30, description: 'Tire rotation and pressure check' },
      { component: 'electrical' as ComponentType, interval: 120, description: 'Battery and electrical system check' },
      { component: 'transmission' as ComponentType, interval: 240, description: 'Transmission fluid change and inspection' }
    ]

    // Simulate vehicles needing preventive maintenance
    const vehicleIds = ['V001', 'V002', 'V003', 'V004', 'V005']
    
    vehicleIds.forEach((vehicleId, vehicleIndex) => {
      routineMaintenanceTypes.forEach((maintenance, index) => {
        const scheduledDate = new Date()
        scheduledDate.setDate(scheduledDate.getDate() + maintenance.interval + (vehicleIndex * 7))
        
        preventiveTasks.push({
          id: `prev_task_${vehicleIndex}_${index}`,
          vehicleId,
          vehicleName: `Vehicle ${vehicleId}`,
          type: 'preventive',
          category: 'service',
          component: maintenance.component,
          description: maintenance.description,
          scheduledDate,
          estimatedDuration: this.getPreventiveDuration(maintenance.component),
          estimatedCost: this.getPreventiveCost(maintenance.component),
          priority: 'medium',
          status: 'scheduled',
          requiredParts: this.getRequiredParts(maintenance.component),
          requiredTools: this.getRequiredTools(maintenance.component),
          safetyRequirements: this.getSafetyRequirements(maintenance.component),
          completionCriteria: this.getCompletionCriteria(maintenance.component)
        })
      })
    })

    return preventiveTasks
  }

  private prioritizeTasks(tasks: MaintenanceTask[]): MaintenanceTask[] {
    return tasks.sort((a, b) => {
      // Priority weights
      const priorityWeights = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }
      const typeWeights = { 'emergency': 4, 'predictive': 3, 'preventive': 2, 'corrective': 1 }
      
      const aScore = priorityWeights[a.priority] * 2 + typeWeights[a.type]
      const bScore = priorityWeights[b.priority] * 2 + typeWeights[b.type]
      
      if (aScore !== bScore) return bScore - aScore
      
      // If same priority, sort by scheduled date
      return a.scheduledDate.getTime() - b.scheduledDate.getTime()
    })
  }

  private async scheduleTasksOptimally(
    tasks: MaintenanceTask[], 
    optimization: ScheduleOptimization
  ): Promise<MaintenanceSchedule[]> {
    
    const scheduleMap = new Map<string, MaintenanceSchedule>()
    
    // Group tasks by vehicle
    const tasksByVehicle = new Map<string, MaintenanceTask[]>()
    tasks.forEach(task => {
      if (!tasksByVehicle.has(task.vehicleId)) {
        tasksByVehicle.set(task.vehicleId, [])
      }
      tasksByVehicle.get(task.vehicleId)!.push(task)
    })
    
    // Create schedules for each vehicle
    for (const [vehicleId, vehicleTasks] of tasksByVehicle) {
      const schedule = await this.createVehicleSchedule(vehicleId, vehicleTasks, optimization)
      scheduleMap.set(vehicleId, schedule)
    }
    
    return Array.from(scheduleMap.values())
  }

  private async createVehicleSchedule(
    vehicleId: string, 
    tasks: MaintenanceTask[], 
    optimization: ScheduleOptimization
  ): Promise<MaintenanceSchedule> {
    
    // Optimize task scheduling for this vehicle
    const optimizedTasks = await this.optimizeTaskSequence(tasks, optimization)
    
    // Calculate totals
    const totalCost = optimizedTasks.reduce((sum, task) => sum + task.estimatedCost, 0)
    const totalDowntime = optimizedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0)
    
    // Find next maintenance date
    const nextMaintenanceDate = optimizedTasks.length > 0 
      ? new Date(Math.min(...optimizedTasks.map(t => t.scheduledDate.getTime())))
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    
    // Calculate maintenance score (0-100)
    const maintenanceScore = this.calculateMaintenanceScore(optimizedTasks)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(optimizedTasks, totalCost, totalDowntime)
    
    return {
      vehicleId,
      tasks: optimizedTasks,
      totalCost,
      totalDowntime,
      nextMaintenanceDate,
      maintenanceScore,
      recommendations
    }
  }

  private async optimizeTaskSequence(
    tasks: MaintenanceTask[], 
    optimization: ScheduleOptimization
  ): Promise<MaintenanceTask[]> {
    
    // Simple optimization: group compatible tasks and schedule by priority
    const optimizedTasks = [...tasks]
    
    // Check for task combinations that can be done together
    const combinableTasks = this.findCombinableTasks(optimizedTasks)
    
    // Adjust scheduling dates for optimal resource utilization
    this.adjustSchedulingDates(optimizedTasks, optimization)
    
    // Ensure parts availability
    await this.ensurePartsAvailability(optimizedTasks)
    
    return optimizedTasks
  }

  private findCombinableTasks(tasks: MaintenanceTask[]): MaintenanceTask[][] {
    const combinations: MaintenanceTask[][] = []
    
    // Group tasks that can be done simultaneously
    const engineTasks = tasks.filter(t => t.component === 'engine')
    const brakeTasks = tasks.filter(t => t.component === 'brakes')
    const electricalTasks = tasks.filter(t => t.component === 'electrical')
    
    // Engine and electrical tasks can often be combined
    if (engineTasks.length > 0 && electricalTasks.length > 0) {
      combinations.push([...engineTasks, ...electricalTasks])
    }
    
    return combinations
  }

  private adjustSchedulingDates(tasks: MaintenanceTask[], optimization: ScheduleOptimization): void {
    // Adjust dates based on resource availability and optimization objectives
    tasks.forEach(task => {
      if (optimization.objective === 'minimize_downtime') {
        // Schedule critical tasks as soon as possible
        if (task.priority === 'critical') {
          task.scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
        }
      } else if (optimization.objective === 'minimize_cost') {
        // Batch tasks to reduce setup costs
        const dayOfWeek = task.scheduledDate.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
          task.scheduledDate.setDate(task.scheduledDate.getDate() + (8 - dayOfWeek)) // Move to Monday
        }
      }
    })
  }

  private async ensurePartsAvailability(tasks: MaintenanceTask[]): Promise<void> {
    for (const task of tasks) {
      for (const part of task.requiredParts) {
        const available = this.partInventory.get(part.partNumber) || 0
        if (available < part.quantity) {
          // Adjust schedule based on lead time
          const leadTime = this.constraints.partLeadTimes.get(part.partNumber) || 7
          const earliestDate = new Date(Date.now() + leadTime * 24 * 60 * 60 * 1000)
          
          if (task.scheduledDate < earliestDate) {
            task.scheduledDate = earliestDate
          }
        }
      }
    }
  }

  private calculateMaintenanceScore(tasks: MaintenanceTask[]): number {
    if (tasks.length === 0) return 85 // Good score for no pending issues
    
    const criticalTasks = tasks.filter(t => t.priority === 'critical').length
    const highTasks = tasks.filter(t => t.priority === 'high').length
    const overdueTasks = tasks.filter(t => t.status === 'overdue').length
    
    let score = 100
    score -= criticalTasks * 20
    score -= highTasks * 10
    score -= overdueTasks * 15
    score -= tasks.length * 2 // General penalty for pending tasks
    
    return Math.max(0, Math.min(100, score))
  }

  private generateRecommendations(
    tasks: MaintenanceTask[], 
    totalCost: number, 
    totalDowntime: number
  ): string[] {
    const recommendations: string[] = []
    
    if (totalCost > 5000) {
      recommendations.push('Consider spreading high-cost maintenance across multiple periods')
    }
    
    if (totalDowntime > 24) {
      recommendations.push('Schedule maintenance during off-peak hours to minimize service disruption')
    }
    
    const criticalTasks = tasks.filter(t => t.priority === 'critical')
    if (criticalTasks.length > 0) {
      recommendations.push(`${criticalTasks.length} critical task(s) require immediate attention`)
    }
    
    const engineTasks = tasks.filter(t => t.component === 'engine')
    const brakeTasks = tasks.filter(t => t.component === 'brakes')
    
    if (engineTasks.length > 0 && brakeTasks.length > 0) {
      recommendations.push('Consider combining engine and brake maintenance to reduce downtime')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Maintenance schedule is well-optimized')
    }
    
    return recommendations
  }

  private optimizeSchedules(schedules: MaintenanceSchedule[]): MaintenanceSchedule[] {
    // Global optimization across all vehicle schedules
    // Balance resource utilization and minimize conflicts
    
    return schedules.map(schedule => ({
      ...schedule,
      tasks: schedule.tasks.map(task => ({
        ...task,
        // Assign technicians based on availability and skills
        assignedTechnician: this.assignOptimalTechnician(task)
      }))
    }))
  }

  private assignOptimalTechnician(task: MaintenanceTask): string {
    // Simple technician assignment based on component expertise
    const technicianMap = {
      'engine': 'Tech_Engine_01',
      'brakes': 'Tech_Brakes_01', 
      'electrical': 'Tech_Electrical_01',
      'transmission': 'Tech_Engine_01', // Engine techs can handle transmission
      'tires': 'Tech_General_01',
      'suspension': 'Tech_General_01',
      'cooling': 'Tech_Engine_01',
      'fuel': 'Tech_Engine_01',
      'exhaust': 'Tech_General_01'
    }
    
    return technicianMap[task.component] || 'Tech_General_01'
  }

  // Utility methods for task creation
  private getMaintenanceCategory(component: ComponentType): 'inspection' | 'service' | 'repair' | 'replacement' {
    const categoryMap = {
      'engine': 'repair',
      'brakes': 'replacement',
      'electrical': 'replacement',
      'transmission': 'repair',
      'tires': 'replacement',
      'suspension': 'repair',
      'cooling': 'service',
      'fuel': 'service',
      'exhaust': 'repair'
    }
    return categoryMap[component] || 'inspection'
  }

  private convertRiskToPriority(riskLevel: string): Priority {
    const priorityMap = {
      'critical': 'critical' as Priority,
      'high': 'high' as Priority,
      'medium': 'medium' as Priority,
      'low': 'low' as Priority
    }
    return priorityMap[riskLevel] || 'medium'
  }

  private getRequiredParts(component: ComponentType): Part[] {
    const partsMap = {
      'engine': [
        { partNumber: 'ENG001', name: 'Engine Oil Filter', quantity: 1, unitCost: 25, supplier: 'Ghana Auto Parts', leadTime: 2, inStock: true },
        { partNumber: 'ENG002', name: 'Engine Oil (5L)', quantity: 1, unitCost: 85, supplier: 'Ghana Auto Parts', leadTime: 1, inStock: true }
      ],
      'brakes': [
        { partNumber: 'BRK001', name: 'Brake Pads (Set)', quantity: 1, unitCost: 120, supplier: 'Brake Specialists', leadTime: 3, inStock: true },
        { partNumber: 'BRK002', name: 'Brake Fluid (1L)', quantity: 1, unitCost: 35, supplier: 'Ghana Auto Parts', leadTime: 1, inStock: true }
      ],
      'electrical': [
        { partNumber: 'ELE001', name: 'Car Battery 12V', quantity: 1, unitCost: 280, supplier: 'Battery World', leadTime: 2, inStock: true }
      ],
      'tires': [
        { partNumber: 'TIR001', name: 'Tire 195/65R15', quantity: 4, unitCost: 180, supplier: 'Tire Center', leadTime: 5, inStock: false }
      ]
    }
    return partsMap[component] || []
  }

  private getRequiredTools(component: ComponentType): string[] {
    const toolsMap = {
      'engine': ['Engine Hoist', 'Torque Wrench', 'Oil Drain Pan', 'Socket Set'],
      'brakes': ['Brake Caliper Tool', 'Brake Bleeder', 'Jack', 'Lug Wrench'],
      'electrical': ['Multimeter', 'Battery Tester', 'Wire Strippers', 'Electrical Tape'],
      'transmission': ['Transmission Jack', 'Fluid Pump', 'Torque Wrench'],
      'tires': ['Tire Machine', 'Wheel Balancer', 'Air Compressor', 'Tire Pressure Gauge']
    }
    return toolsMap[component] || ['Basic Tool Set']
  }

  private getSafetyRequirements(component: ComponentType): string[] {
    const safetyMap = {
      'engine': ['Engine must be cool', 'Disconnect battery', 'Use proper lifting equipment'],
      'brakes': ['Test brake system after repair', 'Use brake cleaner in ventilated area'],
      'electrical': ['Disconnect battery before work', 'Use insulated tools', 'Check for shorts'],
      'transmission': ['Support vehicle properly', 'Handle transmission fluid safely'],
      'tires': ['Use proper tire changing procedures', 'Check wheel torque specifications']
    }
    return safetyMap[component] || ['Follow standard safety procedures']
  }

  private getCompletionCriteria(component: ComponentType): string[] {
    const criteriaMap = {
      'engine': ['Engine temperature within normal range', 'No oil leaks', 'Smooth idle'],
      'brakes': ['Brake pedal firm', 'No brake fluid leaks', 'Even braking'],
      'electrical': ['Battery voltage 12.4V+', 'All electrical systems functional'],
      'transmission': ['Smooth gear changes', 'No transmission leaks', 'Proper fluid level'],
      'tires': ['Proper tire pressure', 'Wheel alignment checked', 'No vibration']
    }
    return criteriaMap[component] || ['Visual inspection passed', 'Functional test completed']
  }

  private getPreventiveDuration(component: ComponentType): number {
    const durationMap = {
      'engine': 4,
      'brakes': 3,
      'electrical': 2,
      'transmission': 6,
      'tires': 1
    }
    return durationMap[component] || 2
  }

  private getPreventiveCost(component: ComponentType): number {
    const costMap = {
      'engine': 150,
      'brakes': 200,
      'electrical': 100,
      'transmission': 300,
      'tires': 80
    }
    return costMap[component] || 100
  }

  private initializeResources(): void {
    // Initialize maintenance resources (technicians, bays, equipment)
    this.resources = [
      {
        id: 'tech_001',
        name: 'Engine Specialist',
        type: 'technician',
        availability: [],
        skills: ['engine', 'transmission', 'cooling'],
        hourlyRate: 45
      },
      {
        id: 'tech_002', 
        name: 'Brake Specialist',
        type: 'technician',
        availability: [],
        skills: ['brakes', 'suspension'],
        hourlyRate: 40
      },
      {
        id: 'bay_001',
        name: 'Service Bay 1',
        type: 'bay',
        availability: [],
        skills: [],
        capacity: 1
      }
    ]
  }

  private initializePartInventory(): void {
    // Initialize parts inventory
    this.partInventory.set('ENG001', 10)
    this.partInventory.set('ENG002', 15)
    this.partInventory.set('BRK001', 8)
    this.partInventory.set('BRK002', 12)
    this.partInventory.set('ELE001', 5)
    this.partInventory.set('TIR001', 0) // Out of stock
  }
}

export default MaintenanceScheduler
