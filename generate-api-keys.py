#!/usr/bin/env python3
"""
🔑 AURA API Key Generator
Generate secure API keys for AURA backend authentication
"""

import secrets
import hashlib
import time
from datetime import datetime

def generate_secure_api_key(prefix="aura", length=32):
    """Generate a cryptographically secure API key"""
    # Generate random bytes
    random_bytes = secrets.token_bytes(length)
    
    # Create a hash with timestamp for uniqueness
    timestamp = str(int(time.time()))
    combined = f"{prefix}_{timestamp}_{random_bytes.hex()}"
    
    # Create final key
    key_hash = hashlib.sha256(combined.encode()).hexdigest()
    return f"{prefix}_{key_hash[:length]}"

def generate_master_key():
    """Generate a master API key"""
    return secrets.token_urlsafe(32)

def main():
    print("🔑 AURA API Key Generator")
    print("=" * 50)
    
    # Generate different types of keys
    keys = {
        "Master Key": generate_master_key(),
        "Frontend Key": generate_secure_api_key("aura_frontend"),
        "Admin Key": generate_secure_api_key("aura_admin"),
        "Mobile App Key": generate_secure_api_key("aura_mobile"),
        "Analytics Key": generate_secure_api_key("aura_analytics"),
        "Fleet Key": generate_secure_api_key("aura_fleet")
    }
    
    print(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    for key_type, key_value in keys.items():
        print(f"🔐 {key_type}:")
        print(f"   {key_value}")
        print()
    
    print("📋 Usage Instructions:")
    print("1. Set environment variables:")
    print(f"   export AURA_MASTER_API_KEY='{keys['Master Key']}'")
    print()
    print("2. Use in API requests:")
    print("   Authorization: Bearer <api_key>")
    print()
    print("3. Use in FastAPI docs:")
    print("   Click 'Authorize' and enter the key (without 'Bearer')")
    print()
    
    print("⚠️  Security Notes:")
    print("   • Store keys securely (environment variables)")
    print("   • Never commit keys to version control")
    print("   • Rotate keys regularly in production")
    print("   • Use different keys for different environments")

if __name__ == "__main__":
    main()
