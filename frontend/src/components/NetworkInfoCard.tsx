import React from 'react';
import { Shield, Wifi, AlertCircle } from 'lucide-react';
import { NetworkInfo, Server as ServerType } from '../types';

interface NetworkInfoCardProps {
  networkInfo: NetworkInfo | null;
  server: ServerType | null;
}

export const NetworkInfoCard: React.FC<NetworkInfoCardProps> = ({ networkInfo, server }) => {
  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Wifi className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Network & Client Telemetry
          </span>
        </div>
        <span className="flex items-center space-x-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <Shield className="w-3 h-3" />
          <span>Privacy Protected</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
        {/* Client ISP & ASN */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            ISP / Network
          </div>
          <div className="text-slate-200 font-medium truncate mt-1 text-sm">
            {networkInfo ? networkInfo.isp : 'Resolving...'}
          </div>
          <div className="text-slate-400 text-[11px] font-mono mt-0.5">
            ASN: {networkInfo?.asn || 'Unavailable'}
          </div>
        </div>

        {/* Location & IP */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            Client Gateway
          </div>
          <div className="text-slate-200 font-medium truncate mt-1 text-sm">
            {networkInfo ? `${networkInfo.city}, ${networkInfo.country}` : 'Localhost'}
          </div>
          <div className="text-slate-400 text-[11px] font-mono mt-0.5 flex items-center space-x-1.5">
            <span>IP: {networkInfo?.ip || '127.0.0.1'}</span>
            <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] uppercase font-bold">
              {networkInfo?.ip_version || 'IPv4'}
            </span>
          </div>
        </div>

        {/* Selected Test Server */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            Active Test Server
          </div>
          <div className="text-cyan-400 font-medium truncate mt-1 text-sm">
            {server ? server.name : 'Auto Edge Server'}
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            {server ? `${server.region}, ${server.country}` : 'Local Node'}
          </div>
        </div>

        {/* Browser Sandbox Capabilities */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            Protocol Capabilities
          </div>
          <div className="text-slate-300 font-medium mt-1 text-[11px]">
            High-Resolution Timers: <span className="text-emerald-400">Active</span>
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            HTTP Failures: <span className="text-cyan-400">Tracked</span> | ICMP: <span className="text-slate-500">Sandbox N/A</span>
          </div>
        </div>
      </div>

      {/* Honest Limitation Notice */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-start space-x-2 text-[11px] text-slate-400">
        <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-300">Technical Accuracy Guarantee:</strong> Measurements originate from uncompressed byte streams and microsecond RTT probes. Raw ICMP packet loss and direct socket DNS timing are marked unavailable as they cannot be accessed within browser security sandboxes.
        </p>
      </div>
    </div>
  );
};
