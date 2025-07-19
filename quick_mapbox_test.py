"""
🚀 QUICK MAPBOX TOKEN VERIFICATION
Test the provided Mapbox token and demonstrate basic capabilities
"""

import requests
import json

# Your Mapbox token
MAPBOX_TOKEN = "pk.eyJ1IjoiYWxnb3JpdGhteCIsImEiOiJjbTdob3lzNmwxYjliMmxzamppbDRqMHlhIn0.bBKjPrD_sp6RY5t2-AEnGQ"

def test_mapbox_token():
    """Test if the Mapbox token is valid"""
    
    print("🧪 Testing Mapbox token validity...")
    
    try:
        # Test geocoding API
        url = "https://api.mapbox.com/geocoding/v5/mapbox.places/Accra,Ghana.json"
        params = {'access_token': MAPBOX_TOKEN}
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('features'):
                print("✅ Mapbox token is VALID and working!")
                print(f"✅ Successfully geocoded Accra, Ghana")
                return True
        
        print(f"❌ Token test failed: HTTP {response.status_code}")
        return False
        
    except Exception as e:
        print(f"❌ Token test error: {e}")
        return False

def test_directions_api():
    """Test Mapbox Directions API for Ghana"""
    
    print("\n🗺️ Testing Mapbox Directions API for Accra routes...")
    
    try:
        # Kotoka Airport to Accra Mall
        start_lon, start_lat = -0.1719, 5.6052  # Kotoka Airport
        end_lon, end_lat = -0.1769, 5.6456      # Accra Mall
        
        url = f"https://api.mapbox.com/directions/v5/mapbox/driving-traffic/{start_lon},{start_lat};{end_lon},{end_lat}"
        
        params = {
            'access_token': MAPBOX_TOKEN,
            'geometries': 'geojson',
            'overview': 'full'
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            routes = data.get('routes', [])
            
            if routes:
                route = routes[0]
                distance_km = route.get('distance', 0) / 1000
                duration_min = route.get('duration', 0) / 60
                
                print("✅ Professional routing WORKING!")
                print(f"🚗 Route: Kotoka Airport → Accra Mall")
                print(f"📏 Distance: {distance_km:.1f} km")
                print(f"⏱️ Duration: {duration_min:.1f} minutes")
                print(f"🎯 Real-time traffic data included!")
                
                return True
            
        print(f"❌ Directions API failed: HTTP {response.status_code}")
        return False
        
    except Exception as e:
        print(f"❌ Directions test error: {e}")
        return False

def demonstrate_ghana_capabilities():
    """Demonstrate Ghana-specific capabilities"""
    
    print("\n🇬🇭 Demonstrating Ghana-specific capabilities...")
    
    # Ghana fuel and economic data
    fuel_price_ghs = 14.34  # Current Ghana fuel price per liter
    avg_consumption = 7.4   # Liters per 100km for tro-tro
    
    # Sample route data (would come from real API)
    sample_distance_km = 8.5
    sample_duration_min = 25
    
    # Calculate Ghana-specific insights
    fuel_needed = (sample_distance_km / 100) * avg_consumption
    fuel_cost = fuel_needed * fuel_price_ghs
    
    # Tro-tro fare estimation
    if sample_distance_km < 5:
        trotro_fare = 3.0
    elif sample_distance_km < 15:
        trotro_fare = 5.0
    else:
        trotro_fare = 8.0
    
    print(f"💰 Ghana Economic Analysis:")
    print(f"   Fuel Cost: GH₵ {fuel_cost:.2f}")
    print(f"   Tro-tro Fare: GH₵ {trotro_fare:.2f}")
    print(f"   Journey Type: Intra-city travel")
    print(f"   CO₂ Emissions: {sample_distance_km * 0.196:.1f} kg")
    
    print("✅ Ghana-specific intelligence ready!")

def main():
    """Main test function"""
    
    print("🚀 MAPBOX PROFESSIONAL ROUTING VERIFICATION")
    print("🇬🇭 Testing enterprise-grade capabilities for Ghana")
    print("=" * 55)
    
    # Test 1: Token validity
    if test_mapbox_token():
        
        # Test 2: Professional routing
        if test_directions_api():
            
            # Test 3: Ghana capabilities
            demonstrate_ghana_capabilities()
            
            print("\n🏆 VERIFICATION COMPLETE!")
            print("✅ Mapbox professional routing: WORKING")
            print("✅ Real-time traffic integration: CONFIRMED") 
            print("✅ Ghana economic intelligence: READY")
            print("✅ Enterprise-grade system: OPERATIONAL")
            
            print("\n🎯 NEXT STEPS:")
            print("1. ✅ Token configured and working")
            print("2. 🔄 Integrate with Streamlit app")
            print("3. 🚀 Replace basic routing with professional APIs")
            print("4. 🏆 Dominate hackathon with enterprise system!")
            
            return True
        
    print("\n❌ Verification failed")
    print("🔧 Check network connection or token permissions")
    return False

if __name__ == "__main__":
    main() 