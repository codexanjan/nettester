export type TestStage =
  | 'IDLE'
  | 'CONNECTING'
  | 'SERVER_SELECTION'
  | 'LATENCY_TEST'
  | 'DOWNLOAD_TEST'
  | 'UPLOAD_TEST'
  | 'ANALYSIS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type TestMode = 'quick' | 'full' | 'advanced';

export interface Server {
  id: string;
  name: string;
  hostname: string;
  port: string;
  protocol: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
  status: string;
  capacity_gbps: number;
  is_default?: boolean;
  latency_ms?: number;
}

export interface LiveMeasurementSample {
  timestamp: number;
  elapsed_s: number;
  download_mbps?: number;
  upload_mbps?: number;
  latency_ms?: number;
}

export interface LatencyProbeResult {
  min: number;
  median: number;
  avg: number;
  max: number;
  jitter: number;
  samples: number[];
  failed_probes: number;
  total_probes: number;
  failure_rate: number;
}

export interface SpeedMetric {
  current: number;
  average: number;
  peak: number;
  totalBytes: number;
  duration: number;
}

export interface QualityScore {
  overall_score: number;
  speed_score: number;
  latency_score: number;
  jitter_score: number;
  stability_score: number;
  http_success_score: number;
  rating: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
  description: string;
  weights: {
    speed: string;
    latency: string;
    jitter: string;
    stability: string;
    http_reliability: string;
  };
}

export interface TestResultRecord {
  id: string;
  timestamp: string;
  server_id?: string;
  server_name?: string;
  download_mbps: number;
  upload_mbps: number;
  latency_ms: number;
  latency_min_ms?: number;
  latency_max_ms?: number;
  latency_avg_ms?: number;
  jitter_ms: number;
  http_failure_rate: number;
  stability_score: number;
  overall_score: number;
  speed_score?: number;
  latency_score?: number;
  duration: number;
  bytes_downloaded: number;
  bytes_uploaded: number;
  test_mode: TestMode;
}

export interface NetworkInfo {
  ip: string;
  ip_version: string;
  isp: string;
  organization: string;
  asn: string;
  city: string;
  region: string;
  country: string;
  country_code: string;
  latitude?: number;
  longitude?: number;
  is_vpn_or_proxy?: boolean;
}

export interface DiagnosticItem {
  category: 'speed' | 'latency' | 'jitter' | 'stability' | 'general';
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  description: string;
  possible_causes: string[];
  recommendations: string[];
}

export interface DiagnosticReport {
  overall_status: string;
  connection_type_estimate: string;
  items: DiagnosticItem[];
  metrics_summary: Record<string, number>;
  timestamp: number;
}

export interface AIDoctorResponse {
  summary: string;
  analysis: string;
  possible_issues: string[];
  possible_causes: string[];
  recommendations: string[];
  is_ai_generated: boolean;
}

export interface AnalyticsPeriod {
  period: string;
  test_count: number;
  avg_download_mbps: number;
  avg_upload_mbps: number;
  avg_latency_ms: number;
  avg_jitter_ms: number;
  avg_stability_score: number;
  avg_overall_score: number;
  best_download_mbps: number;
  best_upload_mbps: number;
  lowest_latency_ms: number;
  lowest_jitter_ms: number;
  worst_download_mbps: number;
}

export interface PersonalRecords {
  fastest_download?: number;
  fastest_upload?: number;
  lowest_latency?: number;
  lowest_jitter?: number;
  best_overall_score?: number;
}

export interface AnalyticsData {
  summary_24h?: AnalyticsPeriod;
  summary_7d?: AnalyticsPeriod;
  summary_30d?: AnalyticsPeriod;
  records: PersonalRecords;
  recent_history: TestResultRecord[];
}

export interface AdminMetrics {
  system: {
    cpu_percent: number;
    memory_percent: number;
    memory_used_mb: number;
    memory_total_mb: number;
    active_threads: number;
    uptime_seconds: number;
  };
  total_tests_completed: number;
  tests_last_24h: number;
  avg_download_24h: number;
  avg_upload_24h: number;
  avg_latency_24h: number;
  error_rate_percent: number;
  active_servers: Array<{
    id: string;
    name: string;
    hostname: string;
    region: string;
    status: string;
    latency_ms: number;
    capacity_gbps: number;
  }>;
  database_status: string;
}
