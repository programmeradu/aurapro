import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Types for our store
export interface Vehicle {
  id: string
  route: string
  lat: number
  lng: number
  speed: number
  passengers: number
  capacity: number
  status: 'active' | 'idle' | 'maintenance'
  lastUpdate: Date
}

export interface Route {
  id: string
  name: string
  color: string
  stops: Array<{
    id: string
    name: string
    lat: number
    lng: number
    passengers_waiting: number
  }>
  vehicles: string[]
  status: 'active' | 'disrupted' | 'maintenance'
}

export interface KPI {
  id: string
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
  unit: string
  category: 'efficiency' | 'financial' | 'environmental' | 'social'
}

// GTFS Data Types
export interface GTFSRoute {
  route_id: string
  route_short_name: string
  route_long_name: string
  route_type: number
  route_color?: string
  shape_id?: string
}

export interface GTFSStop {
  stop_id: string
  stop_name: string
  stop_lat: string
  stop_lon: string
  stop_code?: string
}

export interface GTFSStopTime {
  trip_id: string
  arrival_time: string
  departure_time: string
  stop_id: string
  stop_sequence: number
}

export interface GTFSShape {
  shape_id: string
  shape_pt_lat: string
  shape_pt_lon: string
  shape_pt_sequence: number
}

export interface GTFSData {
  routes: GTFSRoute[]
  stops: GTFSStop[]
  stop_times: GTFSStopTime[]
  shapes: GTFSShape[]
  trips: GTFSTrip[]
}

export interface GTFSTrip {
  trip_id: string
  route_id: string
  service_id: string
  shape_id: string
  route_info: {
    route_short_name: string
    route_long_name: string
    route_type: number
  }
  stop_times: Array<{
    stop_id: string
    arrival_time: string
    departure_time: string
    stop_sequence: number
  }>
  status: 'active' | 'completed' | 'cancelled'
  last_updated: string
}

export interface Alert {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actions?: Array<{
    label: string
    action: () => void
  }>
}

export interface Scenario {
  id: string
  name: string
  type: 'crisis' | 'optimization' | 'simulation'
  active: boolean
  parameters: Record<string, any>
  impact: {
    routes: string[]
    estimated_delay: number
    affected_passengers: number
  }
}

// New ML/AI interfaces for Phase 3 integration
export interface MLPrediction {
  prediction_type: string
  value: number
  confidence: number
  timestamp: Date
  context: Record<string, any>
  metadata: Record<string, any>
}

export interface AnomalyEvent {
  anomaly_id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  affected_routes: string[]
  detected_at: Date
  confidence: number
  baseline_value: number
  current_value: number
  deviation_percentage: number
  predicted_impact: Record<string, any>
  recommended_actions: string[]
  ghana_context: Record<string, any>
}

export interface AIInsight {
  insight_id: string
  type: string
  title: string
  description: string
  confidence: number
  impact_level: string
  recommendations: string[]
  data_sources: string[]
  timestamp: Date
  ghana_context: Record<string, any>
}

export interface ScenarioAnalysis {
  scenario_id: string
  scenario_name: string
  description: string
  predicted_outcomes: Record<string, any>
  risk_assessment: Record<string, any>
  mitigation_strategies: string[]
  economic_impact: Record<string, any>
  timeline: string
  confidence: number
}

export interface CulturalInsights {
  timestamp: string
  cultural_factors: Record<string, any>
  economic_indicators: Record<string, any>
  recommendations: string[]
}

export interface EconomicAnalysis {
  timestamp: string
  baseline_economics: Record<string, any>
  optimization_benefits: Record<string, any>
  total_impact: Record<string, any>
}

interface AppState {
  // Real-time data
  vehicles: Vehicle[]
  routes: Route[]
  trips: GTFSTrip[]
  kpis: KPI[]

  // Ghana GTFS Data
  gtfsData: GTFSData | null
  gtfsLoaded: boolean
  gtfsError: string | null
  alerts: Alert[]
  scenarios: Scenario[]

  // ML/AI data (Phase 3)
  mlPredictions: MLPrediction[]
  anomalies: AnomalyEvent[]
  aiInsights: AIInsight[]
  scenarioAnalyses: ScenarioAnalysis[]
  culturalInsights: CulturalInsights | null
  economicAnalysis: EconomicAnalysis | null
  
  // UI state
  selectedRoute: string | null
  selectedVehicle: string | null
  mapCenter: [number, number]
  mapZoom: number
  sidebarOpen: boolean
  activePanel: 'overview' | 'routes' | 'vehicles' | 'analytics' | 'alerts'
  
  // WebSocket connection
  connected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastUpdate: Date | null
  
  // User preferences
  theme: 'light' | 'dark'
  notifications: boolean
  autoRefresh: boolean
  refreshInterval: number
  
  // Actions
  setVehicles: (vehicles: Vehicle[]) => void
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void
  setRoutes: (routes: Route[]) => void
  updateRoute: (id: string, updates: Partial<Route>) => void
  setTrips: (trips: GTFSTrip[]) => void
  setKPIs: (kpis: KPI[]) => void
  updateKPI: (id: string, updates: Partial<KPI>) => void
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void
  markAlertRead: (id: string) => void
  clearAlerts: () => void
  setScenarios: (scenarios: Scenario[]) => void
  activateScenario: (id: string) => void
  deactivateScenario: (id: string) => void

  // ML/AI actions (Phase 3)
  addMLPrediction: (prediction: MLPrediction) => void
  addAnomaly: (anomaly: AnomalyEvent) => void
  addAIInsight: (insight: AIInsight) => void
  addScenarioAnalysis: (analysis: ScenarioAnalysis) => void
  setCulturalInsights: (insights: CulturalInsights) => void
  setEconomicAnalysis: (analysis: EconomicAnalysis) => void
  clearOldPredictions: () => void
  
  // UI actions
  selectRoute: (id: string | null) => void
  selectVehicle: (id: string | null) => void
  setMapView: (center: [number, number], zoom: number) => void
  toggleSidebar: () => void
  setActivePanel: (panel: AppState['activePanel']) => void
  
  // Connection actions
  setConnectionStatus: (status: AppState['connectionStatus']) => void
  updateLastUpdate: () => void

  // GTFS Data actions
  setGTFSData: (data: GTFSData) => void
  setGTFSError: (error: string) => void
  clearGTFSData: () => void

  // Preference actions
  setTheme: (theme: 'light' | 'dark') => void
  toggleNotifications: () => void
  setAutoRefresh: (enabled: boolean) => void
  setRefreshInterval: (interval: number) => void
}

// Default Accra coordinates
const DEFAULT_CENTER: [number, number] = [5.6037, -0.1870]

export const useStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    vehicles: [],
    routes: [],
    trips: [],
    kpis: [],

    // Ghana GTFS Data
    gtfsData: null,
    gtfsLoaded: false,
    gtfsError: null,
    alerts: [],
    scenarios: [],

    // ML/AI initial state (Phase 3)
    mlPredictions: [],
    anomalies: [],
    aiInsights: [],
    scenarioAnalyses: [],
    culturalInsights: null,
    economicAnalysis: null,
    
    selectedRoute: null,
    selectedVehicle: null,
    mapCenter: DEFAULT_CENTER,
    mapZoom: 12,
    sidebarOpen: true,
    activePanel: 'overview',
    
    connected: false,
    connectionStatus: 'disconnected',
    lastUpdate: null,
    
    theme: 'light',
    notifications: true,
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    
    // Data actions
    setVehicles: (vehicles) => set({ vehicles }),
    
    updateVehicle: (id, updates) => set((state) => ({
      vehicles: state.vehicles.map(vehicle =>
        vehicle.id === id ? { ...vehicle, ...updates } : vehicle
      )
    })),
    
    setRoutes: (routes) => set({ routes }),
    
    updateRoute: (id, updates) => set((state) => ({
      routes: state.routes.map(route =>
        route.id === id ? { ...route, ...updates } : route
      )
    })),

    setTrips: (trips) => set({ trips }),

    setKPIs: (kpis) => set({ kpis }),
    
    updateKPI: (id, updates) => set((state) => ({
      kpis: state.kpis.map(kpi =>
        kpi.id === id ? { ...kpi, ...updates } : kpi
      )
    })),
    
    addAlert: (alert) => set((state) => ({
      alerts: [
        {
          ...alert,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
        },
        ...state.alerts
      ]
    })),
    
    markAlertRead: (id) => set((state) => ({
      alerts: state.alerts.map(alert =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    })),
    
    clearAlerts: () => set({ alerts: [] }),
    
    setScenarios: (scenarios) => set({ scenarios }),
    
    activateScenario: (id) => set((state) => ({
      scenarios: state.scenarios.map(scenario =>
        scenario.id === id ? { ...scenario, active: true } : scenario
      )
    })),
    
    deactivateScenario: (id) => set((state) => ({
      scenarios: state.scenarios.map(scenario =>
        scenario.id === id ? { ...scenario, active: false } : scenario
      )
    })),

    // ML/AI actions (Phase 3)
    addMLPrediction: (prediction) => set((state) => ({
      mlPredictions: [...state.mlPredictions.slice(-99), prediction] // Keep last 100
    })),

    addAnomaly: (anomaly) => set((state) => ({
      anomalies: [...state.anomalies.slice(-49), anomaly] // Keep last 50
    })),

    addAIInsight: (insight) => set((state) => ({
      aiInsights: [...state.aiInsights.slice(-29), insight] // Keep last 30
    })),

    addScenarioAnalysis: (analysis) => set((state) => ({
      scenarioAnalyses: [...state.scenarioAnalyses.slice(-19), analysis] // Keep last 20
    })),

    setCulturalInsights: (insights) => set({ culturalInsights: insights }),

    setEconomicAnalysis: (analysis) => set({ economicAnalysis: analysis }),

    clearOldPredictions: () => set((state) => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      return {
        mlPredictions: state.mlPredictions.filter(p => p.timestamp > oneHourAgo),
        anomalies: state.anomalies.filter(a => a.detected_at > oneHourAgo)
      }
    }),
    
    // UI actions
    selectRoute: (id) => set({ selectedRoute: id }),
    selectVehicle: (id) => set({ selectedVehicle: id }),
    setMapView: (center, zoom) => set({ mapCenter: center, mapZoom: zoom }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setActivePanel: (panel) => set({ activePanel: panel }),
    
    // Connection actions
    setConnectionStatus: (status) => set({ 
      connectionStatus: status,
      connected: status === 'connected'
    }),
    
    updateLastUpdate: () => set({ lastUpdate: new Date() }),

    // GTFS Data actions
    setGTFSData: (data: GTFSData) => set({ gtfsData: data, gtfsLoaded: true, gtfsError: null }),
    setGTFSError: (error: string) => set({ gtfsError: error, gtfsLoaded: false }),
    clearGTFSData: () => set({ gtfsData: null, gtfsLoaded: false, gtfsError: null }),

    // Preference actions
    setTheme: (theme) => set({ theme }),
    toggleNotifications: () => set((state) => ({ notifications: !state.notifications })),
    setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
    setRefreshInterval: (interval) => set({ refreshInterval: interval }),
  }))
)

// Selectors for computed values
export const useUnreadAlerts = () => useStore((state) => 
  state.alerts.filter(alert => !alert.read)
)

export const useActiveScenarios = () => useStore((state) => 
  state.scenarios.filter(scenario => scenario.active)
)

export const useRouteVehicles = (routeId: string) => useStore((state) => 
  state.vehicles.filter(vehicle => vehicle.route === routeId)
)

export const useKPIsByCategory = (category: KPI['category']) => useStore((state) => 
  state.kpis.filter(kpi => kpi.category === category)
)
