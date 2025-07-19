#!/usr/bin/env python3
"""
🇬🇭 GHANA ML SERVICE
Real-time machine learning predictions using trained models on Ghana GTFS data
Provides: Travel Time Prediction, Demand Forecasting, Route Optimization
"""

import joblib
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

class GhanaMLService:
    def __init__(self, models_dir: str = "models"):
        """Initialize ML service with trained models"""
        self.models_dir = Path(models_dir)
        self.models = {}
        self.scalers = {}
        self.feature_names = {}
        self.metadata = {}
        
        # Load all available models
        self._load_models()
        
        print(f"🤖 Ghana ML Service initialized with {len(self.models)} models")

    def _load_models(self):
        """Load all trained models and their metadata"""
        try:
            # Load travel time prediction model
            if (self.models_dir / 'travel_time_model.joblib').exists():
                self.models['travel_time'] = joblib.load(self.models_dir / 'travel_time_model.joblib')
                self.scalers['travel_time'] = joblib.load(self.models_dir / 'travel_time_scaler.joblib')
                self.feature_names['travel_time'] = joblib.load(self.models_dir / 'travel_time_features.joblib')
                
                with open(self.models_dir / 'travel_time_metadata.json', 'r') as f:
                    self.metadata['travel_time'] = json.load(f)
                
                print("✅ Travel time prediction model loaded")

            # Load demand forecasting model
            if (self.models_dir / 'demand_forecasting_model.joblib').exists():
                self.models['demand'] = joblib.load(self.models_dir / 'demand_forecasting_model.joblib')
                self.feature_names['demand'] = joblib.load(self.models_dir / 'demand_forecasting_features.joblib')
                print("✅ Demand forecasting model loaded")

        except Exception as e:
            print(f"⚠️ Error loading models: {e}")

    def predict_travel_time(self, 
                          total_stops: int,
                          departure_hour: int,
                          departure_minute: int = 0,
                          is_weekend: bool = False,
                          stops_remaining: int = None,
                          route_type: int = 3) -> Dict:
        """
        Predict travel time for a trip segment
        
        Args:
            total_stops: Total number of stops in the trip
            departure_hour: Hour of departure (0-23)
            departure_minute: Minute of departure (0-59)
            is_weekend: Whether it's a weekend
            stops_remaining: Number of stops remaining (if None, calculated from total_stops)
            route_type: GTFS route type (3 = bus, default)
        
        Returns:
            Dict with prediction, confidence, and metadata
        """
        if 'travel_time' not in self.models:
            return {'error': 'Travel time model not available'}

        try:
            # Calculate derived features
            if stops_remaining is None:
                stops_remaining = max(1, total_stops - 1)
            
            trip_progress = 1 - (stops_remaining / total_stops) if total_stops > 0 else 0
            is_rush_hour = departure_hour in [7, 8, 17, 18, 19]
            
            # Prepare features
            features = np.array([[
                total_stops,
                departure_hour,
                departure_minute,
                1 if is_weekend else 0,
                1 if is_rush_hour else 0,
                stops_remaining,
                trip_progress,
                route_type
            ]])
            
            # Scale features
            features_scaled = self.scalers['travel_time'].transform(features)
            
            # Make prediction
            prediction = self.models['travel_time'].predict(features_scaled)[0]
            
            # Calculate confidence based on model performance
            model_r2 = self.metadata['travel_time'].get('performance', {}).get('r2', 0)
            confidence = min(0.95, max(0.1, model_r2))
            
            # Add Ghana-specific adjustments
            if is_rush_hour:
                prediction *= 1.3  # Rush hour delay factor
            if is_weekend:
                prediction *= 0.8  # Weekend speed factor
                
            prediction = max(1.0, prediction)  # Minimum 1 minute
            
            return {
                'predicted_time_minutes': round(prediction, 2),
                'confidence': round(confidence, 3),
                'factors': {
                    'is_rush_hour': is_rush_hour,
                    'is_weekend': is_weekend,
                    'trip_progress': round(trip_progress, 2),
                    'route_type': route_type
                },
                'model_info': {
                    'model_type': self.metadata['travel_time'].get('model_type', 'Unknown'),
                    'training_date': self.metadata['travel_time'].get('training_date', 'Unknown'),
                    'data_source': 'Ghana GTFS Real Data'
                }
            }
            
        except Exception as e:
            return {'error': f'Prediction failed: {str(e)}'}

    def predict_demand(self,
                      route_type: int = 3,
                      hour: int = None,
                      day_of_week: int = None,
                      is_weekend: bool = None,
                      is_rush_hour: bool = None,
                      is_business_hours: bool = None) -> Dict:
        """
        Predict passenger demand for a route
        
        Args:
            route_type: GTFS route type (3 = bus, default)
            hour: Hour of day (0-23), if None uses current hour
            day_of_week: Day of week (0=Monday, 6=Sunday), if None uses current day
            is_weekend: Override weekend detection
            is_rush_hour: Override rush hour detection
            is_business_hours: Override business hours detection
        
        Returns:
            Dict with demand prediction and metadata
        """
        if 'demand' not in self.models:
            return {'error': 'Demand forecasting model not available'}

        try:
            # Use current time if not specified
            now = datetime.now()
            if hour is None:
                hour = now.hour
            if day_of_week is None:
                day_of_week = now.weekday()
            
            # Calculate boolean features
            if is_weekend is None:
                is_weekend = day_of_week in [5, 6]  # Saturday, Sunday
            if is_rush_hour is None:
                is_rush_hour = hour in [7, 8, 17, 18, 19]
            if is_business_hours is None:
                is_business_hours = hour in [9, 10, 11, 12, 13, 14, 15, 16]
            
            # Prepare features
            features = np.array([[
                route_type,
                hour,
                day_of_week,
                1 if is_weekend else 0,
                1 if is_rush_hour else 0,
                1 if is_business_hours else 0
            ]])
            
            # Make prediction
            prediction = self.models['demand'].predict(features)[0]
            
            # Ensure reasonable bounds
            prediction = max(5, min(200, prediction))
            
            return {
                'predicted_passengers': round(prediction),
                'demand_level': self._categorize_demand(prediction),
                'factors': {
                    'hour': hour,
                    'day_of_week': day_of_week,
                    'is_weekend': is_weekend,
                    'is_rush_hour': is_rush_hour,
                    'is_business_hours': is_business_hours,
                    'route_type': route_type
                },
                'recommendations': self._get_demand_recommendations(prediction, is_rush_hour, is_weekend)
            }
            
        except Exception as e:
            return {'error': f'Demand prediction failed: {str(e)}'}

    def _categorize_demand(self, demand: float) -> str:
        """Categorize demand level"""
        if demand < 30:
            return 'Low'
        elif demand < 80:
            return 'Medium'
        elif demand < 120:
            return 'High'
        else:
            return 'Very High'

    def _get_demand_recommendations(self, demand: float, is_rush_hour: bool, is_weekend: bool) -> List[str]:
        """Get operational recommendations based on demand"""
        recommendations = []
        
        if demand > 120:
            recommendations.append("Deploy additional vehicles")
            recommendations.append("Consider express services")
        elif demand > 80:
            recommendations.append("Monitor capacity closely")
            if is_rush_hour:
                recommendations.append("Prepare backup vehicles")
        elif demand < 30:
            recommendations.append("Consider reducing frequency")
            if is_weekend:
                recommendations.append("Optimize for weekend schedule")
        
        if is_rush_hour and demand > 60:
            recommendations.append("Implement dynamic pricing")
            recommendations.append("Coordinate with traffic management")
        
        return recommendations

    def get_route_optimization_insights(self, route_data: Dict) -> Dict:
        """
        Provide ML-driven route optimization insights
        
        Args:
            route_data: Dict containing route information
        
        Returns:
            Dict with optimization recommendations
        """
        try:
            route_id = route_data.get('route_id', 'Unknown')
            current_passengers = route_data.get('passengers', 0)
            current_time = datetime.now()
            
            # Predict demand for next few hours
            demand_predictions = []
            for hour_offset in range(1, 4):  # Next 3 hours
                future_time = current_time + timedelta(hours=hour_offset)
                demand_pred = self.predict_demand(
                    hour=future_time.hour,
                    day_of_week=future_time.weekday()
                )
                if 'predicted_passengers' in demand_pred:
                    demand_predictions.append({
                        'hour': future_time.hour,
                        'predicted_demand': demand_pred['predicted_passengers'],
                        'demand_level': demand_pred['demand_level']
                    })
            
            # Generate optimization recommendations
            recommendations = []
            if demand_predictions:
                avg_future_demand = np.mean([p['predicted_demand'] for p in demand_predictions])
                
                if avg_future_demand > current_passengers * 1.5:
                    recommendations.append("Increase frequency in next 3 hours")
                elif avg_future_demand < current_passengers * 0.7:
                    recommendations.append("Consider reducing frequency")
                
                peak_hour = max(demand_predictions, key=lambda x: x['predicted_demand'])
                recommendations.append(f"Peak demand expected at {peak_hour['hour']}:00 ({peak_hour['predicted_demand']} passengers)")
            
            return {
                'route_id': route_id,
                'current_passengers': current_passengers,
                'demand_forecast': demand_predictions,
                'optimization_recommendations': recommendations,
                'analysis_timestamp': current_time.isoformat()
            }
            
        except Exception as e:
            return {'error': f'Route optimization analysis failed: {str(e)}'}

    def get_system_health(self) -> Dict:
        """Get ML service health and model information"""
        return {
            'service_status': 'operational',
            'models_loaded': list(self.models.keys()),
            'model_metadata': {
                name: {
                    'training_date': meta.get('training_date', 'Unknown'),
                    'model_type': meta.get('model_type', 'Unknown'),
                    'performance': meta.get('performance', {})
                }
                for name, meta in self.metadata.items()
            },
            'ghana_gtfs_integration': True,
            'last_updated': datetime.now().isoformat()
        }

# Global ML service instance
ml_service = None

def get_ml_service() -> GhanaMLService:
    """Get or create the global ML service instance"""
    global ml_service
    if ml_service is None:
        ml_service = GhanaMLService()
    return ml_service

def main():
    """Test the ML service"""
    print("🇬🇭 Testing Ghana ML Service...")
    
    service = GhanaMLService()
    
    # Test travel time prediction
    print("\n🚌 Testing travel time prediction...")
    travel_pred = service.predict_travel_time(
        total_stops=15,
        departure_hour=8,  # Rush hour
        is_weekend=False
    )
    print(f"Travel time prediction: {travel_pred}")
    
    # Test demand forecasting
    print("\n📊 Testing demand forecasting...")
    demand_pred = service.predict_demand(hour=17)  # Evening rush
    print(f"Demand prediction: {demand_pred}")
    
    # Test system health
    print("\n🔧 System health:")
    health = service.get_system_health()
    print(f"Health status: {health}")

if __name__ == "__main__":
    main()
