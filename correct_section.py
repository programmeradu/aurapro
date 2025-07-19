# Replace the section around line 1135-1145 in app.py with this:

        # Clear loading indicators
        progress_bar.empty()
        status_text.empty()
        
        try:
            response = requests.post(f"{BACKEND_URL}/api/v1/predict/ensemble", json={
                "num_stops": num_stops,
                "hour": hour,
                "day_of_week": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].index(day_of_week),
                "is_market_day": is_market_day
            })
            
            if response.status_code == 200:
                result = response.json()
                
                # Main prediction display with enhanced styling
                st.markdown(f"""
                <div class="victory-section" style="text-align: center; padding: 2rem; margin: 1rem 0;">
                    <h2 style="color: #48bb78; margin-bottom: 1rem;">🎯 Ensemble Prediction</h2>
                    <h1 style="color: #e2e8f0; font-size: 3rem; margin: 0;">{result['ensemble_prediction']:.1f} minutes</h1>
                    <p style="color: #a0aec0; margin-top: 0.5rem;">AI-powered travel time prediction</p>
                </div>
                """, unsafe_allow_html=True)
                
                # Individual model results with enhanced display
                st.markdown("### 📊 **Algorithm Performance Breakdown**")
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.metric("🌲 Random Forest", f"{result['random_forest']:.1f} min", 
                             delta=f"{result['random_forest'] - result['ensemble_prediction']:.1f} vs ensemble")
                with col2:
                    st.metric("🚀 XGBoost", f"{result['xgboost']:.1f} min",
                             delta=f"{result['xgboost'] - result['ensemble_prediction']:.1f} vs ensemble")
                with col3:
                    st.metric("🧠 Neural Network", f"{result['neural_network']:.1f} min",
                             delta=f"{result['neural_network'] - result['ensemble_prediction']:.1f} vs ensemble")
                
                # Advanced analytics
                st.markdown("### 🔬 **Advanced Analytics**")
                col1, col2 = st.columns(2)
                
                with col1:
                    st.info(f"📊 **Confidence Interval**\n{result['confidence_interval'][0]:.1f} - {result['confidence_interval'][1]:.1f} minutes")
                    st.info(f"🎯 **Model Agreement**: {result['model_agreement']}")
                
                with col2:
                    # Ghana context with enhanced display
                    if 'ghana_context' in result:
                        ghana = result['ghana_context']
                        st.warning(f"🚦 **Traffic Condition**: {ghana.get('traffic_condition', 'Normal')}")
                        
                        if ghana.get('ghana_factors'):
                            st.markdown("**🇬🇭 Cultural Factors:**")
                            for factor in ghana.get('ghana_factors', []):
                                st.write(f"• {factor}")
                        
                        if ghana.get('recommendations'):
                            st.markdown("**💡 AI Recommendations:**")
                            for rec in ghana.get('recommendations', []):
                                st.write(f"• {rec}")
                
                # Feature importance with visualization
                if 'top_features' in result:
                    st.markdown("### 🔍 **Top Contributing Factors**")
                    
                    # Create a simple bar chart for feature importance
                    features = [f[0] for f in result['top_features']]
                    importance = [f[1] for f in result['top_features']]
                    
                    import plotly.express as px
                    fig = px.bar(
                        x=importance, 
                        y=features, 
                        orientation='h',
                        title="Feature Importance in Prediction",
                        color=importance,
                        color_continuous_scale='viridis'
                    )
                    fig.update_layout(
                        plot_bgcolor='rgba(0,0,0,0)',
                        paper_bgcolor='rgba(0,0,0,0)',
                        font=dict(color='#e2e8f0'),
                        height=300
                    )
                    st.plotly_chart(fig, use_container_width=True)
            
            else:
                st.error(f"❌ API Error: {response.status_code}")
                
        except Exception as e:
            st.error(f"❌ Connection Error: {str(e)}")

# Note: The key is that 'try:' should have exactly 8 spaces (2 indentation levels)
# Make sure it aligns with the 'progress_bar.empty()' lines above it 