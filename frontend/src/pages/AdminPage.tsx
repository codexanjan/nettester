import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, 
  Cpu, 
  HardDrive, 
  Activity, 
  RefreshCw, 
  Layers 
} from 'lucide-react';
import { AdminMetrics } from '../types';
import { fetchAdminMetrics } from '../services/api';

export const AdminPage: React.FC = () => {
  const [adminKey, setAdminKey] = useState<string>('netscope-admin-secret-key-2026');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthenticate = useCallback(async (keyToUse?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminMetrics(keyToUse || adminKey);
      setMetrics(data);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    handleAuthenticate('netscope-admin-secret-key-2026');
  }, [handleAuthenticate]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-wider text-rose-400">
            <Lock className="w-4 h-4" />
            <span>Restricted Access</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            System Admin & Infrastructure Portal
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal server capacity, resource utilization, and operational diagnostics.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => handleAuthenticate()}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="max-w-md mx-auto glass-panel p-8 rounded-3xl border border-slate-800 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Admin Authentication Required</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Enter your administrative authorization key to inspect cluster health.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleAuthenticate(); }} className="space-y-4">
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter Admin API Key..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            {error && <div className="text-xs text-rose-400">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-500/20"
            >
              {loading ? 'Verifying...' : 'Unlock Admin Portal'}
            </button>
          </form>
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          {/* System Resource Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>CPU Usage</span>
              </div>
              <div className="text-2xl font-black font-mono text-white mt-2">
                {metrics.system.cpu_percent.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Threads: {metrics.system.active_threads}
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <span>Memory (RAM)</span>
              </div>
              <div className="text-2xl font-black font-mono text-white mt-2">
                {metrics.system.memory_used_mb.toFixed(0)} <span className="text-xs text-slate-500 font-sans">MB</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Total: {metrics.system.memory_total_mb.toFixed(0)} MB ({metrics.system.memory_percent.toFixed(1)}%)
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Total Completed Tests</span>
              </div>
              <div className="text-2xl font-black font-mono text-white mt-2">
                {metrics.total_tests_completed}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Last 24h: {metrics.tests_last_24h}
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Error Rate</span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
                {metrics.error_rate_percent.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                DB: {metrics.database_status}
              </div>
            </div>
          </div>

          {/* Active Test Nodes Capacity Table */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Cluster Server Nodes Health & Capacity
              </h3>
              <span className="text-xs text-emerald-400 font-mono">
                {metrics.active_servers.length} Registered Nodes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Server Name</th>
                    <th className="px-4 py-3">Hostname</th>
                    <th className="px-4 py-3">Region</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {metrics.active_servers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold text-white">{s.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{s.hostname}</td>
                      <td className="px-4 py-3 text-slate-300">{s.region}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{s.capacity_gbps} Gbps</td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
