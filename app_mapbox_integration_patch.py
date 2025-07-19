"""
🚀 MAPBOX PROFESSIONAL ROUTING INTEGRATION PATCH
Add this code to your existing app.py to enable enterprise-grade routing

INSTRUCTIONS:
1. Add the token definition at the top of app.py
2. Add the import sections where indicated
3. Replace existing route calculation with professional routing
4. Add the professional UI components
"""

# ==========================================
# ADD THIS AT THE TOP OF app.py (after imports)
# ==========================================

# Professional Mapbox integration
MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoiYWxnb3JpdGhteCIsImEiOiJjbTdob3lzNmwxYjliMmxzamppbDRqMHlhIn0.bBKjPrD_sp6RY5t2-AEnGQ"

# Add backend to path for professional routing
import sys
if 'backend' not in sys.path:
    sys.path.append('backend')

# ==========================================
# ADD THESE IMPORTS (after existing imports)
# ==========================================

try:
    from mapbox_routing import MapboxRoutingPro, RouteVisualizer
    MAPBOX_AVAILABLE = True
    st.sidebar.success("🚀 Professional Mapbox routing enabled!")
except ImportError:
    MAPBOX_AVAILABLE = False
    st.sidebar.warning("⚠️ Professional routing not available - check backend/mapbox_routing.py")

# ==========================================
# ADD THIS PROFESSIONAL ROUTING ENGINE
# ==========================================

@st.cache_resource
def get_professional_routing_engine():
    """Initialize professional Mapbox routing engine"""
    if MAPBOX_AVAILABLE:
        return MapboxRoutingPro(MAPBOX_ACCESS_TOKEN)
    return None

# Initialize the engine
professional_routing = get_professional_routing_engine()

# ==========================================
# REPLACE EXISTING ROUTE CALCULATION WITH THIS
# ==========================================

def calculate_professional_route(origin_coords, dest_coords):
    """
    🏆 PROFESSIONAL ROUTE CALCULATION
    Uses enterprise-grade Mapbox APIs with real-time traffic
    """
    
    if not professional_routing:
        st.error("❌ Professional routing not available")
        return None, None
    
    try:
        with st.spinner("🔄 Calculating professional route with real-time Accra traffic..."):
            
            # Get professional route with traffic
            route_data = professional_routing.get_professional_route(
                origin_coords, 
                dest_coords, 
                profile="driving-traffic"
            )
            
            # Get traffic comparison
            traffic_comparison = professional_routing.get_traffic_aware_comparison(
                origin_coords, 
                dest_coords
            )
            
            return route_data, traffic_comparison
    
    except Exception as e:
        st.error(f"❌ Professional routing error: {e}")
        return None, None

# ==========================================
# ADD THIS PROFESSIONAL UI COMPONENT  
# ==========================================

def display_professional_route_analysis(route_data, traffic_comparison):
    """
    🎨 PROFESSIONAL ROUTE ANALYSIS DISPLAY
    Enterprise-grade metrics and Ghana-specific insights
    """
    
    if not route_data or not route_data.get('routes'):
        return
    
    route = route_data['routes'][0]
    metrics = route.get('professional_metrics', {})
    ghana_insights = route.get('ghana_specific', {})
    
    # Professional header
    st.markdown("## 🏆 Professional Route Analysis")
    st.markdown("*Powered by Mapbox Enterprise APIs with real-time Accra traffic*")
    
    # Professional metrics cards
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            label="🚗 Distance",
            value=f"{route.get('distance', 0)/1000:.1f} km",
            help="Actual road distance via optimal route"
        )
    
    with col2:
        traffic_delay = metrics.get('traffic_delay', 0)
        st.metric(
            label="⏱️ Duration",
            value=f"{route.get('duration', 0)/60:.0f} min",
            delta=f"+{traffic_delay/60:.0f} min traffic" if traffic_delay > 0 else "No delays",
            help="Real-time duration including current traffic"
        )
    
    with col3:
        st.metric(
            label="💰 Fuel Cost",
            value=f"GH₵ {metrics.get('fuel_cost', 0):.2f}",
            help="Based on current Ghana fuel prices (GH₵14.34/L)"
        )
    
    with col4:
        st.metric(
            label="📈 Efficiency",
            value=f"{metrics.get('efficiency_score', 0):.0f}%",
            help="Professional efficiency rating (speed vs optimal)"
        )
    
    # Ghana-specific intelligence
    st.markdown("### 🇬🇭 Ghana Economic Intelligence")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.info(f"""
        **🚌 Tro-tro Fare**: GH₵ {ghana_insights.get('tro_tro_fare_estimate', 0):.2f}  
        **🏙️ Journey Type**: {ghana_insights.get('journey_classification', 'Unknown')}  
        **🌱 CO₂ Emissions**: {metrics.get('co2_emissions', 0):.1f} kg
        """)
    
    with col2:
        peak_impact = ghana_insights.get('peak_hour_impact', {})
        st.info(f"""
        **⏰ Current Period**: {peak_impact.get('period', 'Unknown')}  
        **🚦 Traffic Level**: {peak_impact.get('traffic_level', 'Unknown')}  
        **📊 Delay Factor**: {peak_impact.get('delay_factor', 1.0):.1f}x
        """)
    
    # Live traffic analysis
    if traffic_comparison and traffic_comparison.get('traffic_analysis'):
        st.markdown("### 🚦 Live Traffic Intelligence")
        
        traffic_analysis = traffic_comparison['traffic_analysis']
        delay = traffic_analysis.get('delay_minutes', 0)
        severity = traffic_analysis.get('traffic_severity', 'Unknown')
        recommendation = traffic_analysis.get('recommendation', 'No recommendation')
        
        if delay > 0:
            st.warning(f"🚦 **Traffic Impact**: {delay:.1f} minutes delay ({severity})")
            st.info(f"💡 **AI Recommendation**: {recommendation}")
        else:
            st.success("🚦 **Traffic Status**: Clear roads - excellent time to travel!")
    
    # Professional route comparison
    if traffic_comparison:
        st.markdown("### 📊 Multi-Modal Route Comparison")
        
        comparison_data = []
        for route_type, route_info in traffic_comparison.items():
            if route_type != 'traffic_analysis':
                comparison_data.append({
                    'Route Type': route_type.replace('_', ' ').title(),
                    'Duration (min)': round(route_info.get('duration_minutes', 0), 1),
                    'Distance (km)': round(route_info.get('distance_km', 0), 1)
                })
        
        if comparison_data:
            import pandas as pd
            df = pd.DataFrame(comparison_data)
            st.dataframe(df, use_container_width=True)

# ==========================================
# ADD THIS PROFESSIONAL MAP FUNCTION
# ==========================================

def create_professional_mapbox_map(route_data):
    """
    🗺️ PROFESSIONAL MAP WITH MAPBOX INTEGRATION
    Enterprise-grade visualization with real route geometry
    """
    
    import folium
    
    # Create professional map
    m = folium.Map(
        location=[5.6037, -0.1969],  # Accra center
        zoom_start=12,
        tiles=None
    )
    
    # Add Mapbox professional tiles
    folium.TileLayer(
        tiles=f"https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{{z}}/{{x}}/{{y}}?access_token={MAPBOX_ACCESS_TOKEN}",
        attr="Mapbox Professional",
        name="Mapbox Streets",
        overlay=False,
        control=True
    ).add_to(m)
    
    # Add satellite view option
    folium.TileLayer(
        tiles=f"https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{{z}}/{{x}}/{{y}}?access_token={MAPBOX_ACCESS_TOKEN}",
        attr="Mapbox Satellite",
        name="Satellite View",
        overlay=False,
        control=True
    ).add_to(m)
    
    # Add layer control
    folium.LayerControl().add_to(m)
    
    # Add professional route visualization
    if route_data and route_data.get('routes'):
        route = route_data['routes'][0]
        
        if route.get('geometry'):
            coords = route['geometry']['coordinates']
            folium_coords = [[lat, lon] for lon, lat in coords]
            
            # Professional route styling
            folium.PolyLine(
                locations=folium_coords,
                color='#FFD700',  # Gold for professional feel
                weight=8,
                opacity=0.9,
                popup=f"""
                <b>🏆 Professional Route</b><br>
                📏 Distance: {route.get('distance', 0)/1000:.1f} km<br>
                ⏱️ Duration: {route.get('duration', 0)/60:.0f} minutes<br>
                🚀 Real-time traffic optimized
                """
            ).add_to(m)
    
    return m

# ==========================================
# USAGE EXAMPLE IN YOUR MAIN APP
# ==========================================

def demo_professional_routing_section():
    """
    🚀 PROFESSIONAL ROUTING DEMO SECTION
    Add this to your main app where you want to show routing
    """
    
    st.markdown("## 🚀 Professional Route Planning")
    st.markdown("*Enterprise-grade routing with real-time Accra traffic and Ghana economic analysis*")
    
    if not MAPBOX_AVAILABLE:
        st.error("❌ Professional routing requires backend/mapbox_routing.py")
        return
    
    # Quick preset locations for demo
    locations = {
        "Kotoka Airport": (-0.1719, 5.6052),
        "Accra Mall": (-0.1769, 5.6456),
        "Kaneshie Market": (-0.2370, 5.5755),
        "37 Station": (-0.1445, 5.5781),
        "University of Ghana": (-0.1816, 5.6494),
        "Tema Station": (-0.1445, 5.5781)
    }
    
    col1, col2 = st.columns(2)
    
    with col1:
        origin = st.selectbox("🎯 Origin:", list(locations.keys()))
    
    with col2:
        destination = st.selectbox("🏁 Destination:", list(locations.keys()), index=1)
    
    if st.button("🚀 Calculate Professional Route", type="primary"):
        
        origin_coords = locations[origin]
        dest_coords = locations[destination]
        
        # Calculate professional route
        route_data, traffic_comparison = calculate_professional_route(origin_coords, dest_coords)
        
        if route_data:
            # Display professional analysis
            display_professional_route_analysis(route_data, traffic_comparison)
            
            # Show professional map
            st.markdown("### 🗺️ Professional Route Visualization")
            professional_map = create_professional_mapbox_map(route_data)
            
            # Display map
            import streamlit.components.v1 as components
            components.html(professional_map._repr_html_(), height=500)
            
            st.success("✅ Professional routing complete! This demonstrates enterprise-grade capabilities.")

# ==========================================
# INTEGRATION INSTRUCTIONS
# ==========================================

"""
🎯 TO INTEGRATE INTO YOUR EXISTING APP:

1. Copy the MAPBOX_ACCESS_TOKEN and imports to the top of app.py

2. Add the professional routing functions anywhere in your app.py

3. In your existing routing section, replace the route calculation with:
   route_data, traffic_comparison = calculate_professional_route(origin, destination)

4. Replace your route display with:
   display_professional_route_analysis(route_data, traffic_comparison)

5. Replace your map with:
   professional_map = create_professional_mapbox_map(route_data)

6. Or add the complete demo section:
   demo_professional_routing_section()

🏆 RESULT: Enterprise-grade routing with real-time traffic, Ghana economic analysis, 
and professional visualization that will dominate the hackathon!
""" 