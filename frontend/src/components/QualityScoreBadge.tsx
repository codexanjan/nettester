import React from 'react';
import { ShieldCheck, Award, Info } from 'lucide-react';
import { QualityScore } from '../types';

interface QualityScoreBadgeProps {
  score: QualityScore;
  size?: 'sm' | 'md' | 'lg';
}

export const QualityScoreBadge: React.FC<QualityScoreBadgeProps> = ({ score, size = 'md' }) => {
  const getRatingColor = () => {
    switch (score.rating) {
      case 'Excellent':
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', ring: '#34D399' };
      case 'Very Good':
        return { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', ring: '#22D3EE' };
      case 'Good':
        return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', ring: '#60A5FA' };
      case 'Fair':
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', ring: '#FBBF24' };
      default:
        return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', ring: '#F43F5E' };
    }
  };

  const style = getRatingColor();

  return (
    <div className={`glass-panel p-4 rounded-xl border ${style.border} flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Award className={`w-5 h-5 ${style.text}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Connection Quality
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${style.bg} ${style.text} border ${style.border}`}>
          {score.rating}
        </span>
      </div>

      <div className="flex items-center space-x-4 my-2">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              stroke={style.ring}
              strokeWidth="3.5"
              strokeDasharray={`${score.overall_score}, 100`}
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              style={{ filter: `drop-shadow(0 0 4px ${style.ring})` }}
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-lg font-black font-mono text-white">
              {score.overall_score.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-xs text-slate-300 leading-relaxed">
            {score.description}
          </p>
        </div>
      </div>

      {/* Component Breakdown Bars */}
      <div className="grid grid-cols-4 gap-2 pt-3 mt-2 border-t border-slate-800/80 text-center">
        <div>
          <div className="text-[10px] text-slate-400">Speed (35%)</div>
          <div className="text-xs font-bold font-mono text-cyan-400">{score.speed_score.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">Latency (25%)</div>
          <div className="text-xs font-bold font-mono text-amber-400">{score.latency_score.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">Jitter (15%)</div>
          <div className="text-xs font-bold font-mono text-purple-400">{score.jitter_score.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">Stability (20%)</div>
          <div className="text-xs font-bold font-mono text-emerald-400">{score.stability_score.toFixed(0)}</div>
        </div>
      </div>
    </div>
  );
};
