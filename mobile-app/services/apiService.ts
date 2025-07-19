/**
 * AURA Mobile App - Comprehensive API Service
 * Replaces all hardcoded data with real backend API calls
 * Apple/Uber-level data integration
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface GTFSStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  type?: 'terminal' | 'stop';
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  visibility: number;
  transport_impact: {
    level: 'low' | 'medium' | 'high';
    message: string;
  };
}

export interface VehiclePosition {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  route_id?: string;
  timestamp: string;
}

export interface JourneyPlan {
  routes: Array<{
    duration: number;
    distance: number;
    steps: Array<{
      instruction: string;
      distance: number;
      duration: number;
      coordinates: [number, number][];
    }>;
    transport_modes: string[];
    cost_estimate: number;
  }>;
  alternatives: number;
  total_time: number;
  total_cost: number;
}

export interface TrafficData {
  segment_id: string;
  congestion_level: 'low' | 'medium' | 'high' | 'severe';
  speed_kmh: number;
  travel_time_minutes: number;
  incidents: Array<{
    type: string;
    description: string;
    severity: string;
  }>;
}

export interface MLPrediction {
  travel_time: number;
  confidence: number;
  factors: {
    traffic: number;
    weather: number;
    time_of_day: number;
    route_complexity: number;
  };
}

export interface SystemMetrics {
  active_vehicles: number;
  average_speed: number;
  congestion_level: string;
  service_reliability: number;
  user_satisfaction: number;
  cost_efficiency: number;
}

export interface PopularDestination {
  name: string;
  coordinates: Location;
  category: string;
  popularity_score: number;
  estimated_travel_time: number;
}

export interface LiveEvent {
  id: string;
  type: 'traffic' | 'weather' | 'incident' | 'service';
  title: string;
  description: string;
  location: Location;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  estimated_impact: number;
}

export interface UberEstimate {
  product_id: string;
  display_name: string;
  estimate: string;
  low_estimate: number;
  high_estimate: number;
  surge_multiplier: number;
  duration: number;
  distance: number;
}

class APIService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      return {
        success: false,
        data: null as any,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // GTFS Data Services
  async getGTFSStops(): Promise<ApiResponse<GTFSStop[]>> {
    return this.makeRequest<GTFSStop[]>('/api/v1/gtfs/stops');
  }

  async getNearbyStops(
    latitude: number,
    longitude: number,
    radius: number = 1000
  ): Promise<ApiResponse<GTFSStop[]>> {
    return this.makeRequest<GTFSStop[]>(
      `/api/v1/gtfs/stops/near?lat=${latitude}&lon=${longitude}&radius=${radius}`
    );
  }

  async getGTFSRoutes(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>('/api/v1/gtfs/routes');
  }

  async getGTFSAgencies(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>('/api/v1/gtfs/agencies');
  }

  // Weather Services
  async getWeatherData(): Promise<ApiResponse<WeatherData>> {
    return this.makeRequest<WeatherData>('/api/v1/live_weather/accra');
  }

  // Vehicle Tracking Services
  async getVehiclePositions(): Promise<ApiResponse<VehiclePosition[]>> {
    return this.makeRequest<VehiclePosition[]>('/api/v1/vehicles/positions');
  }

  async getNearbyVehicles(
    latitude: number,
    longitude: number,
    radius: number = 2000
  ): Promise<ApiResponse<VehiclePosition[]>> {
    return this.makeRequest<VehiclePosition[]>(
      `/api/v1/tracking/nearby?lat=${latitude}&lon=${longitude}&radius=${radius}`
    );
  }

  async getVehicleHistory(vehicleId: string, hours: number = 24): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/api/v1/vehicles/${vehicleId}/history?hours=${hours}`);
  }

  // Journey Planning Services
  async planJourney(request: {
    origin: Location;
    destination: Location;
    preferences?: {
      mode?: string[];
      max_walking_distance?: number;
      departure_time?: string;
    };
  }): Promise<ApiResponse<JourneyPlan>> {
    return this.makeRequest<JourneyPlan>('/api/v1/journey/plan', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getPopularDestinations(): Promise<ApiResponse<PopularDestination[]>> {
    return this.makeRequest<PopularDestination[]>('/api/v1/journey/popular-destinations');
  }

  async getSavedJourneys(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>('/api/v1/journey/saved');
  }

  async searchPlaces(query: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/api/v1/journey/search-places?q=${encodeURIComponent(query)}`);
  }

  // ML Prediction Services
  async predictTravelTime(request: {
    origin: Location;
    destination: Location;
    departure_time?: string;
    transport_mode?: string;
  }): Promise<ApiResponse<MLPrediction>> {
    return this.makeRequest<MLPrediction>('/api/v1/ml/predict-travel-time', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async predictTraffic(request: {
    route_segments: string[];
    time_horizon: number;
  }): Promise<ApiResponse<TrafficData[]>> {
    return this.makeRequest<TrafficData[]>('/api/v1/ml/predict-traffic', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getPredictiveAnalytics(request: {
    location: Location;
    time_range: string;
    metrics: string[];
  }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/ml/predictive-analytics', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Traffic Services
  async getTrafficData(segmentId: string): Promise<ApiResponse<TrafficData>> {
    return this.makeRequest<TrafficData>(`/api/v1/traffic/${segmentId}`);
  }

  async getLiveTrafficData(): Promise<ApiResponse<TrafficData[]>> {
    return this.makeRequest<TrafficData[]>('/api/v1/traffic/live');
  }

  async getTrafficPredictions(segmentId: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/api/v1/traffic/predictions/${segmentId}`);
  }

  async getTrafficAlerts(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>('/api/v1/traffic/alerts');
  }

  // System Metrics Services
  async getSystemMetrics(): Promise<ApiResponse<SystemMetrics>> {
    return this.makeRequest<SystemMetrics>('/api/v1/kpis');
  }

  async getRealtimeKPIs(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/kpis/realtime');
  }

  async getMLPerformanceMetrics(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/ml/performance-metrics');
  }

  // Live Events Services
  async getLiveEvents(): Promise<ApiResponse<LiveEvent[]>> {
    return this.makeRequest<LiveEvent[]>('/api/v1/live_events');
  }

  // Route Optimization Services
  async getOptimizedRoutes(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>('/api/v1/routes');
  }

  async optimizeRoutes(request: {
    stops: Location[];
    vehicle_type: string;
    constraints: any;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/optimize/routes/enhanced', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Pricing Services
  async getDynamicPricing(request: {
    origin: Location;
    destination: Location;
    time: string;
    demand_factors: any;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/pricing/dynamic', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Uber Integration Services
  async getUberEstimate(request: {
    start_latitude: number;
    start_longitude: number;
    end_latitude: number;
    end_longitude: number;
  }): Promise<ApiResponse<UberEstimate[]>> {
    return this.makeRequest<UberEstimate[]>('/api/v1/uber/estimate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Maintenance Services
  async getVehicleSensorData(vehicleId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/api/v1/maintenance/sensors/${vehicleId}`);
  }

  async predictMaintenanceFailures(request: {
    vehicle_data: any;
    sensor_readings: any;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/maintenance/predict', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Economics and Analytics
  async getGhanaEconomics(request: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/ghana/economics', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getNetworkAnalysis(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/ghana/network_analysis');
  }

  // CO2 and Environmental Services
  async calculateCO2Emissions(request: {
    distance_km: number;
    vehicle_type: string;
    fuel_type: string;
    passengers: number;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/calculate_co2', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Isochrone Services
  async getIsochrone(request: {
    latitude: number;
    longitude: number;
    time_minutes: number;
    transport_mode: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/get_isochrone', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Holiday and Calendar Services
  async checkGhanaHoliday(date?: string): Promise<ApiResponse<any>> {
    const dateParam = date ? `?date=${date}` : '';
    return this.makeRequest<any>(`/api/v1/check_holiday/GH${dateParam}`);
  }

  // Health Check Services
  async getHealthStatus(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/health');
  }

  async getComprehensiveHealth(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/health/comprehensive');
  }

  // Demand Prediction Services
  async predictDemand(request: {
    location: Location;
    time_range: string;
    historical_data: any;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/ml/predict-demand', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;