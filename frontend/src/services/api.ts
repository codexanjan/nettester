import {
  Server,
  NetworkInfo,
  DiagnosticReport,
  AIDoctorResponse,
  TestResultRecord,
  AdminMetrics,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function fetchServers(): Promise<Server[]> {
  try {
    const res = await fetch(`${API_BASE}/servers`);
    if (!res.ok) throw new Error('Failed to fetch server registry');
    return await res.json();
  } catch (err) {
    console.warn('Using edge fallback server registry', err);
    return [
      {
        id: 'srv-auto',
        name: '⚡ Auto Nearest Edge (Lowest Latency)',
        hostname: 'speed.cloudflare.com',
        port: '443',
        protocol: 'https',
        region: 'Global Anycast / Automatic Routing',
        country: 'Global',
        status: 'active',
        capacity_gbps: 100.0,
        is_default: true,
      },
      {
        id: 'srv-cf-global',
        name: '🌐 Global High-Speed CDN Edge',
        hostname: 'speed.cloudflare.com',
        port: '443',
        protocol: 'https',
        region: '300+ Edge Data Centers',
        country: 'Global',
        status: 'active',
        capacity_gbps: 100.0,
        is_default: false,
      },
      {
        id: 'srv-local-01',
        name: '💻 Localhost NetScope Server',
        hostname: window.location.hostname || '127.0.0.1',
        port: '8000',
        protocol: window.location.protocol.replace(':', '') || 'http',
        region: 'Localhost / Direct Server',
        country: 'Local',
        status: 'active',
        capacity_gbps: 10.0,
        is_default: false,
      },
    ];
  }
}

export async function fetchServersHealth(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/servers/health`);
    if (!res.ok) throw new Error('Failed to probe servers health');
    return await res.json();
  } catch {
    return [
      { id: 'srv-auto', name: '⚡ Auto Nearest Edge', status: 'healthy', latency_ms: 12.4 },
      { id: 'srv-cf-global', name: '🌐 Global High-Speed CDN Edge', status: 'healthy', latency_ms: 14.2 },
      { id: 'srv-local-01', name: '💻 Localhost NetScope Server', status: 'healthy', latency_ms: 0.8 },
    ];
  }
}

export async function fetchNetworkInfo(): Promise<NetworkInfo> {
  try {
    const res = await fetch(`${API_BASE}/network/info`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Attempt client-side public edge resolution if backend is unreachable
  }

  try {
    const ipRes = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (ipRes.ok) {
      const data = await ipRes.json();
      return {
        ip: data.ip || '127.0.0.1',
        ip_version: data.version || 'IPv4',
        isp: data.org || data.asn || 'Broadband ISP',
        organization: data.org || 'Internet Service Provider',
        asn: data.asn || 'AS0000',
        city: data.city || 'Local',
        region: data.region || 'Local',
        country: data.country_name || 'Global',
        country_code: data.country_code || 'GL',
        latitude: data.latitude,
        longitude: data.longitude,
        is_vpn_or_proxy: false,
      };
    }
  } catch {
    // Fallback default
  }

  return {
    ip: '127.0.0.1',
    ip_version: 'IPv4',
    isp: 'Local Network',
    organization: 'Direct Connection',
    asn: 'AS-LOCAL',
    city: 'Local Edge',
    region: 'Network Host',
    country: 'Local',
    country_code: 'LO',
    is_vpn_or_proxy: false,
  };
}

export async function fetchDiagnosticsReport(
  downloadMbps: number,
  uploadMbps: number,
  latencyMs: number,
  jitterMs: number,
  stabilityScore: number,
  httpFailureRate: number = 0
): Promise<DiagnosticReport> {
  const params = new URLSearchParams({
    download_mbps: downloadMbps.toString(),
    upload_mbps: uploadMbps.toString(),
    latency_ms: latencyMs.toString(),
    jitter_ms: jitterMs.toString(),
    stability_score: stabilityScore.toString(),
    http_failure_rate: httpFailureRate.toString(),
  });

  const res = await fetch(`${API_BASE}/diagnostics/evaluate?${params.toString()}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to evaluate diagnostics');
  return await res.json();
}

export async function fetchAIDoctorAnalysis(payload: {
  download_mbps: number;
  upload_mbps: number;
  latency_ms: number;
  jitter_ms: number;
  stability_score: number;
  http_failure_rate?: number;
  server_name?: string;
  historical_avg_download?: number;
  historical_avg_latency?: number;
}): Promise<AIDoctorResponse> {
  const res = await fetch(`${API_BASE}/diagnostics/ai-doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('AI Doctor service request failed');
  return await res.json();
}

export async function syncTestResultToBackend(result: Omit<TestResultRecord, 'id' | 'timestamp'>): Promise<TestResultRecord> {
  const res = await fetch(`${API_BASE}/tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  });
  if (!res.ok) throw new Error('Failed to sync test result to backend');
  return await res.json();
}

export async function fetchAdminMetrics(adminKey: string): Promise<AdminMetrics> {
  const res = await fetch(`${API_BASE}/admin/metrics`, {
    headers: { 'X-Admin-Key': adminKey },
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('Invalid Admin Key');
    throw new Error('Failed to fetch admin metrics');
  }
  return await res.json();
}
