#!/usr/bin/env python3
"""
Comprehensive API Audit for AURA Backend
Ensures all APIs use real data instead of mocks for hackathon submission
"""

import requests
import json
from datetime import datetime

def test_gtfs_data_apis():
    """Test GTFS APIs to ensure real data usage"""
    
    print("🗺️ Testing GTFS Data APIs")
    print("=" * 40)
    
    endpoints = [
        ("/api/v1/gtfs/stops", "GTFS Stops"),
        ("/api/v1/gtfs/routes", "GTFS Routes"),
        ("/api/v1/gtfs/agencies", "GTFS Agencies"),
        ("/api/v1/gtfs/trips", "GTFS Trips"),
        ("/api/v1/ml/models-status", "ML Models Status")
    ]
    
    results = {}
    
    for endpoint, name in endpoints:
        try:
            print(f"🔄 Testing {name}...")
            response = requests.get(f"http://localhost:8000{endpoint}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()

                # FIXED: Properly parse our API response structure
                if isinstance(data, dict) and 'count' in data:
                    # Our APIs return {"status": "success", "data": {...}, "count": N}
                    count = data['count']
                elif isinstance(data, list):
                    count = len(data)
                elif isinstance(data, dict) and 'data' in data:
                    if isinstance(data['data'], dict):
                        # Count items in nested data structure
                        nested_data = data['data']
                        if len(nested_data) == 1:
                            # Single key like {"routes": [...]}
                            key = list(nested_data.keys())[0]
                            count = len(nested_data[key]) if isinstance(nested_data[key], list) else 1
                        else:
                            count = len(nested_data)
                    else:
                        count = len(data['data']) if isinstance(data['data'], list) else 1
                else:
                    count = 1
                
                print(f"✅ {name}: {count} records")
                
                # Check for real data indicators - FIXED LOGIC
                if name == "GTFS Stops" and count >= 2000:
                    print(f"   🎯 REAL DATA: {count} stops (expected ~2565)")
                    results[name] = "REAL"
                elif name == "GTFS Routes" and count >= 600:
                    print(f"   🎯 REAL DATA: {count} routes (expected ~651)")
                    results[name] = "REAL"
                elif name == "GTFS Agencies" and count >= 80:
                    print(f"   🎯 REAL DATA: {count} agencies (expected ~91)")
                    results[name] = "REAL"
                elif name == "GTFS Trips" and count >= 600:
                    print(f"   🎯 REAL DATA: {count} trips (expected ~651)")
                    results[name] = "REAL"
                elif name == "ML Models Status":
                    # Check if models are actually loaded
                    if isinstance(data, dict) and data.get("models_status"):
                        loaded_count = sum(data["models_status"].values())
                        total_count = len(data["models_status"])
                        print(f"   🎯 REAL ML MODELS: {loaded_count}/{total_count} loaded")
                        if loaded_count >= 5:
                            results[name] = "REAL"
                        else:
                            results[name] = "PARTIAL"
                    else:
                        results[name] = "AVAILABLE"
                elif count > 0:
                    print(f"   ✅ DATA PRESENT: {count} records")
                    results[name] = "PRESENT"
                else:
                    print(f"   ⚠️ NO DATA: {count} records")
                    results[name] = "EMPTY"
            else:
                print(f"❌ {name}: HTTP {response.status_code}")
                results[name] = "ERROR"
                
        except Exception as e:
            print(f"❌ {name}: {str(e)}")
            results[name] = "ERROR"
    
    return results

def test_ml_prediction_apis():
    """Test ML prediction APIs for real model usage"""
    
    print("\n🧠 Testing ML Prediction APIs")
    print("=" * 40)
    
    # Test journey planning with ML
    test_data = {
        "from": {"lat": 5.5502, "lng": -0.2174, "name": "Accra Central"},
        "to": {"lat": 5.5731, "lng": -0.2469, "name": "Kaneshie Market"},
        "departure_time": "2025-01-18T12:00:00Z"
    }
    
    try:
        print("🔄 Testing ML-powered journey planning...")
        response = requests.post(
            "http://localhost:8000/api/v1/journey/plan",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success") and data.get("data"):
                journey_data = data["data"]
                metadata = journey_data.get("metadata", {})
                
                # Check for ML indicators
                ml_models = metadata.get("ml_models_used", [])
                confidence = metadata.get("confidence_score", 0)
                algorithm = journey_data.get("options", [{}])[0].get("algorithm_used", "")
                
                print("✅ Journey Planning API SUCCESS")
                print(f"   🤖 ML Models: {ml_models}")
                print(f"   🎯 Confidence: {confidence*100:.1f}%")
                print(f"   ⚙️ Algorithm: {algorithm}")
                
                if "Enhanced" in str(ml_models) and confidence > 0.9:
                    return "REAL_ML"
                else:
                    return "BASIC_ML"
            else:
                print("❌ Journey planning failed")
                return "ERROR"
        else:
            print(f"❌ Journey planning HTTP {response.status_code}")
            return "ERROR"
            
    except Exception as e:
        print(f"❌ Journey planning error: {str(e)}")
        return "ERROR"

def test_uber_integration():
    """Test Uber API integration"""
    
    print("\n🚗 Testing Uber Integration")
    print("=" * 40)
    
    test_data = {
        "start_latitude": 5.5502,
        "start_longitude": -0.2174,
        "end_latitude": 5.5731,
        "end_longitude": -0.2469
    }
    
    try:
        print("🔄 Testing Uber price estimation...")
        response = requests.post(
            "http://localhost:8000/api/v1/uber/price_estimate",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success"):
                print("✅ Uber API SUCCESS")
                print(f"   💰 Fare: {data.get('estimated_fare', 'N/A')}")
                print(f"   📏 Distance: {data.get('distance_km', 'N/A')} km")
                print(f"   💱 Currency: {data.get('currency_code', 'N/A')}")
                print(f"   📊 Source: {data.get('api_source', 'N/A')}")
                
                # Check for Ghana-specific indicators
                currency = data.get('currency_code', '')
                fare = data.get('estimated_fare', '')
                
                if currency == 'GHS' and 'GH₵' in str(fare):
                    return "GHANA_SPECIFIC"
                else:
                    return "GENERIC"
            else:
                print("❌ Uber API failed")
                return "ERROR"
        else:
            print(f"❌ Uber API HTTP {response.status_code}")
            return "ERROR"
            
    except Exception as e:
        print(f"❌ Uber API error: {str(e)}")
        return "ERROR"

def test_gemini_integration():
    """Test Gemini AI integration"""
    
    print("\n🤖 Testing Gemini AI Integration")
    print("=" * 40)
    
    test_data = {
        "query": "How do I get from Accra Central to Kaneshie Market?",
        "context": "Need fastest route during morning rush hour",
        "user_location": {"lat": 5.5502, "lng": -0.2174}
    }
    
    try:
        print("🔄 Testing Gemini journey assistant...")
        response = requests.post(
            "http://localhost:8000/api/v1/gemini/journey-assistant",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success"):
                print("✅ Gemini AI SUCCESS")
                response_text = data.get('response', '')
                confidence = data.get('confidence', 0)
                
                print(f"   🎯 Confidence: {confidence*100:.1f}%")
                print(f"   📝 Response: {response_text[:100]}...")
                
                # Check for data-driven indicators
                if "ML" in response_text or "GTFS" in response_text or "Enhanced" in response_text:
                    return "DATA_DRIVEN"
                else:
                    return "GENERIC"
            else:
                print("❌ Gemini AI failed")
                return "ERROR"
        else:
            print(f"❌ Gemini AI HTTP {response.status_code}")
            return "ERROR"
            
    except Exception as e:
        print(f"❌ Gemini AI error: {str(e)}")
        return "ERROR"

def test_advanced_ml_models():
    """Test all advanced ML models and OR-Tools"""

    print("\n🧠 Testing Advanced ML Models & OR-Tools")
    print("=" * 50)

    results = {}

    # Test production ML service - FAST HEALTH CHECK
    try:
        print("🔄 Testing Production ML Service...")
        response = requests.get("http://localhost:8000/api/v1/ml/health/production-service", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "LOADED":
                print("✅ Production ML Service: LOADED")
                print(f"   🏭 Components: {sum(data.get('components', {}).values())}/3 loaded")
                results["production_ml"] = "LOADED"
            else:
                print("⚠️ Production ML Service: NOT LOADED")
                results["production_ml"] = "NOT_LOADED"
        else:
            print("⚠️ Production ML Service: NOT AVAILABLE")
            results["production_ml"] = "NOT_AVAILABLE"
    except Exception as e:
        print(f"❌ Production ML Service: ERROR - {str(e)}")
        results["production_ml"] = "ERROR"

    # Test OR-Tools optimization - FAST HEALTH CHECK
    try:
        print("🔄 Testing OR-Tools Route Optimization...")
        response = requests.get("http://localhost:8000/api/v1/optimize/health", timeout=10)

        if response.status_code == 200:
            data = response.json()
            basic_loaded = data.get("basic_optimizer") == "LOADED"
            advanced_loaded = data.get("advanced_optimizer") == "LOADED"

            if basic_loaded and advanced_loaded:
                print("✅ OR-Tools Optimization: ADVANCED")
                print(f"   ⚙️ Basic Optimizer: LOADED")
                print(f"   🎯 Advanced Optimizer: LOADED")
                print(f"   📊 Objectives: {len(data.get('objectives', []))}")
                results["ortools"] = "ADVANCED"
            elif basic_loaded:
                print("✅ OR-Tools Optimization: BASIC")
                print(f"   ⚙️ Basic Optimizer: LOADED")
                results["ortools"] = "BASIC"
            else:
                print("⚠️ OR-Tools Optimization: NOT LOADED")
                results["ortools"] = "NOT_LOADED"
        else:
            print(f"❌ OR-Tools Optimization: HTTP {response.status_code}")
            results["ortools"] = "ERROR"

    except Exception as e:
        print(f"❌ OR-Tools Optimization: {str(e)}")
        results["ortools"] = "ERROR"

    # Test traffic prediction system - FAST HEALTH CHECK
    try:
        print("🔄 Testing Traffic Prediction System...")
        response = requests.get("http://localhost:8000/api/v1/ml/health/traffic-prediction", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "LOADED":
                print("✅ Traffic Prediction: LOADED")
                print(f"   🚦 Accuracy: {data.get('accuracy', 'N/A')}")
                print(f"   📍 Corridors: {data.get('corridors', 'N/A')}")
                results["traffic_prediction"] = "LOADED"
            else:
                print("⚠️ Traffic Prediction: NOT LOADED")
                results["traffic_prediction"] = "NOT_LOADED"
        else:
            print("⚠️ Traffic Prediction: NOT AVAILABLE")
            results["traffic_prediction"] = "NOT_AVAILABLE"
    except Exception as e:
        print(f"❌ Traffic Prediction: ERROR - {str(e)}")
        results["traffic_prediction"] = "ERROR"

    # Test advanced travel time predictor - FAST HEALTH CHECK
    try:
        print("🔄 Testing Advanced Travel Time Predictor...")
        response = requests.get("http://localhost:8000/api/v1/ml/health/advanced-travel-time", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "LOADED":
                print("✅ Advanced Travel Time: LOADED")
                print(f"   🚀 R² Score: {data.get('r2_score', 'N/A')}")
                print(f"   🔧 Features: {data.get('features', 'N/A')}")
                results["advanced_travel_time"] = "LOADED"
            else:
                print("⚠️ Advanced Travel Time: NOT LOADED")
                results["advanced_travel_time"] = "NOT_LOADED"
        else:
            print("⚠️ Advanced Travel Time: NOT AVAILABLE")
            results["advanced_travel_time"] = "NOT_AVAILABLE"
    except Exception as e:
        print(f"❌ Advanced Travel Time: ERROR - {str(e)}")
        results["advanced_travel_time"] = "ERROR"

    # Test WebSocket real-time features - NEW
    try:
        print("🔄 Testing WebSocket Real-time Features...")
        response = requests.get("http://localhost:8000/api/v1/websocket/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "LOADED":
                vehicles_info = data.get('vehicles', {})
                total_vehicles = vehicles_info.get('total', 0)
                active_vehicles = vehicles_info.get('active', 0)

                print("✅ WebSocket Real-time: LOADED")
                print(f"   🔌 Connected Clients: {data.get('connected_clients', 0)}")
                print(f"   🚗 Vehicles: {total_vehicles} total, {active_vehicles} active")
                print(f"   📊 KPIs: {data.get('kpis', 0)} live metrics")
                print(f"   🎯 Features: {len(data.get('features', []))} real-time features")
                results["websocket_realtime"] = "LOADED"
            else:
                print("⚠️ WebSocket Real-time: NOT LOADED")
                results["websocket_realtime"] = "NOT_LOADED"
        else:
            print("⚠️ WebSocket Real-time: NOT AVAILABLE")
            results["websocket_realtime"] = "NOT_AVAILABLE"
    except Exception as e:
        print(f"❌ WebSocket Real-time: ERROR - {str(e)}")
        results["websocket_realtime"] = "ERROR"

    return results

def main():
    """Run comprehensive API audit"""

    print("🔍 COMPREHENSIVE API AUDIT FOR HACKATHON")
    print("=" * 60)
    print(f"Audit Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Test all API categories
    gtfs_results = test_gtfs_data_apis()
    ml_result = test_ml_prediction_apis()
    uber_result = test_uber_integration()
    gemini_result = test_gemini_integration()
    advanced_ml_results = test_advanced_ml_models()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 API AUDIT SUMMARY")
    print("=" * 60)
    
    print("\n🗺️ GTFS Data APIs:")
    for api, status in gtfs_results.items():
        icon = "🎯" if status == "REAL" else "✅" if status == "PRESENT" else "❌"
        print(f"   {icon} {api}: {status}")
    
    print(f"\n🧠 ML Prediction APIs:")
    icon = "🎯" if ml_result == "REAL_ML" else "⚠️" if ml_result == "BASIC_ML" else "❌"
    print(f"   {icon} Journey Planning: {ml_result}")
    
    print(f"\n🚗 Uber Integration:")
    icon = "🎯" if uber_result == "GHANA_SPECIFIC" else "⚠️" if uber_result == "GENERIC" else "❌"
    print(f"   {icon} Price Estimation: {uber_result}")
    
    print(f"\n🤖 Gemini AI Integration:")
    icon = "🎯" if gemini_result == "DATA_DRIVEN" else "⚠️" if gemini_result == "GENERIC" else "❌"
    print(f"   {icon} Journey Assistant: {gemini_result}")

    print(f"\n🏭 Advanced ML Models & OR-Tools:")
    for model_name, status in advanced_ml_results.items():
        if model_name == "websocket_realtime":
            continue  # Handle separately
        icon = "🎯" if status in ["WORKING", "RUNNING", "AVAILABLE", "ADVANCED", "LOADED"] else "⚠️" if status in ["BASIC", "NOT_RUNNING", "NOT_AVAILABLE", "NOT_LOADED"] else "❌"
        display_name = model_name.replace('_', ' ').title()
        print(f"   {icon} {display_name}: {status}")

    # WebSocket real-time features
    websocket_status = advanced_ml_results.get("websocket_realtime", "NOT_TESTED")
    icon = "🎯" if websocket_status in ["LOADED", "WORKING"] else "⚠️" if websocket_status in ["NOT_LOADED"] else "❌"
    print(f"\n🔌 Real-time Features:")
    print(f"   {icon} WebSocket Real-time: {websocket_status}")

    # Overall assessment - FIXED COUNTING
    real_data_count = 0

    # Count GTFS real data
    for status in gtfs_results.values():
        if status == "REAL":
            real_data_count += 1

    # Count ML systems
    if ml_result == "REAL_ML":
        real_data_count += 1

    # Count integrations
    if uber_result == "GHANA_SPECIFIC":
        real_data_count += 1
    if gemini_result == "DATA_DRIVEN":
        real_data_count += 1

    # Count advanced systems (including WebSocket)
    for status in advanced_ml_results.values():
        if status in ["WORKING", "RUNNING", "AVAILABLE", "ADVANCED", "LOADED", "BASIC"]:
            real_data_count += 1

    total_apis = len(gtfs_results) + 3 + len(advanced_ml_results)  # Includes WebSocket now
    
    print(f"\n🎯 HACKATHON READINESS:")
    print(f"   Real Data/Advanced Systems: {real_data_count}/{total_apis}")

    readiness_percentage = (real_data_count / total_apis) * 100
    print(f"   Readiness Score: {readiness_percentage:.1f}%")

    if readiness_percentage >= 90:
        print("   🏆 PERFECT: HACKATHON CHAMPION READY!")
        print("   🎉 Advanced ML models, real data, sophisticated algorithms, AND real-time features!")
        print("   🚀 This is a WINNING submission with cutting-edge technology!")
    elif readiness_percentage >= 85:
        print("   🏆 EXCELLENT: HACKATHON WINNER READY!")
        print("   🎉 Advanced ML models, real data, and sophisticated algorithms!")
    elif readiness_percentage >= 70:
        print("   ✅ VERY GOOD: Strong hackathon submission!")
    elif readiness_percentage >= 50:
        print("   ⚠️ GOOD: Decent hackathon submission")
    else:
        print("   ❌ NEEDS WORK: Too many systems not working")

if __name__ == "__main__":
    main()
