#!/usr/bin/env python3
"""
Quick test of all our advanced models
"""

import sys
import os
sys.path.append('backend')

print("🧪 TESTING ALL ADVANCED MODELS")
print("=" * 50)

# Test 1: Advanced Travel Time V2
try:
    from backend.advanced_travel_time_v2 import AdvancedTravelTimePredictorV2
    predictor_v2 = AdvancedTravelTimePredictorV2()
    print("✅ Advanced Travel Time V2: LOADED")
    print(f"   Methods: {[method for method in dir(predictor_v2) if not method.startswith('_')]}")
except Exception as e:
    print(f"❌ Advanced Travel Time V2: {e}")

# Test 2: Traffic Prediction
try:
    from backend.traffic_prediction_system import AccraTrafficPredictor
    traffic_pred = AccraTrafficPredictor()
    print("✅ Traffic Prediction: LOADED")
    print(f"   Methods: {[method for method in dir(traffic_pred) if not method.startswith('_')]}")
except Exception as e:
    print(f"❌ Traffic Prediction: {e}")

# Test 3: Production ML Service
try:
    from backend.production_ml_service import ProductionMLService
    prod_service = ProductionMLService()
    print("✅ Production ML Service: LOADED")
    print(f"   Methods: {[method for method in dir(prod_service) if not method.startswith('_')]}")
except Exception as e:
    print(f"❌ Production ML Service: {e}")

# Test 4: Advanced Ghana Optimizer
try:
    from backend.advanced_ortools_optimizer import AdvancedGhanaOptimizer
    optimizer = AdvancedGhanaOptimizer()
    print("✅ Advanced Ghana Optimizer: LOADED")
    print(f"   Methods: {[method for method in dir(optimizer) if not method.startswith('_')]}")
except Exception as e:
    print(f"❌ Advanced Ghana Optimizer: {e}")

# Test 5: Basic OR-Tools
try:
    from backend.ortools_optimizer import get_route_optimizer
    basic_opt = get_route_optimizer()
    print("✅ Basic OR-Tools: LOADED")
    print(f"   Methods: {[method for method in dir(basic_opt) if not method.startswith('_')]}")
except Exception as e:
    print(f"❌ Basic OR-Tools: {e}")

# Test 6: Enhanced ML
try:
    from backend.advanced_ml import get_ensemble
    ensemble = get_ensemble()
    print("✅ Enhanced ML Ensemble: LOADED")
    print(f"   Type: {type(ensemble)}")
except Exception as e:
    print(f"❌ Enhanced ML Ensemble: {e}")

print("\n🎯 MODEL LOADING COMPLETE")
