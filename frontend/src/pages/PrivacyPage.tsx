import React from 'react';
import { 
  ShieldCheck, 
  Trash2, 
  Lock, 
  Database, 
  UploadCloud, 
  EyeOff 
} from 'lucide-react';
import { clearLocalTestResults } from '../services/storage';

export const PrivacyPage: React.FC = () => {
  const handleWipeAllData = async () => {
    if (window.confirm('Clear all locally saved speed test records?')) {
      await clearLocalTestResults();
      alert('All local test history has been erased from your browser.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-wider text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Privacy & Security Architecture</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white mt-1">
          Privacy Policy & Data Transparency
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          NetScope is designed with a strict privacy-first architecture. This document details exactly how data flows through our measurement engine.
        </p>
      </div>

      {/* Core Privacy Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">No Accounts Required</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            You never need to sign up, log in, or provide personal details (name, email, or telephone number) to run high-speed tests.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
            <UploadCloud className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Ephemeral Upload Payloads</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Data sent during the upload speed test consists of temporary random byte buffers. The backend measures throughput and immediately drops the chunks from RAM. Payloads are never saved to disk or databases.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Local-First Vault (IndexedDB)</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Your detailed test history, samples, and performance baselines stay in your browser's private IndexedDB storage. You maintain 100% control over retention.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">No Trackers or Ads</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            We do not embed third-party advertising SDKs, session replay trackers, cross-site beacons, or fingerprinting scripts.
          </p>
        </div>
      </div>

      {/* Detailed Q&A Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <h2 className="text-lg font-bold text-white">
          Detailed Transparency Disclosures
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-bold text-cyan-400 text-sm">How is my IP Address handled?</h4>
            <p className="text-slate-300 mt-1 leading-relaxed">
              When communicating with test servers, your IP is necessary to establish TCP/HTTP network sockets. If metrics are synced to the backend database, your raw IP address is salted and hashed using cryptographic SHA-256 truncation. The original raw IP address is never stored in persistent databases.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-cyan-400 text-sm">How do I delete all my data?</h4>
            <p className="text-slate-300 mt-1 leading-relaxed">
              You can wipe all stored records anytime using the button below or on the History tab. This immediately purges your IndexedDB storage.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-cyan-400 text-sm">Are measurement formulas open and verifiable?</h4>
            <p className="text-slate-300 mt-1 leading-relaxed">
              Yes. All jitter calculations follow the standard RFC 3550 Mean Absolute Successive Difference methodology, and speed calculations use exact high-resolution byte arrival formulas: <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded font-mono">Mbps = (bytes * 8) / seconds / 1,000,000</code>.
            </p>
          </div>
        </div>

        {/* 1-Click Wipe Button */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white">Instant Data Erasure</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently delete all speed test history and cached server metadata from this device.
            </p>
          </div>

          <button
            onClick={handleWipeAllData}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Wipe Local History</span>
          </button>
        </div>
      </div>
    </div>
  );
};
