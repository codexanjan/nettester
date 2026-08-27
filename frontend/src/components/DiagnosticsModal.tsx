import React, { useState } from 'react';
import { 
  X, 
  Stethoscope, 
  Bot, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  HelpCircle, 
  Sparkles, 
  Loader2 
} from 'lucide-react';
import { TestResultRecord, DiagnosticReport, AIDoctorResponse } from '../types';
import { fetchDiagnosticsReport, fetchAIDoctorAnalysis } from '../services/api';

interface DiagnosticsModalProps {
  result: TestResultRecord;
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  result,
  isOpen,
  onClose,
}) => {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIDoctorResponse | null>(null);
  const [loadingRule, setLoadingRule] = useState<boolean>(false);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen && result) {
      loadDeterministicDiagnostics();
    }
  }, [isOpen, result]);

  const loadDeterministicDiagnostics = async () => {
    setLoadingRule(true);
    try {
      const data = await fetchDiagnosticsReport(
        result.download_mbps,
        result.upload_mbps,
        result.latency_ms,
        result.jitter_ms,
        result.stability_score,
        result.http_failure_rate
      );
      setReport(data);
    } catch (err) {
      console.error('Failed to load diagnostics', err);
    } finally {
      setLoadingRule(false);
    }
  };

  const handleRunAIDoctor = async () => {
    setLoadingAi(true);
    try {
      const data = await fetchAIDoctorAnalysis({
        download_mbps: result.download_mbps,
        upload_mbps: result.upload_mbps,
        latency_ms: result.latency_ms,
        jitter_ms: result.jitter_ms,
        stability_score: result.stability_score,
        http_failure_rate: result.http_failure_rate,
        server_name: result.server_name,
      });
      setAiAnalysis(data);
    } catch (err) {
      console.error('Failed to run AI Doctor', err);
    } finally {
      setLoadingAi(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl glass-panel border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-6 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>Network Diagnostics & Doctor</span>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                RULE + AI
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive analysis based strictly on real measurement samples.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* Quick Connection Classification */}
          {report && (
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase font-bold text-slate-400">Connection Profile</div>
                <div className="text-sm font-semibold text-cyan-400 mt-0.5">
                  {report.connection_type_estimate}
                </div>
              </div>
              <div className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700">
                Status: <strong className="text-emerald-400">{report.overall_status}</strong>
              </div>
            </div>
          )}

          {/* AI Network Doctor Card */}
          <div className="glass-panel-glow p-5 rounded-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  AI Network Doctor
                </span>
              </div>
              {!aiAnalysis && !loadingAi && (
                <button
                  onClick={handleRunAIDoctor}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Generate AI Consultation</span>
                </button>
              )}
            </div>

            {loadingAi ? (
              <div className="flex items-center justify-center space-x-2 py-6 text-purple-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Evaluating real telemetry metrics with AI Doctor...</span>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-4 text-xs mt-3">
                <div className="bg-purple-950/30 p-3 rounded-xl border border-purple-500/20 text-purple-200 font-medium leading-relaxed">
                  {aiAnalysis.summary}
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {aiAnalysis.analysis}
                </p>

                {aiAnalysis.possible_causes.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                      Possible Root Causes (Non-presumptive):
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {aiAnalysis.possible_causes.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiAnalysis.recommendations.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase text-emerald-400 mb-1.5">
                      Actionable Recommendations:
                    </div>
                    <ul className="list-decimal list-inside space-y-1 text-slate-200">
                      {aiAnalysis.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Click above to generate intelligent troubleshooting steps and root-cause analysis using the actual speed, latency, jitter, and stability measured in this test.
              </p>
            )}
          </div>

          {/* Rules-based Telemetry Breakdown */}
          {loadingRule ? (
            <div className="flex items-center justify-center py-6 text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span>Evaluating telemetry rules...</span>
            </div>
          ) : report && report.items.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Detailed Diagnostic Findings
              </div>
              {report.items.map((item, idx) => {
                const isWarn = item.severity === 'warning' || item.severity === 'critical';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${
                      isWarn ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      {isWarn ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white">{item.title}</div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.description}</p>
                        
                        {item.possible_causes.length > 0 && (
                          <div className="mt-2 text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-300">Possible causes: </span>
                            {item.possible_causes.join(' • ')}
                          </div>
                        )}

                        {item.recommendations.length > 0 && (
                          <div className="mt-1.5 text-[11px] text-emerald-400/90">
                            <span className="font-semibold">Try: </span>
                            {item.recommendations.join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
