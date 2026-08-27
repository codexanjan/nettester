import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Zap, 
  Activity, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AnalyticsData } from '../types';
import { getLocalAnalytics } from '../services/storage';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    const data = await getLocalAnalytics();
    setAnalytics(data);
    setLoading(false);
  };

  const activeSummary = timeframe === '24h' 
    ? analytics?.summary_24h 
    : timeframe === '7d' 
    ? analytics?.summary_7d 
    : analytics?.summary_30d;

  // Chart data from recent history
  const chartData = (analytics?.recent_history || [])
    .slice()
    .reverse()
    .map((r, i) => ({
      index: i + 1,
      date: new Date(r.timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
      download: r.download_mbps,
      upload: r.upload_mbps,
      latency: r.latency_ms,
      score: r.overall_score,
    }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-wider text-cyan-400">
            <BarChart3 className="w-4 h-4" />
            <span>Connection Insights</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Performance Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Calculated strictly from your recorded measurement history.
          </p>
        </div>

        {/* Timeframe Pill */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
          {(['24h', '7d', '30d'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                timeframe === t
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === '24h' ? '24 Hours' : t === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Personal Best Records */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Personal All-Time Records
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Fastest Download</div>
            <div className="text-xl font-black font-mono text-cyan-400 mt-1">
              {analytics?.records.fastest_download ?? '--'} <span className="text-xs text-slate-500 font-sans">Mbps</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Fastest Upload</div>
            <div className="text-xl font-black font-mono text-purple-400 mt-1">
              {analytics?.records.fastest_upload ?? '--'} <span className="text-xs text-slate-500 font-sans">Mbps</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Lowest Latency</div>
            <div className="text-xl font-black font-mono text-amber-400 mt-1">
              {analytics?.records.lowest_latency ?? '--'} <span className="text-xs text-slate-500 font-sans">ms</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Lowest Jitter</div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1">
              {analytics?.records.lowest_jitter ?? '--'} <span className="text-xs text-slate-500 font-sans">ms</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Best Quality Score</div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1">
              {analytics?.records.best_overall_score ?? '--'}/100
            </div>
          </div>
        </div>
      </div>

      {/* Selected Timeframe Stats Summary */}
      {activeSummary ? (
        <div className="glass-panel-glow p-6 rounded-3xl border border-cyan-500/20">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              {timeframe === '24h' ? '24-Hour' : timeframe === '7d' ? '7-Day' : '30-Day'} Performance Baseline
            </h3>
            <span className="text-xs text-cyan-400 font-mono">
              {activeSummary.test_count} Completed Tests
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-center">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Average Download</div>
              <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
                {activeSummary.avg_download_mbps.toFixed(1)} <span className="text-xs text-slate-500">Mbps</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Average Upload</div>
              <div className="text-2xl font-black font-mono text-purple-400 mt-1">
                {activeSummary.avg_upload_mbps.toFixed(1)} <span className="text-xs text-slate-500">Mbps</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Average Latency</div>
              <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                {activeSummary.avg_latency_ms.toFixed(1)} <span className="text-xs text-slate-500">ms</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Average Stability</div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                {activeSummary.avg_stability_score.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-8 text-center rounded-2xl border border-slate-800 text-xs text-slate-400">
          No tests recorded in this timeframe window. Run additional tests to generate trending baselines.
        </div>
      )}

      {/* Historical Trend Charts */}
      {chartData.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Speed & Latency Trends
            </h3>
            <span className="text-xs text-slate-500">Latest {chartData.length} Tests</span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#F3F4F6',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="download"
                  name="Download (Mbps)"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  dot={{ fill: '#38BDF8', r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="upload"
                  name="Upload (Mbps)"
                  stroke="#C084FC"
                  strokeWidth={2}
                  dot={{ fill: '#C084FC', r: 2.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  name="Latency (ms)"
                  stroke="#FBBF24"
                  strokeWidth={2}
                  dot={{ fill: '#FBBF24', r: 2.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
