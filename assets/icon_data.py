# assets/icon_data.py
"""
Base64 encoded icon data for Aura Command Ultimate
Modern bus and hub icons for pydeck visualization
"""

# Modern bus icon (64x64 PNG)
BUS_ICON_BASE64 = """
iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAOKSURBVHic7ZtPaBNBFMafJBUrFrQgFqsHwYMIXgQPHrx4EEEQD168ePHixYsXL168ePHixYsXL168ePHixYsXL168ePHixYsXL168ePHixYsXL168ePHixYsXL168ePHixYsX
"""

# Modern hub icon (64x64 PNG)
HUB_ICON_BASE64 = """
iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANXSURBVHic7ZtLaBNBGMefJBUrFrQgFqsHwYMIXgQPHrx4EEEQD168ePHixYsXL168ePHixYsXL168ePHixYsXL168ePHixYsXL168ePHixYsXL168ePHixYsXL168ePHixYsX
"""

# Simple SVG icon data as fallback
BUS_ICON_SVG = """
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="4" y="10" width="24" height="15" rx="3" fill="#FFD700" stroke="#000" stroke-width="1"/>
  <rect x="6" y="12" width="6" height="6" rx="1" fill="#ADD8E6"/>
  <rect x="14" y="12" width="6" height="6" rx="1" fill="#ADD8E6"/>
  <rect x="22" y="12" width="4" height="6" rx="1" fill="#ADD8E6"/>
  <circle cx="8" cy="26" r="3" fill="#404040" stroke="#000"/>
  <circle cx="24" cy="26" r="3" fill="#404040" stroke="#000"/>
  <polygon points="30,16 32,15 32,17" fill="#FF4500"/>
</svg>
"""

HUB_ICON_SVG = """
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="12" fill="#60A5FA" stroke="#000" stroke-width="1"/>
  <circle cx="16" cy="16" r="8" fill="#FFF"/>
  <circle cx="16" cy="16" r="4" fill="#2563EB"/>
  <circle cx="16" cy="4" r="2" fill="#22C55E" stroke="#000"/>
  <circle cx="28" cy="16" r="2" fill="#22C55E" stroke="#000"/>
  <circle cx="16" cy="28" r="2" fill="#22C55E" stroke="#000"/>
  <circle cx="4" cy="16" r="2" fill="#22C55E" stroke="#000"/>
</svg>
"""

import base64

def get_bus_icon_url():
    """Get bus icon as data URL"""
    encoded = base64.b64encode(BUS_ICON_SVG.encode('utf-8')).decode('utf-8')
    return f"data:image/svg+xml;base64,{encoded}"

def get_hub_icon_url():
    """Get hub icon as data URL"""  
    encoded = base64.b64encode(HUB_ICON_SVG.encode('utf-8')).decode('utf-8')
    return f"data:image/svg+xml;base64,{encoded}" 