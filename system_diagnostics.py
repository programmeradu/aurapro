#!/usr/bin/env python3
"""
🔧 SYSTEM DIAGNOSTICS - Aura Command
Comprehensive testing script to identify and fix all issues in our sophisticated AI system
"""

import sys
import traceback
from datetime import datetime

def test_component(component_name, test_func):
    """Test a component and return results"""
    try:
        print(f"🧪 Testing {component_name}...")
        result = test_func()
        print(f"✅ {component_name}: PASSED")
        return True, result
    except Exception as e:
        print(f"❌ {component_name}: FAILED - {str(e)}")
        print(f"📝 Error details: {traceback.format_exc()}")
        return False, {component_name: f"❌ Error: {str(e)}"}

def test_basic_imports():
    """Test all basic Python imports"""
    imports = [
        ('streamlit', 'import streamlit as st'),
        ('pandas', 'import pandas as pd'),
        ('numpy', 'import numpy as np'),
        ('requests', 'import requests'),
        ('folium', 'import folium'),
        ('plotly', 'import plotly.express as px'),
        ('plotly.graph_objects', 'import plotly.graph_objects as go'),
    ]
    
    results = {}
    for name, import_cmd in imports:
        try:
            exec(import_cmd)
            results[name] = "✅ Available"
        except ImportError as e:
            results[name] = f"❌ Missing: {e}"
    
    return results

def test_victory_imports():
    """Test sophisticated ML and optimization imports"""
    imports = [
        ('scikit-learn', 'import sklearn; from sklearn.ensemble import RandomForestRegressor'),
        ('xgboost', 'import xgboost as xgb'),
        ('joblib', 'import joblib'),
        ('ortools', 'from ortools.constraint_solver import pywrapcp'),
        ('fastapi', 'import fastapi'),
        ('uvicorn', 'import uvicorn'),
        ('httpx', 'import httpx'),
        ('geopy', 'import geopy'),
        ('networkx', 'import networkx as nx'),
        ('matplotlib', 'import matplotlib.pyplot as plt'),
        ('seaborn', 'import seaborn as sns'),
    ]
    
    results = {}
    for name, import_cmd in imports:
        try:
            exec(import_cmd)
            results[name] = "✅ Available"
        except ImportError as e:
            results[name] = f"❌ Missing: {e}"
    
    return results

def test_backend_modules():
    """Test backend module imports"""
    backend_modules = [
        'backend.main',
        'backend.advanced_ml',
        'backend.ghana_economics', 
        'backend.ortools_optimizer',
        'backend.mock_data',
        'backend.model_trainer'
    ]
    
    results = {}
    for module in backend_modules:
        try:
            __import__(module)
            results[module] = "✅ Importable"
        except Exception as e:
            results[module] = f"❌ Error: {e}"
    
    return results

def test_gtfs_data():
    """Test GTFS data availability and structure"""
    import os
    import pandas as pd
    
    gtfs_files = [
        'gtfs-accra-ghana-2016/trips.txt',
        'gtfs-accra-ghana-2016/stops.txt', 
        'gtfs-accra-ghana-2016/stop_times.txt',
        'gtfs-accra-ghana-2016/routes.txt',
        'gtfs-accra-ghana-2016/shapes.txt',
        'gtfs-accra-ghana-2016/agency.txt',
        'gtfs-accra-ghana-2016/calendar.txt',
        'gtfs-accra-ghana-2016/fare_attributes.txt',
        'gtfs-accra-ghana-2016/fare_rules.txt'
    ]
    
    results = {}
    for file_path in gtfs_files:
        if os.path.exists(file_path):
            try:
                df = pd.read_csv(file_path)
                results[file_path] = f"✅ {len(df)} records"
            except Exception as e:
                results[file_path] = f"❌ Read error: {e}"
        else:
            results[file_path] = "❌ File not found"
    
    return results

def test_app_syntax():
    """Test main app.py for syntax errors"""
    try:
        with open('app.py', 'r') as f:
            code = f.read()
        
        # Try to compile the code
        compile(code, 'app.py', 'exec')
        return "✅ No syntax errors"
    except SyntaxError as e:
        return f"❌ Syntax error at line {e.lineno}: {e.msg}"
    except Exception as e:
        return f"❌ Error: {e}"

def test_backend_syntax():
    """Test backend files for syntax errors"""
    backend_files = [
        'backend/main.py',
        'backend/advanced_ml.py', 
        'backend/ghana_economics.py',
        'backend/ortools_optimizer.py'
    ]
    
    results = {}
    for file_path in backend_files:
        try:
            with open(file_path, 'r') as f:
                code = f.read()
            compile(code, file_path, 'exec')
            results[file_path] = "✅ No syntax errors"
        except SyntaxError as e:
            results[file_path] = f"❌ Syntax error at line {e.lineno}: {e.msg}"
        except FileNotFoundError:
            results[file_path] = "❌ File not found"
        except Exception as e:
            results[file_path] = f"❌ Error: {e}"
    
    return results

def test_model_files():
    """Test if ML model files exist and are loadable"""
    import os
    
    model_files = [
        'backend/travel_time_model.joblib',
        'backend/random_forest_model.joblib',
        'backend/xgboost_model.joblib', 
        'backend/neural_network_model.joblib'
    ]
    
    results = {}
    for file_path in model_files:
        if os.path.exists(file_path):
            try:
                import joblib
                model = joblib.load(file_path)
                results[file_path] = f"✅ Loadable ({type(model).__name__})"
            except Exception as e:
                results[file_path] = f"❌ Load error: {e}"
        else:
            results[file_path] = "❌ File not found"
    
    return results

def run_full_diagnostics():
    """Run complete system diagnostics"""
    print("🚀 AURA COMMAND - SYSTEM DIAGNOSTICS")
    print("=" * 60)
    print(f"⏰ Diagnostic Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test 1: Basic Imports
    print("📦 BASIC IMPORTS TEST")
    print("-" * 30)
    basic_passed, basic_results = test_component("Basic Imports", test_basic_imports)
    if isinstance(basic_results, dict):
        for lib, status in basic_results.items():
            print(f"  {lib}: {status}")
    print()
    
    # Test 2: Victory Feature Imports  
    print("🏆 VICTORY FEATURES IMPORTS TEST")
    print("-" * 30)
    victory_passed, victory_results = test_component("Victory Imports", test_victory_imports)
    if isinstance(victory_results, dict):
        for lib, status in victory_results.items():
            print(f"  {lib}: {status}")
    print()
    
    # Test 3: Backend Module Imports
    print("🔧 BACKEND MODULES TEST")
    print("-" * 30)
    backend_passed, backend_results = test_component("Backend Modules", test_backend_modules)
    if isinstance(backend_results, dict):
        for module, status in backend_results.items():
            print(f"  {module}: {status}")
    print()
    
    # Test 4: GTFS Data
    print("📊 GTFS DATA TEST")
    print("-" * 30)
    gtfs_passed, gtfs_results = test_component("GTFS Data", test_gtfs_data)
    if isinstance(gtfs_results, dict):
        for file_path, status in gtfs_results.items():
            print(f"  {file_path}: {status}")
    print()
    
    # Test 5: Syntax Checks
    print("📝 SYNTAX VALIDATION TEST")
    print("-" * 30)
    app_passed, app_result = test_component("app.py syntax", test_app_syntax)
    if isinstance(app_result, dict):
        for item, status in app_result.items():
            print(f"  {item}: {status}")
    else:
        print(f"  app.py: {app_result}")
    
    backend_syntax_passed, backend_syntax_results = test_component("Backend syntax", test_backend_syntax)
    if isinstance(backend_syntax_results, dict):
        for file_path, status in backend_syntax_results.items():
            print(f"  {file_path}: {status}")
    print()
    
    # Test 6: Model Files
    print("🤖 ML MODEL FILES TEST")
    print("-" * 30)
    model_passed, model_results = test_component("Model Files", test_model_files)
    if isinstance(model_results, dict):
        for file_path, status in model_results.items():
            print(f"  {file_path}: {status}")
    print()
    
    # Summary
    print("📋 DIAGNOSTIC SUMMARY")
    print("=" * 60)
    
    all_tests = [
        ("Basic Imports", basic_passed),
        ("Victory Imports", victory_passed), 
        ("Backend Modules", backend_passed),
        ("GTFS Data", gtfs_passed),
        ("App Syntax", app_passed),
        ("Backend Syntax", backend_syntax_passed),
        ("Model Files", model_passed)
    ]
    
    passed_count = sum(1 for _, passed in all_tests if passed)
    total_tests = len(all_tests)
    
    print(f"📊 Tests Passed: {passed_count}/{total_tests}")
    print(f"📈 Success Rate: {(passed_count/total_tests)*100:.1f}%")
    
    if passed_count == total_tests:
        print("🎉 ALL TESTS PASSED - SYSTEM READY!")
    elif passed_count >= total_tests * 0.8:
        print("⚠️  MOSTLY READY - MINOR FIXES NEEDED")
    elif passed_count >= total_tests * 0.6:
        print("🔧 NEEDS WORK - MODERATE FIXES REQUIRED")
    else:
        print("🚨 CRITICAL ISSUES - MAJOR FIXES NEEDED")
    
    # Specific recommendations
    print("\n💡 RECOMMENDED ACTIONS:")
    print("-" * 30)
    
    failed_imports = []
    if not victory_passed and isinstance(victory_results, dict):
        for lib, status in victory_results.items():
            if "❌ Missing" in status:
                failed_imports.append(lib)
    
    if failed_imports:
        print(f"🔧 Install missing packages: pip install {' '.join(failed_imports)}")
    
    if not backend_passed:
        print("🔧 Fix backend module imports")
    
    if not app_passed or not backend_syntax_passed:
        print("📝 Fix syntax errors in Python files")
    
    if not model_passed:
        print("🤖 Run model training pipeline: python backend/enhanced_training_pipeline.py")
    
    print()
    return passed_count, total_tests

if __name__ == "__main__":
    try:
        passed, total = run_full_diagnostics()
        sys.exit(0 if passed == total else 1)
    except Exception as e:
        print(f"💥 DIAGNOSTIC CRASHED: {e}")
        print(traceback.format_exc())
        sys.exit(1) 