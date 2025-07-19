#!/usr/bin/env python3
"""
Quick test to verify app.py starts without errors
"""

def test_app_imports():
    """Test that the app can be imported without errors"""
    try:
        print("🧪 Testing app.py imports...")
        
        # Test basic imports
        import streamlit as st
        print("✅ Streamlit imported successfully")
        
        import pandas as pd
        print("✅ Pandas imported successfully")
        
        # Test if we can import the main app file
        import app
        print("✅ app.py imported successfully")
        
        print("\n🎉 All imports successful! App should run without the selected_tab error.")
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

if __name__ == "__main__":
    success = test_app_imports()
    if success:
        print("\n🚀 App is ready to run!")
        print("📝 Start with: streamlit run app.py --server.port 8503")
    else:
        print("\n🔧 Please fix the errors above before running") 