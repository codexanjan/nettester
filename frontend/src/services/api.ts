import {
  Server,
  NetworkInfo,
  DiagnosticReport,
  AIDoctorResponse,
  TestResultRecord,
  AnalyticsData,
  AdminMetrics,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function fetchServers(): Promise<Server[]> {
  try {
    const res = await fetch(`${API_BASE}/servers`);
    if (!res.ok) throw new Error('Failed to fetch server registry');
    return await res.json();
  } catch (err) {
    console.warn('Using local fallback server', err);
    return [
      {
        id: 'srv-local-01',
        name: 'Local Edge Server',
        hostname: window.location.hostname || '127.0.0.1',
        port: '8000',
        protocol: window.location.protocol.replace(':', '') || 'http',
        region: 'Local Loopback',
        country: 'Local',
        status: 'active',
        capacity_gbps: 10.0,
        is_default: true,
      },
    ];
  }
}

export async function fetchServersHealth(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/servers/health`);
  if (!res.ok) throw new Error('Failed to probe servers health');
  return await res.json();
}

export async function fetchNetworkInfo(): Promise<NetworkInfo> {
  try {
    const res = await fetch(`${API_BASE}/network/info`);
    if (!res.ok) throw new Error('Network resolution failed');
    return await res.json();
  } catch {
    return {
      ip: '127.0.0.1',
      ip_version: 'IPv4',
      isp: 'Unavailable',
      organization: 'Unavailable',
      asn: 'Unavailable',
      city: 'Unavailable',
      region: 'Unavailable',
      country: 'Unavailable',
      country_code: 'UN',
      is_vpn_or_proxy: false,
    };
  }
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
