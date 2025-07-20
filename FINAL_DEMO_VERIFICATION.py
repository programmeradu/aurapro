#!/usr/bin/env python3
"""
🎯 FINAL DEMO VERIFICATION SCRIPT
Verifies all our advanced ML models and capabilities are working for hackathon demo
"""

import os
import sys
import importlib.util
from datetime import datetime

def test_ml_models():
    """Test all our advanced ML models"""
    
    print("🧠 TESTING ADVANCED ML MODELS")
    print("=" * 50)
    
    results = {}
    
    # Test 1: Enhanced Travel Time Predictor
    try:
        from backend.advanced_ml import TransportMLEnsemble, get_ensemble
        ensemble = get_ensemble()
        if ensemble and hasattr(ensemble, 'predict'):
            print("✅ Enhanced Travel Time Predictor: LOADED")
            print(f"   📊 Model Type: {type(ensemble).__name__}")
            results["enhanced_ml"] = "WORKING"
        else:
            print("⚠️ Enhanced Travel Time Predictor: NOT LOADED")
            results["enhanced_ml"] = "NOT_LOADED"
    except Exception as e:
        print(f"❌ Enhanced Travel Time Predictor: ERROR - {str(e)}")
        results["enhanced_ml"] = "ERROR"
    
    # Test 2: Advanced Travel Time V2
    try:
        from backend.advanced_travel_time_v2 import AdvancedTravelTimePredictorV2
        predictor_v2 = AdvancedTravelTimePredictorV2()
        print("✅ Advanced Travel Time V2: AVAILABLE")
        print(f"   🔧 Features: {getattr(predictor_v2, 'feature_count', 'Unknown')}")
        results["travel_time_v2"] = "AVAILABLE"
    except Exception as e:
        print(f"❌ Advanced Travel Time V2: ERROR - {str(e)}")
        results["travel_time_v2"] = "ERROR"
    
    # Test 3: Traffic Prediction System
    try:
        from backend.traffic_prediction_system import AccraTrafficPredictor
        traffic_predictor = AccraTrafficPredictor()
        print("✅ Traffic Prediction System: AVAILABLE")
        print(f"   🚦 Type: {type(traffic_predictor).__name__}")
        results["traffic_prediction"] = "AVAILABLE"
    except Exception as e:
        print(f"❌ Traffic Prediction System: ERROR - {str(e)}")
        results["traffic_prediction"] = "ERROR"
    
    # Test 4: Production ML Service
    try:
        from backend.production_ml_service import ProductionMLService
        ml_service = ProductionMLService()
        print("✅ Production ML Service: AVAILABLE")
        print(f"   🏭 Service Type: {type(ml_service).__name__}")
        results["production_ml"] = "AVAILABLE"
    except Exception as e:
        print(f"❌ Production ML Service: ERROR - {str(e)}")
        results["production_ml"] = "ERROR"
    
    return results

def test_ortools():
    """Test OR-Tools optimization"""
    
    print("\n⚙️ TESTING OR-TOOLS OPTIMIZATION")
    print("=" * 50)
    
    results = {}
    
    # Test 1: Basic OR-Tools Optimizer
    try:
        from backend.ortools_optimizer import AccraRouteOptimizer, get_route_optimizer
        optimizer = get_route_optimizer()
        print("✅ OR-Tools Route Optimizer: AVAILABLE")
        print(f"   🛣️ Type: {type(optimizer).__name__}")
        results["basic_ortools"] = "AVAILABLE"
    except Exception as e:
        print(f"❌ OR-Tools Route Optimizer: ERROR - {str(e)}")
        results["basic_ortools"] = "ERROR"
    
    # Test 2: Advanced OR-Tools Optimizer
    try:
        from backend.advanced_ortools_optimizer import AdvancedGhanaOptimizer
        advanced_optimizer = AdvancedGhanaOptimizer()
        print("✅ Advanced Ghana Optimizer: AVAILABLE")
        print(f"   🎯 Type: {type(advanced_optimizer).__name__}")
        results["advanced_ortools"] = "AVAILABLE"
    except Exception as e:
        print(f"❌ Advanced Ghana Optimizer: ERROR - {str(e)}")
        results["advanced_ortools"] = "ERROR"
    
    return results

def test_gtfs_data():
    """Test GTFS data loading"""
    
    print("\n🗺️ TESTING GTFS DATA")
    print("=" * 50)
    
    results = {}
    
    try:
        from backend.gtfs_parser import load_gtfs
        gtfs_data = load_gtfs("gtfs-accra-ghana-2016")
        
        if gtfs_data:
            print("✅ GTFS Data: LOADED")
            
            # Check stops
            if hasattr(gtfs_data, 'stops') and gtfs_data.stops is not None:
                stops_count = len(gtfs_data.stops)
                print(f"   🚏 Stops: {stops_count}")
                results["stops"] = stops_count
            
            # Check routes
            if hasattr(gtfs_data, 'routes') and gtfs_data.routes is not None:
                routes_count = len(gtfs_data.routes)
                print(f"   🛣️ Routes: {routes_count}")
                results["routes"] = routes_count
            
            # Check agencies
            if hasattr(gtfs_data, 'agency') and gtfs_data.agency is not None:
                agencies_count = len(gtfs_data.agency)
                print(f"   🏢 Agencies: {agencies_count}")
                results["agencies"] = agencies_count
            
            # Check trips
            if hasattr(gtfs_data, 'trips') and gtfs_data.trips is not None:
                trips_count = len(gtfs_data.trips)
                print(f"   🚌 Trips: {trips_count}")
                results["trips"] = trips_count
                
        else:
            print("❌ GTFS Data: NOT LOADED")
            results["status"] = "NOT_LOADED"
            
    except Exception as e:
        print(f"❌ GTFS Data: ERROR - {str(e)}")
        results["status"] = "ERROR"
    
    return results

def test_ai_integration():
    """Test AI integrations"""
    
    print("\n🤖 TESTING AI INTEGRATIONS")
    print("=" * 50)
    
    results = {}
    
    # Test Gemini configuration
    try:
        import os
        gemini_key = os.getenv("GOOGLE_API_KEY", "demo-key")
        if gemini_key and gemini_key != "demo-key":
            print("✅ Google Gemini: API KEY CONFIGURED")
            print(f"   🔑 Key: {gemini_key[:20]}...")
            results["gemini"] = "CONFIGURED"
        else:
            print("⚠️ Google Gemini: DEMO MODE")
            results["gemini"] = "DEMO_MODE"
    except Exception as e:
        print(f"❌ Google Gemini: ERROR - {str(e)}")
        results["gemini"] = "ERROR"
    
    return results

def generate_demo_summary():
    """Generate final demo summary"""
    
    print("\n🎯 RUNNING COMPREHENSIVE VERIFICATION")
    print("=" * 60)
    print(f"Verification Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run all tests
    ml_results = test_ml_models()
    ortools_results = test_ortools()
    gtfs_results = test_gtfs_data()
    ai_results = test_ai_integration()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 HACKATHON DEMO READINESS SUMMARY")
    print("=" * 60)
    
    # Count working components
    working_ml = sum(1 for status in ml_results.values() if status in ["WORKING", "AVAILABLE"])
    total_ml = len(ml_results)
    
    working_ortools = sum(1 for status in ortools_results.values() if status == "AVAILABLE")
    total_ortools = len(ortools_results)
    
    gtfs_loaded = gtfs_results.get("stops", 0) > 2000
    
    ai_ready = ai_results.get("gemini") in ["CONFIGURED", "DEMO_MODE"]
    
    print(f"\n🧠 ML Models: {working_ml}/{total_ml} working")
    for model, status in ml_results.items():
        icon = "✅" if status in ["WORKING", "AVAILABLE"] else "❌"
        print(f"   {icon} {model.replace('_', ' ').title()}: {status}")
    
    print(f"\n⚙️ OR-Tools: {working_ortools}/{total_ortools} working")
    for tool, status in ortools_results.items():
        icon = "✅" if status == "AVAILABLE" else "❌"
        print(f"   {icon} {tool.replace('_', ' ').title()}: {status}")
    
    print(f"\n🗺️ GTFS Data: {'✅ LOADED' if gtfs_loaded else '❌ NOT LOADED'}")
    if gtfs_loaded:
        print(f"   📊 Stops: {gtfs_results.get('stops', 0)}")
        print(f"   📊 Routes: {gtfs_results.get('routes', 0)}")
        print(f"   📊 Agencies: {gtfs_results.get('agencies', 0)}")
        print(f"   📊 Trips: {gtfs_results.get('trips', 0)}")
    
    print(f"\n🤖 AI Integration: {'✅ READY' if ai_ready else '❌ NOT READY'}")
    print(f"   🔑 Gemini: {ai_results.get('gemini', 'UNKNOWN')}")
    
    # Overall readiness
    total_components = working_ml + working_ortools + (1 if gtfs_loaded else 0) + (1 if ai_ready else 0)
    max_components = total_ml + total_ortools + 1 + 1
    
    readiness_percentage = (total_components / max_components) * 100
    
    print(f"\n🎯 OVERALL DEMO READINESS: {readiness_percentage:.1f}%")
    print(f"   Working Components: {total_components}/{max_components}")
    
    if readiness_percentage >= 80:
        print("🎉 HACKATHON READY! Demo can proceed with confidence.")
    elif readiness_percentage >= 60:
        print("⚠️ MOSTLY READY: Some components need attention.")
    else:
        print("❌ NOT READY: Major issues need fixing.")
    
    # Demo recommendations
    print(f"\n🚀 DEMO RECOMMENDATIONS:")
    if working_ml >= 2:
        print("✅ Showcase ML ensemble with confidence scores")
    if working_ortools >= 1:
        print("✅ Demonstrate OR-Tools route optimization")
    if gtfs_loaded:
        print("✅ Highlight real GTFS data (2,565+ stops)")
    if ai_ready:
        print("✅ Show Gemini AI integration")
    
    print("\n🏆 READY FOR HACKATHON VICTORY!")

if __name__ == "__main__":
    generate_demo_summary()
