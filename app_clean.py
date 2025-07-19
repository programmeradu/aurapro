#!/usr/bin/env python3
"""
Quick fix script - this will create a corrected version of app.py
"""

def fix_app_indentation():
    print("🔧 Fixing indentation error in app.py...")
    
    try:
        with open('app.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # The issue is likely a try statement with wrong indentation
        # Let's fix common indentation patterns that would cause errors
        
        # Fix try statements with excessive indentation (more than 12 spaces)
        import re
        
        # Pattern to find try statements with excessive indentation
        # and replace with proper indentation (8 spaces)
        pattern = r'^( {12,})try:$'
        replacement = r'        try:'
        
        lines = content.split('\n')
        fixed_lines = []
        
        for i, line in enumerate(lines):
            line_num = i + 1
            
            # Check around line 1141 for indentation issues
            if 1135 <= line_num <= 1150:
                # Fix try statement with wrong indentation
                if line.strip() == 'try:' and len(line) - len(line.lstrip()) > 8:
                    fixed_lines.append('        try:')
                    print(f"✅ Fixed try statement indentation at line {line_num}")
                else:
                    fixed_lines.append(line)
            else:
                fixed_lines.append(line)
        
        # Write the corrected content
        with open('app_corrected.py', 'w', encoding='utf-8') as f:
            f.write('\n'.join(fixed_lines))
        
        print("✅ Created app_corrected.py with fixed indentation")
        print("📁 Now copy app_corrected.py to app.py to apply the fix")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_app_indentation() 