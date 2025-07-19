import os
import pandas as pd
from typing import Dict
from ghana_economics import GhanaTransportEconomics

class GTFSData:
    def __init__(self, data: Dict[str, pd.DataFrame]):
        self.agency = data.get('agency')
        self.stops = data.get('stops')
        self.routes = data.get('routes')
        self.trips = data.get('trips')
        self.stop_times = data.get('stop_times')
        self.shapes = data.get('shapes')
        self.calendar = data.get('calendar')
        self.fare_attributes = data.get('fare_attributes')
        self.fare_rules = data.get('fare_rules')


def load_gtfs(directory: str) -> GTFSData:
    """
    Load GTFS files from the given directory into DataFrames.
    Expected files: agency.txt, stops.txt, routes.txt, trips.txt,
    stop_times.txt, shapes.txt, calendar.txt, fare_attributes.txt, fare_rules.txt.
    """
    files = {
        'agency': 'agency.txt',
        'stops': 'stops.txt',
        'routes': 'routes.txt',
        'trips': 'trips.txt',
        'stop_times': 'stop_times.txt',
        'shapes': 'shapes.txt',
        'calendar': 'calendar.txt',
        'fare_attributes': 'fare_attributes.txt',
        'fare_rules': 'fare_rules.txt',
    }
    data: Dict[str, pd.DataFrame] = {}
    for key, fname in files.items():
        path = os.path.join(directory, fname)
        if os.path.exists(path):
            data[key] = pd.read_csv(path)
        else:
            data[key] = pd.DataFrame()
        # Automatic fare inflation based on fuel price ratio (2015→2025)
    gtfs = GTFSData(data)
    try:
        econ = GhanaTransportEconomics()
        current_price = econ.economics_data.get('diesel_cost_per_liter', econ.economics_data.get('fuel_cost_per_liter'))
        historical_price = float(os.getenv('HISTORICAL_DIESEL_PRICE', 4.0))
        ratio = current_price / historical_price
        if gtfs.fare_attributes is not None and not gtfs.fare_attributes.empty:
            current_fares = dict(zip(gtfs.fare_attributes['fare_id'], gtfs.fare_attributes['price'] * ratio))
            update_fares(gtfs, current_fares)
            print(f"⚙️ Inflated fare prices by factor {ratio:.2f}")
    except Exception as e:
        print(f"⚠️ Fare inflation failed: {e}")
    return gtfs


def update_fares(gtfs_data: GTFSData, current_fares: Dict[str, float]) -> None:
    """
    Update fare attributes for current fare rules.

    Parameters:
    - gtfs_data: loaded GTFSData object
    - current_fares: mapping fare_id -> new price (float)
    """
    fa = gtfs_data.fare_attributes
    if fa is not None and not fa.empty:
        fa.loc[fa['fare_id'].isin(current_fares.keys()), 'price'] = fa['fare_id'].map(current_fares)
    # Note: fare_rules may need adjustment if routes change
