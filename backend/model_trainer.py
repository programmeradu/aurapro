# backend/model_trainer.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import joblib
import os
import sys
from datetime import datetime

def load_gtfs_data():
    """
    Loads GTFS data with proper path handling and validation.
    Returns loaded dataframes or None if failed.
    """
    # Try different possible paths for GTFS data
    possible_paths = [
        "../gtfs-accra-ghana-2016",  # From backend directory
        "gtfs-accra-ghana-2016",     # From project root
        "../../gtfs-accra-ghana-2016" # Alternative path
    ]
    
    gtfs_folder = None
    for path in possible_paths:
        if os.path.isdir(path):
            gtfs_folder = path
            print(f"✅ Found GTFS data at: {os.path.abspath(path)}")
            break
    
    if not gtfs_folder:
        print("❌ FATAL ERROR: GTFS data folder not found in any of these locations:")
        for path in possible_paths:
            print(f"   - {os.path.abspath(path)}")
        return None, None, None
    
    # Load required files with error handling
    try:
        print("📊 Loading GTFS data files...")
        
        stop_times_path = os.path.join(gtfs_folder, "stop_times.txt")
        trips_path = os.path.join(gtfs_folder, "trips.txt")
        routes_path = os.path.join(gtfs_folder, "routes.txt")
        
        # Validate files exist
        required_files = [stop_times_path, trips_path, routes_path]
        for file_path in required_files:
            if not os.path.exists(file_path):
                print(f"❌ Missing required file: {file_path}")
                return None, None, None
        
        # Load data with proper error handling
        stop_times_df = pd.read_csv(stop_times_path)
        trips_df = pd.read_csv(trips_path)
        routes_df = pd.read_csv(routes_path)
        
        print(f"✅ stop_times.txt: {len(stop_times_df)} records")
        print(f"✅ trips.txt: {len(trips_df)} records")
        print(f"✅ routes.txt: {len(routes_df)} records")
        
        return stop_times_df, trips_df, routes_df
        
    except Exception as e:
        print(f"❌ Error loading GTFS files: {str(e)}")
        return None, None, None

def validate_data(stop_times_df, trips_df, routes_df):
    """
    Validates the loaded GTFS data for quality and completeness.
    """
    print("🔍 Validating data quality...")
    
    issues = []
    
    # Check for required columns
    required_stop_times_cols = ['trip_id', 'arrival_time', 'departure_time', 'stop_sequence']
    required_trips_cols = ['trip_id', 'route_id']
    required_routes_cols = ['route_id', 'route_type']
    
    missing_cols = []
    for col in required_stop_times_cols:
        if col not in stop_times_df.columns:
            missing_cols.append(f"stop_times.{col}")
    
    for col in required_trips_cols:
        if col not in trips_df.columns:
            missing_cols.append(f"trips.{col}")
            
    for col in required_routes_cols:
        if col not in routes_df.columns:
            missing_cols.append(f"routes.{col}")
    
    if missing_cols:
        issues.append(f"Missing required columns: {', '.join(missing_cols)}")
    
    # Check data quality
    if stop_times_df['trip_id'].isnull().any():
        issues.append("Found null trip_ids in stop_times")
    
    if stop_times_df['arrival_time'].isnull().any():
        issues.append("Found null arrival_times in stop_times")
    
    # Check for data consistency
    common_trips = set(stop_times_df['trip_id'].unique()) & set(trips_df['trip_id'].unique())
    if len(common_trips) == 0:
        issues.append("No matching trip_ids between stop_times and trips data")
    
    if issues:
        print("⚠️ Data validation issues found:")
        for issue in issues:
            print(f"   - {issue}")
        return False
    
    print("✅ Data validation passed!")
    return True

def engineer_features(stop_times_df, trips_df, routes_df):
    """
    Engineers features for travel time prediction with enhanced feature set.
    """
    print("⚙️ Engineering features...")
    
    try:
        # Convert time strings to timedelta for proper calculation
        def safe_time_convert(time_str):
            try:
                if pd.isna(time_str):
                    return pd.NaT
                # Handle times that might exceed 24 hours (common in GTFS)
                parts = str(time_str).split(':')
                if len(parts) == 3:
                    hours, minutes, seconds = map(int, parts)
                    total_seconds = hours * 3600 + minutes * 60 + seconds
                    return pd.Timedelta(seconds=total_seconds)
                return pd.NaT
            except:
                return pd.NaT
        
        print("   Converting time formats...")
        stop_times_df['arrival_time_td'] = stop_times_df['arrival_time'].apply(safe_time_convert)
        stop_times_df['departure_time_td'] = stop_times_df['departure_time'].apply(safe_time_convert)
        
        # Remove rows with invalid times
        stop_times_df = stop_times_df.dropna(subset=['arrival_time_td'])
        
        print("   Calculating trip durations and stop counts...")
        
        # Calculate trip duration (first arrival to last arrival)
        trip_times = stop_times_df.groupby('trip_id')['arrival_time_td'].agg(['min', 'max', 'count'])
        trip_times.columns = ['first_arrival', 'last_arrival', 'total_stops']
        trip_times['travel_time_minutes'] = (trip_times['last_arrival'] - trip_times['first_arrival']).dt.total_seconds() / 60
        
        # Calculate average stop spacing (time between stops)
        stop_times_sorted = stop_times_df.sort_values(['trip_id', 'stop_sequence'])
        stop_times_sorted['next_arrival'] = stop_times_sorted.groupby('trip_id')['arrival_time_td'].shift(-1)
        stop_times_sorted['stop_interval'] = (stop_times_sorted['next_arrival'] - stop_times_sorted['arrival_time_td']).dt.total_seconds() / 60
        
        avg_stop_intervals = stop_times_sorted.groupby('trip_id')['stop_interval'].mean().reset_index()
        avg_stop_intervals.columns = ['trip_id', 'avg_stop_interval_minutes']
        
        # Merge with trips and routes data for additional features
        print("   Merging trip and route information...")
        enhanced_trips = pd.merge(trips_df, routes_df, on='route_id', how='left')
        
        # Create final training dataset
        training_df = pd.merge(enhanced_trips, trip_times, on='trip_id', how='inner')
        training_df = pd.merge(training_df, avg_stop_intervals, on='trip_id', how='left')
        
        # Filter for valid trips (positive travel time, reasonable duration)
        initial_count = len(training_df)
        training_df = training_df[
            (training_df['travel_time_minutes'] > 0) & 
            (training_df['travel_time_minutes'] < 300) &  # Less than 5 hours
            (training_df['total_stops'] >= 2) &  # At least 2 stops
            (training_df['total_stops'] <= 100)  # Reasonable number of stops
        ]
        
        print(f"   Filtered {initial_count} -> {len(training_df)} valid trips")
        
        # Fill missing average stop intervals with median
        median_interval = training_df['avg_stop_interval_minutes'].median()
        training_df.loc[:, 'avg_stop_interval_minutes'] = training_df['avg_stop_interval_minutes'].fillna(median_interval)
        
        # Create route type encoding (if available)
        if 'route_type' in training_df.columns:
            # Create dummy variables for route types
            route_type_dummies = pd.get_dummies(training_df['route_type'], prefix='route_type')
            training_df = pd.concat([training_df, route_type_dummies], axis=1)
        
        print(f"✅ Feature engineering complete! Final dataset: {len(training_df)} trips")
        return training_df
        
    except Exception as e:
        print(f"❌ Error in feature engineering: {str(e)}")
        return None

def train_enhanced_model(training_df):
    """
    Trains an enhanced model with multiple features and proper evaluation.
    """
    print("🤖 Training enhanced travel time prediction model...")
    
    try:
        # Define feature columns
        base_features = ['total_stops', 'avg_stop_interval_minutes']
        
        # Add route type features if available
        route_type_cols = [col for col in training_df.columns if col.startswith('route_type_')]
        feature_columns = base_features + route_type_cols
        
        # Prepare features and target
        X = training_df[feature_columns].copy()
        y = training_df['travel_time_minutes'].copy()
        
        # Handle any remaining missing values
        X = X.fillna(X.median())
        
        print(f"   Features: {feature_columns}")
        print(f"   Training samples: {len(X)}")
        print(f"   Target range: {y.min():.1f} - {y.max():.1f} minutes")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=None
        )
        
        # Scale features for better performance
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train model
        model = LinearRegression()
        model.fit(X_train_scaled, y_train)
        
        # Make predictions
        y_train_pred = model.predict(X_train_scaled)
        y_test_pred = model.predict(X_test_scaled)
        
        # Evaluate model
        train_r2 = r2_score(y_train, y_train_pred)
        test_r2 = r2_score(y_test, y_test_pred)
        train_mae = mean_absolute_error(y_train, y_train_pred)
        test_mae = mean_absolute_error(y_test, y_test_pred)
        train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
        test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
        
        # Print detailed evaluation
        print("\n📊 Model Performance Evaluation:")
        print(f"   Training R²: {train_r2:.3f}")
        print(f"   Testing R²:  {test_r2:.3f}")
        print(f"   Training MAE: {train_mae:.1f} minutes")
        print(f"   Testing MAE:  {test_mae:.1f} minutes")
        print(f"   Training RMSE: {train_rmse:.1f} minutes")
        print(f"   Testing RMSE:  {test_rmse:.1f} minutes")
        
        # Feature importance (coefficients)
        print("\n🔍 Feature Importance:")
        for i, feature in enumerate(feature_columns):
            coef = model.coef_[i] if len(model.coef_) > i else 0
            print(f"   {feature}: {coef:.3f}")
        
        # Save model and scaler
        model_package = {
            'model': model,
            'scaler': scaler,
            'feature_columns': feature_columns,
            'performance': {
                'test_r2': test_r2,
                'test_mae': test_mae,
                'test_rmse': test_rmse
            },
            'trained_at': datetime.now().isoformat()
        }
        
        joblib.dump(model_package, 'travel_time_model.joblib')
        print(f"\n✅ Enhanced model saved successfully!")
        print(f"   Model file: travel_time_model.joblib")
        print(f"   Test R² Score: {test_r2:.3f}")
        print(f"   Mean Absolute Error: {test_mae:.1f} minutes")
        
        return True
        
    except Exception as e:
        print(f"❌ Error training model: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def train_travel_time_model():
    """
    Main function to train the enhanced travel time prediction model.
    """
    print("🚀 Starting Enhanced Aura Travel Time Model Training")
    print("=" * 60)
    
    # Load data
    stop_times_df, trips_df, routes_df = load_gtfs_data()
    if stop_times_df is None:
        print("❌ Model training failed: Could not load GTFS data")
        return False
    
    # Validate data
    if not validate_data(stop_times_df, trips_df, routes_df):
        print("❌ Model training failed: Data validation failed")
        return False
    
    # Engineer features
    training_df = engineer_features(stop_times_df, trips_df, routes_df)
    if training_df is None or len(training_df) == 0:
        print("❌ Model training failed: Feature engineering failed")
        return False
    
    # Train model
    success = train_enhanced_model(training_df)
    
    if success:
        print("\n🎉 Model training completed successfully!")
        print("   You can now use the model for travel time predictions.")
    else:
        print("\n❌ Model training failed!")
    
    return success

if __name__ == "__main__":
    train_travel_time_model() 