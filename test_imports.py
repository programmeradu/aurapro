#!/usr/bin/env python3
"""
Test imports for WebSocket integration
"""

import sys
sys.path.append('backend')

print("🔍 TESTING IMPORTS")
print("=" * 30)

# Test basic imports
try:
    import socketio
    print("✅ socketio imported")
except Exception as e:
    print(f"❌ socketio: {e}")

try:
    from dataclasses import dataclass, asdict
    print("✅ dataclasses imported")
except Exception as e:
    print(f"❌ dataclasses: {e}")

# Test advanced service imports
try:
    from backend.realtime_data_generator import get_data_generator
    print("✅ realtime_data_generator imported")
except Exception as e:
    print(f"❌ realtime_data_generator: {e}")

try:
    from backend.streaming_ml_service import get_streaming_ml_service
    print("✅ streaming_ml_service imported")
except Exception as e:
    print(f"❌ streaming_ml_service: {e}")

# Test main module import
try:
    from backend.main import socket_app
    print("✅ main.socket_app imported")
except Exception as e:
    print(f"❌ main.socket_app: {e}")
    print(f"   Error details: {str(e)}")

print("\n🎯 Import test complete")
