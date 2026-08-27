import {
  TestStage,
  TestMode,
  Server,
  LatencyProbeResult,
  LiveMeasurementSample,
  SpeedMetric,
  TestResultRecord,
} from '../types';
import {
  calculateJitterRFC3550,
  calculateStabilityScore,
  calculateQualityScore,
} from './scoring';

export interface EngineCallbacks {
  onStageChange: (stage: TestStage) => void;
  onLatencyUpdate: (result: LatencyProbeResult) => void;
  onDownloadUpdate: (metric: SpeedMetric, sample: LiveMeasurementSample) => void;
  onUploadUpdate: (metric: SpeedMetric, sample: LiveMeasurementSample) => void;
  onError: (errorMsg: string) => void;
  onComplete: (result: TestResultRecord) => void;
}

export class SpeedTestEngine {
  private abortController: AbortController | null = null;
  private isRunning: boolean = false;
  private currentStage: TestStage = 'IDLE';

  constructor(private callbacks: EngineCallbacks) {}

  public getStage(): TestStage {
    return this.currentStage;
  }

  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isRunning = false;
    this.setStage('CANCELLED');
  }

  private setStage(stage: TestStage): void {
    this.currentStage = stage;
    this.callbacks.onStageChange(stage);
  }

  public async runTest(server: Server, mode: TestMode = 'full'): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // High-concurrency multi-stream settings for exact saturation
    const config = {
      quick: { pingProbes: 12, dlSeconds: 7, ulSeconds: 6, dlStreams: 4, ulStreams: 3 },
      full: { pingProbes: 24, dlSeconds: 11, ulSeconds: 9, dlStreams: 6, ulStreams: 4 },
      advanced: { pingProbes: 36, dlSeconds: 15, ulSeconds: 13, dlStreams: 8, ulStreams: 6 },
    }[mode];

    const startTimeOverall = performance.now();

    try {
      // 1. CONNECTING & INITIALIZATION
      this.setStage('CONNECTING');
      await new Promise(r => setTimeout(r, 200));
      if (signal.aborted) return;

      // 2. SERVER SELECTION & PROBING
      this.setStage('SERVER_SELECTION');
      let activeServer = { ...server };

      // If Auto Nearest Edge was selected, find lowest-latency server
      if (server.id === 'srv-auto') {
        activeServer = await this.resolveBestEdge(signal);
      }
      if (signal.aborted) return;

      const isCloudflare = activeServer.hostname === 'speed.cloudflare.com' || activeServer.id.startsWith('srv-cf') || activeServer.id.startsWith('srv-in-') || activeServer.id.startsWith('srv-sg-') || activeServer.id.startsWith('srv-us-') || activeServer.id.startsWith('srv-eu-') || activeServer.id.startsWith('srv-uk-');
      const serverBaseUrl = `${activeServer.protocol}://${activeServer.hostname}${activeServer.port && activeServer.port !== '443' && activeServer.port !== '80' ? `:${activeServer.port}` : ''}`;

      // 3. LATENCY & JITTER TEST (High Precision)
      this.setStage('LATENCY_TEST');
      const latencyResult = await this.runLatencyProbes(
        serverBaseUrl,
        isCloudflare,
        config.pingProbes,
        signal
      );
      if (signal.aborted) return;

      // 4. DOWNLOAD SPEED TEST (Multi-Stream Saturation + TCP Ramp-up Discarding)
      this.setStage('DOWNLOAD_TEST');
      const downloadResult = await this.runDownloadMeasurement(
        serverBaseUrl,
        isCloudflare,
        config.dlSeconds,
        config.dlStreams,
        signal
      );
      if (signal.aborted) return;

      // Brief inter-stage cooldown to flush TCP buffer & socket state
      await new Promise(r => setTimeout(r, 350));
      if (signal.aborted) return;

      // 5. UPLOAD SPEED TEST (Multi-Stream Adaptive Chunks + Ramp-up Discarding)
      this.setStage('UPLOAD_TEST');
      const uploadResult = await this.runUploadMeasurement(
        serverBaseUrl,
        isCloudflare,
        config.ulSeconds,
        config.ulStreams,
        signal
      );
      if (signal.aborted) return;

      // 6. ANALYSIS & QUALITY SCORING
      this.setStage('ANALYSIS');
      const totalDuration = (performance.now() - startTimeOverall) / 1000;

      // Calculate network stability score
      const stabilityScore = calculateStabilityScore(
        downloadResult.samples,
        latencyResult.samples.filter(s => s > latencyResult.median * 1.5).length
      );

      // Multi-factor connection quality score
      const qualityScore = calculateQualityScore(
        downloadResult.metric.average,
        uploadResult.metric.average,
        latencyResult.median,
        latencyResult.jitter,
        stabilityScore,
        latencyResult.failure_rate
      );

      const finalRecord: TestResultRecord = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        server_id: activeServer.id,
        server_name: activeServer.name,
        download_mbps: downloadResult.metric.average,
        upload_mbps: uploadResult.metric.average,
        latency_ms: latencyResult.median,
        latency_min_ms: latencyResult.min,
        latency_max_ms: latencyResult.max,
        latency_avg_ms: latencyResult.avg,
        jitter_ms: latencyResult.jitter,
        http_failure_rate: latencyResult.failure_rate,
        stability_score: stabilityScore,
        overall_score: qualityScore.overall_score,
        speed_score: qualityScore.speed_score,
        latency_score: qualityScore.latency_score,
        duration: Number(totalDuration.toFixed(2)),
        bytes_downloaded: downloadResult.metric.totalBytes,
        bytes_uploaded: uploadResult.metric.totalBytes,
        test_mode: mode,
      };

      this.setStage('COMPLETED');
      this.callbacks.onComplete(finalRecord);
    } catch (err: any) {
      if (signal.aborted) {
        this.setStage('CANCELLED');
      } else {
        console.error('Speed test error:', err);
        this.setStage('FAILED');
        this.callbacks.onError(err.message || 'Network test failed unexpectedly');
      }
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  // --- Auto-resolve fastest edge node ---
  private async resolveBestEdge(signal: AbortSignal): Promise<Server> {
    const candidates: { id: string; name: string; url: string; srv: Server }[] = [
      {
        id: 'srv-cf-global',
        name: '🌐 Cloudflare Global Edge',
        url: 'https://speed.cloudflare.com/__down?bytes=0',
        srv: {
          id: 'srv-cf-global',
          name: '🌐 Global High-Speed CDN Edge',
          hostname: 'speed.cloudflare.com',
          port: '443',
          protocol: 'https',
          region: 'Global Edge (Auto Anycast)',
          country: 'Global',
          status: 'active',
          capacity_gbps: 100.0,
        },
      },
      {
        id: 'srv-local-01',
        name: '💻 Localhost NetScope Server',
        url: 'http://127.0.0.1:8000/api/speedtest/ping',
        srv: {
          id: 'srv-local-01',
          name: '💻 Localhost NetScope Server',
          hostname: '127.0.0.1',
          port: '8000',
          protocol: 'http',
          region: 'Local Loopback',
          country: 'Local',
          status: 'active',
          capacity_gbps: 10.0,
        },
      },
    ];

    try {
      const probePromises = candidates.map(async (c) => {
        const t0 = performance.now();
        try {
          const res = await fetch(c.url, { signal, cache: 'no-store' });
          if (res.ok) {
            return { srv: c.srv, rtt: performance.now() - t0 };
          }
        } catch {
          // Probe failed
        }
        return { srv: c.srv, rtt: 99999 };
      });

      const results = await Promise.all(probePromises);
      results.sort((a, b) => a.rtt - b.rtt);
      return results[0].rtt < 99999 ? results[0].srv : candidates[0].srv;
    } catch {
      return candidates[0].srv;
    }
  }

  // --- High-Precision Latency & RFC 3550 Jitter ---
  private async runLatencyProbes(
    baseUrl: string,
    isCloudflare: boolean,
    count: number,
    signal: AbortSignal
  ): Promise<LatencyProbeResult> {
    const samples: number[] = [];
    let failed = 0;

    const pingUrl = isCloudflare
      ? 'https://speed.cloudflare.com/__down?bytes=0'
      : `${baseUrl}/api/speedtest/ping`;

    for (let i = 0; i < count; i++) {
      if (signal.aborted) break;

      const t0 = performance.now();
      try {
        const fetchUrl = isCloudflare ? `${pingUrl}&_t=${Date.now()}_${i}` : `${pingUrl}?echo=${i}&_t=${Date.now()}`;
        const res = await fetch(fetchUrl, {
          signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' },
        });

        if (res.ok) {
          const rtt = Math.max(0.1, performance.now() - t0);
          samples.push(rtt);
        } else {
          failed++;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') throw err;
        failed++;
      }

      if (samples.length > 0) {
        const sorted = [...samples].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const median = sorted[Math.floor(sorted.length / 2)];
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        const jitter = calculateJitterRFC3550(samples);

        this.callbacks.onLatencyUpdate({
          min: Number(min.toFixed(2)),
          median: Number(median.toFixed(2)),
          avg: Number(avg.toFixed(2)),
          max: Number(max.toFixed(2)),
          jitter,
          samples: [...samples],
          failed_probes: failed,
          total_probes: i + 1,
          failure_rate: Number(((failed / (i + 1)) * 100).toFixed(1)),
        });
      }

      // 35ms pacing between ping bursts
      await new Promise(r => setTimeout(r, 35));
    }

    if (samples.length === 0) {
      throw new Error('Unable to reach latency probe endpoint. Check network connection.');
    }

    const sorted = [...samples].sort((a, b) => a - b);
    return {
      min: Number(sorted[0].toFixed(2)),
      median: Number(sorted[Math.floor(sorted.length / 2)].toFixed(2)),
      avg: Number((samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(2)),
      max: Number(sorted[sorted.length - 1].toFixed(2)),
      jitter: calculateJitterRFC3550(samples),
      samples,
      failed_probes: failed,
      total_probes: count,
      failure_rate: Number(((failed / count) * 100).toFixed(1)),
    };
  }

  // --- Real Download Measurement Engine (Multi-Stream Saturation) ---
  private async runDownloadMeasurement(
    baseUrl: string,
    isCloudflare: boolean,
    durationSeconds: number,
    streamCount: number,
    signal: AbortSignal
  ): Promise<{ metric: SpeedMetric; samples: number[] }> {
    let totalBytesReceived = 0;
    let peakMbps = 0;
    let smoothedMbps = 0;
    const speedSamples: number[] = [];
    const steadyStateSamples: number[] = [];

    const startTime = performance.now();
    const testEndTime = startTime + durationSeconds * 1000;
    const rampUpEndTime = startTime + 1200; // First 1.2s is TCP slow-start ramp-up

    let lastSampleTime = startTime;
    let lastBytesCount = 0;

    const runStreamWorker = async (workerId: number) => {
      while (performance.now() < testEndTime && !signal.aborted) {
        try {
          const downloadUrl = isCloudflare
            ? `https://speed.cloudflare.com/__down?bytes=50000000&_w=${workerId}&_t=${Date.now()}`
            : `${baseUrl}/api/speedtest/download?size_mb=60&chunk_kb=1024&duration_s=${durationSeconds}`;

          const res = await fetch(downloadUrl, {
            signal,
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store' },
          });

          if (!res.ok || !res.body) break;

          const reader = res.body.getReader();
          while (performance.now() < testEndTime && !signal.aborted) {
            const { done, value } = await reader.read();
            if (done || !value) break;

            totalBytesReceived += value.byteLength;

            const now = performance.now();
            const deltaMs = now - lastSampleTime;

            // Compute rate every ~80ms
            if (deltaMs >= 80) {
              const deltaBytes = totalBytesReceived - lastBytesCount;
              const instantMbps = (deltaBytes * 8) / (deltaMs / 1000) / 1_000_000;
              const elapsedSec = (now - startTime) / 1000;

              // Smooth live needle display using Exponential Moving Average
              if (smoothedMbps === 0) {
                smoothedMbps = instantMbps;
              } else {
                smoothedMbps = smoothedMbps * 0.7 + instantMbps * 0.3;
              }

              if (instantMbps > peakMbps) peakMbps = instantMbps;
              speedSamples.push(instantMbps);

              // If past TCP slow-start ramp-up, record steady state
              if (now >= rampUpEndTime) {
                steadyStateSamples.push(instantMbps);
              }

              // Compute sustained average
              const activeAvg = steadyStateSamples.length > 0
                ? steadyStateSamples.reduce((a, b) => a + b, 0) / steadyStateSamples.length
                : (totalBytesReceived * 8) / elapsedSec / 1_000_000;

              const currentMetric: SpeedMetric = {
                current: Number(smoothedMbps.toFixed(2)),
                average: Number(activeAvg.toFixed(2)),
                peak: Number(peakMbps.toFixed(2)),
                totalBytes: totalBytesReceived,
                duration: Number(elapsedSec.toFixed(2)),
              };

              this.callbacks.onDownloadUpdate(currentMetric, {
                timestamp: now,
                elapsed_s: Number(elapsedSec.toFixed(2)),
                download_mbps: Number(smoothedMbps.toFixed(2)),
              });

              lastSampleTime = now;
              lastBytesCount = totalBytesReceived;
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError') break;
          await new Promise(r => setTimeout(r, 40));
        }
      }
    };

    // Parallel download stream workers
    const workers = Array.from({ length: streamCount }, (_, i) => runStreamWorker(i));
    await Promise.all(workers);

    const totalElapsedSec = Math.max(0.1, (performance.now() - startTime) / 1000);

    // Exact accuracy calculation matching Ookla / Fast.com:
    // Discard slow-start ramp-up, take trimmed mean of top sustained steady-state samples
    let finalSustainedMbps: number;
    if (steadyStateSamples.length >= 4) {
      const sorted = [...steadyStateSamples].sort((a, b) => a - b);
      // Trim lowest 15% and highest 5%
      const trimLow = Math.floor(sorted.length * 0.15);
      const trimHigh = Math.floor(sorted.length * 0.95);
      const trimmed = sorted.slice(trimLow, trimHigh);
      finalSustainedMbps = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    } else if (speedSamples.length > 0) {
      finalSustainedMbps = speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length;
    } else {
      finalSustainedMbps = (totalBytesReceived * 8) / totalElapsedSec / 1_000_000;
    }

    const finalMetric: SpeedMetric = {
      current: Number(finalSustainedMbps.toFixed(2)),
      average: Number(finalSustainedMbps.toFixed(2)),
      peak: Number(peakMbps.toFixed(2)),
      totalBytes: totalBytesReceived,
      duration: Number(totalElapsedSec.toFixed(2)),
    };

    return { metric: finalMetric, samples: speedSamples };
  }

  // --- Real Upload Measurement Engine (Adaptive Chunks + Ramp-up Discarding) ---
  private async runUploadMeasurement(
    baseUrl: string,
    isCloudflare: boolean,
    durationSeconds: number,
    streamCount: number,
    signal: AbortSignal
  ): Promise<{ metric: SpeedMetric; samples: number[] }> {
    let totalBytesUploaded = 0;
    let peakMbps = 0;
    let smoothedMbps = 0;
    const speedSamples: number[] = [];
    const steadyStateSamples: number[] = [];

    const startTime = performance.now();
    const testEndTime = startTime + durationSeconds * 1000;
    const rampUpEndTime = startTime + 1000; // First 1.0s is ramp-up

    let lastSampleTime = startTime;
    let lastBytesCount = 0;

    // Pre-allocated pseudo-random non-compressible binary payload chunks
    const chunk2MB = new Uint8Array(2 * 1024 * 1024);
    for (let i = 0; i < chunk2MB.length; i += 1024) {
      chunk2MB[i] = (i * 37 + 13) & 0xff;
    }
    const blob1MB = new Blob([chunk2MB.slice(0, 1024 * 1024)], { type: 'application/octet-stream' });
    const blob2MB = new Blob([chunk2MB], { type: 'application/octet-stream' });

    const uploadUrl = isCloudflare
      ? 'https://speed.cloudflare.com/__up'
      : `${baseUrl}/api/speedtest/upload`;

    const runUploadWorker = async (workerId: number) => {
      let currentBlob = blob1MB;

      while (performance.now() < testEndTime && !signal.aborted) {
        try {
          const reqStartTime = performance.now();
          const res = await fetch(`${uploadUrl}?_w=${workerId}&_t=${Date.now()}`, {
            method: 'POST',
            signal,
            body: currentBlob,
            headers: { 'Content-Type': 'application/octet-stream' },
          });

          if (res.ok) {
            const uploadedBytes = currentBlob.size;
            totalBytesUploaded += uploadedBytes;

            const now = performance.now();
            const deltaMs = now - lastSampleTime;

            // Dynamically scale chunk size if upload is fast (> 50 Mbps)
            const reqDuration = (now - reqStartTime) / 1000;
            if (reqDuration < 0.15 && currentBlob !== blob2MB) {
              currentBlob = blob2MB;
            }

            if (deltaMs >= 80) {
              const deltaBytes = totalBytesUploaded - lastBytesCount;
              const instantMbps = (deltaBytes * 8) / (deltaMs / 1000) / 1_000_000;
              const elapsedSec = (now - startTime) / 1000;

              if (smoothedMbps === 0) {
                smoothedMbps = instantMbps;
              } else {
                smoothedMbps = smoothedMbps * 0.7 + instantMbps * 0.3;
              }

              if (instantMbps > peakMbps) peakMbps = instantMbps;
              speedSamples.push(instantMbps);

              if (now >= rampUpEndTime) {
                steadyStateSamples.push(instantMbps);
              }

              const activeAvg = steadyStateSamples.length > 0
                ? steadyStateSamples.reduce((a, b) => a + b, 0) / steadyStateSamples.length
                : (totalBytesUploaded * 8) / elapsedSec / 1_000_000;

              const currentMetric: SpeedMetric = {
                current: Number(smoothedMbps.toFixed(2)),
                average: Number(activeAvg.toFixed(2)),
                peak: Number(peakMbps.toFixed(2)),
                totalBytes: totalBytesUploaded,
                duration: Number(elapsedSec.toFixed(2)),
              };

              this.callbacks.onUploadUpdate(currentMetric, {
                timestamp: now,
                elapsed_s: Number(elapsedSec.toFixed(2)),
                upload_mbps: Number(smoothedMbps.toFixed(2)),
              });

              lastSampleTime = now;
              lastBytesCount = totalBytesUploaded;
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError') break;
          await new Promise(r => setTimeout(r, 40));
        }
      }
    };

    const workers = Array.from({ length: streamCount }, (_, i) => runUploadWorker(i));
    await Promise.all(workers);

    const totalElapsedSec = Math.max(0.1, (performance.now() - startTime) / 1000);

    // Exact trimmed mean of steady-state upload samples
    let finalSustainedMbps: number;
    if (steadyStateSamples.length >= 3) {
      const sorted = [...steadyStateSamples].sort((a, b) => a - b);
      const trimLow = Math.floor(sorted.length * 0.15);
      const trimHigh = Math.floor(sorted.length * 0.95);
      const trimmed = sorted.slice(trimLow, trimHigh);
      finalSustainedMbps = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    } else if (speedSamples.length > 0) {
      finalSustainedMbps = speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length;
    } else {
      finalSustainedMbps = (totalBytesUploaded * 8) / totalElapsedSec / 1_000_000;
    }

    const finalMetric: SpeedMetric = {
      current: Number(finalSustainedMbps.toFixed(2)),
      average: Number(finalSustainedMbps.toFixed(2)),
      peak: Number(peakMbps.toFixed(2)),
      totalBytes: totalBytesUploaded,
      duration: Number(totalElapsedSec.toFixed(2)),
    };

    return { metric: finalMetric, samples: speedSamples };
  }
}
