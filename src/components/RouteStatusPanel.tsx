import React, { useEffect, useState } from 'react';

interface RouteStatus {
  route_id: string;
  name: string;
  color: string;
  status: 'normal' | 'delayed' | 'disrupted';
  vehicle_count: number;
  avg_speed: number;
  delay_min: number;
  passengers: number;
  incidents: number;
}

const STATUS_COLORS = {
  normal: 'bg-green-400',
  delayed: 'bg-yellow-400',
  disrupted: 'bg-red-500',
};

const STATUS_LABELS = {
  normal: 'Normal',
  delayed: 'Delayed',
  disrupted: 'Disrupted',
};

const DEMO_ROUTES: RouteStatus[] = [
  {
    route_id: 'R1',
    name: 'Circle ↔ Kaneshie',
    color: '#3b82f6',
    status: 'normal',
    vehicle_count: 24,
    avg_speed: 32,
    delay_min: 0,
    passengers: 800,
    incidents: 0,
  },
  {
    route_id: 'R2',
    name: 'Accra ↔ Madina',
    color: '#10b981',
    status: 'delayed',
    vehicle_count: 19,
    avg_speed: 21,
    delay_min: 8,
    passengers: 1200,
    incidents: 1,
  },
  {
    route_id: 'R3',
    name: 'Tema ↔ Accra',
    color: '#FFC300',
    status: 'disrupted',
    vehicle_count: 12,
    avg_speed: 10,
    delay_min: 24,
    passengers: 900,
    incidents: 3,
  },
];

export default function RouteStatusPanel() {
  const [routes, setRoutes] = useState<RouteStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real API call
    setTimeout(() => {
      setRoutes(DEMO_ROUTES);
      setLoading(false);
    }, 1200);
  }, []);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      {loading ? (
        <div className="col-span-3 flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-yellow-400"></div>
        </div>
      ) : (
        routes.map((route) => (
          <div
            key={route.route_id}
            className={`rounded-2xl shadow-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-2 border-white/10 p-6 flex flex-col relative overflow-hidden group transition-transform hover:scale-[1.03]`}
            style={{ boxShadow: `0 0 0 4px ${route.color}33` }}
          >
            <div className="flex items-center mb-2">
              <span
                className={`inline-block w-3 h-3 rounded-full mr-2 ${STATUS_COLORS[route.status]}`}
              ></span>
              <span className="text-lg font-bold text-white drop-shadow-lg">
                {route.name}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2 py-1 rounded-full font-semibold text-slate-900 bg-white/80 shadow" style={{ background: route.color }}>
                {route.route_id}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold text-white ${STATUS_COLORS[route.status]}`}>
                {STATUS_LABELS[route.status]}
              </span>
              {route.incidents > 0 && (
                <span className="ml-2 text-xs font-bold text-red-400 animate-pulse">
                  {route.incidents} Incident{route.incidents > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 text-white">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium opacity-80">Vehicles</span>
                <span className="font-bold text-lg" style={{ color: route.color }}>{route.vehicle_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium opacity-80">Avg Speed</span>
                <span className="font-bold text-lg">{route.avg_speed} km/h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium opacity-80">Delay</span>
                <span className={`font-bold text-lg ${route.delay_min > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{route.delay_min} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium opacity-80">Passengers</span>
                <span className="font-bold text-lg text-cyan-300">{route.passengers}</span>
              </div>
            </div>
            <div className="absolute right-0 top-0 opacity-20 text-[6rem] font-black pointer-events-none select-none group-hover:opacity-40 transition-opacity" style={{ color: route.color }}>
              ●
            </div>
          </div>
        ))
      )}
    </div>
  );
}
