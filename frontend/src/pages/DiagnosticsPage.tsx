import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Bot, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  Loader2 
} from 'lucide-react';
import { DiagnosticReport, AIDoctorResponse, TestResultRecord } from '../types';
import { getLocalTestResults } from '../services/storage';
import { fetchDiagnosticsReport, fetchAIDoctorAnalysis } from '../services/api';

export const DiagnosticsPage: React.FC = () => {
  const [latestResult, setLatestResult] = useState<TestResultRecord | null>(null);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIDoctorResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const records = await getLocalTestResults();
      if (records.length > 0) {
        const latest = records[0];
        setLatestResult(latest);
        const data = await fetchDiagnosticsReport(
          latest.download_mbps,
          latest.upload_mbps,
          latest.latency_ms,
          latest.jitter_ms,
          latest.stability_score,
          latest.http_failure_rate
        );
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to load diagnostics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAiDoctor = async () => {
    if (!latestResult) return;
    setLoadingAi(true);
    try {
      const res = await fetchAIDoctorAnalysis({
        download_mbps: latestResult.download_mbps,
        upload_mbps: latestResult.upload_mbps,
        latency_ms: latestResult.latency_ms,
        jitter_ms: latestResult.jitter_ms,
        stability_score: latestResult.stability_score,
        http_failure_rate: latestResult.http_failure_rate,
        server_name: latestResult.server_name,
      });
      setAiAnalysis(res);
    } catch (err) {
      console.error('AI Doctor analysis failed', err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-wider text-purple-400">
            <Stethoscope className="w-4 h-4" />
            <span>Health & Reliability</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Network Diagnostics & Doctor
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real telemetry analysis and non-presumptive root cause troubleshooting.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-12 text-center rounded-2xl text-slate-400 text-xs">
          Loading diagnostic evaluator...
        </div>
      ) : !latestResult ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800">
          <Stethoscope className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Telemetry Available</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Please run a speed test first so the Diagnostic Engine can evaluate real measurement samples.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Diagnostic Summary Card */}
          <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl border border-purple-500/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                  Latest Test Evaluated
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {report?.connection_type_estimate}
                </h3>
                <div className="text-xs text-slate-400 mt-1">
                  Evaluated: {latestResult.download_mbps} Mbps Down • {latestResult.latency_ms} ms Latency • {latestResult.jitter_ms} ms Jitter • {latestResult.stability_score}% Stability
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-bold">
                  Status: {report?.overall_status}
                </span>
              </div>
            </div>

            {/* AI Doctor Box */}
            <div className="mt-6 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold uppercase text-purple-300">
                    AI Consultation
                  </span>
                </div>

                {!aiAnalysis && !loadingAi && (
                  <button
                    onClick={handleRunAiDoctor}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Analysis</span>
                  </button>
                )}
              </div>

              {loadingAi ? (
                <div className="flex items-center justify-center py-6 text-xs text-purple-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>AI Doctor is diagnosing your real network samples...</span>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-purple-950/40 border border-purple-500/20 rounded-xl text-purple-200 font-medium">
                    {aiAnalysis.summary}
                  </div>
                  <p className="text-slate-300 leading-relaxed">{aiAnalysis.analysis}</p>
                  
                  {aiAnalysis.possible_causes.length > 0 && (
                    <div>
                      <div className="font-bold uppercase text-slate-400 mb-1">Possible Causes:</div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {aiAnalysis.possible_causes.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiAnalysis.recommendations.length > 0 && (
                    <div>
                      <div className="font-bold uppercase text-emerald-400 mb-1">Actionable Recommendations:</div>
                      <ul className="list-decimal list-inside space-y-1 text-slate-200">
                        {aiAnalysis.recommendations.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Generate an AI Doctor consultation for actionable, step-by-step guidance on optimizing your bandwidth, router placement, or bufferbloat.
                </p>
              )}
            </div>
          </div>

          {/* Rules Diagnostic Findings */}
          {report && report.items.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Rule Engine Telemetry Findings
              </h3>
              {report.items.map((item, idx) => {
                const isWarn = item.severity === 'warning' || item.severity === 'critical';
                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border ${
                      isWarn ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {isWarn ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{item.title}</div>
                        <p className="text-xs text-slate-300 mt-1">{item.description}</p>

                        {item.possible_causes.length > 0 && (
                          <div className="mt-2 text-xs text-slate-400">
                            <strong className="text-slate-300">Possible causes: </strong>
                            {item.possible_causes.join(' • ')}
                          </div>
                        )}

                        {item.recommendations.length > 0 && (
                          <div className="mt-1.5 text-xs text-emerald-400">
                            <strong>Recommended actions: </strong>
                            {item.recommendations.join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
