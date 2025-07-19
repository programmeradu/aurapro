#!/usr/bin/env python3
"""
Icon Generator for Aura Command Ultimate
Creates modern bus and hub icons for pydeck visualization
"""

import base64
from PIL import Image, ImageDraw, ImageFont
import os

def create_bus_icon():
    """Create a modern bus icon"""
    # Create 64x64 image with transparent background
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Bus body (rounded rectangle)
    bus_color = (255, 215, 0, 255)  # Golden yellow
    draw.rounded_rectangle([8, 20, 56, 50], radius=6, fill=bus_color, outline=(0, 0, 0, 255), width=2)
    
    # Windows
    window_color = (173, 216, 230, 200)  # Light blue with transparency
    draw.rounded_rectangle([12, 24, 24, 36], radius=2, fill=window_color)
    draw.rounded_rectangle([28, 24, 40, 36], radius=2, fill=window_color)
    draw.rounded_rectangle([44, 24, 52, 36], radius=2, fill=window_color)
    
    # Wheels
    wheel_color = (64, 64, 64, 255)  # Dark gray
    draw.ellipse([10, 46, 20, 56], fill=wheel_color, outline=(0, 0, 0, 255), width=1)
    draw.ellipse([44, 46, 54, 56], fill=wheel_color, outline=(0, 0, 0, 255), width=1)
    
    # Front grille
    draw.rectangle([6, 28, 8, 42], fill=(128, 128, 128, 255))
    
    # Direction indicator (arrow)
    arrow_color = (255, 69, 0, 255)  # Red-orange
    draw.polygon([(58, 32), (62, 30), (62, 34)], fill=arrow_color)
    
    return img

def create_hub_icon():
    """Create a modern transport hub icon"""
    # Create 64x64 image with transparent background
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Hub base (circle)
    hub_color = (96, 165, 250, 255)  # Blue
    draw.ellipse([16, 16, 48, 48], fill=hub_color, outline=(0, 0, 0, 255), width=2)
    
    # Inner circle
    inner_color = (255, 255, 255, 255)  # White
    draw.ellipse([22, 22, 42, 42], fill=inner_color)
    
    # Center dot
    center_color = (37, 99, 235, 255)  # Dark blue
    draw.ellipse([28, 28, 36, 36], fill=center_color)
    
    # Connection points (smaller circles around the hub)
    point_color = (34, 197, 94, 255)  # Green
    points = [
        (32, 8),   # Top
        (56, 32),  # Right
        (32, 56),  # Bottom
        (8, 32)    # Left
    ]
    
    for x, y in points:
        draw.ellipse([x-4, y-4, x+4, y+4], fill=point_color, outline=(0, 0, 0, 255), width=1)
    
    return img

def main():
    """Generate and save the icons"""
    print("🎨 Generating modern icons for Aura Command Ultimate...")
    
    # Create bus icon
    bus_icon = create_bus_icon()
    bus_icon.save('bus-icon.png', 'PNG')
    print("✅ Created bus-icon.png")
    
    # Create hub icon
    hub_icon = create_hub_icon()
    hub_icon.save('hub-icon.png', 'PNG')
    print("✅ Created hub-icon.png")
    
    print("🚀 Icon generation complete!")

if __name__ == "__main__":
    main() 