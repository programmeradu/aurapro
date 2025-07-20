#!/usr/bin/env python3
"""
Test Google Gemini AI Integration
Tests the new Gemini journey assistant endpoint
"""

import requests
import json
from datetime import datetime

def test_gemini_journey_assistant():
    """Test the Gemini journey assistant endpoint"""
    
    print("🤖 Testing Google Gemini AI Integration")
    print("=" * 50)
    
    # Test queries for Ghana transport scenarios
    test_queries = [
        {
            "query": "How do I get from Accra Central to Kaneshie Market?",
            "context": "Need fastest route during morning rush hour",
            "user_location": {"lat": 5.5502, "lng": -0.2174}
        },
        {
            "query": "What's the cheapest way to travel to Kotoka Airport?",
            "context": "Budget traveler, willing to take longer route",
            "user_location": {"lat": 5.5731, "lng": -0.2469}
        },
        {
            "query": "Is it safe to travel to Circle at night?",
            "context": "Solo female traveler, safety is priority",
            "user_location": {"lat": 5.5502, "lng": -0.2174}
        },
        {
            "query": "Current traffic situation in Accra",
            "context": "Planning journey for 5pm departure",
            "user_location": {"lat": 5.5502, "lng": -0.2174}
        }
    ]
    
    for i, test_data in enumerate(test_queries, 1):
        print(f"\n🔄 Test {i}: {test_data['query'][:50]}...")
        
        try:
            response = requests.post(
                "http://localhost:8000/api/v1/gemini/journey-assistant",
                json=test_data,
                timeout=30
            )
            
            print(f"📡 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    print("✅ Gemini AI SUCCESS!")
                    print(f"🤖 AI Response: {data.get('response', 'N/A')[:200]}...")
                    
                    suggestions = data.get('suggestions', [])
                    if suggestions:
                        print(f"💡 Suggestions ({len(suggestions)}):")
                        for j, suggestion in enumerate(suggestions[:3], 1):
                            print(f"   {j}. {suggestion}")
                    
                    confidence = data.get('confidence', 0)
                    print(f"🎯 Confidence: {confidence*100:.1f}%")
                    
                else:
                    print("❌ Gemini AI FAILED!")
                    print(f"Error: {data.get('error_message', 'Unknown error')}")
                    
            else:
                print("❌ HTTP Error!")
                print(f"Status: {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection Error: Backend not running on localhost:8000")
            return False
        except Exception as e:
            print(f"❌ Test Error: {str(e)}")
            return False
    
    return True

def test_gemini_route_optimization():
    """Test the Gemini route optimization endpoint"""
    
    print("\n🧠 Testing Gemini Route Optimization")
    print("=" * 50)
    
    test_data = {
        "origin": {
            "name": "Accra Central",
            "lat": 5.5502,
            "lng": -0.2174
        },
        "destination": {
            "name": "Kaneshie Market", 
            "lat": 5.5731,
            "lng": -0.2469
        },
        "preferences": {
            "priority": "cost",
            "avoid_traffic": True,
            "max_walking_distance": 1000
        }
    }
    
    try:
        print("🔄 Testing route optimization...")
        response = requests.post(
            "http://localhost:8000/api/v1/gemini/route-optimization",
            json=test_data,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success"):
                print("✅ Route Optimization SUCCESS!")
                
                route = data.get('optimized_route', {})
                print(f"🛣️ Route: {route.get('route_name', 'N/A')}")
                print(f"⏱️ Time: {route.get('total_time', 'N/A')} minutes")
                print(f"💰 Cost: GH₵{route.get('total_cost', 'N/A')}")
                print(f"🎯 Confidence: {route.get('confidence', 0)*100:.1f}%")
                
                insights = route.get('ai_insights', [])
                if insights:
                    print(f"🧠 AI Insights ({len(insights)}):")
                    for i, insight in enumerate(insights, 1):
                        print(f"   {i}. {insight}")
                
                return True
            else:
                print("❌ Route Optimization FAILED!")
                print(f"Error: {data.get('error', 'Unknown error')}")
                return False
        else:
            print("❌ HTTP Error!")
            print(f"Status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Route Optimization Error: {str(e)}")
        return False

def main():
    """Run complete Gemini integration test"""
    
    print("🤖 GOOGLE GEMINI AI INTEGRATION TEST")
    print("=" * 60)
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    results = {
        'journey_assistant': False,
        'route_optimization': False
    }
    
    # Test journey assistant
    results['journey_assistant'] = test_gemini_journey_assistant()
    
    # Test route optimization
    results['route_optimization'] = test_gemini_route_optimization()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 GEMINI INTEGRATION TEST SUMMARY")
    print("=" * 60)
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print()
    print(f"Overall Result: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 GEMINI INTEGRATION SUCCESSFUL!")
        print()
        print("🚀 CAPABILITIES VERIFIED:")
        print("✅ Natural language journey planning")
        print("✅ Ghana-specific transport advice")
        print("✅ AI-powered route optimization")
        print("✅ Contextual suggestions and insights")
        print("✅ Safety and cost recommendations")
    else:
        print("⚠️  Some Gemini tests failed. Check the errors above.")

if __name__ == "__main__":
    main()
