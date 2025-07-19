#!/usr/bin/env python3
"""
VICTORY PLAN FEATURE TESTING SCRIPT
Tests all implemented victory plan features for Aura Command
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8002"
TEST_TIMEOUT = 10

def test_endpoint(name, method, url, data=None):
    """Test a single API endpoint"""
    try:
        print(f"🧪 Testing {name}...")
        
        if method.upper() == "GET":
            response = requests.get(url, timeout=TEST_TIMEOUT)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=TEST_TIMEOUT)
        else:
            print(f"❌ {name}: Unsupported method {method}")
            return False
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {name}: SUCCESS")
            return True
        else:
            print(f"❌ {name}: HTTP {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: Backend not running")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ {name}: Timeout")
        return False
    except Exception as e:
        print(f"❌ {name}: {str(e)}")
        return False

def test_backend_connection():
    """Test basic backend connectivity"""
    print("🔌 Testing backend connection...")
    try:
        response = requests.get(f"{BACKEND_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and accessible")
            return True
        else:
            print("❌ Backend responded but not healthy")
            return False
    except:
        print("❌ Backend is not running")
        print("💡 Please start backend with: cd backend && python main.py")
        return False

def test_ortools_endpoints():
    """Test OR-Tools route optimization endpoints"""
    print("\n🛣️  TESTING OR-TOOLS ENDPOINTS")
    print("="*50)
    
    tests = [
        {
            "name": "Route Optimization",
            "method": "POST",
            "url": f"{BACKEND_URL}/api/v1/optimize/routes",
            "data": {"num_vehicles": 3}
        },
        {
            "name": "Route Analysis", 
            "method": "POST",
            "url": f"{BACKEND_URL}/api/v1/optimize/route_analysis",
            "data": {"route_data": {"distance_km": 15, "stops": 8}}
        },
        {
            "name": "Accra Network Optimization",
            "method": "POST", 
            "url": f"{BACKEND_URL}/api/v1/optimize/accra_network",
            "data": {"analysis_type": "comprehensive"}
        }
    ]
    
    results = []
    for test in tests:
        result = test_endpoint(test["name"], test["method"], test["url"], test.get("data"))
        results.append(result)
    
    success_rate = sum(results) / len(results) * 100
    print(f"\n📊 OR-Tools Success Rate: {success_rate:.1f}%")
    return all(results)

def test_ghana_economics_endpoints():
    """Test Ghana economics calculation endpoints"""
    print("\n🇬🇭 TESTING GHANA ECONOMICS ENDPOINTS") 
    print("="*50)
    
    tests = [
        {
            "name": "Trip Economics Analysis",
            "method": "POST",
            "url": f"{BACKEND_URL}/api/v1/ghana/economics",
            "data": {
                "distance_km": 15,
                "passengers": 12,
                "hour": 14,
                "day_of_week": 1,
                "month": 3,
                "location": "Circle",
                "route_type": "urban"
            }
        },
        {
            "name": "Network Economics Analysis", 
            "method": "POST",
            "url": f"{BACKEND_URL}/api/v1/ghana/network_analysis",
            "data": {
                "fleet_size": 5,
                "analysis_period": "weekly"
            }
        }
    ]
    
    results = []
    for test in tests:
        result = test_endpoint(test["name"], test["method"], test["url"], test.get("data"))
        results.append(result)
    
    success_rate = sum(results) / len(results) * 100
    print(f"\n📊 Ghana Economics Success Rate: {success_rate:.1f}%")
    return all(results)

def test_ml_ensemble_endpoints():
    """Test ML ensemble prediction endpoints"""
    print("\n🤖 TESTING ML ENSEMBLE ENDPOINTS")
    print("="*50)
    
    tests = [
        {
            "name": "Ensemble Prediction",
            "method": "POST", 
            "url": f"{BACKEND_URL}/api/v1/predict/ensemble",
            "data": {
                "num_stops": 15,
                "hour": 12,
                "day_of_week": 1,
                "is_market_day": True
            }
        },
        {
            "name": "Travel Time Prediction",
            "method": "POST",
            "url": f"{BACKEND_URL}/api/v1/predict/travel_time", 
            "data": {
                "route_id": "test_route",
                "num_stops": 10
            }
        }
    ]
    
    results = []
    for test in tests:
        result = test_endpoint(test["name"], test["method"], test["url"], test.get("data"))
        results.append(result)
    
    success_rate = sum(results) / len(results) * 100
    print(f"\n📊 ML Ensemble Success Rate: {success_rate:.1f}%")
    return all(results)

def test_external_apis():
    """Test external API integrations"""
    print("\n🌍 TESTING EXTERNAL API INTEGRATIONS")
    print("="*50)
    
    tests = [
        {
            "name": "CO₂ Calculation (Carbon Interface)",
            "method": "POST",
            "url": f"{BACKEND_URL}/api/v1/calculate_co2", 
            "data": {"distance_km": 25}
        },
        {
            "name": "Holiday Check (Public Holidays API)",
            "method": "GET",
            "url": f"{BACKEND_URL}/api/v1/check_holiday/GH"
        },
        {
            "name": "Live Events",
            "method": "GET", 
            "url": f"{BACKEND_URL}/api/v1/live_events"
        },
        {
            "name": "Isochrone Generation (OpenRouteService)",
            "method": "POST",
            "url": f"{BACKEND_URL}/api/v1/get_isochrone",
            "data": {
                "latitude": 5.6037,
                "longitude": -0.1870, 
                "time_seconds": 1800
            }
        }
    ]
    
    results = []
    for test in tests:
        result = test_endpoint(test["name"], test["method"], test["url"], test.get("data"))
        results.append(result)
    
    success_rate = sum(results) / len(results) * 100
    print(f"\n📊 External APIs Success Rate: {success_rate:.1f}%")
    return all(results)

def generate_victory_report(ortools_success, ghana_success, ml_success, api_success):
    """Generate comprehensive victory plan status report"""
    print("\n" + "="*60)
    print("🏆 VICTORY PLAN STATUS REPORT")
    print("="*60)
    
    features = [
        ("🛣️  OR-Tools Route Optimization", ortools_success, "Google VRP solver"),
        ("🇬🇭 Ghana Economics Module", ghana_success, "Real GHS costs & culture"),
        ("🤖 ML Ensemble System", ml_success, "3-algorithm predictions"),
        ("🌍 External API Integration", api_success, "5 live data sources")
    ]
    
    total_score = 0
    for name, success, description in features:
        status = "✅ OPERATIONAL" if success else "❌ NEEDS ATTENTION"
        print(f"{name}: {status}")
        print(f"   └─ {description}")
        if success:
            total_score += 25
    
    print(f"\n📊 OVERALL SYSTEM HEALTH: {total_score}/100")
    
    if total_score == 100:
        print("🎉 ALL VICTORY FEATURES ARE OPERATIONAL!")
        print("🏆 READY TO DOMINATE THE HACKATHON!")
    elif total_score >= 75:
        print("⚡ VICTORY PLAN IS MOSTLY READY!")
        print("🔧 Minor fixes needed for 100% operational status")
    elif total_score >= 50:
        print("⚠️  VICTORY PLAN NEEDS ATTENTION")
        print("🛠️  Several components require fixes")
    else:
        print("🚨 VICTORY PLAN REQUIRES IMMEDIATE ATTENTION")
        print("🔥 Critical systems need repair")
    
    # Technical complexity assessment
    print(f"\n🎯 HACKATHON SCORING PROJECTION:")
    print(f"   Innovation (25%): {'25/25' if total_score >= 75 else '20/25'}")
    print(f"   Technical Complexity (25%): {'25/25' if ortools_success and ml_success else '20/25'}")
    print(f"   Impact (20%): {'20/20' if ghana_success else '15/20'}")
    print(f"   Feasibility (20%): {'20/20' if total_score >= 75 else '15/20'}")
    print(f"   Presentation (10%): {'10/10' if api_success else '8/10'}")
    
    projected_score = (
        (25 if total_score >= 75 else 20) +
        (25 if ortools_success and ml_success else 20) +
        (20 if ghana_success else 15) +
        (20 if total_score >= 75 else 15) +
        (10 if api_success else 8)
    )
    
    print(f"\n🎯 PROJECTED HACKATHON SCORE: {projected_score}/100")
    
    if projected_score >= 95:
        print("🏆 GUARANTEED VICTORY! 🥇")
    elif projected_score >= 85:
        print("🥈 STRONG CONTENDER FOR TOP 3!")
    elif projected_score >= 75:
        print("🥉 COMPETITIVE ENTRY!")
    else:
        print("🔧 NEEDS MORE WORK FOR VICTORY")

def main():
    """Main testing function"""
    print("🚀 AURA COMMAND VICTORY PLAN TESTING")
    print("="*60)
    print(f"🕐 Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test backend connection first
    if not test_backend_connection():
        print("\n❌ Cannot proceed without backend running")
        print("💡 Start backend: cd backend && python main.py")
        sys.exit(1)
    
    # Run all tests
    ortools_success = test_ortools_endpoints()
    ghana_success = test_ghana_economics_endpoints() 
    ml_success = test_ml_ensemble_endpoints()
    api_success = test_external_apis()
    
    # Generate final report
    generate_victory_report(ortools_success, ghana_success, ml_success, api_success)
    
    print(f"\n🕐 Test Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main() 