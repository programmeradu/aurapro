"""
🎨 PROFESSIONAL MAPBOX FRONTEND INTEGRATION
Enterprise-grade routing visualization for Aura Command Pro
"""

import streamlit as st
import folium
import plotly.graph_objects as go
import plotly.express as px
from typing import Dict, List, Tuple
import json
import requests
import pandas as pd

# Import our professional routing engine
try:
    from backend.mapbox_routing import MapboxRoutingPro, RouteVisualizer, RouteMetrics
except ImportError:
    st.error("❌ MapboxRoutingPro not available. Please ensure backend is properly configured.")
    MapboxRoutingPro = None

class MapboxFrontendPro:
    """
    🏆 PROFESSIONAL MAPBOX FRONTEND INTEGRATION
    Enterprise-grade routing visualization and interaction
    """
    
    def __init__(self, mapbox_token: str):
        self.mapbox_token = mapbox_token
        if MapboxRoutingPro:
            self.routing_engine = MapboxRoutingPro(mapbox_token)
        else:
            self.routing_engine = None
        
        # Ghana/Accra coordinates
        self.accra_center = (-0.1969, 5.6037)
        self.ghana_bounds = [(-3.25, 4.74), (1.19, 11.17)]
        
        # Professional color scheme
        self.colors = {
            'primary': '#FFD700',      # Gold
            'secondary': '#4A90E2',    # Blue  
            'success': '#50C878',      # Green
            'warning': '#FF6B6B',      # Red
            'dark': '#2C3E50',         # Dark blue
            'light': '#ECF0F1'         # Light gray
        }
    
    def render_professional_routing_interface(self):
        """
        🎯 Main professional routing interface
        """
        st.markdown("""
        <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    padding: 2rem; border-radius: 15px; margin-bottom: 2rem;'>
            <h1 style='color: white; text-align: center; margin: 0;'>
                🚀 Aura Professional Routing Engine
            </h1>
            <p style='color: rgba(255,255,255,0.9); text-align: center; margin: 0.5rem 0 0 0;'>
                Enterprise-grade routing with real-time Accra traffic integration
            </p>
        </div>
        """, unsafe_allow_html=True)
        
        if not self.routing_engine:
            self._render_setup_instructions()
            return
        
        # Professional control panel
        with st.container():
            col1, col2, col3 = st.columns([2, 2, 1])
            
            with col1:
                st.markdown("### 📍 Route Planning")
                self._render_route_input_panel()
            
            with col2:
                st.markdown("### ⚙️ Advanced Options")
                self._render_advanced_options_panel()
            
            with col3:
                st.markdown("### 🚀 Actions")
                self._render_action_buttons()
        
        # Professional results display
        if st.session_state.get('show_route_results'):
            self._render_professional_results()
    
    def _render_route_input_panel(self):
        """Professional route input interface"""
        
        # Quick preset locations for Accra
        preset_locations = {
            "Kotoka Airport": (-0.1719, 5.6052),
            "Accra Mall": (-0.1769, 5.6456),
            "Kaneshie Market": (-0.2370, 5.5755),
            "37 Station": (-0.1445, 5.5781),
            "Legon University": (-0.1816, 5.6494),
            "Tema Station": (-0.1445, 5.5781),
            "Circle": (-0.2074, 5.5641),
            "Adabraka": (-0.2074, 5.5641)
        }
        
        # Origin selection
        origin_method = st.radio("Origin Selection:", 
                                ["🎯 Preset Location", "📍 Custom Coordinates"],
                                horizontal=True)
        
        if origin_method == "🎯 Preset Location":
            origin_name = st.selectbox("Select Origin:", list(preset_locations.keys()))
            origin_coords = preset_locations[origin_name]
        else:
            col1, col2 = st.columns(2)
            with col1:
                origin_lon = st.number_input("Origin Longitude:", value=-0.1969, step=0.0001, format="%.4f")
            with col2:
                origin_lat = st.number_input("Origin Latitude:", value=5.6037, step=0.0001, format="%.4f")
            origin_coords = (origin_lon, origin_lat)
        
        # Destination selection
        dest_method = st.radio("Destination Selection:", 
                              ["🎯 Preset Location", "📍 Custom Coordinates"],
                              horizontal=True, key="dest_method")
        
        if dest_method == "🎯 Preset Location":
            dest_name = st.selectbox("Select Destination:", list(preset_locations.keys()), index=1)
            dest_coords = preset_locations[dest_name]
        else:
            col1, col2 = st.columns(2)
            with col1:
                dest_lon = st.number_input("Destination Longitude:", value=-0.1769, step=0.0001, format="%.4f")
            with col2:
                dest_lat = st.number_input("Destination Latitude:", value=5.6456, step=0.0001, format="%.4f")
            dest_coords = (dest_lon, dest_lat)
        
        # Store in session state
        st.session_state['origin_coords'] = origin_coords
        st.session_state['dest_coords'] = dest_coords
    
    def _render_advanced_options_panel(self):
        """Advanced routing options"""
        
        # Routing profile
        profile = st.selectbox(
            "🚗 Routing Profile:",
            ["driving-traffic", "driving", "walking"],
            help="driving-traffic includes real-time Accra traffic data"
        )
        
        # Advanced features
        show_alternatives = st.checkbox("📊 Show Alternative Routes", value=True)
        include_traffic_analysis = st.checkbox("🚦 Include Traffic Analysis", value=True)
        ghana_economic_analysis = st.checkbox("💰 Ghana Economic Analysis", value=True)
        
        # Multi-stop routing
        enable_multi_stop = st.checkbox("🗺️ Multi-Stop Optimization")
        
        if enable_multi_stop:
            num_stops = st.slider("Number of Additional Stops:", 1, 5, 2)
            st.info("💡 Multi-stop optimization uses Mapbox's professional VRP solver")
        
        # Store settings
        st.session_state.update({
            'routing_profile': profile,
            'show_alternatives': show_alternatives,
            'include_traffic_analysis': include_traffic_analysis,
            'ghana_economic_analysis': ghana_economic_analysis,
            'enable_multi_stop': enable_multi_stop,
            'num_stops': num_stops if enable_multi_stop else 0
        })
    
    def _render_action_buttons(self):
        """Professional action buttons"""
        
        # Primary action
        if st.button("🚀 Calculate Professional Route", type="primary", use_container_width=True):
            self._calculate_professional_route()
        
        # Secondary actions
        if st.button("🌐 Traffic Comparison", use_container_width=True):
            self._generate_traffic_comparison()
        
        if st.button("📊 Route Analytics", use_container_width=True):
            self._generate_route_analytics()
        
        # Emergency actions
        with st.expander("🚨 Emergency Options"):
            if st.button("⚡ Quick Route", use_container_width=True):
                st.session_state['emergency_route'] = True
                self._calculate_professional_route()
            
            if st.button("🔄 Clear Results", use_container_width=True):
                self._clear_results()
    
    def _calculate_professional_route(self):
        """Calculate route using professional Mapbox engine"""
        
        with st.spinner("🔄 Calculating professional route with Mapbox..."):
            try:
                origin = st.session_state.get('origin_coords')
                destination = st.session_state.get('dest_coords')
                profile = st.session_state.get('routing_profile', 'driving-traffic')
                
                if not origin or not destination:
                    st.error("❌ Please select origin and destination")
                    return
                
                # Get professional route
                route_data = self.routing_engine.get_professional_route(
                    origin, destination, profile
                )
                
                # Get traffic comparison if requested
                traffic_comparison = None
                if st.session_state.get('include_traffic_analysis'):
                    traffic_comparison = self.routing_engine.get_traffic_aware_comparison(
                        origin, destination
                    )
                
                # Store results
                st.session_state.update({
                    'route_data': route_data,
                    'traffic_comparison': traffic_comparison,
                    'show_route_results': True,
                    'calculation_timestamp': pd.Timestamp.now()
                })
                
                st.success("✅ Professional route calculated successfully!")
                
            except Exception as e:
                st.error(f"❌ Route calculation failed: {str(e)}")
                st.info("🔄 Falling back to basic routing...")
    
    def _generate_traffic_comparison(self):
        """Generate comprehensive traffic comparison"""
        
        with st.spinner("🌐 Analyzing traffic conditions..."):
            try:
                origin = st.session_state.get('origin_coords')
                destination = st.session_state.get('dest_coords')
                
                comparison = self.routing_engine.get_traffic_aware_comparison(
                    origin, destination
                )
                
                st.session_state.update({
                    'traffic_comparison': comparison,
                    'show_traffic_results': True
                })
                
                st.success("✅ Traffic analysis completed!")
                
            except Exception as e:
                st.error(f"❌ Traffic analysis failed: {str(e)}")
    
    def _render_professional_results(self):
        """Render comprehensive professional results"""
        
        route_data = st.session_state.get('route_data')
        traffic_comparison = st.session_state.get('traffic_comparison')
        
        if not route_data:
            return
        
        st.markdown("---")
        st.markdown("## 📊 Professional Route Analysis")
        
        # Main route metrics
        if route_data.get('routes'):
            main_route = route_data['routes'][0]
            self._render_route_metrics_card(main_route)
        
        # Professional map visualization
        self._render_professional_map(route_data, traffic_comparison)
        
        # Detailed analytics
        col1, col2 = st.columns(2)
        
        with col1:
            if traffic_comparison:
                self._render_traffic_analysis_card(traffic_comparison)
        
        with col2:
            if main_route.get('ghana_specific'):
                self._render_ghana_insights_card(main_route['ghana_specific'])
        
        # Professional charts
        self._render_professional_charts(route_data, traffic_comparison)
    
    def _render_route_metrics_card(self, route: Dict):
        """Professional route metrics display"""
        
        metrics = route.get('professional_metrics', {})
        
        # Create metrics columns
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                label="🚗 Distance",
                value=f"{route.get('distance', 0)/1000:.1f} km",
                delta=None
            )
        
        with col2:
            st.metric(
                label="⏱️ Duration", 
                value=f"{route.get('duration', 0)/60:.0f} min",
                delta=f"+{metrics.get('traffic_delay', 0)/60:.0f} min traffic" if metrics.get('traffic_delay') > 0 else None
            )
        
        with col3:
            st.metric(
                label="💰 Fuel Cost",
                value=f"GH₵ {metrics.get('fuel_cost', 0):.2f}",
                delta=None
            )
        
        with col4:
            st.metric(
                label="📈 Efficiency",
                value=f"{metrics.get('efficiency_score', 0):.0f}%",
                delta=None
            )
    
    def _render_professional_map(self, route_data: Dict, traffic_comparison: Dict = None):
        """Render professional map with routes"""
        
        st.markdown("### 🗺️ Professional Route Visualization")
        
        # Create base map
        m = folium.Map(
            location=[self.accra_center[1], self.accra_center[0]],
            zoom_start=12,
            tiles=None
        )
        
        # Add Mapbox tiles (if token available)
        folium.TileLayer(
            tiles=f"https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{{z}}/{{x}}/{{y}}?access_token={self.mapbox_token}",
            attr="Mapbox",
            name="Mapbox Streets",
            overlay=False,
            control=True
        ).add_to(m)
        
        # Add routes
        if route_data.get('routes'):
            for i, route in enumerate(route_data['routes']):
                self._add_route_to_map(m, route, i == 0)
        
        # Add traffic comparison routes if available
        if traffic_comparison:
            self._add_traffic_routes_to_map(m, traffic_comparison)
        
        # Add markers
        self._add_route_markers(m)
        
        # Display map
        st.components.v1.html(m._repr_html_(), height=500)
    
    def _add_route_to_map(self, map_obj, route: Dict, is_primary: bool = True):
        """Add professional route to map"""
        
        if not route.get('geometry'):
            return
        
        coords = route['geometry']['coordinates']
        
        # Convert to lat, lon format for Folium
        folium_coords = [[lat, lon] for lon, lat in coords]
        
        # Professional styling
        color = self.colors['primary'] if is_primary else self.colors['secondary']
        weight = 8 if is_primary else 6
        opacity = 0.9 if is_primary else 0.7
        
        folium.PolyLine(
            locations=folium_coords,
            color=color,
            weight=weight,
            opacity=opacity,
            popup=self._create_route_popup(route)
        ).add_to(map_obj)
    
    def _add_traffic_routes_to_map(self, map_obj, traffic_comparison: Dict):
        """Add traffic comparison routes"""
        
        for route_type, route_info in traffic_comparison.items():
            if route_type == 'traffic_analysis':
                continue
            
            if route_info.get('geometry'):
                coords = route_info['geometry']['coordinates']
                folium_coords = [[lat, lon] for lon, lat in coords]
                
                # Color coding for different route types
                colors = {
                    'with_traffic': '#FF6B6B',
                    'without_traffic': '#4A90E2', 
                    'walking': '#50C878'
                }
                
                folium.PolyLine(
                    locations=folium_coords,
                    color=colors.get(route_type, '#888888'),
                    weight=5,
                    opacity=0.7,
                    popup=f"{route_type.replace('_', ' ').title()}: {route_info.get('duration_minutes', 0):.0f} min"
                ).add_to(map_obj)
    
    def _add_route_markers(self, map_obj):
        """Add professional route markers"""
        
        origin = st.session_state.get('origin_coords')
        destination = st.session_state.get('dest_coords')
        
        if origin:
            folium.Marker(
                location=[origin[1], origin[0]],
                popup="🎯 Origin",
                icon=folium.Icon(color='green', icon='play')
            ).add_to(map_obj)
        
        if destination:
            folium.Marker(
                location=[destination[1], destination[0]],
                popup="🏁 Destination", 
                icon=folium.Icon(color='red', icon='stop')
            ).add_to(map_obj)
    
    def _create_route_popup(self, route: Dict) -> str:
        """Create professional route popup"""
        
        metrics = route.get('professional_metrics', {})
        
        return f"""
        <div style='width: 200px;'>
            <h4>📊 Route Details</h4>
            <p><strong>Distance:</strong> {route.get('distance', 0)/1000:.1f} km</p>
            <p><strong>Duration:</strong> {route.get('duration', 0)/60:.0f} minutes</p>
            <p><strong>Fuel Cost:</strong> GH₵ {metrics.get('fuel_cost', 0):.2f}</p>
            <p><strong>Efficiency:</strong> {metrics.get('efficiency_score', 0):.0f}%</p>
        </div>
        """
    
    def _render_traffic_analysis_card(self, traffic_comparison: Dict):
        """Render traffic analysis card"""
        
        st.markdown("#### 🚦 Traffic Analysis")
        
        traffic_analysis = traffic_comparison.get('traffic_analysis', {})
        
        if traffic_analysis:
            st.markdown(f"""
            **Traffic Delay:** {traffic_analysis.get('delay_minutes', 0):.1f} minutes  
            **Severity:** {traffic_analysis.get('traffic_severity', 'Unknown')}  
            **Recommendation:** {traffic_analysis.get('recommendation', 'No recommendation')}
            """)
        
        # Traffic comparison chart
        if 'with_traffic' in traffic_comparison and 'without_traffic' in traffic_comparison:
            self._render_traffic_comparison_chart(traffic_comparison)
    
    def _render_ghana_insights_card(self, ghana_insights: Dict):
        """Render Ghana-specific insights"""
        
        st.markdown("#### 🇬🇭 Ghana Insights")
        
        st.markdown(f"""
        **Tro-tro Fare:** GH₵ {ghana_insights.get('tro_tro_fare_estimate', 0):.2f}  
        **Journey Type:** {ghana_insights.get('journey_classification', 'Unknown')}  
        **Peak Hour Impact:** {ghana_insights.get('peak_hour_impact', {}).get('traffic_level', 'Unknown')}
        """)
        
        # Economic breakdown chart
        fuel_cost = ghana_insights.get('fuel_cost_ghs', 0)
        tro_tro_fare = ghana_insights.get('tro_tro_fare_estimate', 0)
        
        fig = go.Figure(data=[
            go.Bar(x=['Fuel Cost', 'Tro-tro Fare'], 
                  y=[fuel_cost, tro_tro_fare],
                  marker_color=[self.colors['warning'], self.colors['success']])
        ])
        fig.update_layout(title="Cost Comparison (GH₵)", height=250)
        st.plotly_chart(fig, use_container_width=True)
    
    def _render_traffic_comparison_chart(self, traffic_comparison: Dict):
        """Render traffic comparison chart"""
        
        data = []
        for route_type, route_info in traffic_comparison.items():
            if route_type != 'traffic_analysis':
                data.append({
                    'Route Type': route_type.replace('_', ' ').title(),
                    'Duration (min)': route_info.get('duration_minutes', 0),
                    'Distance (km)': route_info.get('distance_km', 0)
                })
        
        if data:
            df = pd.DataFrame(data)
            
            fig = px.bar(df, x='Route Type', y='Duration (min)', 
                        color='Route Type',
                        title="Route Comparison")
            st.plotly_chart(fig, use_container_width=True)
    
    def _render_professional_charts(self, route_data: Dict, traffic_comparison: Dict):
        """Render comprehensive professional charts"""
        
        st.markdown("### 📈 Advanced Analytics")
        
        col1, col2 = st.columns(2)
        
        with col1:
            self._render_efficiency_radar_chart(route_data)
        
        with col2:
            self._render_cost_breakdown_chart(route_data)
    
    def _render_efficiency_radar_chart(self, route_data: Dict):
        """Render efficiency radar chart"""
        
        if not route_data.get('routes'):
            return
        
        route = route_data['routes'][0]
        metrics = route.get('professional_metrics', {})
        
        categories = ['Speed', 'Efficiency', 'Cost-Effectiveness', 'Sustainability', 'Reliability']
        values = [
            min(100, (route.get('distance', 0) / route.get('duration', 1)) * 3.6 * 2),  # Speed score
            metrics.get('efficiency_score', 0),
            max(0, 100 - metrics.get('fuel_cost', 0) * 10),  # Cost score (inverse)
            max(0, 100 - metrics.get('co2_emissions', 0) * 20),  # Sustainability score
            85  # Reliability score (based on Mapbox quality)
        ]
        
        fig = go.Figure()
        fig.add_trace(go.Scatterpolar(
            r=values,
            theta=categories,
            fill='toself',
            name='Route Performance',
            line_color=self.colors['primary']
        ))
        
        fig.update_layout(
            polar=dict(
                radialaxis=dict(visible=True, range=[0, 100])
            ),
            title="Route Performance Analysis",
            height=350
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    def _render_cost_breakdown_chart(self, route_data: Dict):
        """Render cost breakdown chart"""
        
        if not route_data.get('routes'):
            return
        
        route = route_data['routes'][0]
        metrics = route.get('professional_metrics', {})
        ghana_insights = route.get('ghana_specific', {})
        
        # Cost components
        fuel_cost = metrics.get('fuel_cost', 0)
        time_cost = (route.get('duration', 0) / 3600) * 20  # GH₵ 20/hour time value
        wear_cost = (route.get('distance', 0) / 1000) * 0.5  # GH₵ 0.5/km vehicle wear
        
        labels = ['Fuel Cost', 'Time Cost', 'Vehicle Wear']
        values = [fuel_cost, time_cost, wear_cost]
        
        fig = go.Figure(data=[go.Pie(labels=labels, values=values, hole=.3)])
        fig.update_layout(title="Total Journey Cost Breakdown", height=350)
        
        st.plotly_chart(fig, use_container_width=True)
    
    def _render_setup_instructions(self):
        """Render setup instructions when routing engine not available"""
        
        st.warning("⚠️ Professional Mapbox routing not configured")
        
        with st.expander("🔧 Setup Instructions"):
            st.markdown("""
            ## Setup Professional Mapbox Routing:
            
            1. **Get Mapbox Access Token:**
               - Sign up at [mapbox.com](https://mapbox.com)
               - Go to your account dashboard
               - Copy your access token
            
            2. **Configure Environment:**
               ```bash
               export MAPBOX_ACCESS_TOKEN="your_token_here"
               ```
            
            3. **Install Dependencies:**
               ```bash
               pip install requests numpy
               ```
            
            4. **Restart Application**
            
            ✅ **Once configured, you'll have access to:**
            - 🚗 Real-time traffic routing
            - 📊 Professional analytics
            - 🌐 Multi-modal comparisons
            - 💰 Ghana economic analysis
            - 🎯 GPS trace matching
            - ⚡ Route optimization
            """)
    
    def _clear_results(self):
        """Clear all results"""
        
        keys_to_clear = [
            'route_data', 'traffic_comparison', 'show_route_results',
            'show_traffic_results', 'calculation_timestamp'
        ]
        
        for key in keys_to_clear:
            if key in st.session_state:
                del st.session_state[key]
        
        st.success("✅ Results cleared!")

# Usage example for integration
def integrate_mapbox_professional():
    """
    Integration function for main Streamlit app
    """
    
    # Get Mapbox token from environment or user input
    mapbox_token = st.secrets.get("MAPBOX_ACCESS_TOKEN") or st.sidebar.text_input(
        "🔑 Mapbox Access Token:", 
        type="password",
        help="Get your token from mapbox.com"
    )
    
    if mapbox_token:
        # Initialize professional frontend
        mapbox_frontend = MapboxFrontendPro(mapbox_token)
        
        # Render professional interface
        mapbox_frontend.render_professional_routing_interface()
    else:
        st.info("🔑 Please provide your Mapbox access token to enable professional routing")

# Export main class
__all__ = ['MapboxFrontendPro', 'integrate_mapbox_professional'] 