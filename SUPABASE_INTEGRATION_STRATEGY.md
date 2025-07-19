# 🗄️ AURA Supabase Integration Strategy

## **Overview: Unified Backend Architecture**

Supabase will serve as the **unified backend infrastructure** for both the AURA Command Center and Mobile Commuter App, providing real-time database capabilities, authentication, file storage, and serverless functions.

---

## **🏗️ Architecture Overview**

### **Supabase Services Integration**

```typescript
// Core Supabase Services
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                     │
├─────────────────────────────────────────────────────────┤
│ PostgreSQL Database  │ Real-time Engine │ Auth Service │
│ Edge Functions      │ Storage Service  │ API Gateway  │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────┐                    ┌─────────────────┐
│  AURA Command    │◄──────────────────►│  Mobile Client  │
│     Center       │                    │      App        │
│  (Web Dashboard) │                    │ (React Native)  │
└──────────────────┘                    └─────────────────┘
```

### **Data Flow Architecture**

```typescript
// Real-time Data Synchronization
Command Center ──► Supabase ──► Mobile App
      ▲                │              ▼
      │                ▼              │
   Admin Users    Real-time DB    Commuters
      │                │              │
      └────────────────┼──────────────┘
                  Live Updates
```

---

## **📊 Database Schema Design**

### **Core Tables Structure**

#### **1. Users & Authentication**
```sql
-- Users table (managed by Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  role user_role_enum,
  department TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles enum
CREATE TYPE user_role_enum AS ENUM (
  'super_admin', 'admin', 'fleet_manager', 
  'dispatcher', 'analyst', 'maintenance', 
  'driver', 'commuter', 'viewer'
);
```

#### **2. Transport Infrastructure**
```sql
-- Routes table
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_location JSONB, -- {lat, lng, name}
  end_location JSONB,
  waypoints JSONB[], -- Array of {lat, lng, name}
  distance_km DECIMAL,
  estimated_duration_minutes INTEGER,
  fare_amount DECIMAL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT,
  capacity INTEGER,
  driver_id UUID REFERENCES profiles(id),
  route_id UUID REFERENCES routes(id),
  status vehicle_status_enum DEFAULT 'inactive',
  last_maintenance DATE,
  next_maintenance DATE,
  health_score INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE vehicle_status_enum AS ENUM (
  'active', 'inactive', 'maintenance', 'breakdown'
);
```

#### **3. Real-time Tracking**
```sql
-- Vehicle locations (real-time updates)
CREATE TABLE vehicle_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  heading DECIMAL, -- Direction in degrees
  speed_kmh DECIMAL,
  passenger_count INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_vehicle_locations_vehicle_id (vehicle_id),
  INDEX idx_vehicle_locations_timestamp (timestamp)
);

-- Trip tracking
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  route_id UUID REFERENCES routes(id),
  driver_id UUID REFERENCES profiles(id),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  start_location JSONB,
  end_location JSONB,
  passenger_count INTEGER,
  fare_collected DECIMAL,
  fuel_consumed DECIMAL,
  status trip_status_enum DEFAULT 'planned'
);

CREATE TYPE trip_status_enum AS ENUM (
  'planned', 'in_progress', 'completed', 'cancelled'
);
```

#### **4. Predictive Maintenance**
```sql
-- Vehicle sensor data
CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  sensor_data JSONB, -- All sensor readings as JSON
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Partitioned by date for performance
  PARTITION BY RANGE (timestamp)
);

-- Maintenance predictions
CREATE TABLE maintenance_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  component TEXT,
  risk_level risk_level_enum,
  days_until_failure INTEGER,
  confidence_score DECIMAL,
  estimated_cost DECIMAL,
  recommended_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE risk_level_enum AS ENUM ('low', 'medium', 'high', 'critical');
```

#### **5. Traffic & Route Optimization**
```sql
-- Traffic conditions
CREATE TABLE traffic_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_segment_id TEXT,
  congestion_level DECIMAL, -- 0-1 scale
  average_speed_kmh DECIMAL,
  travel_time_minutes DECIMAL,
  incidents JSONB[], -- Array of incident objects
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Route optimizations
CREATE TABLE route_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_route_id UUID REFERENCES routes(id),
  optimized_waypoints JSONB[],
  optimization_type TEXT, -- 'time', 'cost', 'fuel', 'co2'
  savings_percentage DECIMAL,
  confidence_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **6. Community Features**
```sql
-- User reports and feedback
CREATE TABLE community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id),
  report_type report_type_enum,
  location JSONB, -- {lat, lng}
  description TEXT,
  severity severity_enum,
  status report_status_enum DEFAULT 'open',
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE report_type_enum AS ENUM (
  'traffic_jam', 'accident', 'breakdown', 'safety_concern', 
  'route_change', 'fare_dispute', 'vehicle_full'
);

CREATE TYPE severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE report_status_enum AS ENUM ('open', 'verified', 'resolved', 'dismissed');
```

---

## **🔐 Row Level Security (RLS) Policies**

### **User Data Protection**
```sql
-- Profiles: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin users can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );
```

### **Vehicle & Route Access Control**
```sql
-- Drivers can only see their assigned vehicles
CREATE POLICY "Drivers see assigned vehicles" ON vehicles
  FOR SELECT USING (
    driver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'fleet_manager', 'dispatcher')
    )
  );

-- Public routes are visible to all authenticated users
CREATE POLICY "Authenticated users see active routes" ON routes
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');
```

### **Real-time Data Security**
```sql
-- Vehicle locations: Drivers and fleet managers only
CREATE POLICY "Vehicle location access" ON vehicle_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN profiles p ON p.id = auth.uid()
      WHERE v.id = vehicle_locations.vehicle_id
      AND (v.driver_id = auth.uid() OR p.role IN ('admin', 'fleet_manager', 'dispatcher'))
    )
  );
```

---

## **⚡ Real-time Subscriptions**

### **Command Center Real-time Updates**
```typescript
// Vehicle tracking subscription
const vehicleSubscription = supabase
  .channel('vehicle-tracking')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'vehicle_locations'
  }, (payload) => {
    updateVehiclePosition(payload.new)
  })
  .subscribe()

// Traffic conditions subscription
const trafficSubscription = supabase
  .channel('traffic-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'traffic_conditions'
  }, (payload) => {
    updateTrafficDisplay(payload.new)
  })
  .subscribe()
```

### **Mobile App Real-time Features**
```typescript
// Personal trip updates
const tripSubscription = supabase
  .channel(`user-trips-${userId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'trips',
    filter: `driver_id=eq.${userId}`
  }, (payload) => {
    updateTripStatus(payload.new)
  })
  .subscribe()

// Community reports subscription
const communitySubscription = supabase
  .channel('community-reports')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'community_reports'
  }, (payload) => {
    showNewCommunityReport(payload.new)
  })
  .subscribe()
```

---

## **🔧 Edge Functions for ML Processing**

### **Route Optimization Function**
```typescript
// supabase/functions/optimize-route/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { route_id, optimization_type, constraints } = await req.json()
  
  // Fetch route data
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Run genetic algorithm optimization
  const optimizedRoute = await runGeneticOptimization(route_id, optimization_type)
  
  // Store results
  await supabase.from('route_optimizations').insert({
    original_route_id: route_id,
    optimized_waypoints: optimizedRoute.waypoints,
    optimization_type,
    savings_percentage: optimizedRoute.savings,
    confidence_score: optimizedRoute.confidence
  })
  
  return new Response(JSON.stringify(optimizedRoute), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### **Predictive Maintenance Function**
```typescript
// supabase/functions/predict-maintenance/index.ts
serve(async (req) => {
  const { vehicle_id, sensor_data } = await req.json()
  
  // Run ML prediction models
  const predictions = await runMaintenancePrediction(sensor_data)
  
  // Store predictions
  await supabase.from('maintenance_predictions').insert(
    predictions.map(pred => ({
      vehicle_id,
      component: pred.component,
      risk_level: pred.riskLevel,
      days_until_failure: pred.daysUntilFailure,
      confidence_score: pred.confidence,
      estimated_cost: pred.estimatedCost,
      recommended_action: pred.recommendedAction
    }))
  )
  
  return new Response(JSON.stringify(predictions))
})
```

---

## **📱 Mobile Client Integration**

### **Supabase SDK Setup**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### **Real-time Vehicle Tracking**
```typescript
// src/hooks/useVehicleTracking.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const useVehicleTracking = (routeId: string) => {
  const [vehicles, setVehicles] = useState([])
  
  useEffect(() => {
    // Subscribe to vehicle location updates
    const subscription = supabase
      .channel(`route-vehicles-${routeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vehicle_locations',
        filter: `vehicle_id=in.(${vehicleIds.join(',')})`
      }, (payload) => {
        setVehicles(prev => updateVehicleLocation(prev, payload.new))
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [routeId])
  
  return vehicles
}
```

---

## **🌐 Command Center Integration**

### **Real-time Dashboard Updates**
```typescript
// src/hooks/useSupabaseRealtime.ts
import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { supabase } from '@/lib/supabase'

export const useSupabaseRealtime = () => {
  const { setVehicles, setTrafficData, setAlerts } = useStore()
  
  useEffect(() => {
    // Vehicle updates
    const vehicleChannel = supabase
      .channel('dashboard-vehicles')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vehicle_locations'
      }, (payload) => {
        setVehicles(prev => updateVehicleInList(prev, payload.new))
      })
      .subscribe()
    
    // Traffic updates
    const trafficChannel = supabase
      .channel('dashboard-traffic')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'traffic_conditions'
      }, (payload) => {
        setTrafficData(prev => [...prev, payload.new])
      })
      .subscribe()
    
    return () => {
      vehicleChannel.unsubscribe()
      trafficChannel.unsubscribe()
    }
  }, [])
}
```

---

## **🔄 Migration Strategy**

### **Phase 1: Database Setup** (2 days)
1. **Schema Creation:** Implement all tables and relationships
2. **RLS Policies:** Configure security policies
3. **Indexes:** Optimize for performance
4. **Seed Data:** Import existing transport data

### **Phase 2: Authentication Migration** (1 day)
1. **Supabase Auth Setup:** Configure authentication
2. **User Migration:** Transfer existing users
3. **Role Mapping:** Map existing roles to new system
4. **Session Management:** Update session handling

### **Phase 3: Real-time Integration** (2 days)
1. **Command Center:** Replace WebSocket with Supabase subscriptions
2. **Mobile App:** Implement real-time features
3. **Data Sync:** Ensure data consistency
4. **Performance Testing:** Validate real-time performance

### **Phase 4: Edge Functions** (2 days)
1. **ML Functions:** Deploy prediction models
2. **Optimization Functions:** Route and maintenance algorithms
3. **API Gateway:** Replace existing API endpoints
4. **Monitoring:** Set up function monitoring

---

## **📊 Benefits of Supabase Integration**

### **Technical Advantages**
- **Real-time by Default:** Built-in real-time subscriptions
- **Scalable Architecture:** Auto-scaling PostgreSQL
- **Security First:** Row Level Security and Auth
- **Serverless Functions:** Edge Functions for ML processing
- **Global CDN:** Fast content delivery worldwide

### **Development Benefits**
- **Unified Backend:** Single source of truth for both apps
- **Reduced Complexity:** Less backend code to maintain
- **Built-in Features:** Auth, storage, real-time out of the box
- **Developer Experience:** Excellent tooling and documentation
- **Cost Effective:** Pay-as-you-scale pricing model

### **Business Impact**
- **Faster Development:** Accelerated feature delivery
- **Better Performance:** Optimized for real-time applications
- **Enhanced Security:** Enterprise-grade security features
- **Global Scale:** Ready for international expansion
- **Reduced Costs:** Lower infrastructure and maintenance costs

---

**Supabase Integration Timeline:** 7-8 days  
**Estimated Effort:** 1-2 developers  
**Impact:** 🚀 Unified, scalable, real-time backend architecture  
**Benefits:** Faster development, better performance, enhanced security
