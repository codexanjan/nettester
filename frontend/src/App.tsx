import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ServerSelector } from './components/ServerSelector';
import { Dashboard } from './pages/Dashboard';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ServersPage } from './pages/ServersPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { AdminPage } from './pages/AdminPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ResultCard } from './components/ResultCard';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { Server, TestResultRecord } from './types';
import { fetchServers } from './services/api';
import { ShieldCheck, Zap } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentServer, setCurrentServer] = useState<Server | null>(null);
  const [isServerModalOpen, setIsServerModalOpen] = useState<boolean>(false);
  const [selectedHistoryResult, setSelectedHistoryResult] = useState<TestResultRecord | null>(null);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Load servers on mount
    fetchServers().then((servers) => {
      if (servers.length > 0) {
        const defaultSrv = servers.find((s) => s.is_default) || servers[0];
        setCurrentServer(defaultSrv);
      }
    }).catch(console.warn);
  }, []);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedHistoryResult(null);
          setActiveTab(tab);
        }}
        currentServer={currentServer}
        onOpenServerModal={() => setIsServerModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {selectedHistoryResult ? (
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
            <button
              onClick={() => setSelectedHistoryResult(null)}
              className="text-xs text-cyan-400 hover:underline mb-2 flex items-center space-x-1"
            >
              <span>← Back to History List</span>
            </button>
            <ResultCard
              result={selectedHistoryResult}
              onOpenDiagnostics={() => setIsDiagnosticsModalOpen(true)}
              onRetest={() => {
                setSelectedHistoryResult(null);
                setActiveTab('dashboard');
              }}
            />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                currentServer={currentServer}
                onOpenServerModal={() => setIsServerModalOpen(true)}
              />
            )}
            {activeTab === 'history' && (
              <HistoryPage
                onSelectResult={(res) => setSelectedHistoryResult(res)}
              />
            )}
            {activeTab === 'analytics' && <AnalyticsPage />}
            {activeTab === 'servers' && (
              <ServersPage
                currentServer={currentServer}
                onSelectServer={(srv) => setCurrentServer(srv)}
              />
            )}
            {activeTab === 'diagnostics' && <DiagnosticsPage />}
            {activeTab === 'admin' && <AdminPage />}
            {activeTab === 'privacy' && <PrivacyPage />}
          </>
        )}
      </main>

      {/* Global Server Selector Modal */}
      <ServerSelector
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        currentServer={currentServer}
        onSelectServer={(srv) => setCurrentServer(srv)}
      />

      {/* Diagnostics Modal */}
      {selectedHistoryResult && (
        <DiagnosticsModal
          result={selectedHistoryResult}
          isOpen={isDiagnosticsModalOpen}
          onClose={() => setIsDiagnosticsModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            <span className="font-bold text-slate-300">NETSCOPE SPEED TESTER</span>
            <span>•</span>
            <span className="flex items-center text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Real & Privacy-First Architecture
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={() => {
                setSelectedHistoryResult(null);
                setActiveTab('privacy');
              }}
              className="hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => {
                setSelectedHistoryResult(null);
                setActiveTab('admin');
              }}
              className="hover:text-slate-300 transition-colors"
            >
              Cluster Admin
            </button>
            <span className="font-mono text-[11px] text-slate-600">v1.0.0-PRO</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
