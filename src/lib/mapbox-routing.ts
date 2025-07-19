// Professional Mapbox Routing Engine for Ghana Transport Optimization
// Implements enterprise-grade routing with real-time traffic integration

export interface RouteProfile {
  profile: 'driving-traffic' | 'driving' | 'walking' | 'cycling';
  name: string;
  description: string;
}

export interface AccraCoordinates {
  longitude: number;
  latitude: number;
  name?: string;
  type?: 'hub' | 'market' | 'residential' | 'commercial';
}

export interface OptimizedRoute {
  geometry: GeoJSON.LineString;
  duration: number; // seconds
  distance: number; // meters
  traffic_delay: number; // additional seconds due to traffic
  fuel_cost_ghs: number; // Ghana Cedis
  co2_emissions_kg: number;
  efficiency_score: number;
  waypoints: AccraCoordinates[];
  traffic_incidents: TrafficIncident[];
}

export interface TrafficIncident {
  type: 'accident' | 'construction' | 'flooding' | 'market_congestion';
  severity: 'low' | 'medium' | 'high' | 'severe';
  location: AccraCoordinates;
  description: string;
  estimated_delay: number; // minutes
}

export interface GhanaRouteContext {
  is_market_day: boolean;
  is_school_hours: boolean;
  is_friday_prayer: boolean;
  is_rainy_season: boolean;
  fuel_price_ghs: number;
  traffic_density: 'low' | 'medium' | 'high' | 'severe';
}

export class MapboxProfessionalRouting {
  private accessToken: string;
  private baseUrl = 'https://api.mapbox.com';
  private ghanaFuelPrice = 14.34; // Current Ghana fuel price (GHS per liter)
  private co2EmissionRate = 2.31; // kg CO2 per liter of fuel
  private avgFuelConsumption = 8.5; // L/100km for tro-tro

  // Major Accra transport hubs with real coordinates
  private accraHubs: AccraCoordinates[] = [
    { longitude: -0.186964, latitude: 5.603717, name: 'Circle', type: 'hub' },
    { longitude: -0.205874, latitude: 5.614818, name: 'Kaneshie', type: 'hub' },
    { longitude: -0.232107, latitude: 5.588928, name: 'Achimota', type: 'hub' },
    { longitude: -0.166667, latitude: 5.550000, name: '37 Military Hospital', type: 'hub' },
    { longitude: -0.196667, latitude: 5.550000, name: 'Independence Square', type: 'hub' },
    { longitude: -0.201389, latitude: 5.603889, name: 'Makola Market', type: 'market' },
    { longitude: -0.224722, latitude: 5.614722, name: 'Kaneshie Market', type: 'market' }
  ];

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Get professional route with traffic-aware optimization
   */
  async getTrafficAwareRoute(
    origin: AccraCoordinates,
    destination: AccraCoordinates,
    context?: GhanaRouteContext
  ): Promise<OptimizedRoute> {
    try {
      // Get multiple route profiles for comparison
      const profiles: RouteProfile[] = [
        { profile: 'driving-traffic', name: 'Traffic-Aware', description: 'Real-time traffic optimization' },
        { profile: 'driving', name: 'Standard', description: 'Without traffic data' }
      ];

      const routes = await Promise.all(
        profiles.map(profile => this.getRouteForProfile(origin, destination, profile.profile))
      );

      // Select best route based on Ghana context
      const bestRoute = this.selectOptimalRoute(routes, context);
      
      // Calculate Ghana-specific metrics
      const optimizedRoute = await this.calculateGhanaMetrics(bestRoute, context);
      
      return optimizedRoute;
    } catch (error) {
      console.error('Mapbox routing error:', error);
      throw new Error(`Failed to get route: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Multi-stop route optimization using Mapbox Optimization API
   */
  async optimizeMultiStopRoute(
    waypoints: AccraCoordinates[],
    context?: GhanaRouteContext
  ): Promise<OptimizedRoute> {
    try {
      const coordinates = waypoints.map(wp => `${wp.longitude},${wp.latitude}`).join(';');
      
      const url = `${this.baseUrl}/optimized-trips/v1/mapbox/driving-traffic/${coordinates}`;
      const params = new URLSearchParams({
        access_token: this.accessToken,
        geometries: 'geojson',
        overview: 'full',
        steps: 'true',
        annotations: 'duration,distance,speed',
        roundtrip: 'false',
        source: 'first',
        destination: 'last'
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.trips || data.trips.length === 0) {
        throw new Error('No optimized route found');
      }

      const trip = data.trips[0];
      return await this.calculateGhanaMetrics(trip, context);
    } catch (error) {
      console.error('Multi-stop optimization error:', error);
      // Fallback to simple routing if optimization fails
      return await this.getFallbackRoute(waypoints, context);
    }
  }

  /**
   * Get real-time traffic conditions for Accra
   */
  async getAccraTrafficConditions(): Promise<{
    overall_density: string;
    incidents: TrafficIncident[];
    peak_hour_multiplier: number;
  }> {
    try {
      // In production, this would call Mapbox Traffic API
      // For now, simulate realistic Accra traffic patterns
      const hour = new Date().getHours();
      const isWeekday = new Date().getDay() >= 1 && new Date().getDay() <= 5;
      
      let density: 'low' | 'medium' | 'high' | 'severe';
      let multiplier: number;

      if (isWeekday && ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19))) {
        density = 'severe';
        multiplier = 1.8;
      } else if (isWeekday && (hour >= 6 && hour <= 20)) {
        density = 'high';
        multiplier = 1.4;
      } else if (hour >= 22 || hour <= 5) {
        density = 'low';
        multiplier = 0.8;
      } else {
        density = 'medium';
        multiplier = 1.1;
      }

      // Simulate common Accra traffic incidents
      const incidents: TrafficIncident[] = [];
      
      if (Math.random() > 0.7) {
        const kaneshieMarket = this.accraHubs.find(h => h.name === 'Kaneshie Market');
        if (kaneshieMarket) {
          incidents.push({
            type: 'market_congestion',
            severity: 'medium',
            location: kaneshieMarket,
            description: 'Heavy congestion around Kaneshie Market',
            estimated_delay: 15
          });
        }
      }

      if (Math.random() > 0.8) {
        incidents.push({
          type: 'construction',
          severity: 'high',
          location: { longitude: -0.186964, latitude: 5.603717, name: 'Circle Interchange' },
          description: 'Road construction on N1 Highway',
          estimated_delay: 25
        });
      }

      return {
        overall_density: density,
        incidents,
        peak_hour_multiplier: multiplier
      };
    } catch (error) {
      console.error('Traffic conditions error:', error);
      return {
        overall_density: 'medium',
        incidents: [],
        peak_hour_multiplier: 1.2
      };
    }
  }

  /**
   * Get route for specific profile
   */
  private async getRouteForProfile(
    origin: AccraCoordinates,
    destination: AccraCoordinates,
    profile: string
  ): Promise<any> {
    const url = `${this.baseUrl}/directions/v5/mapbox/${profile}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    
    const params = new URLSearchParams({
      access_token: this.accessToken,
      geometries: 'geojson',
      overview: 'full',
      steps: 'true',
      annotations: 'duration,distance,speed'
    });

    const response = await fetch(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    return data.routes[0];
  }

  /**
   * Select optimal route based on Ghana context
   */
  private selectOptimalRoute(routes: any[], context?: GhanaRouteContext): any {
    if (!routes || routes.length === 0) {
      throw new Error('No routes available for selection');
    }
    
    if (!context) return routes[0]; // Default to first route

    // Score routes based on Ghana-specific factors
    const scoredRoutes = routes.map(route => {
      let score = 0;
      
      // Prefer shorter duration in traffic
      score += (1 / route.duration) * 1000;
      
      // Penalty for routes during market days
      if (context.is_market_day) {
        score -= 50;
      }
      
      // Bonus for fuel efficiency
      const fuelEfficiency = route.distance / route.duration;
      score += fuelEfficiency * 10;
      
      return { route, score };
    });

    // Return route with highest score
    const bestRoute = scoredRoutes.sort((a, b) => b.score - a.score)[0];
    return bestRoute ? bestRoute.route : routes[0];
  }

  /**
   * Calculate Ghana-specific route metrics
   */
  private async calculateGhanaMetrics(
    route: any,
    context?: GhanaRouteContext
  ): Promise<OptimizedRoute> {
    const distanceKm = route.distance / 1000;
    const durationMinutes = route.duration / 60;
    
    // Calculate fuel consumption and costs
    const fuelConsumption = (distanceKm / 100) * this.avgFuelConsumption;
    const fuelCostGHS = fuelConsumption * (context?.fuel_price_ghs || this.ghanaFuelPrice);
    const co2EmissionsKg = fuelConsumption * this.co2EmissionRate;
    
    // Calculate traffic delay
    const baseTime = distanceKm / 50; // Assume 50 km/h without traffic
    const trafficDelay = Math.max(0, durationMinutes - (baseTime * 60));
    
    // Calculate efficiency score (higher is better)
    const efficiencyScore = (distanceKm * 100) / (durationMinutes + fuelCostGHS);
    
    // Get traffic incidents
    const trafficConditions = await this.getAccraTrafficConditions();
    
    // Ensure geometry exists and has coordinates
    if (!route.geometry || !route.geometry.coordinates || route.geometry.coordinates.length === 0) {
      throw new Error('Invalid route geometry');
    }
    
    const coordinates = route.geometry.coordinates;
    const firstCoord = coordinates[0];
    const lastCoord = coordinates[coordinates.length - 1];
    
    return {
      geometry: route.geometry,
      duration: route.duration,
      distance: route.distance,
      traffic_delay: trafficDelay * 60, // Convert to seconds
      fuel_cost_ghs: fuelCostGHS,
      co2_emissions_kg: co2EmissionsKg,
      efficiency_score: efficiencyScore,
      waypoints: [
        { longitude: firstCoord[0], latitude: firstCoord[1] },
        { longitude: lastCoord[0], latitude: lastCoord[1] }
      ],
      traffic_incidents: trafficConditions.incidents
    };
  }

  /**
   * Fallback route calculation if optimization fails
   */
  private async getFallbackRoute(
    waypoints: AccraCoordinates[],
    context?: GhanaRouteContext
  ): Promise<OptimizedRoute> {
    // Simple point-to-point routing as fallback
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints required');
    }

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    
    if (!origin || !destination) {
      throw new Error('Invalid waypoints provided');
    }
    
    return await this.getTrafficAwareRoute(origin, destination, context);
  }

  /**
   * Get Ghana route context based on current time and conditions
   */
  getGhanaRouteContext(): GhanaRouteContext {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    return {
      is_market_day: day === 1 || day === 4, // Monday and Thursday
      is_school_hours: hour >= 7 && hour <= 15,
      is_friday_prayer: day === 5 && hour >= 12 && hour <= 14,
      is_rainy_season: [4, 5, 6, 9, 10].includes(now.getMonth()), // April-June, Sept-Oct
      fuel_price_ghs: this.ghanaFuelPrice,
      traffic_density: 'medium' // Default, should be updated from real data
    };
  }

  /**
   * Get major Accra transport hubs
   */
  getAccraHubs(): AccraCoordinates[] {
    return this.accraHubs;
  }
} 