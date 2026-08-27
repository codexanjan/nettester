import { QualityScore } from '../types';

export function calculateJitterRFC3550(rttSamples: number[]): number {
  if (rttSamples.length < 2) return 0;
  let diffSum = 0;
  for (let i = 0; i < rttSamples.length - 1; i++) {
    diffSum += Math.abs(rttSamples[i + 1] - rttSamples[i]);
  }
  return Number((diffSum / (rttSamples.length - 1)).toFixed(2));
}

export function calculateSpeedScore(downloadMbps: number, uploadMbps: number): number {
  if (downloadMbps <= 0) return 0;
  const effectiveMbps = (downloadMbps * 0.75) + (uploadMbps * 0.25);
  const score = 20.0 * Math.log10(Math.max(1.0, effectiveMbps) + 1.0) * 1.6;
  return Math.max(0, Math.min(100, Number(score.toFixed(1))));
}

export function calculateLatencyScore(latencyMs: number): number {
  if (latencyMs <= 0) return 100;
  let score = 0;
  if (latencyMs <= 15) {
    score = 100 - (latencyMs * 0.4);
  } else if (latencyMs <= 50) {
    score = 94 - ((latencyMs - 15) * 0.55);
  } else if (latencyMs <= 120) {
    score = 75 - ((latencyMs - 50) * 0.45);
  } else {
    score = Math.max(0, 43.5 - ((latencyMs - 120) * 0.25));
  }
  return Math.max(0, Math.min(100, Number(score.toFixed(1))));
}

export function calculateJitterScore(jitterMs: number): number {
  if (jitterMs <= 0) return 100;
  let score = 0;
  if (jitterMs <= 3.0) {
    score = 100 - (jitterMs * 1.5);
  } else if (jitterMs <= 10.0) {
    score = 95.5 - ((jitterMs - 3.0) * 2.5);
  } else if (jitterMs <= 30.0) {
    score = 78 - ((jitterMs - 10.0) * 1.8);
  } else {
    score = Math.max(0, 42 - ((jitterMs - 30.0) * 0.8));
  }
  return Math.max(0, Math.min(100, Number(score.toFixed(1))));
}

export function calculateStabilityScore(
  speedSamples: number[],
  latencySpikesCount: number = 0
): number {
  if (!speedSamples || speedSamples.length < 3) return 90.0;
  
  const validSamples = speedSamples.slice(Math.max(1, Math.floor(speedSamples.length / 10)));
  const meanSpeed = validSamples.reduce((a, b) => a + b, 0) / validSamples.length;
  if (meanSpeed <= 0) return 0;

  const variance = validSamples.reduce((acc, val) => acc + Math.pow(val - meanSpeed, 2), 0) / validSamples.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / meanSpeed;

  const cvScore = Math.max(0, 100 - (cv * 85.0));
  const spikePenalty = Math.min(25, latencySpikesCount * 5.0);

  return Math.max(0, Math.min(100, Number((cvScore - spikePenalty).toFixed(1))));
}

export function calculateQualityScore(
  downloadMbps: number,
  uploadMbps: number,
  latencyMs: number,
  jitterMs: number,
  stabilityScore: number,
  httpFailureRate: number = 0
): QualityScore {
  const speedScore = calculateSpeedScore(downloadMbps, uploadMbps);
  const latencyScore = calculateLatencyScore(latencyMs);
  const jitterScore = calculateJitterScore(jitterMs);
  const httpSuccessScore = Math.max(0, 100 - httpFailureRate);

  const overall = (
    (speedScore * 0.35) +
    (latencyScore * 0.25) +
    (jitterScore * 0.15) +
    (stabilityScore * 0.20) +
    (httpSuccessScore * 0.05)
  );

  const overallClamped = Math.max(0, Math.min(100, Number(overall.toFixed(1))));

  let rating: QualityScore['rating'] = 'Poor';
  let description = '';

  if (overallClamped >= 90) {
    rating = 'Excellent';
    description = 'Optimal for 4K/8K streaming, competitive multiplayer gaming, and heavy workloads.';
  } else if (overallClamped >= 80) {
    rating = 'Very Good';
    description = 'Great performance for smooth video conferences, cloud gaming, and rapid downloads.';
  } else if (overallClamped >= 65) {
    rating = 'Good';
    description = 'Reliable for standard web browsing, HD streaming, and casual use.';
  } else if (overallClamped >= 45) {
    rating = 'Fair';
    description = 'Usable for basic browsing; bandwidth-heavy tasks or gaming may experience lag.';
  } else {
    rating = 'Poor';
    description = 'Severe connection bottlenecks or latency delays detected.';
  }

  return {
    overall_score: overallClamped,
    speed_score: speedScore,
    latency_score: latencyScore,
    jitter_score: jitterScore,
    stability_score: stabilityScore,
    http_success_score: httpSuccessScore,
    rating,
    description,
    weights: {
      speed: '35%',
      latency: '25%',
      jitter: '15%',
      stability: '20%',
      http_reliability: '5%'
    }
  };
}
