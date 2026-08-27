import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { LiveMeasurementSample } from '../types';

interface LiveGraphProps {
  samples: LiveMeasurementSample[];
  activeType: 'download' | 'upload' | 'all';
}

export const LiveGraph: React.FC<LiveGraphProps> = ({ samples, activeType }) => {
  if (!samples || samples.length === 0) {
    return (
      <div className="w-full h-44 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
        <span>Awaiting measurement telemetry...</span>
      </div>
    );
  }

  // Format data for chart
  const data = samples.map((s, idx) => ({
    time: `${s.elapsed_s}s`,
    download: s.download_mbps,
    upload: s.upload_mbps,
    latency: s.latency_ms,
    index: idx,
  }));

  const maxVal = Math.max(
    ...samples.map((s) => Math.max(s.download_mbps || 0, s.upload_mbps || 0)),
    10
  );

  return (
    <div className="w-full h-48 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="dlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="ulGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C084FC" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#C084FC" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="#6B7280"
            fontSize={10}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#6B7280"
            fontSize={10}
            tickLine={false}
            domain={[0, Math.ceil(maxVal * 1.15)]}
            unit="M"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#374151',
              borderRadius: '0.5rem',
              fontSize: '12px',
              color: '#F3F4F6',
            }}
            formatter={(value: any, name: any) => [
              `${Number(value).toFixed(1)} Mbps`,
              name === 'download' ? 'Download' : 'Upload',
            ]}
          />
          {(activeType === 'download' || activeType === 'all') && (
            <Area
              type="linear"
              dataKey="download"
              stroke="#38BDF8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#dlGradient)"
              isAnimationActive={false}
            />
          )}
          {(activeType === 'upload' || activeType === 'all') && (
            <Area
              type="linear"
              dataKey="upload"
              stroke="#C084FC"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#ulGradient)"
              isAnimationActive={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
