#!/usr/bin/env python3
"""
Install Victory Dependencies - Sophisticated AI Packages for Aura Command
"""

import subprocess
import sys

def install_package(package):
    """Install a package using pip"""
    try:
        print(f"🔧 Installing {package}...")
        result = subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ {package} installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {package}: {e}")
        return False
    except Exception as e:
        print(f"💥 Error installing {package}: {e}")
        return False

def main():
    print("🏆 INSTALLING VICTORY DEPENDENCIES")
    print("=" * 50)
    
    # Sophisticated AI and optimization packages
    victory_packages = [
        "streamlit>=1.35.0",
        "fastapi>=0.111.0",
        "uvicorn[standard]>=0.30.1",
        "pandas>=2.0.3",
        "numpy>=1.25.1",
        "scikit-learn>=1.3.0",
        "xgboost>=1.7.0",
        "joblib>=1.3.2",
        "ortools>=9.7.2996",
        "requests>=2.31.0",
        "httpx>=0.24.1",
        "folium>=0.14.0",
        "plotly>=5.15.0",
        "streamlit-folium>=0.13.0",
        "geopy>=2.3.0",
        "networkx>=3.1",
        "matplotlib>=3.5.0",
        "seaborn>=0.11.0",
        "pydeck>=0.8.1b0"
    ]
    
    # Install packages
    success_count = 0
    for package in victory_packages:
        if install_package(package):
            success_count += 1
    
    print("\n" + "=" * 50)
    print(f"📊 INSTALLATION SUMMARY")
    print(f"✅ Successful: {success_count}/{len(victory_packages)}")
    print(f"📈 Success Rate: {(success_count/len(victory_packages))*100:.1f}%")
    
    if success_count == len(victory_packages):
        print("🎉 ALL VICTORY DEPENDENCIES INSTALLED!")
        print("🚀 Ready for sophisticated AI features!")
    elif success_count >= len(victory_packages) * 0.8:
        print("⚠️  MOSTLY READY - Check failed packages")
    else:
        print("🚨 CRITICAL ISSUES - Manual intervention needed")
    
    return success_count == len(victory_packages)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 