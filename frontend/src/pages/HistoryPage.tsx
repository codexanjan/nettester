import React, { useState, useEffect } from 'react';
import { 
  History, 
  Trash2, 
  Download, 
  FileText, 
  ArrowDown, 
  ArrowUp, 
  Activity, 
  Search, 
  ShieldCheck,
  Award,
  ChevronRight
} from 'lucide-react';
import { TestResultRecord } from '../types';
import { 
  getLocalTestResults, 
  clearLocalTestResults, 
  exportResultsAsJSON, 
  exportResultsAsCSV 
} from '../services/storage';

interface HistoryPageProps {
  onSelectResult: (result: TestResultRecord) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectResult }) => {
  const [results, setResults] = useState<TestResultRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const data = await getLocalTestResults();
    setResults(data);
    setLoading(false);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to delete all stored local test history? This action cannot be undone.')) {
      await clearLocalTestResults();
      setResults([]);
    }
  };

  const filtered = results.filter(r => 
    (r.server_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.test_mode || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-wider text-cyan-400">
            <History className="w-4 h-4" />
            <span>Local Test Vault</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Measurement History
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Your results are stored locally in your browser (IndexedDB) with zero mandatory cloud tracking.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {results.length > 0 && (
            <>
              <button
                onClick={() => exportResultsAsJSON(results)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => exportResultsAsCSV(results)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors border border-slate-700"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleClearHistory}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-xs font-semibold text-rose-300 transition-colors border border-rose-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Data</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      {results.length > 0 && (
        <div className="flex items-center space-x-3 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by server name or mode..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      )}

      {/* History Table / Empty State */}
      {loading ? (
        <div className="glass-panel p-12 text-center rounded-2xl text-slate-400 text-xs">
          Loading test records from local storage...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Test Records Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {results.length === 0
              ? 'Run your first speed test on the dashboard to build your local historical baseline.'
              : 'No historical records match your search filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectResult(item)}
              className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              {/* Left Column: Date & Server */}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">
                    {new Date(item.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {item.test_mode}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Server: <strong className="text-slate-300">{item.server_name || 'Edge Node'}</strong>
                </div>
              </div>

              {/* Middle Metrics Row */}
              <div className="grid grid-cols-4 gap-4 sm:gap-6 text-center w-full sm:w-auto">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center justify-center space-x-1">
                    <ArrowDown className="w-3 h-3 text-cyan-400" />
                    <span>Down</span>
                  </div>
                  <div className="text-sm sm:text-base font-black font-mono text-cyan-400">
                    {item.download_mbps.toFixed(1)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center justify-center space-x-1">
                    <ArrowUp className="w-3 h-3 text-purple-400" />
                    <span>Up</span>
                  </div>
                  <div className="text-sm sm:text-base font-black font-mono text-purple-400">
                    {item.upload_mbps.toFixed(1)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center justify-center space-x-1">
                    <Activity className="w-3 h-3 text-amber-400" />
                    <span>Ping</span>
                  </div>
                  <div className="text-sm sm:text-base font-black font-mono text-amber-400">
                    {item.latency_ms.toFixed(0)} <span className="text-[10px] text-slate-500">ms</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    Quality
                  </div>
                  <div className="text-sm sm:text-base font-black font-mono text-emerald-400">
                    {item.overall_score.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* Right: Open Details */}
              <div className="hidden sm:flex items-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
