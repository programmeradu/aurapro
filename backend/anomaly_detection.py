#!/usr/bin/env python3
"""
AURA Command Center - Anomaly Detection System
Phase 3: Advanced ML/AI Features Implementation

This module provides real-time anomaly detection for:
- Traffic pattern anomalies
- Demand fluctuation detection
- Route performance anomalies
- Economic indicator anomalies
- Ghana-specific pattern deviations
"""

import asyncio
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import logging
import json
from dataclasses import dataclass, asdict
from enum import Enum
import random
import math
from collections import deque

logger = logging.getLogger(__name__)

class AnomalyType(Enum):
    TRAFFIC_CONGESTION = "traffic_congestion"
    DEMAND_SPIKE = "demand_spike"
    DEMAND_DROP = "demand_drop"
    ROUTE_EFFICIENCY = "route_efficiency"
    FUEL_CONSUMPTION = "fuel_consumption"
    PASSENGER_BEHAVIOR = "passenger_behavior"
    ECONOMIC_INDICATOR = "economic_indicator"
    CULTURAL_DEVIATION = "cultural_deviation"

class SeverityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class AnomalyEvent:
    """Structure for detected anomaly events"""
    anomaly_id: str
    type: AnomalyType
    severity: SeverityLevel
    title: str
    description: str
    affected_routes: List[str]
    detected_at: datetime
    confidence: float
    baseline_value: float
    current_value: float
    deviation_percentage: float
    predicted_impact: Dict[str, Any]
    recommended_actions: List[str]
    ghana_context: Dict[str, Any]

@dataclass
class BaselineMetrics:
    """Structure for baseline metrics used in anomaly detection"""
    metric_name: str
    mean_value: float
    std_deviation: float
    min_value: float
    max_value: float
    sample_count: int
    last_updated: datetime

class AnomalyDetectionSystem:
    """Advanced anomaly detection system for transport network monitoring"""
    
    def __init__(self, window_size: int = 100):
        self.window_size = window_size
        self.baseline_metrics: Dict[str, BaselineMetrics] = {}
        self.historical_data: Dict[str, deque] = {}
        self.anomaly_threshold = 2.5  # Standard deviations
        self.is_running = False
        self.detected_anomalies: List[AnomalyEvent] = []
        
        # Initialize baseline metrics
        self._initialize_baselines()
        
        # Ghana-specific patterns
        self.ghana_patterns = self._load_ghana_patterns()
    
    def _initialize_baselines(self):
        """Initialize baseline metrics for key transport indicators"""
        baseline_configs = {
            "travel_time_circle_madina": {"mean": 35.0, "std": 8.0, "min": 20.0, "max": 60.0},
            "travel_time_kaneshie_tema": {"mean": 45.0, "std": 12.0, "min": 30.0, "max": 80.0},
            "passenger_demand_circle": {"mean": 150.0, "std": 30.0, "min": 50.0, "max": 300.0},
            "passenger_demand_kaneshie": {"mean": 120.0, "std": 25.0, "min": 40.0, "max": 250.0},
            "fuel_consumption_per_100km": {"mean": 12.0, "std": 2.0, "min": 8.0, "max": 18.0},
            "route_efficiency_score": {"mean": 0.75, "std": 0.15, "min": 0.3, "max": 1.0},
            "network_congestion_index": {"mean": 0.6, "std": 0.2, "min": 0.1, "max": 1.0},
            "passenger_satisfaction": {"mean": 78.0, "std": 12.0, "min": 40.0, "max": 100.0}
        }
        
        for metric_name, config in baseline_configs.items():
            self.baseline_metrics[metric_name] = BaselineMetrics(
                metric_name=metric_name,
                mean_value=config["mean"],
                std_deviation=config["std"],
                min_value=config["min"],
                max_value=config["max"],
                sample_count=100,  # Simulated historical data
                last_updated=datetime.now()
            )
            
            # Initialize historical data deque
            self.historical_data[metric_name] = deque(maxlen=self.window_size)
    
    def _load_ghana_patterns(self) -> Dict:
        """Load Ghana-specific patterns for anomaly detection"""
        return {
            "market_day_multipliers": {
                "monday": {"demand": 1.4, "congestion": 1.3},
                "thursday": {"demand": 1.3, "congestion": 1.2}
            },
            "prayer_time_effects": {
                "friday_afternoon": {"demand": 1.2, "route_changes": 0.8}
            },
            "seasonal_patterns": {
                "harmattan": {"visibility": 0.7, "travel_time": 1.1},
                "rainy_season": {"travel_time": 1.4, "demand": 0.8}
            },
            "cultural_events": {
                "homowo": {"demand_spike": 2.0, "route_disruption": 0.6},
                "independence_day": {"demand_drop": 0.3, "route_closure": 0.4}
            }
        }
    
    async def start_monitoring(self, data_callback=None):
        """Start the anomaly detection monitoring system"""
        self.is_running = True
        self.data_callback = data_callback
        logger.info("🔍 Starting Anomaly Detection System...")
        
        # Start monitoring tasks
        tasks = [
            self._monitor_traffic_patterns(),
            self._monitor_demand_patterns(),
            self._monitor_route_efficiency(),
            self._monitor_economic_indicators(),
            self._monitor_cultural_deviations()
        ]
        
        await asyncio.gather(*tasks)
    
    async def stop_monitoring(self):
        """Stop the anomaly detection system"""
        self.is_running = False
        logger.info("🛑 Stopping Anomaly Detection System...")
    
    def update_metric(self, metric_name: str, value: float, timestamp: datetime = None):
        """Update a metric and check for anomalies"""
        if timestamp is None:
            timestamp = datetime.now()
        
        # Add to historical data
        if metric_name not in self.historical_data:
            self.historical_data[metric_name] = deque(maxlen=self.window_size)
        
        self.historical_data[metric_name].append((timestamp, value))
        
        # Check for anomaly
        anomaly = self._detect_anomaly(metric_name, value, timestamp)
        if anomaly:
            self.detected_anomalies.append(anomaly)
            if self.data_callback:
                asyncio.create_task(self.data_callback("anomaly_detected", asdict(anomaly)))
        
        # Update baseline if enough data
        self._update_baseline(metric_name)
    
    def _detect_anomaly(self, metric_name: str, value: float, timestamp: datetime) -> Optional[AnomalyEvent]:
        """Detect if a metric value represents an anomaly"""
        if metric_name not in self.baseline_metrics:
            return None
        
        baseline = self.baseline_metrics[metric_name]
        
        # Calculate z-score
        z_score = abs(value - baseline.mean_value) / baseline.std_deviation
        
        # Check if anomaly
        if z_score > self.anomaly_threshold:
            # Determine severity
            if z_score > 4.0:
                severity = SeverityLevel.CRITICAL
            elif z_score > 3.5:
                severity = SeverityLevel.HIGH
            elif z_score > 3.0:
                severity = SeverityLevel.MEDIUM
            else:
                severity = SeverityLevel.LOW
            
            # Calculate deviation percentage
            deviation_pct = ((value - baseline.mean_value) / baseline.mean_value) * 100
            
            # Determine anomaly type and details
            anomaly_type, title, description, affected_routes = self._classify_anomaly(
                metric_name, value, baseline.mean_value, deviation_pct
            )
            
            # Generate recommendations
            recommendations = self._generate_recommendations(anomaly_type, metric_name, severity, deviation_pct)
            
            # Assess Ghana-specific context
            ghana_context = self._assess_ghana_context(metric_name, timestamp, value)
            
            return AnomalyEvent(
                anomaly_id=f"ANOM_{timestamp.strftime('%Y%m%d_%H%M%S')}_{metric_name}",
                type=anomaly_type,
                severity=severity,
                title=title,
                description=description,
                affected_routes=affected_routes,
                detected_at=timestamp,
                confidence=min(0.95, 0.6 + (z_score - 2.5) * 0.1),
                baseline_value=baseline.mean_value,
                current_value=value,
                deviation_percentage=deviation_pct,
                predicted_impact=self._predict_impact(anomaly_type, deviation_pct),
                recommended_actions=recommendations,
                ghana_context=ghana_context
            )
        
        return None
    
    def _classify_anomaly(self, metric_name: str, value: float, baseline: float, deviation_pct: float) -> Tuple[AnomalyType, str, str, List[str]]:
        """Classify the type of anomaly and generate description"""
        
        if "travel_time" in metric_name:
            if value > baseline:
                return (
                    AnomalyType.TRAFFIC_CONGESTION,
                    "Unusual Traffic Congestion Detected",
                    f"Travel time on {metric_name.replace('travel_time_', '').replace('_', ' to ')} route is {deviation_pct:.1f}% above normal, indicating severe congestion.",
                    [metric_name.replace('travel_time_', '').replace('_', ' to ')]
                )
            else:
                return (
                    AnomalyType.ROUTE_EFFICIENCY,
                    "Exceptional Route Performance",
                    f"Travel time on {metric_name.replace('travel_time_', '').replace('_', ' to ')} route is {abs(deviation_pct):.1f}% below normal, indicating improved efficiency.",
                    [metric_name.replace('travel_time_', '').replace('_', ' to ')]
                )
        
        elif "passenger_demand" in metric_name:
            location = metric_name.replace('passenger_demand_', '')
            if value > baseline:
                return (
                    AnomalyType.DEMAND_SPIKE,
                    f"Passenger Demand Surge at {location.title()}",
                    f"Passenger demand at {location} is {deviation_pct:.1f}% above normal levels, indicating potential service strain.",
                    [f"Routes serving {location}"]
                )
            else:
                return (
                    AnomalyType.DEMAND_DROP,
                    f"Passenger Demand Drop at {location.title()}",
                    f"Passenger demand at {location} is {abs(deviation_pct):.1f}% below normal levels, indicating potential service disruption or external factors.",
                    [f"Routes serving {location}"]
                )
        
        elif "fuel_consumption" in metric_name:
            return (
                AnomalyType.FUEL_CONSUMPTION,
                "Fuel Consumption Anomaly",
                f"Fuel consumption is {deviation_pct:.1f}% {'above' if value > baseline else 'below'} normal levels.",
                ["All routes"]
            )
        
        elif "efficiency" in metric_name:
            return (
                AnomalyType.ROUTE_EFFICIENCY,
                "Route Efficiency Anomaly",
                f"Route efficiency is {deviation_pct:.1f}% {'below' if value < baseline else 'above'} normal performance.",
                ["Network-wide"]
            )
        
        # Default classification
        return (
            AnomalyType.PASSENGER_BEHAVIOR,
            "System Anomaly Detected",
            f"Unusual pattern detected in {metric_name} with {deviation_pct:.1f}% deviation from baseline.",
            ["Multiple routes"]
        )
    
    def _generate_recommendations(self, anomaly_type: AnomalyType, metric_name: str, severity: SeverityLevel, deviation_pct: float) -> List[str]:
        """Generate actionable recommendations based on anomaly type"""
        
        recommendations = []
        
        if anomaly_type == AnomalyType.TRAFFIC_CONGESTION:
            recommendations = [
                "Deploy additional vehicles to affected routes",
                "Activate alternative route recommendations",
                "Implement dynamic pricing to manage demand",
                "Coordinate with traffic authorities for signal optimization"
            ]
            if severity in [SeverityLevel.HIGH, SeverityLevel.CRITICAL]:
                recommendations.append("Consider emergency route diversions")
        
        elif anomaly_type == AnomalyType.DEMAND_SPIKE:
            recommendations = [
                "Increase vehicle frequency on affected routes",
                "Deploy standby vehicles from nearby depots",
                "Implement surge pricing if applicable",
                "Monitor passenger wait times closely"
            ]
        
        elif anomaly_type == AnomalyType.DEMAND_DROP:
            recommendations = [
                "Investigate potential service disruptions",
                "Check for competing transport options",
                "Reduce vehicle frequency to optimize costs",
                "Conduct passenger feedback survey"
            ]
        
        elif anomaly_type == AnomalyType.FUEL_CONSUMPTION:
            recommendations = [
                "Review driver behavior and training needs",
                "Check vehicle maintenance status",
                "Analyze route optimization effectiveness",
                "Consider fuel-efficient driving incentives"
            ]
        
        elif anomaly_type == AnomalyType.ROUTE_EFFICIENCY:
            if deviation_pct < 0:  # Improved efficiency
                recommendations = [
                    "Document and replicate successful practices",
                    "Analyze factors contributing to improvement",
                    "Consider expanding optimization to other routes"
                ]
            else:  # Decreased efficiency
                recommendations = [
                    "Review route optimization parameters",
                    "Check for infrastructure changes or obstacles",
                    "Analyze driver performance and training needs"
                ]
        
        return recommendations
    
    def _predict_impact(self, anomaly_type: AnomalyType, deviation_pct: float) -> Dict[str, Any]:
        """Predict the impact of the detected anomaly"""
        
        impact = {}
        
        if anomaly_type == AnomalyType.TRAFFIC_CONGESTION:
            impact = {
                "passenger_delay": f"+{abs(deviation_pct) * 0.3:.1f} minutes average",
                "fuel_cost_increase": f"+GH₵{abs(deviation_pct) * 0.5:.1f} per vehicle",
                "passenger_satisfaction": f"-{abs(deviation_pct) * 0.2:.1f}%",
                "revenue_impact": f"-GH₵{abs(deviation_pct) * 2:.1f} per hour"
            }
        
        elif anomaly_type == AnomalyType.DEMAND_SPIKE:
            impact = {
                "additional_passengers": f"+{abs(deviation_pct) * 1.5:.0f} per hour",
                "revenue_opportunity": f"+GH₵{abs(deviation_pct) * 3:.1f} per hour",
                "service_strain": f"{min(100, abs(deviation_pct) * 0.8):.1f}% capacity utilization",
                "wait_time_increase": f"+{abs(deviation_pct) * 0.2:.1f} minutes"
            }
        
        elif anomaly_type == AnomalyType.FUEL_CONSUMPTION:
            impact = {
                "daily_cost_change": f"{'+'if deviation_pct > 0 else ''}GH₵{deviation_pct * 0.3:.1f} per vehicle",
                "monthly_projection": f"{'+'if deviation_pct > 0 else ''}GH₵{deviation_pct * 9:.1f} per vehicle",
                "environmental_impact": f"{'+'if deviation_pct > 0 else ''}{deviation_pct * 0.1:.1f}kg CO₂ per day"
            }
        
        return impact
    
    def _assess_ghana_context(self, metric_name: str, timestamp: datetime, value: float) -> Dict[str, Any]:
        """Assess Ghana-specific contextual factors"""
        
        context = {
            "market_day_factor": timestamp.weekday() in [0, 3],
            "prayer_time_factor": timestamp.weekday() == 4 and 12 <= timestamp.hour <= 14,
            "rush_hour_factor": timestamp.hour in [7, 8, 17, 18, 19],
            "seasonal_factor": "harmattan" if timestamp.month in [11, 12, 1] else "normal"
        }
        
        # Add specific contextual insights
        if context["market_day_factor"]:
            context["cultural_note"] = "Market day activity may be contributing to traffic patterns"
        
        if context["prayer_time_factor"]:
            context["cultural_note"] = "Friday prayer time may be affecting passenger demand"
        
        return context
    
    def _update_baseline(self, metric_name: str):
        """Update baseline metrics with new data"""
        if metric_name not in self.historical_data or len(self.historical_data[metric_name]) < 10:
            return
        
        # Get recent values
        recent_values = [value for _, value in list(self.historical_data[metric_name])[-50:]]
        
        if len(recent_values) >= 10:
            new_mean = np.mean(recent_values)
            new_std = np.std(recent_values)
            
            # Update baseline with exponential smoothing
            alpha = 0.1  # Smoothing factor
            baseline = self.baseline_metrics[metric_name]
            baseline.mean_value = alpha * new_mean + (1 - alpha) * baseline.mean_value
            baseline.std_deviation = alpha * new_std + (1 - alpha) * baseline.std_deviation
            baseline.last_updated = datetime.now()
    
    async def _monitor_traffic_patterns(self):
        """Monitor traffic patterns for anomalies"""
        while self.is_running:
            try:
                # Simulate traffic data collection
                routes = ["circle_madina", "kaneshie_tema", "achimota_osu"]
                
                for route in routes:
                    # Simulate travel time with realistic variations
                    base_time = {"circle_madina": 35, "kaneshie_tema": 45, "achimota_osu": 25}[route]
                    
                    # Add realistic noise and occasional anomalies
                    if random.random() < 0.05:  # 5% chance of anomaly
                        travel_time = base_time * random.uniform(1.5, 2.5)  # Significant delay
                    else:
                        travel_time = base_time * random.uniform(0.8, 1.3)  # Normal variation
                    
                    self.update_metric(f"travel_time_{route}", travel_time)
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error in traffic pattern monitoring: {e}")
                await asyncio.sleep(120)
    
    async def _monitor_demand_patterns(self):
        """Monitor passenger demand patterns for anomalies"""
        while self.is_running:
            try:
                locations = ["circle", "kaneshie", "madina", "tema"]
                
                for location in locations:
                    base_demand = {"circle": 150, "kaneshie": 120, "madina": 100, "tema": 80}[location]
                    
                    # Add time-of-day and day-of-week effects
                    now = datetime.now()
                    time_multiplier = 1.0
                    
                    if now.hour in [7, 8, 17, 18, 19]:  # Rush hours
                        time_multiplier *= 1.5
                    if now.weekday() in [0, 3]:  # Market days
                        time_multiplier *= 1.3
                    
                    # Occasional demand spikes
                    if random.random() < 0.03:  # 3% chance of spike
                        demand = base_demand * time_multiplier * random.uniform(2.0, 3.0)
                    else:
                        demand = base_demand * time_multiplier * random.uniform(0.7, 1.4)
                    
                    self.update_metric(f"passenger_demand_{location}", demand)
                
                await asyncio.sleep(120)  # Check every 2 minutes
                
            except Exception as e:
                logger.error(f"Error in demand pattern monitoring: {e}")
                await asyncio.sleep(180)
    
    async def _monitor_route_efficiency(self):
        """Monitor route efficiency metrics for anomalies"""
        while self.is_running:
            try:
                # Simulate efficiency monitoring
                efficiency = random.uniform(0.6, 0.95)
                
                # Occasional efficiency drops
                if random.random() < 0.02:  # 2% chance of significant drop
                    efficiency = random.uniform(0.3, 0.6)
                
                self.update_metric("route_efficiency_score", efficiency)
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in efficiency monitoring: {e}")
                await asyncio.sleep(300)
    
    async def _monitor_economic_indicators(self):
        """Monitor economic indicators for anomalies"""
        while self.is_running:
            try:
                # Simulate fuel consumption monitoring
                fuel_consumption = random.uniform(10, 15)
                
                # Occasional fuel consumption spikes
                if random.random() < 0.01:  # 1% chance of spike
                    fuel_consumption = random.uniform(16, 20)
                
                self.update_metric("fuel_consumption_per_100km", fuel_consumption)
                
                await asyncio.sleep(600)  # Check every 10 minutes
                
            except Exception as e:
                logger.error(f"Error in economic monitoring: {e}")
                await asyncio.sleep(600)
    
    async def _monitor_cultural_deviations(self):
        """Monitor for deviations from expected cultural patterns"""
        while self.is_running:
            try:
                # This would monitor for unexpected patterns during cultural events
                # For now, we'll simulate occasional cultural anomalies
                
                if random.random() < 0.005:  # 0.5% chance of cultural anomaly
                    # Simulate unexpected pattern during expected cultural event
                    anomaly = AnomalyEvent(
                        anomaly_id=f"CULT_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                        type=AnomalyType.CULTURAL_DEVIATION,
                        severity=SeverityLevel.MEDIUM,
                        title="Unexpected Cultural Pattern Deviation",
                        description="Traffic patterns deviate from expected cultural norms for this time period.",
                        affected_routes=["Multiple routes"],
                        detected_at=datetime.now(),
                        confidence=0.75,
                        baseline_value=1.0,
                        current_value=0.6,
                        deviation_percentage=-40.0,
                        predicted_impact={"cultural_event_impact": "Lower than expected participation"},
                        recommended_actions=["Investigate cultural event status", "Adjust service expectations"],
                        ghana_context={"cultural_calendar": "active", "community_feedback": "required"}
                    )
                    
                    self.detected_anomalies.append(anomaly)
                    if self.data_callback:
                        await self.data_callback("anomaly_detected", asdict(anomaly))
                
                await asyncio.sleep(1800)  # Check every 30 minutes
                
            except Exception as e:
                logger.error(f"Error in cultural monitoring: {e}")
                await asyncio.sleep(1800)
    
    def get_recent_anomalies(self, hours: int = 24) -> List[AnomalyEvent]:
        """Get anomalies detected in the last N hours"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        return [anomaly for anomaly in self.detected_anomalies if anomaly.detected_at >= cutoff_time]
    
    def get_anomaly_summary(self) -> Dict[str, Any]:
        """Get summary of anomaly detection status"""
        recent_anomalies = self.get_recent_anomalies(24)
        
        return {
            "total_anomalies_24h": len(recent_anomalies),
            "severity_breakdown": {
                "critical": len([a for a in recent_anomalies if a.severity == SeverityLevel.CRITICAL]),
                "high": len([a for a in recent_anomalies if a.severity == SeverityLevel.HIGH]),
                "medium": len([a for a in recent_anomalies if a.severity == SeverityLevel.MEDIUM]),
                "low": len([a for a in recent_anomalies if a.severity == SeverityLevel.LOW])
            },
            "type_breakdown": {
                anomaly_type.value: len([a for a in recent_anomalies if a.type == anomaly_type])
                for anomaly_type in AnomalyType
            },
            "monitoring_status": "active" if self.is_running else "inactive",
            "baseline_metrics_count": len(self.baseline_metrics),
            "last_update": datetime.now().isoformat()
        }

# Global instance
anomaly_detection_system = AnomalyDetectionSystem()

def get_anomaly_detection_system() -> AnomalyDetectionSystem:
    """Get the global anomaly detection system instance"""
    return anomaly_detection_system
