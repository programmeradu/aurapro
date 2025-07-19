import sys

def fix_indentation_issue():
    """
    Quick fix for the indentation error in app.py line 1141
    """
    try:
        # Read the file
        with open('app.py', 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Find and fix the problematic line
        for i, line in enumerate(lines):
            if i >= 1140 and i <= 1145:  # Around line 1141
                # Check if this line has a try statement with wrong indentation
                if 'try:' in line and line.startswith('    '):
                    # Count leading spaces
                    leading_spaces = len(line) - len(line.lstrip())
                    if leading_spaces > 8:  # More than 2 indentation levels
                        # Fix to proper indentation (8 spaces)
                        lines[i] = '        try:\n'
                        print(f"Fixed line {i+1}: {line.strip()} -> properly indented try:")
        
        # Write back
        with open('app.py', 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        print("✅ Indentation fix completed!")
        
        # Test if Python can parse it now
        try:
            with open('app.py', 'r') as f:
                compile(f.read(), 'app.py', 'exec')
            print("✅ Python syntax is now valid!")
        except SyntaxError as e:
            print(f"❌ Still has syntax error: {e}")
            print(f"Line {e.lineno}: {e.text}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_indentation_issue() 