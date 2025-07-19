#!/usr/bin/env python3
"""
Quick script to fix indentation issues in app.py
"""

def fix_indentation():
    with open('app.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find and fix the problematic area around line 1140-1141
    fixed_lines = []
    
    for i, line in enumerate(lines):
        line_num = i + 1
        
        # Check for the problematic try statement around line 1141
        if line_num >= 1140 and line_num <= 1145:
            # Remove excessive indentation if present
            if line.strip() == 'try:' and line.startswith('                try:'):
                # Fix to proper indentation (8 spaces)
                fixed_lines.append('        try:\n')
                print(f"Fixed line {line_num}: Corrected try statement indentation")
            else:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)
    
    # Write back the fixed file
    with open('app.py', 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
    
    print("✅ Indentation fix completed!")

if __name__ == "__main__":
    fix_indentation() 