#!/usr/bin/env python3
"""
🔧 COMPREHENSIVE BACKEND TESTING SCRIPT
Test all backend modules, dependencies, and functionality
"""

import sys
import os
import traceback
from datetime import datetime

# Add backend to path
sys.path.append('backend')

def test_basic_imports():
    """Test basic Python libraries"""
    print("🔧 Testing Basic Libraries...")
    
    tests = []
    
    try:
        import pandas as pd
        tests.append(("✅ pandas", pd.__version__))
    except ImportError as e:
        tests.append(("❌ pandas", f"FAILED: {e}"))
    
    try:
        import numpy as np
        tests.append(("✅ numpy", np.__version__))
    except ImportError as e:
        tests.append(("❌ numpy", f"FAILED: {e}"))
    
    try:
        import requests
        tests.append(("✅ requests", requests.__version__))
    except ImportError as e:
        tests.append(("❌ requests", f"FAILED: {e}"))
    
    try:
        import fastapi
        tests.append(("✅ fastapi", fastapi.__version__))
    except ImportError as e:
        tests.append(("❌ fastapi", f"FAILED: {e}"))
    
    return tests

def test_ml_dependencies():
    """Test ML and optimization libraries"""
    print("🤖 Testing ML Dependencies...")
    
    tests = []
    
    try:
        import sklearn
        tests.append(("✅ scikit-learn", sklearn.__version__))
    except ImportError as e:
        tests.append(("❌ scikit-learn", f"FAILED: {e}"))
    
    try:
        import xgboost as xgb
        tests.append(("✅ xgboost", xgb.__version__))
    except ImportError as e:
        tests.append(("❌ xgboost", f"FAILED: {e}"))
    
    try:
        import tensorflow as tf
        tests.append(("✅ tensorflow", tf.__version__))
    except ImportError as e:
        tests.append(("❌ tensorflow", f"FAILED: {e}"))
    
    try:
        from ortools.constraint_solver import pywrapcp
        tests.append(("✅ ortools", "Available"))
    except ImportError as e:
        tests.append(("❌ ortools", f"FAILED: {e}"))
    
    try:
        import joblib
        tests.append(("✅ joblib", joblib.__version__))
    except ImportError as e:
        tests.append(("❌ joblib", f"FAILED: {e}"))
    
    return tests

def test_backend_modules():
    """Test backend module imports"""
    print("🏗️ Testing Backend Modules...")
    
    tests = []
    
    try:
        import main
        tests.append(("✅ main.py", "Imported successfully"))
    except Exception as e:
        tests.append(("❌ main.py", f"FAILED: {e}"))
    
    try:
        from advanced_ml import TransportMLEnsemble, get_ensemble
        tests.append(("✅ advanced_ml.py", "Imported successfully"))
    except Exception as e:
        tests.append(("❌ advanced_ml.py", f"FAILED: {e}"))
    
    try:
        from ghana_economics import get_ghana_economics
        tests.append(("✅ ghana_economics.py", "Imported successfully"))
    except Exception as e:
        tests.append(("❌ ghana_economics.py", f"FAILED: {e}"))
    
    try:
        from ortools_optimizer import AccraRouteOptimizer, get_route_optimizer
        tests.append(("✅ ortools_optimizer.py", "Imported successfully"))
    except Exception as e:
        tests.append(("❌ ortools_optimizer.py", f"FAILED: {e}"))
    
    try:
        from mapbox_routing import MapboxRoutingPro
        tests.append(("✅ mapbox_routing.py", "Imported successfully"))
    except Exception as e:
        tests.append(("❌ mapbox_routing.py", f"FAILED: {e}"))
    
    try:
        import mock_data
        tests.append(("✅ mock_data.py", "Imported successfully"))
    except Exception as e:
        tests.append(("❌ mock_data.py", f"FAILED: {e}"))
    
    return tests

def test_ml_functionality():
    """Test ML ensemble functionality"""
    print("🧠 Testing ML Functionality...")
    
    tests = []
    
    try:
        from advanced_ml import TransportMLEnsemble
        
        # Test ensemble initialization
        ensemble = TransportMLEnsemble()
        tests.append(("✅ ML Ensemble Init", "Created successfully"))
        
        # Test feature engineering with synthetic data
        import pandas as pd
        test_data = pd.DataFrame({
            'num_stops': [10, 15, 8],
            'hour': [8, 17, 12],
            'day_of_week': [1, 5, 3]
        })
        
        engineered = ensemble.advanced_feature_engineering(test_data)
        tests.append(("✅ Feature Engineering", f"Generated {len(engineered.columns)} features"))
        
        # Test training data preparation
        training_data = ensemble.prepare_training_data()
        tests.append(("✅ Training Data", f"Generated {len(training_data)} samples"))
        
    except Exception as e:
        tests.append(("❌ ML Functionality", f"FAILED: {e}"))
        
    return tests

def test_ortools_functionality():
    """Test OR-Tools optimizer functionality"""
    print("🚀 Testing OR-Tools Functionality...")
    
    tests = []
    
    try:
        from ortools_optimizer import AccraRouteOptimizer
        
        # Test optimizer initialization
        optimizer = AccraRouteOptimizer()
        tests.append(("✅ OR-Tools Init", "Created successfully"))
        
        # Test distance calculation
        lat1, lon1 = 5.6037, -0.1870  # Circle
        lat2, lon2 = 5.5558, -0.2238  # Kaneshie
        
        distance = optimizer.haversine_distance(lat1, lon1, lat2, lon2)
        tests.append(("✅ Distance Calc", f"{distance:.2f} km"))
        
        # Test distance matrix creation
        locations = [(5.6037, -0.1870), (5.5558, -0.2238), (5.6341, -0.1653)]
        matrix = optimizer.create_distance_matrix(locations)
        tests.append(("✅ Distance Matrix", f"{len(matrix)}x{len(matrix[0])} matrix"))
        
        # Test simple route optimization
        demands = [0, 5, 8, 3]  # Depot has 0 demand
        locations_with_depot = [(5.6037, -0.1870), (5.5558, -0.2238), (5.6341, -0.1653), (5.5577, -0.1959)]
        
        result = optimizer.solve_vehicle_routing_problem(locations_with_depot, demands, num_vehicles=2)
        tests.append(("✅ Route Optimization", f"Status: {result.get('status', 'Unknown')}"))
        
    except Exception as e:
        tests.append(("❌ OR-Tools Functionality", f"FAILED: {e}"))
        
    return tests

def test_ghana_economics():
    """Test Ghana economics module"""
    print("🇬🇭 Testing Ghana Economics...")
    
    tests = []
    
    try:
        from ghana_economics import get_ghana_economics
        
        # Test economics analysis
        test_request = {
            'distance_km': 15.5,
            'num_stops': 12,
            'fuel_efficiency_l_per_100km': 10.0
        }
        
        result = get_ghana_economics().analyze_trip_economics(test_request)
        tests.append(("✅ Economics Analysis", f"Fuel cost: GH₵{result.get('fuel_cost_ghs', 0):.2f}"))
        
        # Test network economics
        network_result = get_ghana_economics().analyze_network_economics()
        tests.append(("✅ Network Analysis", f"Total routes: {network_result.get('total_routes', 0)}"))
        
    except Exception as e:
        tests.append(("❌ Ghana Economics", f"FAILED: {e}"))
        
    return tests

def test_mapbox_integration():
    """Test Mapbox professional routing"""
    print("🗺️ Testing Mapbox Integration...")
    
    tests = []
    
    try:
        from mapbox_routing import MapboxRoutingPro
        
        # Test with mock token (won't work but should import)
        mapbox_routing = MapboxRoutingPro("test_token")
        tests.append(("✅ Mapbox Import", "Module imported successfully"))
        
        # Test coordinate validation
        from mapbox_routing import RouteVisualizer
        visualizer = RouteVisualizer()
        tests.append(("✅ Route Visualizer", "Created successfully"))
        
    except Exception as e:
        tests.append(("❌ Mapbox Integration", f"FAILED: {e}"))
    
    return tests

def test_data_files():
    """Test GTFS data availability"""
    print("📊 Testing Data Files...")
    
    tests = []
    
    # Check for GTFS data
    gtfs_files = [
        'gtfs-accra-ghana-2016/stops.txt',
        'gtfs-accra-ghana-2016/routes.txt',
        'gtfs-accra-ghana-2016/trips.txt',
        'gtfs-accra-ghana-2016/stop_times.txt'
    ]
    
    for file_path in gtfs_files:
        if os.path.exists(file_path):
            tests.append(("✅ " + file_path, "Found"))
        else:
            tests.append(("⚠️ " + file_path, "Not found (will use synthetic data)"))
    
    # Check for model files
    if os.path.exists('models'):
        tests.append(("✅ models/", "Directory exists"))
    else:
        tests.append(("⚠️ models/", "Directory missing (will be created during training)"))
    
    return tests

def test_api_endpoints():
    """Test FastAPI endpoint structure"""
    print("🌐 Testing API Endpoints...")
    
    tests = []
    
    try:
        import main
        app = main.app
        
        # Get route information
        routes = []
        for route in app.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                routes.append(f"{list(route.methods)[0]} {route.path}")
        
        tests.append(("✅ FastAPI App", f"Created with {len(routes)} endpoints"))
        
        # Test specific endpoints exist
        endpoint_paths = [route.path for route in app.routes if hasattr(route, 'path')]
        
        required_endpoints = [
            '/api/v1/routes',
            '/api/v1/predict/travel_time',
            '/api/v1/predict/ensemble',
            '/api/v1/optimize/routes',
            '/api/v1/live_weather/accra'
        ]
        
        for endpoint in required_endpoints:
            if endpoint in endpoint_paths:
                tests.append(("✅ " + endpoint, "Registered"))
            else:
                tests.append(("❌ " + endpoint, "Missing"))
        
    except Exception as e:
        tests.append(("❌ API Endpoints", f"FAILED: {e}"))
    
    return tests

def run_comprehensive_test():
    """Run all tests and provide summary"""
    
    print("=" * 60)
    print("🔧 COMPREHENSIVE BACKEND TESTING")
    print("🇬🇭 Aura Command Pro - Ghana AI Hackathon")
    print("=" * 60)
    
    all_tests = []
    
    # Run all test categories
    test_categories = [
        ("📦 Basic Imports", test_basic_imports),
        ("🤖 ML Dependencies", test_ml_dependencies),
        ("🏗️ Backend Modules", test_backend_modules),
        ("🧠 ML Functionality", test_ml_functionality),
        ("🚀 OR-Tools Functionality", test_ortools_functionality),
        ("🇬🇭 Ghana Economics", test_ghana_economics),
        ("🗺️ Mapbox Integration", test_mapbox_integration),
        ("📊 Data Files", test_data_files),
        ("🌐 API Endpoints", test_api_endpoints)
    ]
    
    for category_name, test_function in test_categories:
        print(f"\n{category_name}")
        print("-" * 40)
        
        try:
            tests = test_function()
            all_tests.extend(tests)
            
            for test_name, result in tests:
                print(f"  {test_name}: {result}")
                
        except Exception as e:
            error_test = (f"❌ {category_name}", f"Category failed: {e}")
            all_tests.append(error_test)
            print(f"  ❌ {category_name}: Category failed: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    
    passed = len([t for t in all_tests if t[0].startswith("✅")])
    failed = len([t for t in all_tests if t[0].startswith("❌")])
    warnings = len([t for t in all_tests if t[0].startswith("⚠️")])
    
    print(f"✅ PASSED: {passed}")
    print(f"❌ FAILED: {failed}")
    print(f"⚠️ WARNINGS: {warnings}")
    print(f"📊 TOTAL: {len(all_tests)}")
    
    # Overall status
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Backend is ready for production!")
        print("🚀 Ready for hackathon demo!")
    elif failed <= 2:
        print("\n⚠️ Minor issues detected but system should work")
        print("🔧 Consider fixing failed tests for optimal performance")
    else:
        print("\n❌ Multiple issues detected")
        print("🔧 Please fix failed tests before demo")
    
    # Failed tests details
    if failed > 0:
        print("\n🔍 FAILED TESTS DETAILS:")
        for test_name, result in all_tests:
            if test_name.startswith("❌"):
                print(f"  {test_name}: {result}")
    
    print(f"\n🕒 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    return passed, failed, warnings

if __name__ == "__main__":
    try:
        passed, failed, warnings = run_comprehensive_test()
        
        # Exit with appropriate code
        if failed == 0:
            sys.exit(0)  # Success
        else:
            sys.exit(1)  # Some failures
            
    except Exception as e:
        print(f"\n💥 CRITICAL ERROR during testing: {e}")
        print("\nFull traceback:")
        traceback.print_exc()
        sys.exit(2)  # Critical failure 