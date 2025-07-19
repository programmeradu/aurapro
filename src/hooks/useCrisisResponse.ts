import { useState, useEffect, useCallback } from 'react';
import { GhanaORToolsOptimizer, RouteOptimizationRequest, OptimizedSolution } from '@/lib/ortools-optimizer';
import ExternalAPIsManager from '@/lib/external-apis';
import { AccraCoordinates } from '@/lib/mapbox-routing';

export interface CrisisScenario {
  id: string;
  type: 'flooding' | 'accident' | 'breakdown' | 'event' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: AccraCoordinates;
  description: string;
  affected_routes: string[];
  estimated_impact: {
    vehicles_affected: number;
    passengers_affected: number;
    delay_minutes: number;
    area_radius_km: number;
  };
  response_status: 'detected' | 'analyzing' | 'responding' | 'resolved';
  start_time: Date;
  estimated_resolution?: Date;
}

export interface EmergencyResponse {
  scenario_id: string;
  response_plan: {
    immediate_actions: string[];
    route_diversions: string[];
    resource_deployment: string[];
    communication_plan: string[];
  };
  optimized_solution: OptimizedSolution | null;
  coordination: {
    emergency_services: boolean;
    traffic_police: boolean;
    transport_operators: boolean;
    public_notifications: boolean;
  };
  real_time_monitoring: {
    status: 'active' | 'standby';
    updates_frequency: number;
    last_update: Date;
  };
}

export interface SystemStatus {
  overall_status: 'normal' | 'alert' | 'emergency' | 'critical';
  active_scenarios: number;
  response_time_avg: number;
  system_reliability: number;
  emergency_protocols: {
    flood_response: boolean;
    accident_response: boolean;
    event_management: boolean;
    breakdown_support: boolean;
  };
}

export const useCrisisResponse = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    overall_status: 'normal',
    active_scenarios: 0,
    response_time_avg: 2.3,
    system_reliability: 98.5,
    emergency_protocols: {
      flood_response: true,
      accident_response: true,
      event_management: true,
      breakdown_support: true
    }
  });
  
  const [activeScenarios, setActiveScenarios] = useState<CrisisScenario[]>([]);
  const [emergencyResponses, setEmergencyResponses] = useState<EmergencyResponse[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<Error | null>(null);
  
  const [optimizer] = useState(() => new GhanaORToolsOptimizer());
  const [apisManager] = useState(() => new ExternalAPIsManager());

  // Generate cultural factors for context
  const generateCulturalFactors = useCallback((): string[] => {
    const factors = [];
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    if (day === 5 && hour >= 12 && hour <= 14) {
      factors.push('Friday Prayer Time - Reduced traffic near mosques');
    }
    
    if (day === 1 || day === 4) {
      factors.push('Market Day - Increased congestion at major markets');
    }
    
    if (hour >= 7 && hour <= 15) {
      factors.push('School Hours - Higher traffic in school zones');
    }
    
    if (hour >= 17 && hour <= 19) {
      factors.push('Evening Rush - Peak commuter traffic');
    }
    
    if (factors.length === 0) {
      factors.push('Normal traffic patterns expected');
    }
    
    return factors;
  }, []);

  // Detect crisis scenarios from external data
  const detectCrisisScenarios = useCallback(async (externalData: any): Promise<CrisisScenario[]> => {
    const scenarios: CrisisScenario[] = [];
    
    // Weather-based crisis detection
    if (externalData.weather.data?.conditions === 'rainy' && 
        externalData.weather.data?.precipitation_mm > 10) {
      scenarios.push({
        id: `flood_${Date.now()}`,
        type: 'flooding',
        severity: 'high',
        location: { longitude: -0.186964, latitude: 5.603717, name: 'Circle Area' },
        description: 'Heavy rainfall detected - potential flooding in low-lying areas',
        affected_routes: ['Circle-Kaneshie', 'Circle-37', 'Circle-Achimota'],
        estimated_impact: {
          vehicles_affected: 45,
          passengers_affected: 680,
          delay_minutes: 35,
          area_radius_km: 5
        },
        response_status: 'detected',
        start_time: new Date()
      });
    }
    
    // Traffic incident-based detection
    if (externalData.traffic.data?.incidents) {
      for (const incident of externalData.traffic.data.incidents) {
        if (incident.severity === 'high' || incident.severity === 'critical') {
          scenarios.push({
            id: `incident_${incident.id}`,
            type: incident.type === 'accident' ? 'accident' : 'breakdown',
            severity: incident.severity as any,
            location: {
              longitude: incident.location.longitude,
              latitude: incident.location.latitude,
              name: incident.description
            },
            description: incident.description,
            affected_routes: ['Route affected by incident'],
            estimated_impact: {
              vehicles_affected: incident.severity === 'critical' ? 25 : 15,
              passengers_affected: incident.severity === 'critical' ? 375 : 225,
              delay_minutes: incident.estimated_delay_minutes,
              area_radius_km: 2
            },
            response_status: 'detected',
            start_time: incident.start_time
          });
        }
      }
    }
    
    // Holiday/Event-based detection
    if (externalData.holidays.data?.is_holiday && 
        externalData.holidays.data?.impact_level === 'high') {
      scenarios.push({
        id: `event_${Date.now()}`,
        type: 'event',
        severity: 'medium',
        location: { longitude: -0.196667, latitude: 5.550000, name: 'Independence Square' },
        description: `Holiday event: ${externalData.holidays.data.holiday_name}`,
        affected_routes: ['All major routes to city center'],
        estimated_impact: {
          vehicles_affected: 80,
          passengers_affected: 1200,
          delay_minutes: 20,
          area_radius_km: 8
        },
        response_status: 'detected',
        start_time: new Date()
      });
    }
    
    return scenarios;
  }, []);

  // Generate optimized response for a crisis scenario
  const generateOptimizedResponse = useCallback(async (scenario: CrisisScenario): Promise<OptimizedSolution | null> => {
    try {
      const affectedArea = scenario.location;
      const alternativeStops: AccraCoordinates[] = [
        { longitude: -0.205874, latitude: 5.614818, name: 'Kaneshie Hub' },
        { longitude: -0.232107, latitude: 5.588928, name: 'Achimota Terminal' },
        { longitude: -0.166667, latitude: 5.550000, name: '37 Military Hospital' }
      ];
      
      const optimizationRequest: RouteOptimizationRequest = {
        stops: alternativeStops,
        vehicles: [{
          vehicle_id: 'emergency_fleet_1',
          capacity: 15,
          max_distance_km: 50,
          max_duration_hours: 4,
          fuel_tank_capacity_liters: 60,
          driver_shift_hours: 8,
          maintenance_interval_km: 500,
          vehicle_type: 'tro-tro'
        }],
        constraints: {
          avoid_friday_prayer_times: false,
          respect_market_day_congestion: false,
          school_zone_speed_limits: true,
          fuel_budget_limit_ghs: 1000,
          driver_wage_budget_ghs: 500,
          minimum_profit_margin: 0,
          flood_prone_areas: scenario.type === 'flooding' ? [scenario.location] : [],
          construction_zones: [],
          restricted_areas: [scenario.location],
          peak_hour_penalties: false,
          night_operation_restrictions: false,
          weekend_schedule_adjustments: false
        },
        objectives: {
          minimize_total_distance: 0.2,
          minimize_total_time: 0.4,
          minimize_fuel_cost: 0.1,
          maximize_passenger_coverage: 0.2,
          minimize_co2_emissions: 0.05,
          maximize_driver_efficiency: 0.05,
          minimize_vehicle_wear: 0.0
        }
      };
      
      return await optimizer.optimizeVehicleRoutes(optimizationRequest);
    } catch (error) {
      console.error('Failed to generate optimized response:', error);
      return null;
    }
  }, [optimizer]);

  // Generate response plan for a crisis scenario
  const generateResponsePlan = useCallback((scenario: CrisisScenario) => {
    const basePlan = {
      immediate_actions: [
        'Alert all vehicles in affected area',
        'Activate emergency communication protocols',
        'Deploy alternative route information'
      ],
      route_diversions: [
        'Divert traffic from affected area',
        'Establish temporary pickup points',
        'Coordinate with traffic management'
      ],
      resource_deployment: [
        'Deploy emergency response vehicles',
        'Position additional staff at key hubs',
        'Activate backup communication systems'
      ],
      communication_plan: [
        'Send passenger notifications',
        'Update real-time information displays',
        'Coordinate with media for public updates'
      ]
    };

    // Scenario-specific additions
    if (scenario.type === 'flooding') {
      basePlan.immediate_actions.push('Avoid flood-prone routes');
      basePlan.resource_deployment.push('Deploy waterproof communication equipment');
    }
    
    if (scenario.type === 'accident') {
      basePlan.immediate_actions.push('Coordinate with emergency services');
      basePlan.communication_plan.push('Provide incident updates to passengers');
    }
    
    if (scenario.type === 'event') {
      basePlan.route_diversions.push('Implement event-specific route plans');
      basePlan.resource_deployment.push('Increase capacity on alternative routes');
    }
    
    return basePlan;
  }, []);

  // Activate coordination protocols for a crisis scenario
  const activateCoordination = useCallback((scenario: CrisisScenario) => {
    return {
      emergency_services: scenario.type === 'accident' || scenario.type === 'flooding',
      traffic_police: scenario.severity === 'high' || scenario.severity === 'critical',
      transport_operators: true,
      public_notifications: scenario.estimated_impact.passengers_affected > 100
    };
  }, []);

  // Update system status based on active scenarios
  const updateSystemStatus = useCallback((scenarios: CrisisScenario[]) => {
    const criticalScenarios = scenarios.filter(s => s.severity === 'critical').length;
    const highScenarios = scenarios.filter(s => s.severity === 'high').length;
    
    let status: 'normal' | 'alert' | 'emergency' | 'critical' = 'normal';
    
    if (criticalScenarios > 0) {
      status = 'critical';
    } else if (highScenarios > 1) {
      status = 'emergency';
    } else if (scenarios.length > 0) {
      status = 'alert';
    }
    
    setSystemStatus(prev => ({
      ...prev,
      overall_status: status,
      active_scenarios: scenarios.length,
      system_reliability: Math.max(85, 98.5 - (scenarios.length * 2))
    }));
  }, []);

  // Initialize crisis monitoring
  const initializeCrisisMonitoring = useCallback(async () => {
    try {
      const externalData = await apisManager.getComprehensiveData();
      const detectedScenarios = await detectCrisisScenarios(externalData);
      
      setActiveScenarios(detectedScenarios);
      updateSystemStatus(detectedScenarios);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to initialize crisis monitoring:', error);
      setError(error instanceof Error ? error : new Error('Failed to initialize crisis monitoring'));
    }
  }, [apisManager, detectCrisisScenarios, updateSystemStatus]);

  // Trigger emergency response for a scenario
  const triggerEmergencyResponse = useCallback(async (scenario: CrisisScenario): Promise<void> => {
    try {
      const optimizedSolution = await generateOptimizedResponse(scenario);
      const responsePlan = generateResponsePlan(scenario);
      const coordination = activateCoordination(scenario);
      
      const emergencyResponse: EmergencyResponse = {
        scenario_id: scenario.id,
        response_plan: responsePlan,
        optimized_solution: optimizedSolution,
        coordination: coordination,
        real_time_monitoring: {
          status: 'active',
          updates_frequency: 60,
          last_update: new Date()
        }
      };
      
      setEmergencyResponses(prev => [...prev, emergencyResponse]);
      
      // Update scenario status
      setActiveScenarios(prev => 
        prev.map(s => s.id === scenario.id ? { ...s, response_status: 'responding' } : s)
      );
    } catch (error) {
      console.error('Failed to trigger emergency response:', error);
      setError(error instanceof Error ? error : new Error('Failed to trigger emergency response'));
    }
  }, [activateCoordination, generateOptimizedResponse, generateResponsePlan]);

  // Update crisis monitoring
  const updateCrisisMonitoring = useCallback(async () => {
    if (!isMonitoring) return;
    
    try {
      const externalData = await apisManager.getComprehensiveData();
      const detectedScenarios = await detectCrisisScenarios(externalData);
      
      // Check for new scenarios
      const newScenarios = detectedScenarios.filter(scenario => 
        !activeScenarios.find(active => active.id === scenario.id)
      );
      
      if (newScenarios.length > 0) {
        console.log(`🚨 New crisis scenarios detected: ${newScenarios.length}`);
        for (const scenario of newScenarios) {
          await triggerEmergencyResponse(scenario);
        }
      }
      
      setActiveScenarios(detectedScenarios);
      updateSystemStatus(detectedScenarios);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Crisis monitoring update failed:', error);
      setError(error instanceof Error ? error : new Error('Crisis monitoring update failed'));
    }
  }, [activeScenarios, apisManager, detectCrisisScenarios, isMonitoring, updateSystemStatus, triggerEmergencyResponse]);

  // Resolve a scenario
  const resolveScenario = useCallback(async (scenarioId: string) => {
    setActiveScenarios(prev => 
      prev.map(s => s.id === scenarioId ? { ...s, response_status: 'resolved' } : s)
    );
    
    setEmergencyResponses(prev => 
      prev.filter(r => r.scenario_id !== scenarioId)
    );
    
    // Simulate resolution time
    setTimeout(() => {
      setActiveScenarios(prev => prev.filter(s => s.id !== scenarioId));
    }, 3000);
  }, []);

  // Set up monitoring interval
  useEffect(() => {
    initializeCrisisMonitoring();
    
    const interval = setInterval(() => {
      updateCrisisMonitoring();
    }, 15000); // Update every 15 seconds
    
    return () => clearInterval(interval);
  }, [initializeCrisisMonitoring, updateCrisisMonitoring]);

  // Helper functions for UI
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'success';
      case 'alert': return 'warning';
      case 'emergency':
      case 'critical': return 'danger';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high':
      case 'critical': return 'danger';
      default: return 'default';
    }
  };

  return {
    // State
    systemStatus,
    activeScenarios,
    emergencyResponses,
    isMonitoring,
    lastUpdate,
    error,
    
    // Actions
    setIsMonitoring,
    resolveScenario,
    
    // UI Helpers
    getStatusColor,
    getSeverityColor
  };
};
