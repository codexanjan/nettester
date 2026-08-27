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

    // Test duration parameters by mode
    const config = {
      quick: { pingProbes: 10, dlSeconds: 6, ulSeconds: 5, dlStreams: 2, ulStreams: 2 },
      full: { pingProbes: 20, dlSeconds: 10, ulSeconds: 8, dlStreams: 4, ulStreams: 3 },
      advanced: { pingProbes: 30, dlSeconds: 14, ulSeconds: 12, dlStreams: 4, ulStreams: 4 },
    }[mode];

    const serverBaseUrl = `${server.protocol}://${server.hostname}:${server.port}`;
    const startTimeOverall = performance.now();

    try {
      // 1. CONNECTING
      this.setStage('CONNECTING');
      await new Promise(r => setTimeout(r, 250));
      if (signal.aborted) return;

      // 2. SERVER SELECTION / VERIFICATION
      this.setStage('SERVER_SELECTION');
      await new Promise(r => setTimeout(r, 200));
      if (signal.aborted) return;

      // 3. LATENCY & JITTER TEST
      this.setStage('LATENCY_TEST');
      const latencyResult = await this.runLatencyProbes(serverBaseUrl, config.pingProbes, signal);
      if (signal.aborted) return;

      // 4. DOWNLOAD TEST
      this.setStage('DOWNLOAD_TEST');
      const downloadResult = await this.runDownloadMeasurement(
        serverBaseUrl,
        config.dlSeconds,
        config.dlStreams,
        signal
      );
      if (signal.aborted) return;

      // Brief rest between download & upload to let socket buffers clear
      await new Promise(r => setTimeout(r, 300));
      if (signal.aborted) return;

      // 5. UPLOAD TEST
      this.setStage('UPLOAD_TEST');
      const uploadResult = await this.runUploadMeasurement(
        serverBaseUrl,
        config.ulSeconds,
        config.ulStreams,
        signal
      );
      if (signal.aborted) return;

      // 6. ANALYSIS & QUALITY SCORING
      this.setStage('ANALYSIS');
      
      const totalDuration = (performance.now() - startTimeOverall) / 1000;
      
      // Calculate stability from combined download speed samples
      const stabilityScore = calculateStabilityScore(
        downloadResult.samples,
        latencyResult.samples.filter(s => s > latencyResult.median * 1.5).length
      );

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
        server_id: server.id,
        server_name: server.name,
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

  // --- Real Latency & Jitter Probes ---
  private async runLatencyProbes(
    baseUrl: string,
    count: number,
    signal: AbortSignal
  ): Promise<LatencyProbeResult> {
    const samples: number[] = [];
    let failed = 0;

    for (let i = 0; i < count; i++) {
      if (signal.aborted) break;

      const t0 = performance.now();
      try {
        const res = await fetch(`${baseUrl}/api/speedtest/ping?echo=${i}`, {
          signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
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

      // Compute incremental progress
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

      // Small pacing delay between probes (50ms)
      await new Promise(r => setTimeout(r, 45));
    }

    if (samples.length === 0) {
      throw new Error('Unable to reach latency probe endpoint');
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

  // --- Real Download Measurement Engine ---
  private async runDownloadMeasurement(
    baseUrl: string,
    durationSeconds: number,
    streamCount: number,
    signal: AbortSignal
  ): Promise<{ metric: SpeedMetric; samples: number[] }> {
    let totalBytesReceived = 0;
    let peakMbps = 0;
    const speedSamples: number[] = [];
    const startTime = performance.now();
    const testEndTime = startTime + durationSeconds * 1000;

    let lastSampleTime = startTime;
    let lastBytesCount = 0;

    // Single active stream worker
    const runStreamWorker = async (workerId: number) => {
      while (performance.now() < testEndTime && !signal.aborted) {
        try {
          const res = await fetch(
            `${baseUrl}/api/speedtest/download?size_mb=25&chunk_kb=256&duration_s=${durationSeconds}`,
            {
              signal,
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache' },
            }
          );

          if (!res.ok || !res.body) break;

          const reader = res.body.getReader();
          while (performance.now() < testEndTime && !signal.aborted) {
            const { done, value } = await reader.read();
            if (done || !value) break;

            totalBytesReceived += value.byteLength;

            // Emit live sample every ~100ms
            const now = performance.now();
            const deltaMs = now - lastSampleTime;

            if (deltaMs >= 100) {
              const deltaBytes = totalBytesReceived - lastBytesCount;
              const instantMbps = (deltaBytes * 8) / (deltaMs / 1000) / 1_000_000;
              const elapsedSec = (now - startTime) / 1000;
              const avgMbps = (totalBytesReceived * 8) / elapsedSec / 1_000_000;

              if (instantMbps > peakMbps) peakMbps = instantMbps;
              speedSamples.push(instantMbps);

              const currentMetric: SpeedMetric = {
                current: Number(instantMbps.toFixed(2)),
                average: Number(avgMbps.toFixed(2)),
                peak: Number(peakMbps.toFixed(2)),
                totalBytes: totalBytesReceived,
                duration: Number(elapsedSec.toFixed(2)),
              };

              this.callbacks.onDownloadUpdate(currentMetric, {
                timestamp: now,
                elapsed_s: Number(elapsedSec.toFixed(2)),
                download_mbps: Number(instantMbps.toFixed(2)),
              });

              lastSampleTime = now;
              lastBytesCount = totalBytesReceived;
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError') break;
          // Retry worker if test duration remains
          await new Promise(r => setTimeout(r, 50));
        }
      }
    };

    // Run parallel stream workers
    const workers = Array.from({ length: streamCount }, (_, i) => runStreamWorker(i));
    await Promise.all(workers);

    const totalElapsedSec = Math.max(0.1, (performance.now() - startTime) / 1000);
    const finalAvgMbps = (totalBytesReceived * 8) / totalElapsedSec / 1_000_000;

    const finalMetric: SpeedMetric = {
      current: Number(finalAvgMbps.toFixed(2)),
      average: Number(finalAvgMbps.toFixed(2)),
      peak: Number(peakMbps.toFixed(2)),
      totalBytes: totalBytesReceived,
      duration: Number(totalElapsedSec.toFixed(2)),
    };

    return { metric: finalMetric, samples: speedSamples };
  }

  // --- Real Upload Measurement Engine ---
  private async runUploadMeasurement(
    baseUrl: string,
    durationSeconds: number,
    streamCount: number,
    signal: AbortSignal
  ): Promise<{ metric: SpeedMetric; samples: number[] }> {
    let totalBytesUploaded = 0;
    let peakMbps = 0;
    const speedSamples: number[] = [];
    const startTime = performance.now();
    const testEndTime = startTime + durationSeconds * 1000;

    let lastSampleTime = startTime;
    let lastBytesCount = 0;

    // Generate 1MB client test chunk
    const chunkBuffer = new Uint8Array(1024 * 1024);
    for (let i = 0; i < chunkBuffer.length; i += 1024) {
      chunkBuffer[i] = (i * 31) & 0xff;
    }
    const chunkBlob = new Blob([chunkBuffer]);

    const runUploadWorker = async (workerId: number) => {
      while (performance.now() < testEndTime && !signal.aborted) {
        try {
          const chunkStartTime = performance.now();
          const res = await fetch(`${baseUrl}/api/speedtest/upload`, {
            method: 'POST',
            signal,
            body: chunkBlob,
            headers: { 'Content-Type': 'application/octet-stream' },
          });

          if (res.ok) {
            const chunkDuration = Math.max(0.001, (performance.now() - chunkStartTime) / 1000);
            const chunkBytes = chunkBlob.size;
            totalBytesUploaded += chunkBytes;

            const now = performance.now();
            const deltaMs = now - lastSampleTime;

            if (deltaMs >= 100) {
              const deltaBytes = totalBytesUploaded - lastBytesCount;
              const instantMbps = (deltaBytes * 8) / (deltaMs / 1000) / 1_000_000;
              const elapsedSec = (now - startTime) / 1000;
              const avgMbps = (totalBytesUploaded * 8) / elapsedSec / 1_000_000;

              if (instantMbps > peakMbps) peakMbps = instantMbps;
              speedSamples.push(instantMbps);

              const currentMetric: SpeedMetric = {
                current: Number(instantMbps.toFixed(2)),
                average: Number(avgMbps.toFixed(2)),
                peak: Number(peakMbps.toFixed(2)),
                totalBytes: totalBytesUploaded,
                duration: Number(elapsedSec.toFixed(2)),
              };

              this.callbacks.onUploadUpdate(currentMetric, {
                timestamp: now,
                elapsed_s: Number(elapsedSec.toFixed(2)),
                upload_mbps: Number(instantMbps.toFixed(2)),
              });

              lastSampleTime = now;
              lastBytesCount = totalBytesUploaded;
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError') break;
          await new Promise(r => setTimeout(r, 50));
        }
      }
    };

    const workers = Array.from({ length: streamCount }, (_, i) => runUploadWorker(i));
    await Promise.all(workers);

    const totalElapsedSec = Math.max(0.1, (performance.now() - startTime) / 1000);
    const finalAvgMbps = (totalBytesUploaded * 8) / totalElapsedSec / 1_000_000;

    const finalMetric: SpeedMetric = {
      current: Number(finalAvgMbps.toFixed(2)),
      average: Number(finalAvgMbps.toFixed(2)),
      peak: Number(peakMbps.toFixed(2)),
      totalBytes: totalBytesUploaded,
      duration: Number(totalElapsedSec.toFixed(2)),
    };

    return { metric: finalMetric, samples: speedSamples };
  }
}
