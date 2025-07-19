import React, { useState } from 'react';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export const LiveRouteControls: React.FC = () => {
  const [objective, setObjective] = useState<'min-time'|'min-fuel'|'balanced'>('min-time');
  const [heatmap, setHeatmap] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const runOptimizer = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/v1/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective, crisis })
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setResult(data);
      console.log('Optimization result:', data);
      // TODO: emit event or call map to draw optimized routes
    } catch (err: any) {
      console.error('Optimizer error:', err);
      setError('Failed to optimize routes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="objective" className="block text-sm text-gray-300 mb-1">Optimize Objective</label>
        <select
          id="objective"
          value={objective}
          onChange={e => setObjective(e.target.value as any)}
          className="w-full bg-gray-800 text-white p-2 rounded-lg"
          disabled={loading}
        >
          <option value="min-time">Minimize Time</option>
          <option value="min-fuel">Minimize Fuel</option>
          <option value="balanced">Balanced</option>
        </select>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={runOptimizer}
          className="bg-blue-500 px-4 py-2 rounded-lg text-white hover:bg-blue-600 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Optimizing...' : 'Run Optimizer'}
        </button>
        <button
          onClick={() => setResult(null)}
          className="bg-gray-700 px-3 py-1 rounded-lg text-gray-200 hover:bg-gray-600 transition"
          disabled={loading}
        >
          Reset
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox accent-pink-500 scale-125 transition-all duration-200"
              checked={crisis}
              onChange={e => {
              setCrisis(e.target.checked);
              window.dispatchEvent(new CustomEvent('aura-scenario', { detail: { crisis: e.target.checked } }));
            }}
              disabled={loading}
            />
            <span className={`text-base font-bold px-3 py-1 rounded-lg shadow ${crisis ? 'bg-pink-500 text-white animate-pulse' : 'bg-slate-800 text-pink-400 border border-pink-500/40'}`}>Crisis Mode</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox accent-green-500 scale-125 transition-all duration-200"
              checked={objective === 'min-fuel'}
              onChange={e => {
              const newValue = e.target.checked ? 'min-fuel' : 'min-time';
              setObjective(newValue);
              window.dispatchEvent(new CustomEvent('aura-scenario', { detail: { greenRoute: e.target.checked } }));
            }}
              disabled={loading}
            />
            <span className={`text-base font-bold px-3 py-1 rounded-lg shadow ${objective === 'min-fuel' ? 'bg-green-400 text-slate-900 animate-pulse' : 'bg-slate-800 text-green-400 border border-green-400/40'}`}>Green Route</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox accent-amber-400 scale-125 transition-all duration-200"
              checked={heatmap}
              onChange={e => {
              setHeatmap(e.target.checked);
              window.dispatchEvent(new CustomEvent('aura-scenario', { detail: { heatmap: e.target.checked } }));
            }}
              disabled={loading}
            />
            <span className={`text-base font-bold px-3 py-1 rounded-lg shadow ${heatmap ? 'bg-amber-400 text-slate-900 animate-pulse' : 'bg-slate-800 text-amber-300 border border-amber-400/40'}`}>Heatmap</span>
          </label>
        </div>
        {(crisis || objective === 'min-fuel' || heatmap) && (
          <div className="flex gap-2 mt-2">
            {crisis && <span className="px-2 py-1 bg-pink-500/80 text-white rounded-lg font-bold animate-pulse">Crisis Simulation Active</span>}
            {objective === 'min-fuel' && <span className="px-2 py-1 bg-green-400/80 text-slate-900 rounded-lg font-bold animate-pulse">Green Route Active</span>}
            {heatmap && <span className="px-2 py-1 bg-amber-400/80 text-slate-900 rounded-lg font-bold animate-pulse">Heatmap On</span>}
          </div>
        )}
      </div>
      {error && <div className="text-red-400 mt-2">{error}</div>}
      {result && <div className="text-green-400 mt-2">Routes optimized successfully</div>}
    </div>
  );
};
