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

export interface Weather {
  is_rainy: boolean;
  rain_intensity: 'low' | 'medium' | 'high';
}

export interface Holiday {
  name: string;
}