#!/usr/bin/env python3
"""
Complete End-to-End Test for Uber API Integration
Tests both backend API and frontend integration
"""

import requests
import json
import time
from datetime import datetime

def test_backend_uber_api():
    """Test the backend Uber API endpoint"""
    
    print("🔧 Testing Backend Uber API")
    print("=" * 50)
    
    # Test coordinates (Accra Central to Kaneshie Market)
    test_data = {
        "start_latitude": 5.5502,
        "start_longitude": -0.2174,
        "end_latitude": 5.5731,
        "end_longitude": -0.2469
    }
    
    print(f"📍 From: Accra Central ({test_data['start_latitude']}, {test_data['start_longitude']})")
    print(f"📍 To: Kaneshie Market ({test_data['end_latitude']}, {test_data['end_longitude']})")
    print()
    
    try:
        print("🔄 Testing new Uber API endpoint...")
        response = requests.post(
            "http://localhost:8000/api/v1/uber/price_estimate",
            json=test_data,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success"):
                print("✅ Backend Uber API SUCCESS!")
                print()
                print("🚗 Uber Price Estimate:")
                print(f"   Product: {data.get('product', 'N/A')}")
                print(f"   Estimated Fare: {data.get('estimated_fare', 'N/A')}")
                duration_min = data.get('duration_seconds', 0) // 60
                print(f"   Duration: {duration_min} minutes")
                print(f"   Distance: {data.get('distance_km', 'N/A')} km")
                print(f"   Currency: {data.get('currency_code', 'N/A')}")
                print(f"   Surge Multiplier: {data.get('surge_multiplier', 'N/A')}")
                print(f"   API Source: {data.get('api_source', 'N/A')}")
                return True
            else:
                print("❌ Backend Uber API FAILED!")
                print(f"Error: {data.get('error_message', 'Unknown error')}")
                return False
        else:
            print("❌ HTTP Error!")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Backend API Error: {str(e)}")
        return False

def test_frontend_integration():
    """Test that the frontend can access the mobile app"""
    
    print("\n🌐 Testing Frontend Integration")
    print("=" * 50)
    
    try:
        print("🔄 Testing mobile app accessibility...")
        response = requests.get("http://localhost:3001", timeout=10)
        
        if response.status_code == 200:
            print("✅ Mobile app is accessible!")
            print(f"   Status: {response.status_code}")
            print(f"   Content-Type: {response.headers.get('content-type', 'N/A')}")
            
            # Check if it's the React app
            if 'text/html' in response.headers.get('content-type', ''):
                print("   Type: React/Next.js application")
                return True
            else:
                print("   Type: Unknown application")
                return False
        else:
            print("❌ Mobile app not accessible!")
            print(f"Status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Frontend Error: {str(e)}")
        return False

def test_journey_planning_page():
    """Test the journey planning page specifically"""
    
    print("\n🗺️ Testing Journey Planning Page")
    print("=" * 50)
    
    try:
        print("🔄 Testing journey planning page...")
        response = requests.get("http://localhost:3001/journey", timeout=10)
        
        if response.status_code == 200:
            print("✅ Journey planning page is accessible!")
            print(f"   Status: {response.status_code}")
            
            # Check for key elements in the page
            content = response.text.lower()
            has_journey = 'journey' in content
            has_uber = 'uber' in content or 'ride' in content
            has_map = 'map' in content
            
            print(f"   Contains journey elements: {has_journey}")
            print(f"   Contains ride-sharing elements: {has_uber}")
            print(f"   Contains map elements: {has_map}")
            
            return True
        else:
            print("❌ Journey planning page not accessible!")
            print(f"Status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Journey Page Error: {str(e)}")
        return False

def main():
    """Run complete integration test"""
    
    print("🚗 COMPLETE UBER INTEGRATION TEST")
    print("=" * 60)
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    results = {
        'backend_api': False,
        'frontend_access': False,
        'journey_page': False
    }
    
    # Test backend API
    results['backend_api'] = test_backend_uber_api()
    
    # Test frontend
    results['frontend_access'] = test_frontend_integration()
    
    # Test journey planning page
    results['journey_page'] = test_journey_planning_page()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 INTEGRATION TEST SUMMARY")
    print("=" * 60)
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print()
    print(f"Overall Result: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED! Uber integration is working correctly!")
        print()
        print("🚀 NEXT STEPS:")
        print("1. Open http://localhost:3001/journey in your browser")
        print("2. Plan a journey to see live Uber pricing in Ghana Cedis")
        print("3. Notice the realistic Ghana pricing and surge multipliers")
        print("4. See distance in kilometers and time in minutes")
    else:
        print("⚠️  Some tests failed. Check the errors above.")
        
        if not results['backend_api']:
            print("   - Backend API issue: Check if backend is running on port 8000")
        if not results['frontend_access']:
            print("   - Frontend issue: Check if mobile app is running on port 3001")
        if not results['journey_page']:
            print("   - Journey page issue: Check Next.js routing")

if __name__ == "__main__":
    main()
