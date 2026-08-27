import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { TestResultRecord, AnalyticsData, PersonalRecords, AnalyticsPeriod } from '../types';

interface SpeedTestDB extends DBSchema {
  tests: {
    key: string;
    value: TestResultRecord;
    indexes: { 'by-timestamp': string };
  };
}

const DB_NAME = 'netscope_speedtest_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SpeedTestDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SpeedTestDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tests')) {
          const store = db.createObjectStore('tests', { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveLocalTestResult(result: TestResultRecord): Promise<void> {
  try {
    const db = await getDB();
    await db.put('tests', result);
  } catch (err) {
    console.warn('IndexedDB write failed, falling back to localStorage', err);
    const existing = getLocalStorageResults();
    existing.unshift(result);
    localStorage.setItem('netscope_test_history', JSON.stringify(existing.slice(0, 100)));
  }
}

export async function getLocalTestResults(): Promise<TestResultRecord[]> {
  try {
    const db = await getDB();
    const records = await db.getAllFromIndex('tests', 'by-timestamp');
    return records.reverse();
  } catch (err) {
    console.warn('IndexedDB read failed, falling back to localStorage', err);
    return getLocalStorageResults();
  }
}

function getLocalStorageResults(): TestResultRecord[] {
  try {
    const data = localStorage.getItem('netscope_test_history');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function clearLocalTestResults(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('tests');
  } catch (err) {
    console.warn('IndexedDB clear failed', err);
  }
  localStorage.removeItem('netscope_test_history');
}

export async function getLocalAnalytics(): Promise<AnalyticsData> {
  const records = await getLocalTestResults();
  const now = Date.now();

  const getStatsForWindow = (msWindow: number, label: string): AnalyticsPeriod | undefined => {
    const windowTests = records.filter(r => (now - new Date(r.timestamp).getTime()) <= msWindow);
    if (windowTests.length === 0) return undefined;

    const count = windowTests.length;
    const avgDl = windowTests.reduce((a, b) => a + b.download_mbps, 0) / count;
    const avgUl = windowTests.reduce((a, b) => a + b.upload_mbps, 0) / count;
    const avgLat = windowTests.reduce((a, b) => a + b.latency_ms, 0) / count;
    const avgJit = windowTests.reduce((a, b) => a + b.jitter_ms, 0) / count;
    const avgStab = windowTests.reduce((a, b) => a + b.stability_score, 0) / count;
    const avgScore = windowTests.reduce((a, b) => a + b.overall_score, 0) / count;

    const bestDl = Math.max(...windowTests.map(r => r.download_mbps));
    const bestUl = Math.max(...windowTests.map(r => r.upload_mbps));
    const lowestLat = Math.min(...windowTests.map(r => r.latency_ms));
    const lowestJit = Math.min(...windowTests.map(r => r.jitter_ms));
    const worstDl = Math.min(...windowTests.map(r => r.download_mbps));

    return {
      period: label,
      test_count: count,
      avg_download_mbps: Number(avgDl.toFixed(2)),
      avg_upload_mbps: Number(avgUl.toFixed(2)),
      avg_latency_ms: Number(avgLat.toFixed(2)),
      avg_jitter_ms: Number(avgJit.toFixed(2)),
      avg_stability_score: Number(avgStab.toFixed(1)),
      avg_overall_score: Number(avgScore.toFixed(1)),
      best_download_mbps: Number(bestDl.toFixed(2)),
      best_upload_mbps: Number(bestUl.toFixed(2)),
      lowest_latency_ms: Number(lowestLat.toFixed(2)),
      lowest_jitter_ms: Number(lowestJit.toFixed(2)),
      worst_download_mbps: Number(worstDl.toFixed(2)),
    };
  };

  const summary_24h = getStatsForWindow(24 * 60 * 60 * 1000, '24h');
  const summary_7d = getStatsForWindow(7 * 24 * 60 * 60 * 1000, '7d');
  const summary_30d = getStatsForWindow(30 * 24 * 60 * 60 * 1000, '30d');

  let recordsObj: PersonalRecords = {};
  if (records.length > 0) {
    recordsObj = {
      fastest_download: Number(Math.max(...records.map(r => r.download_mbps)).toFixed(2)),
      fastest_upload: Number(Math.max(...records.map(r => r.upload_mbps)).toFixed(2)),
      lowest_latency: Number(Math.min(...records.map(r => r.latency_ms)).toFixed(2)),
      lowest_jitter: Number(Math.min(...records.map(r => r.jitter_ms)).toFixed(2)),
      best_overall_score: Number(Math.max(...records.map(r => r.overall_score)).toFixed(1)),
    };
  }

  return {
    summary_24h,
    summary_7d,
    summary_30d,
    records: recordsObj,
    recent_history: records.slice(0, 30),
  };
}

export function exportResultsAsJSON(results: TestResultRecord[]): void {
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `netscope_speedtest_history_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportResultsAsCSV(results: TestResultRecord[]): void {
  const headers = [
    'ID',
    'Timestamp',
    'Server',
    'Download (Mbps)',
    'Upload (Mbps)',
    'Latency (ms)',
    'Jitter (ms)',
    'HTTP Failure Rate (%)',
    'Stability Score (%)',
    'Overall Quality Score',
    'Duration (s)',
    'Test Mode',
  ];

  const rows = results.map(r => [
    r.id,
    r.timestamp,
    `"${r.server_name || 'Edge'}"`,
    r.download_mbps,
    r.upload_mbps,
    r.latency_ms,
    r.jitter_ms,
    r.http_failure_rate,
    r.stability_score,
    r.overall_score,
    r.duration,
    r.test_mode,
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `netscope_speedtest_history_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
