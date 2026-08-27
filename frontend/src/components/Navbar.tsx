import React from 'react';
import { 
  Zap, 
  History, 
  BarChart3, 
  Server as ServerIcon, 
  Stethoscope, 
  ShieldCheck, 
  Lock, 
  Globe
} from 'lucide-react';
import { Server } from '../types';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentServer: Server | null;
  onOpenServerModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  currentServer,
  onOpenServerModal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Speed Test', icon: Zap },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'servers', label: 'Servers', icon: ServerIcon },
    { id: 'diagnostics', label: 'Diagnostics', icon: Stethoscope },
    { id: 'admin', label: 'Admin', icon: Lock },
    { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => onTabChange('dashboard')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                NETSCOPE
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Real & Accurate Speed Engine</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Test Server Pill */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenServerModal}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-xs text-slate-300 transition-all group"
            title="Click to select test server"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition-transform" />
            <span className="max-w-[120px] truncate font-medium">
              {currentServer ? currentServer.name : 'Auto Server'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-1.5 bg-surface/90 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
