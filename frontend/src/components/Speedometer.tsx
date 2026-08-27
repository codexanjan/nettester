import React from 'react';
import { ArrowDown, ArrowUp, Activity } from 'lucide-react';
import { TestStage } from '../types';

interface SpeedometerProps {
  currentMbps: number;
  avgMbps: number;
  peakMbps: number;
  stage: TestStage;
  maxScaleMbps?: number;
}

export const Speedometer: React.FC<SpeedometerProps> = ({
  currentMbps,
  avgMbps,
  peakMbps,
  stage,
  maxScaleMbps = 1000,
}) => {
  // Color configuration depending on active test stage
  const getTheme = () => {
    switch (stage) {
      case 'DOWNLOAD_TEST':
        return {
          stroke: '#38BDF8', // Cyan
          glow: 'rgba(56, 189, 248, 0.4)',
          text: 'text-cyan-400',
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          label: 'DOWNLOAD SPEED',
          icon: ArrowDown,
        };
      case 'UPLOAD_TEST':
        return {
          stroke: '#C084FC', // Purple
          glow: 'rgba(192, 132, 252, 0.4)',
          text: 'text-purple-400',
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          label: 'UPLOAD SPEED',
          icon: ArrowUp,
        };
      case 'LATENCY_TEST':
        return {
          stroke: '#FBBF24', // Amber
          glow: 'rgba(251, 191, 36, 0.4)',
          text: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          label: 'MEASURING LATENCY',
          icon: Activity,
        };
      case 'COMPLETED':
        return {
          stroke: '#34D399', // Emerald
          glow: 'rgba(52, 211, 153, 0.4)',
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          label: 'TEST COMPLETE',
          icon: Activity,
        };
      default:
        return {
          stroke: '#06B6D4',
          glow: 'rgba(6, 182, 212, 0.2)',
          text: 'text-cyan-400',
          bg: 'bg-slate-800/40',
          border: 'border-slate-700',
          label: 'READY TO TEST',
          icon: Activity,
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  // Logarithmic / progressive angle conversion for needle
  // 0 Mbps = -135deg, 10 Mbps = -90deg, 100 Mbps = 0deg, 500 Mbps = 90deg, 1000 Mbps = 135deg
  const calculateAngle = (mbps: number): number => {
    if (mbps <= 0) return -135;
    const clamped = Math.min(mbps, maxScaleMbps);
    // Log scaling from 0 to 1000 Mbps
    const normalized = Math.log10(clamped + 1) / Math.log10(maxScaleMbps + 1);
    return -135 + normalized * 270;
  };

  const angle = calculateAngle(currentMbps);

  // SVG Gauge calculations
  const radius = 130;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  // 270 degrees arc
  const arcLength = circumference * (270 / 360);
  const strokeDashoffset = arcLength - (arcLength * Math.max(0, Math.min(1, (angle + 135) / 270)));

  // Gauge tick values
  const ticks = [0, 5, 25, 100, 250, 500, 1000];

  return (
    <div className="relative flex flex-col items-center justify-center p-6 select-none">
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
        {/* Background glow circle */}
        <div 
          className="absolute inset-4 rounded-full transition-all duration-700 blur-2xl pointer-events-none"
          style={{ background: theme.glow }}
        />

        {/* Speedometer SVG */}
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 340 340"
        >
          {/* Background Track Arc */}
          <circle
            cx="170"
            cy="170"
            r={radius}
            fill="none"
            stroke="#1F2937"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-45 170 170)"
          />

          {/* Active Colored Progress Arc */}
          <circle
            cx="170"
            cy="170"
            r={radius}
            fill="none"
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-45 170 170)"
            className="transition-all duration-150 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${theme.stroke})`,
            }}
          />
        </svg>

        {/* Ticks on Gauge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {ticks.map((t) => {
            const tickAngle = calculateAngle(t);
            const rad = ((tickAngle - 90) * Math.PI) / 180;
            const rOffset = 108;
            const x = Math.cos(rad) * rOffset;
            const y = Math.sin(rad) * rOffset;

            return (
              <span
                key={t}
                className="absolute text-[10px] sm:text-xs font-mono font-semibold text-slate-500"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
              >
                {t}
              </span>
            );
          })}
        </div>

        {/* Animated Needle */}
        <div
          className="absolute w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-200 ease-out"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div className="w-1.5 h-28 bg-gradient-to-t from-transparent via-cyan-400 to-white rounded-full shadow-[0_0_12px_rgba(34,211,238,0.9)] -translate-y-14" />
        </div>

        {/* Center Digital Display */}
        <div className="absolute flex flex-col items-center justify-center text-center z-10">
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${theme.bg} ${theme.text} ${theme.border} border mb-1`}>
            <IconComponent className="w-3.5 h-3.5" />
            <span>{theme.label}</span>
          </div>

          {/* Big Number */}
          <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
            {currentMbps >= 100 ? currentMbps.toFixed(0) : currentMbps.toFixed(1)}
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-400 mt-0.5">
            Mbps
          </span>
        </div>
      </div>

      {/* Sub-metrics: Peak and Average */}
      <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full max-w-sm mt-2">
        <div className="glass-panel px-4 py-2.5 rounded-xl text-center border border-slate-800">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Peak Speed</div>
          <div className="text-lg font-bold font-mono text-cyan-400">
            {peakMbps.toFixed(1)} <span className="text-xs text-slate-400 font-sans">Mbps</span>
          </div>
        </div>

        <div className="glass-panel px-4 py-2.5 rounded-xl text-center border border-slate-800">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Average Speed</div>
          <div className="text-lg font-bold font-mono text-purple-400">
            {avgMbps.toFixed(1)} <span className="text-xs text-slate-400 font-sans">Mbps</span>
          </div>
        </div>
      </div>
    </div>
  );
};
