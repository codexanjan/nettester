import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Square, 
  ArrowDown, 
  ArrowUp, 
  Activity, 
  Gauge, 
  ShieldCheck, 
  Radio, 
  RotateCcw, 
  Globe 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  TestStage, 
  TestMode, 
  Server, 
  LatencyProbeResult, 
  LiveMeasurementSample, 
  SpeedMetric, 
  TestResultRecord, 
  NetworkInfo 
} from '../types';
import { SpeedTestEngine } from '../services/speedtestEngine';
import { Speedometer } from '../components/Speedometer';
import { LiveGraph } from '../components/LiveGraph';
import { ResultCard } from '../components/ResultCard';
import { NetworkInfoCard } from '../components/NetworkInfoCard';
import { DiagnosticsModal } from '../components/DiagnosticsModal';
import { saveLocalTestResult } from '../services/storage';
import { syncTestResultToBackend, fetchNetworkInfo, fetchServers } from '../services/api';

interface DashboardProps {
  currentServer: Server | null;
  onOpenServerModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentServer,
  onOpenServerModal,
}) => {
  const [stage, setStage] = useState<TestStage>('IDLE');
  const [mode, setMode] = useState<TestMode>('full');
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  
  // Real measurement state
  const [latencyData, setLatencyData] = useState<LatencyProbeResult | null>(null);
  const [downloadMetric, setDownloadMetric] = useState<SpeedMetric>({ current: 0, average: 0, peak: 0, totalBytes: 0, duration: 0 });
  const [uploadMetric, setUploadMetric] = useState<SpeedMetric>({ current: 0, average: 0, peak: 0, totalBytes: 0, duration: 0 });
  const [liveSamples, setLiveSamples] = useState<LiveMeasurementSample[]>([]);
  const [completedResult, setCompletedResult] = useState<TestResultRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);

  const engineRef = useRef<SpeedTestEngine | null>(null);

  useEffect(() => {
    fetchNetworkInfo().then(setNetworkInfo).catch(console.warn);

    // Initialize Engine
    engineRef.current = new SpeedTestEngine({
      onStageChange: (newStage) => setStage(newStage),
      onLatencyUpdate: (res) => setLatencyData(res),
      onDownloadUpdate: (metric, sample) => {
        setDownloadMetric(metric);
        setLiveSamples((prev) => [...prev.slice(-80), sample]);
      },
      onUploadUpdate: (metric, sample) => {
        setUploadMetric(metric);
        setLiveSamples((prev) => [...prev.slice(-80), sample]);
      },
      onError: (msg) => {
        setErrorMessage(msg);
      },
      onComplete: async (result) => {
        setCompletedResult(result);
        
        // Celebrate excellent results
        if (result.overall_score >= 85) {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        }

        // Save locally in IndexedDB
        await saveLocalTestResult(result);

        // Optional background sync to backend DB
        syncTestResultToBackend(result).catch(console.warn);
      },
    });

    return () => {
      if (engineRef.current) {
        engineRef.current.cancel();
      }
    };
  }, []);

  const handleStartTest = async () => {
    if (!currentServer) return;
    setErrorMessage(null);
    setCompletedResult(null);
    setLiveSamples([]);
    setLatencyData(null);
    setDownloadMetric({ current: 0, average: 0, peak: 0, totalBytes: 0, duration: 0 });
    setUploadMetric({ current: 0, average: 0, peak: 0, totalBytes: 0, duration: 0 });

    if (engineRef.current) {
      await engineRef.current.runTest(currentServer, mode);
    }
  };

  const handleCancelTest = () => {
    if (engineRef.current) {
      engineRef.current.cancel();
    }
  };

  const isTesting = stage !== 'IDLE' && stage !== 'COMPLETED' && stage !== 'FAILED' && stage !== 'CANCELLED';

  // Determine current active metric for speedometer
  const currentSpeed = stage === 'DOWNLOAD_TEST'
    ? downloadMetric.current
    : stage === 'UPLOAD_TEST'
    ? uploadMetric.current
    : stage === 'COMPLETED' && completedResult
    ? completedResult.download_mbps
    : 0;

  const currentPeak = stage === 'DOWNLOAD_TEST' || stage === 'IDLE'
    ? downloadMetric.peak
    : uploadMetric.peak;

  const currentAvg = stage === 'DOWNLOAD_TEST'
    ? downloadMetric.average
    : stage === 'UPLOAD_TEST'
    ? uploadMetric.average
    : stage === 'COMPLETED' && completedResult
    ? completedResult.download_mbps
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Completed Test Card View */}
      {completedResult && (
        <ResultCard
          result={completedResult}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          onRetest={handleStartTest}
        />
      )}

      {/* Main Speedometer & Live Telemetry Area */}
      {!completedResult && (
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 relative overflow-hidden">
          {/* Top Controls: Mode Switcher & Server Badge */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            {/* Mode selector */}
            <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
              {(['quick', 'full', 'advanced'] as TestMode[]).map((m) => (
                <button
                  key={m}
                  disabled={isTesting}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    mode === m
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 disabled:opacity-50'
                  }`}
                >
                  {m} Test
                </button>
              ))}
            </div>

            {/* Test Stage Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isTesting ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
                Stage: <strong className="text-cyan-400">{stage.replace('_', ' ')}</strong>
              </span>
            </div>
          </div>

          {/* Speedometer Gauge */}
          <div className="my-4">
            <Speedometer
              currentMbps={currentSpeed}
              avgMbps={currentAvg}
              peakMbps={currentPeak}
              stage={stage}
            />
          </div>

          {/* Action Center (Run Test / Cancel) */}
          <div className="flex justify-center my-6">
            {!isTesting ? (
              <button
                onClick={handleStartTest}
                className="group relative inline-flex items-center justify-center px-10 py-4 text-base font-black tracking-wide text-white uppercase transition-all duration-200 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-2xl shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95"
              >
                <Zap className="w-5 h-5 mr-2 fill-white group-hover:animate-bounce" />
                <span>Run Speed Test</span>
              </button>
            ) : (
              <button
                onClick={handleCancelTest}
                className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold tracking-wide text-rose-300 uppercase transition-all duration-200 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 rounded-2xl shadow-lg hover:scale-105 active:scale-95"
              >
                <Square className="w-4 h-4 mr-2 fill-rose-300" />
                <span>Cancel Test</span>
              </button>
            )}
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs text-center my-4">
              <strong>Test Error:</strong> {errorMessage}
            </div>
          )}

          {/* Live 3 Primary Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {/* Download */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-center">
              <div className="flex items-center justify-center space-x-1 text-xs font-bold uppercase text-cyan-400 mb-1">
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Download</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {downloadMetric.current.toFixed(1)} <span className="text-xs text-slate-400 font-sans">Mbps</span>
              </div>
            </div>

            {/* Upload */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-center">
              <div className="flex items-center justify-center space-x-1 text-xs font-bold uppercase text-purple-400 mb-1">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Upload</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {uploadMetric.current.toFixed(1)} <span className="text-xs text-slate-400 font-sans">Mbps</span>
              </div>
            </div>

            {/* Latency */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-center">
              <div className="flex items-center justify-center space-x-1 text-xs font-bold uppercase text-amber-400 mb-1">
                <Activity className="w-3.5 h-3.5" />
                <span>Latency (RTT)</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {latencyData ? latencyData.median.toFixed(1) : '--'} <span className="text-xs text-slate-400 font-sans">ms</span>
              </div>
            </div>
          </div>

          {/* Live Continuous Chart */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Real-Time Telemetry Stream
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Continuous sample rate: 100ms
              </span>
            </div>
            <LiveGraph
              samples={liveSamples}
              activeType={stage === 'UPLOAD_TEST' ? 'upload' : stage === 'DOWNLOAD_TEST' ? 'download' : 'all'}
            />
          </div>
        </div>
      )}

      {/* Network & Client Information */}
      <NetworkInfoCard
        networkInfo={networkInfo}
        server={currentServer}
      />

      {/* Diagnostics Modal */}
      {completedResult && (
        <DiagnosticsModal
          result={completedResult}
          isOpen={isDiagnosticsOpen}
          onClose={() => setIsDiagnosticsOpen(false)}
        />
      )}
    </div>
  );
};
