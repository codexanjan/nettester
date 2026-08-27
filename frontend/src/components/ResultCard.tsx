import React, { useState } from 'react';
import { 
  ArrowDown, 
  ArrowUp, 
  Activity, 
  Download, 
  FileText, 
  Share2, 
  Stethoscope, 
  Check, 
  Clock, 
  Zap 
} from 'lucide-react';
import { TestResultRecord, QualityScore } from '../types';
import { calculateQualityScore } from '../services/scoring';
import { exportResultsAsJSON, exportResultsAsCSV } from '../services/storage';

interface ResultCardProps {
  result: TestResultRecord;
  onOpenDiagnostics: () => void;
  onRetest: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onOpenDiagnostics,
  onRetest,
}) => {
  const [copied, setCopied] = useState(false);

  const qualityScore: QualityScore = calculateQualityScore(
    result.download_mbps,
    result.upload_mbps,
    result.latency_ms,
    result.jitter_ms,
    result.stability_score,
    result.http_failure_rate
  );

  const handleCopySummary = () => {
    const text = `⚡ NetScope Speed Test Result
↓ Download: ${result.download_mbps} Mbps
↑ Upload: ${result.upload_mbps} Mbps
◉ Latency: ${result.latency_ms} ms (Jitter: ${result.jitter_ms} ms)
★ Stability: ${result.stability_score}%
🛡 Quality Score: ${result.overall_score}/100 (${qualityScore.rating})
🌐 Server: ${result.server_name || 'Edge Server'}
📅 Date: ${new Date(result.timestamp).toLocaleString()}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl border border-cyan-500/30 max-w-4xl mx-auto shadow-2xl animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
              Measurement Verified
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">
            Test Performance Summary
          </h2>
          <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(result.timestamp).toLocaleString()}</span>
            </span>
            <span>•</span>
            <span>Server: <strong className="text-slate-300">{result.server_name || 'Edge Node'}</strong></span>
            <span>•</span>
            <span className="uppercase text-cyan-400 font-semibold">{result.test_mode} Mode</span>
          </div>
        </div>

        {/* Quality Score Pill */}
        <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-700 px-4 py-2 rounded-2xl">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Overall Quality</div>
            <div className="text-xs font-bold text-emerald-400">{qualityScore.rating}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 flex items-center justify-center font-black font-mono text-lg text-white shadow-md">
            {result.overall_score.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Main 3 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        {/* Download */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-cyan-500/20 text-center relative overflow-hidden group">
          <div className="flex items-center justify-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
            <ArrowDown className="w-4 h-4" />
            <span>Download</span>
          </div>
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white my-1">
            {result.download_mbps.toFixed(1)}
          </div>
          <div className="text-xs text-slate-400 font-medium">Mbps</div>
          <div className="text-[11px] text-slate-500 mt-2">
            Total: {((result.bytes_downloaded || 0) / (1024 * 1024)).toFixed(1)} MB
          </div>
        </div>

        {/* Upload */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-purple-500/20 text-center relative overflow-hidden group">
          <div className="flex items-center justify-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
            <ArrowUp className="w-4 h-4" />
            <span>Upload</span>
          </div>
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white my-1">
            {result.upload_mbps.toFixed(1)}
          </div>
          <div className="text-xs text-slate-400 font-medium">Mbps</div>
          <div className="text-[11px] text-slate-500 mt-2">
            Total: {((result.bytes_uploaded || 0) / (1024 * 1024)).toFixed(1)} MB
          </div>
        </div>

        {/* Latency */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-amber-500/20 text-center relative overflow-hidden group">
          <div className="flex items-center justify-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
            <Activity className="w-4 h-4" />
            <span>Latency (Ping)</span>
          </div>
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white my-1">
            {result.latency_ms.toFixed(1)}
          </div>
          <div className="text-xs text-slate-400 font-medium">ms</div>
          <div className="text-[11px] text-slate-500 mt-2">
            Min: {result.latency_min_ms || result.latency_ms} ms | Max: {result.latency_max_ms || result.latency_ms} ms
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-center">
        <div>
          <div className="text-[11px] text-slate-400">Jitter (RFC 3550)</div>
          <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
            {result.jitter_ms.toFixed(1)} <span className="text-xs text-slate-500">ms</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Connection Stability</div>
          <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
            {result.stability_score.toFixed(0)}%
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">HTTP Failure Rate</div>
          <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
            {result.http_failure_rate.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Packet Loss</div>
          <div className="text-xs font-medium text-slate-500 mt-1" title="Browser security sandbox prevents raw ICMP access">
            Not directly measurable
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-6 border-t border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Share Result'}</span>
          </button>

          <button
            onClick={() => exportResultsAsJSON([result])}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>JSON</span>
          </button>

          <button
            onClick={() => exportResultsAsCSV([result])}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={onOpenDiagnostics}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Network Doctor Analysis</span>
          </button>

          <button
            onClick={onRetest}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Run New Test</span>
          </button>
        </div>
      </div>
    </div>
  );
};
