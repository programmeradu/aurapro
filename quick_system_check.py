#!/usr/bin/env python3
"""
Quick system check for Aura Command
"""

import sys
import os

def check_basic_imports():
    """Check if basic packages are available"""
    print("📦 CHECKING BASIC IMPORTS...")
    
    required_packages = [
        'streamlit', 'pandas', 'numpy', 'requests', 
        'folium', 'plotly', 'sklearn', 'xgboost',
        'ortools', 'fastapi', 'uvicorn'
    ]
    
    missing = []
    available = []
    
    for package in required_packages:
        try:
            __import__(package)
            available.append(package)
            print(f"✅ {package}")
        except ImportError:
            missing.append(package)
            print(f"❌ {package} - MISSING")
    
    print(f"\n📊 Available: {len(available)}/{len(required_packages)}")
    if missing:
        print(f"🔧 Missing: {', '.join(missing)}")
    
    return len(missing) == 0

def check_files():
    """Check if critical files exist"""
    print("\n📁 CHECKING CRITICAL FILES...")
    
    critical_files = [
        'app.py',
        'backend/main.py',
        'backend/advanced_ml.py',
        'backend/ghana_economics.py',
        'backend/ortools_optimizer.py',
        'requirements.txt'
    ]
    
    existing = []
    missing = []
    
    for file_path in critical_files:
        if os.path.exists(file_path):
            existing.append(file_path)
            print(f"✅ {file_path}")
        else:
            missing.append(file_path)
            print(f"❌ {file_path} - MISSING")
    
    print(f"\n📊 Files: {len(existing)}/{len(critical_files)}")
    if missing:
        print(f"🔧 Missing: {', '.join(missing)}")
    
    return len(missing) == 0

def check_gtfs_data():
    """Check GTFS data"""
    print("\n📊 CHECKING GTFS DATA...")
    
    gtfs_dir = "gtfs-accra-ghana-2016"
    if not os.path.exists(gtfs_dir):
        print(f"❌ {gtfs_dir} directory missing")
        return False
    
    gtfs_files = ['trips.txt', 'stops.txt', 'stop_times.txt', 'routes.txt']
    
    for file_name in gtfs_files:
        file_path = os.path.join(gtfs_dir, file_name)
        if os.path.exists(file_path):
            print(f"✅ {file_name}")
        else:
            print(f"❌ {file_name} - MISSING")
            return False
    
    print("✅ GTFS data available")
    return True

def main():
    print("🚀 AURA COMMAND - QUICK SYSTEM CHECK")
    print("=" * 50)
    
    checks = [
        ("Basic Imports", check_basic_imports),
        ("Critical Files", check_files), 
        ("GTFS Data", check_gtfs_data)
    ]
    
    passed = 0
    for name, check_func in checks:
        try:
            if check_func():
                passed += 1
        except Exception as e:
            print(f"💥 {name} check failed: {e}")
    
    print("\n" + "=" * 50)
    print(f"📋 SUMMARY: {passed}/{len(checks)} checks passed")
    
    if passed == len(checks):
        print("🎉 SYSTEM LOOKS GOOD!")
    elif passed >= 2:
        print("⚠️  MOSTLY READY - MINOR FIXES NEEDED")
    else:
        print("🚨 CRITICAL ISSUES - MAJOR FIXES REQUIRED")

if __name__ == "__main__":
    main() 