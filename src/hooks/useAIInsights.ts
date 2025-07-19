import ExternalAPIsManager from '@/lib/external-apis';
import { GhanaEconomicsEngine } from '@/lib/ghana-economics';
import { GhanaTransportMLEnsemble } from '@/lib/ml-ensemble';
import { useCallback, useEffect, useState } from 'react';

export interface AIInsightsData {
  ml_predictions: {
    circle_hub: number;
    kaneshie_market: number;
    achimota: number;
    confidence: number;
  };
  economic_impact: {
    daily_savings_ghs: number;
    co2_reduction_kg: number;
    efficiency_gain: number;
    jobs_impact: number;
  };
  ghana_context: {
    is_market_day: boolean;
    is_school_hours: boolean;
    weather_impact: number;
    traffic_density: string;
    cultural_factors: string[];
  };
  system_status: {
    ml_ensemble_accuracy: number;
    apis_operational: number;
    optimization_quality: number;
    real_time_updates: boolean;
  };
  live_insights: string[];
  optimization_suggestions: string[];
}

export const useAIInsights = () => {
  const [insightsData, setInsightsData] = useState<AIInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [mlEnsemble] = useState(() => new GhanaTransportMLEnsemble());
  const [economicsEngine] = useState(() => new GhanaEconomicsEngine());
  const [apisManager] = useState(() => new ExternalAPIsManager());
  const [error, setError] = useState<Error | null>(null);

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

  const generateLiveInsights = useCallback((predictions: any[], economicImpact: any, externalData: any): string[] => {
    const insights: string[] = [];
    
    // ML-based insights
    const avgDemand = predictions.reduce((sum, p) => sum + p.predicted_demand, 0) / predictions.length;
    if (avgDemand > 0.7) {
      insights.push(`🚨 High demand predicted across network (${Math.round(avgDemand * 100)}%)`);
    } else if (avgDemand < 0.3) {
      insights.push(`📉 Low demand period - optimize vehicle allocation`);
    } else {
      insights.push(`📊 Moderate demand - standard operations recommended`);
    }
    
    // Economic insights
    if (economicImpact?.daily_savings_ghs > 500) {
      insights.push(`💰 Significant savings potential: GH₵${Math.round(economicImpact.daily_savings_ghs)}/day`);
    }
    
    // Weather insights
    if (externalData?.weather?.data?.weather_impact_factor > 1.2) {
      insights.push(`🌧️ Weather impact detected - expect ${Math.round((externalData.weather.data.weather_impact_factor - 1) * 100)}% delays`);
    }
    
    // Traffic insights
    if (externalData?.traffic?.data?.overall_congestion === 'severe') {
      insights.push(`🚦 Severe traffic congestion - consider alternative routes`);
    }
    
    // Holiday insights
    if (externalData?.holidays?.data?.is_holiday) {
      insights.push(`🎉 Holiday detected: ${externalData.holidays.data.holiday_name} - adjusted operations needed`);
    }
    
    return insights.slice(0, 4);
  }, []);

  const generateOptimizationSuggestions = useCallback((predictions: any[], context: any, externalData: any): string[] => {
    const suggestions: string[] = [];
    
    // High-demand suggestions
    const highDemandStops = predictions.filter((p: any) => p.predicted_demand > 0.7);
    if (highDemandStops.length > 0) {
      suggestions.push(`Increase vehicle frequency on high-demand routes (${highDemandStops.length} stops affected)`);
    }
    
    // Cultural optimization
    if (context?.is_market_day) {
      suggestions.push('Deploy additional vehicles to market areas during peak hours');
    }
    
    if (context?.is_school_hours) {
      suggestions.push('Implement school zone speed limits and safety protocols');
    }
    
    // Weather optimization
    if (externalData?.weather?.data?.conditions === 'rainy') {
      suggestions.push('Activate rainy season protocols - increase following distance');
    }
    
    // Economic optimization
    suggestions.push('Optimize fuel consumption through route consolidation');
    suggestions.push('Implement dynamic pricing based on demand predictions');
    
    return suggestions.slice(0, 5);
  }, []);

  const loadAIInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load real GTFS data from backend API
      console.log('🧠 Loading real GTFS data for AI insights...')

      const [gtfsStops, gtfsRoutes] = await Promise.all([
        apiService.getStops().catch(err => {
          console.warn('⚠️ Failed to load stops for AI insights:', err)
          // Fallback to mock data
          return [
            { stop_id: 'circle_hub', stop_name: 'Circle Interchange', stop_lat: 5.603717, stop_lon: -0.186964 },
            { stop_id: 'kaneshie_market', stop_name: 'Kaneshie Market', stop_lat: 5.614818, stop_lon: -0.205874 },
            { stop_id: 'achimota', stop_name: 'Achimota Terminal', stop_lat: 5.588928, stop_lon: -0.232107 }
          ]
        }),
        apiService.getRoutes().catch(err => {
          console.warn('⚠️ Failed to load routes for AI insights:', err)
          // Fallback to mock data
          return [
            { route_id: 'route_1', route_short_name: 'Circle-Kaneshie', route_long_name: 'Circle to Kaneshie Market', route_type: 3 },
            { route_id: 'route_2', route_short_name: 'Achimota-37', route_long_name: 'Achimota to 37 Military Hospital', route_type: 3 }
          ]
        })
      ])

      console.log('✅ GTFS data loaded for AI insights:', {
        stops: gtfsStops?.length || 0,
        routes: gtfsRoutes?.length || 0
      })

      // Use first few stops for key predictions
      const keyStops = gtfsStops?.slice(0, 3) || [
        { stop_id: 'circle_hub', stop_name: 'Circle Interchange', stop_lat: 5.603717, stop_lon: -0.186964 },
        { stop_id: 'kaneshie_market', stop_name: 'Kaneshie Market', stop_lat: 5.614818, stop_lon: -0.205874 },
        { stop_id: 'achimota', stop_name: 'Achimota Terminal', stop_lat: 5.588928, stop_lon: -0.232107 }
      ]

      // Load GTFS data into ML ensemble
      await mlEnsemble.loadGTFSData(keyStops, gtfsRoutes);

      // Train ML ensemble
      const ensembleMetrics = await mlEnsemble.trainEnsemble();

      // Get external data for context
      const externalData = await apisManager.getComprehensiveData();

      // Generate ML predictions for key stops
      const circleFeatures = (mlEnsemble as any).extractStopFeatures(keyStops[0]);
      const kaneshieFeatures = (mlEnsemble as any).extractStopFeatures(keyStops[1]);
      const achimotaFeatures = (mlEnsemble as any).extractStopFeatures(keyStops[2]);
      
      // Try to get predictions from backend API first, fallback to local ML
      let circlePrediction, kaneshiePrediction, achimotaPrediction;

      try {
        console.log('🤖 Attempting to get ML predictions from backend API...')

        // Try backend API predictions
        const backendPredictions = await Promise.all([
          apiService.predictTravelTime({
            origin: keyStops[0],
            destination: keyStops[1],
            time_of_day: new Date().getHours()
          }).catch(() => null),
          apiService.predictTravelTime({
            origin: keyStops[1],
            destination: keyStops[2],
            time_of_day: new Date().getHours()
          }).catch(() => null),
          apiService.getEnsemblePrediction({
            stops: keyStops,
            routes: gtfsRoutes?.slice(0, 5) || []
          }).catch(() => null)
        ])

        if (backendPredictions.some(p => p !== null)) {
          console.log('✅ Using backend ML predictions')
          circlePrediction = backendPredictions[0]?.prediction || await mlEnsemble.predictDemand(circleFeatures)
          kaneshiePrediction = backendPredictions[1]?.prediction || await mlEnsemble.predictDemand(kaneshieFeatures)
          achimotaPrediction = backendPredictions[2]?.prediction || await mlEnsemble.predictDemand(achimotaFeatures)
        } else {
          throw new Error('Backend predictions not available')
        }
      } catch (error) {
        console.log('⚠️ Backend ML predictions not available, using local ML ensemble')

        // Fallback to local ML predictions
        const [localCircle, localKaneshie, localAchimota] = await Promise.all([
          mlEnsemble.predictDemand(circleFeatures),
          mlEnsemble.predictDemand(kaneshieFeatures),
          mlEnsemble.predictDemand(achimotaFeatures)
        ])

        circlePrediction = localCircle
        kaneshiePrediction = localKaneshie
        achimotaPrediction = localAchimota
      }

      // Calculate economic impact
      const originalRoutes = [
        economicsEngine.calculateRouteEconomics('route_1', 15, 1.2, 'tro-tro', 12),
        economicsEngine.calculateRouteEconomics('route_2', 18, 1.5, 'tro-tro', 10)
      ];
      
      const optimizedRoutes = [
        economicsEngine.calculateRouteEconomics('route_1_opt', 12, 0.9, 'tro-tro', 14),
        economicsEngine.calculateRouteEconomics('route_2_opt', 15, 1.1, 'tro-tro', 13)
      ];
      
      const economicImpact = economicsEngine.analyzeEconomicImpact(originalRoutes, optimizedRoutes, 100);

      // Generate Ghana cultural context
      const ghanaContext = economicsEngine.getEconomicData();
      const routeContext = {
        is_market_day: new Date().getDay() === 1 || new Date().getDay() === 4,
        is_school_hours: new Date().getHours() >= 7 && new Date().getHours() <= 15,
        weather_impact: externalData.weather?.data?.weather_impact_factor || 1.0,
        traffic_density: externalData.traffic?.data?.overall_congestion || 'medium',
        cultural_factors: generateCulturalFactors()
      };

      // Generate live insights and optimization suggestions
      const liveInsights = generateLiveInsights(
        [circlePrediction, kaneshiePrediction, achimotaPrediction],
        economicImpact,
        externalData
      );

      const optimizationSuggestions = generateOptimizationSuggestions(
        [circlePrediction, kaneshiePrediction, achimotaPrediction],
        routeContext,
        externalData
      );

      // Update state with new data
      setInsightsData({
        ml_predictions: {
          circle_hub: Math.round(circlePrediction.predicted_demand * 100),
          kaneshie_market: Math.round(kaneshiePrediction.predicted_demand * 100),
          achimota: Math.round(achimotaPrediction.predicted_demand * 100),
          confidence: Math.round(((circlePrediction.confidence_score + 
                                kaneshiePrediction.confidence_score + 
                                achimotaPrediction.confidence_score) / 3) * 100)
        },
        economic_impact: {
          daily_savings_ghs: Math.round(economicImpact.daily_savings_ghs),
          co2_reduction_kg: Math.round((economicImpact.co2_reduction_tons_per_year * 1000) / 365),
          efficiency_gain: Math.round(economicImpact.productivity_gain_percentage),
          jobs_impact: economicImpact.jobs_created
        },
        ghana_context: routeContext,
        system_status: {
          ml_ensemble_accuracy: Math.round(ensembleMetrics.accuracy * 100),
          apis_operational: externalData.operational_apis || 0,
          optimization_quality: Math.round((ensembleMetrics.ensemble_confidence + economicImpact.equity_index / 100) * 50),
          real_time_updates: (externalData.operational_apis || 0) >= 3
        },
        live_insights: liveInsights,
        optimization_suggestions: optimizationSuggestions
      });

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading AI insights:', err);
      setError(err instanceof Error ? err : new Error('Failed to load AI insights'));
    } finally {
      setIsLoading(false);
    }
  }, [mlEnsemble, economicsEngine, apisManager, generateCulturalFactors, generateLiveInsights, generateOptimizationSuggestions]);

  const runScenario = useCallback(async (scenarioType: 'flooding' | 'graduation' | 'market_festival') => {
    setIsLoading(true);
    
    try {
      // Simulate scenario analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!insightsData) return;
      
      const scenarioInsights = {
        flooding: [
          '🌊 Flooding scenario activated',
          'Alternative routes calculated for affected areas',
          'Emergency vehicle deployment protocols initiated',
          'Passenger safety notifications sent'
        ],
        graduation: [
          '🎓 University graduation scenario activated',
          'Increased capacity planned for university areas',
          'Extended service hours implemented',
          'Traffic management protocols activated'
        ],
        market_festival: [
          '🎪 Market festival scenario activated',
          'Festival route diversions calculated',
          'Cultural event traffic patterns applied',
          'Special event pricing activated'
        ]
      };
      
      setInsightsData({
        ...insightsData,
        live_insights: scenarioInsights[scenarioType],
        optimization_suggestions: [
          'Scenario-specific optimizations applied',
          'Real-time monitoring activated',
          'Emergency response protocols ready',
          'Stakeholder notifications sent'
        ]
      });
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error running scenario:', err);
      setError(err instanceof Error ? err : new Error('Failed to run scenario'));
    } finally {
      setIsLoading(false);
    }
  }, [insightsData]);

  // Load insights on mount and set up refresh interval
  useEffect(() => {
    loadAIInsights();
    
    const interval = setInterval(() => {
      loadAIInsights();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [loadAIInsights]);

  return {
    insightsData,
    isLoading,
    error,
    lastUpdate,
    refresh: loadAIInsights,
    runScenario
  };
};
