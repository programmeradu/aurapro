// Ghana Economics Engine for Transport Optimization
// Real economic calculations using Ghana-specific data

export interface GhanaEconomicData {
  fuel_price_ghs: number;
  minimum_wage_ghs: number;
  average_driver_wage_ghs: number;
  co2_price_per_ton_usd: number;
  usd_to_ghs_rate: number;
  inflation_rate: number;
  transport_gdp_contribution: number;
  unemployment_rate: number;
  last_updated: Date;
}

export interface VehicleEconomics {
  vehicle_type: 'tro-tro' | 'bus' | 'taxi' | 'motorcycle';
  fuel_consumption_per_100km: number;
  capacity: number;
  purchase_cost_ghs: number;
  maintenance_cost_per_km_ghs: number;
  insurance_cost_per_month_ghs: number;
  driver_wage_per_day_ghs: number;
  fuel_type: 'petrol' | 'diesel' | 'lpg';
}

export interface RouteEconomics {
  route_id: string;
  distance_km: number;
  duration_hours: number;
  passenger_capacity: number;
  actual_passengers: number;
  
  // Costs
  fuel_cost_ghs: number;
  driver_wage_cost_ghs: number;
  maintenance_cost_ghs: number;
  opportunity_cost_ghs: number;
  
  // Revenue
  fare_revenue_ghs: number;
  load_factor: number;
  
  // Environmental
  co2_emissions_kg: number;
  carbon_cost_ghs: number;
  
  // Efficiency metrics
  cost_per_km_ghs: number;
  revenue_per_km_ghs: number;
  profit_margin: number;
  roi_percentage: number;
}

export interface EconomicImpactAnalysis {
  daily_savings_ghs: number;
  weekly_savings_ghs: number;
  monthly_savings_ghs: number;
  annual_savings_ghs: number;
  
  // Employment impact
  jobs_created: number;
  jobs_optimized: number;
  income_increase_per_driver_ghs: number;
  
  // Environmental impact
  co2_reduction_tons_per_year: number;
  carbon_savings_ghs_per_year: number;
  air_quality_improvement_score: number;
  
  // Social impact
  time_savings_hours_per_day: number;
  accessibility_improvement_score: number;
  equity_index: number;
  
  // Economic multipliers
  gdp_impact_ghs: number;
  productivity_gain_percentage: number;
  transport_cost_reduction_percentage: number;
}

export class GhanaEconomicsEngine {
  private economicData!: GhanaEconomicData;
  private vehicleTypes!: Record<string, VehicleEconomics>;
  private lastDataUpdate: Date;

  constructor() {
    this.lastDataUpdate = new Date();
    this.initializeEconomicData();
    this.initializeVehicleData();
  }

  /**
   * Initialize Ghana economic data with real 2024/2025 values
   */
  private initializeEconomicData(): void {
    this.economicData = {
      fuel_price_ghs: 14.34, // Real Ghana fuel price as of 2024
      minimum_wage_ghs: 18.15, // Ghana minimum wage per day (2024)
      average_driver_wage_ghs: 45.00, // Average tro-tro driver wage per day
      co2_price_per_ton_usd: 85.00, // Carbon price (EU ETS reference)
      usd_to_ghs_rate: 12.10, // USD to GHS exchange rate (2024)
      inflation_rate: 0.232, // Ghana inflation rate (23.2% as of 2024)
      transport_gdp_contribution: 0.078, // Transport contributes 7.8% to Ghana GDP
      unemployment_rate: 0.134, // Ghana unemployment rate (13.4%)
      last_updated: new Date()
    };
  }

  /**
   * Initialize vehicle economics data for Ghana transport
   */
  private initializeVehicleData(): void {
    this.vehicleTypes = {
      'tro-tro': {
        vehicle_type: 'tro-tro',
        fuel_consumption_per_100km: 12.5, // Liters per 100km
        capacity: 15, // Typical tro-tro capacity
        purchase_cost_ghs: 45000, // Used tro-tro cost
        maintenance_cost_per_km_ghs: 0.85,
        insurance_cost_per_month_ghs: 450,
        driver_wage_per_day_ghs: 45,
        fuel_type: 'petrol'
      },
      'bus': {
        vehicle_type: 'bus',
        fuel_consumption_per_100km: 18.0,
        capacity: 40,
        purchase_cost_ghs: 120000,
        maintenance_cost_per_km_ghs: 1.25,
        insurance_cost_per_month_ghs: 850,
        driver_wage_per_day_ghs: 55,
        fuel_type: 'diesel'
      },
      'taxi': {
        vehicle_type: 'taxi',
        fuel_consumption_per_100km: 8.5,
        capacity: 4,
        purchase_cost_ghs: 35000,
        maintenance_cost_per_km_ghs: 0.65,
        insurance_cost_per_month_ghs: 320,
        driver_wage_per_day_ghs: 40,
        fuel_type: 'petrol'
      },
      'motorcycle': {
        vehicle_type: 'motorcycle',
        fuel_consumption_per_100km: 3.2,
        capacity: 2,
        purchase_cost_ghs: 8500,
        maintenance_cost_per_km_ghs: 0.25,
        insurance_cost_per_month_ghs: 120,
        driver_wage_per_day_ghs: 30,
        fuel_type: 'petrol'
      }
    };
  }

  /**
   * Calculate comprehensive route economics
   */
  calculateRouteEconomics(
    routeId: string,
    distanceKm: number,
    durationHours: number,
    vehicleType: string,
    actualPassengers: number,
    farePerPassenger: number = 2.5 // Default Ghana tro-tro fare
  ): RouteEconomics {
    const vehicle = this.vehicleTypes[vehicleType];
    if (!vehicle) {
      throw new Error(`Unknown vehicle type: ${vehicleType}`);
    }

    // Calculate costs
    const fuelCost = this.calculateFuelCost(distanceKm, vehicle);
    const driverWageCost = this.calculateDriverWageCost(durationHours, vehicle);
    const maintenanceCost = this.calculateMaintenanceCost(distanceKm, vehicle);
    const opportunityCost = this.calculateOpportunityCost(durationHours, vehicle);

    // Calculate revenue
    const fareRevenue = actualPassengers * farePerPassenger;
    const loadFactor = actualPassengers / vehicle.capacity;

    // Calculate environmental impact
    const co2Emissions = this.calculateCO2Emissions(distanceKm, vehicle);
    const carbonCost = this.calculateCarbonCost(co2Emissions);

    // Calculate efficiency metrics
    const totalCosts = fuelCost + driverWageCost + maintenanceCost + opportunityCost + carbonCost;
    const costPerKm = totalCosts / distanceKm;
    const revenuePerKm = fareRevenue / distanceKm;
    const profitMargin = ((fareRevenue - totalCosts) / fareRevenue) * 100;
    const roi = ((fareRevenue - totalCosts) / totalCosts) * 100;

    return {
      route_id: routeId,
      distance_km: distanceKm,
      duration_hours: durationHours,
      passenger_capacity: vehicle.capacity,
      actual_passengers: actualPassengers,
      
      // Costs
      fuel_cost_ghs: fuelCost,
      driver_wage_cost_ghs: driverWageCost,
      maintenance_cost_ghs: maintenanceCost,
      opportunity_cost_ghs: opportunityCost,
      
      // Revenue
      fare_revenue_ghs: fareRevenue,
      load_factor: loadFactor,
      
      // Environmental
      co2_emissions_kg: co2Emissions,
      carbon_cost_ghs: carbonCost,
      
      // Efficiency metrics
      cost_per_km_ghs: costPerKm,
      revenue_per_km_ghs: revenuePerKm,
      profit_margin: profitMargin,
      roi_percentage: roi
    };
  }

  /**
   * Analyze economic impact of route optimization
   */
  analyzeEconomicImpact(
    originalRoutes: RouteEconomics[],
    optimizedRoutes: RouteEconomics[],
    numberOfVehicles: number = 100
  ): EconomicImpactAnalysis {
    // Calculate savings
    const originalTotalCost = originalRoutes.reduce((sum, route) => 
      sum + route.fuel_cost_ghs + route.driver_wage_cost_ghs + route.maintenance_cost_ghs, 0);
    const optimizedTotalCost = optimizedRoutes.reduce((sum, route) => 
      sum + route.fuel_cost_ghs + route.driver_wage_cost_ghs + route.maintenance_cost_ghs, 0);
    
    const dailySavings = (originalTotalCost - optimizedTotalCost) * numberOfVehicles;
    const weeklySavings = dailySavings * 7;
    const monthlySavings = dailySavings * 30;
    const annualSavings = dailySavings * 365;

    // Calculate employment impact
    const efficiencyGain = (originalTotalCost - optimizedTotalCost) / originalTotalCost;
    const jobsOptimized = Math.floor(numberOfVehicles * efficiencyGain * 0.1); // 10% efficiency can optimize 10% of jobs
    const jobsCreated = Math.floor(jobsOptimized * 0.3); // 30% of optimized jobs become new opportunities
    const incomeIncrease = dailySavings / numberOfVehicles * 0.4; // 40% of savings passed to drivers

    // Calculate environmental impact
    const originalCO2 = originalRoutes.reduce((sum, route) => sum + route.co2_emissions_kg, 0);
    const optimizedCO2 = optimizedRoutes.reduce((sum, route) => sum + route.co2_emissions_kg, 0);
    const co2ReductionPerYear = ((originalCO2 - optimizedCO2) * numberOfVehicles * 365) / 1000; // Convert to tons
    const carbonSavingsPerYear = co2ReductionPerYear * this.economicData.co2_price_per_ton_usd * this.economicData.usd_to_ghs_rate;

    // Calculate social impact
    const timeSavingsPerDay = optimizedRoutes.reduce((sum, route) => sum + route.duration_hours, 0) - 
                              originalRoutes.reduce((sum, route) => sum + route.duration_hours, 0);
    const accessibilityImprovement = this.calculateAccessibilityImprovement(originalRoutes, optimizedRoutes);
    const equityIndex = this.calculateEquityIndex(optimizedRoutes);

    // Calculate economic multipliers
    const gdpImpact = annualSavings * this.economicData.transport_gdp_contribution * 2.5; // Multiplier effect
    const productivityGain = efficiencyGain * 100;
    const transportCostReduction = ((originalTotalCost - optimizedTotalCost) / originalTotalCost) * 100;

    return {
      daily_savings_ghs: dailySavings,
      weekly_savings_ghs: weeklySavings,
      monthly_savings_ghs: monthlySavings,
      annual_savings_ghs: annualSavings,
      
      // Employment impact
      jobs_created: jobsCreated,
      jobs_optimized: jobsOptimized,
      income_increase_per_driver_ghs: incomeIncrease,
      
      // Environmental impact
      co2_reduction_tons_per_year: co2ReductionPerYear,
      carbon_savings_ghs_per_year: carbonSavingsPerYear,
      air_quality_improvement_score: Math.min(100, co2ReductionPerYear * 10),
      
      // Social impact
      time_savings_hours_per_day: Math.abs(timeSavingsPerDay) * numberOfVehicles,
      accessibility_improvement_score: accessibilityImprovement,
      equity_index: equityIndex,
      
      // Economic multipliers
      gdp_impact_ghs: gdpImpact,
      productivity_gain_percentage: productivityGain,
      transport_cost_reduction_percentage: transportCostReduction
    };
  }

  /**
   * Get real-time Ghana economic indicators
   */
  async getRealtimeEconomicIndicators(): Promise<{
    fuel_price_trend: 'increasing' | 'decreasing' | 'stable';
    inflation_impact: 'high' | 'medium' | 'low';
    employment_outlook: 'positive' | 'neutral' | 'negative';
    transport_demand: 'high' | 'medium' | 'low';
    economic_health_score: number;
  }> {
    // In production, this would fetch real data from Bank of Ghana API
    // For now, simulate realistic indicators
    
    const fuelTrend = this.economicData.fuel_price_ghs > 14.0 ? 'increasing' : 'stable';
    const inflationImpact = this.economicData.inflation_rate > 0.15 ? 'high' : 'medium';
    const employmentOutlook = this.economicData.unemployment_rate < 0.12 ? 'positive' : 'neutral';
    const transportDemand = 'high'; // Ghana has high transport demand
    
    // Economic health score (0-100)
    const healthScore = Math.max(0, Math.min(100, 
      (1 - this.economicData.unemployment_rate) * 50 +
      (1 - Math.min(this.economicData.inflation_rate, 0.5)) * 30 +
      this.economicData.transport_gdp_contribution * 100 * 0.2
    ));

    return {
      fuel_price_trend: fuelTrend,
      inflation_impact: inflationImpact,
      employment_outlook: employmentOutlook,
      transport_demand: transportDemand,
      economic_health_score: healthScore
    };
  }

  /**
   * Calculate fuel cost for a route
   */
  private calculateFuelCost(distanceKm: number, vehicle: VehicleEconomics): number {
    const fuelConsumption = (distanceKm / 100) * vehicle.fuel_consumption_per_100km;
    return fuelConsumption * this.economicData.fuel_price_ghs;
  }

  /**
   * Calculate driver wage cost
   */
  private calculateDriverWageCost(durationHours: number, vehicle: VehicleEconomics): number {
    const dailyWage = vehicle.driver_wage_per_day_ghs;
    const hourlyWage = dailyWage / 8; // 8-hour work day
    return durationHours * hourlyWage;
  }

  /**
   * Calculate maintenance cost
   */
  private calculateMaintenanceCost(distanceKm: number, vehicle: VehicleEconomics): number {
    return distanceKm * vehicle.maintenance_cost_per_km_ghs;
  }

  /**
   * Calculate opportunity cost
   */
  private calculateOpportunityCost(durationHours: number, vehicle: VehicleEconomics): number {
    // Opportunity cost of time not generating revenue
    const potentialRevenue = vehicle.capacity * 2.5; // Average fare
    const opportunityRate = 0.1; // 10% opportunity cost
    return durationHours * potentialRevenue * opportunityRate;
  }

  /**
   * Calculate CO2 emissions
   */
  private calculateCO2Emissions(distanceKm: number, vehicle: VehicleEconomics): number {
    const fuelConsumption = (distanceKm / 100) * vehicle.fuel_consumption_per_100km;
    const co2PerLiter = vehicle.fuel_type === 'diesel' ? 2.68 : 2.31; // kg CO2 per liter
    return fuelConsumption * co2PerLiter;
  }

  /**
   * Calculate carbon cost
   */
  private calculateCarbonCost(co2EmissionsKg: number): number {
    const co2EmissionsTons = co2EmissionsKg / 1000;
    const carbonCostUSD = co2EmissionsTons * this.economicData.co2_price_per_ton_usd;
    return carbonCostUSD * this.economicData.usd_to_ghs_rate;
  }

  /**
   * Calculate accessibility improvement score
   */
  private calculateAccessibilityImprovement(
    originalRoutes: RouteEconomics[],
    optimizedRoutes: RouteEconomics[]
  ): number {
    const originalAvgLoadFactor = originalRoutes.reduce((sum, r) => sum + r.load_factor, 0) / originalRoutes.length;
    const optimizedAvgLoadFactor = optimizedRoutes.reduce((sum, r) => sum + r.load_factor, 0) / optimizedRoutes.length;
    
    const improvement = ((optimizedAvgLoadFactor - originalAvgLoadFactor) / originalAvgLoadFactor) * 100;
    return Math.max(0, Math.min(100, improvement));
  }

  /**
   * Calculate equity index
   */
  private calculateEquityIndex(routes: RouteEconomics[]): number {
    // Measure how equitably routes serve different areas
    const loadFactorVariance = this.calculateVariance(routes.map(r => r.load_factor));
    const equityScore = Math.max(0, 100 - (loadFactorVariance * 100));
    return equityScore;
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  /**
   * Get current economic data
   */
  getEconomicData(): GhanaEconomicData {
    return { ...this.economicData };
  }

  /**
   * Get vehicle economics data
   */
  getVehicleEconomics(vehicleType: string): VehicleEconomics | null {
    return this.vehicleTypes[vehicleType] || null;
  }

  /**
   * Update economic data (for real-time updates)
   */
  updateEconomicData(newData: Partial<GhanaEconomicData>): void {
    this.economicData = { ...this.economicData, ...newData, last_updated: new Date() };
  }
} 