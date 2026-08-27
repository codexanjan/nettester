import math
from typing import List, Dict, Any, Optional

def calculate_jitter_rfc3550(rtt_samples_ms: List[float]) -> float:
    """
    Calculates jitter using Mean Absolute Successive Difference (RFC 3550 methodology):
    J = (1 / (N - 1)) * sum(|RTT_{i+1} - RTT_i|)
    Returns 0.0 if fewer than 2 samples.
    """
    if len(rtt_samples_ms) < 2:
        return 0.0
    
    diff_sum = sum(
        abs(rtt_samples_ms[i + 1] - rtt_samples_ms[i])
        for i in range(len(rtt_samples_ms) - 1)
    )
    jitter = diff_sum / (len(rtt_samples_ms) - 1)
    return round(jitter, 2)

def calculate_speed_score(download_mbps: float, upload_mbps: float) -> float:
    """
    Calculates speed score on a 0-100 scale using continuous logarithmic curve.
    Evaluates real-world utility:
    - 10 Mbps: ~45 (Basic HD streaming)
    - 50 Mbps: ~75 (Smooth multi-device streaming & working)
    - 100 Mbps: ~86 (Fast broadband)
    - 300+ Mbps: ~95-100 (Gigabit-class performance)
    """
    if download_mbps <= 0:
        return 0.0
    
    # Combined effective throughput (download weighted 75%, upload weighted 25%)
    effective_mbps = (download_mbps * 0.75) + (upload_mbps * 0.25)
    
    # Logarithmic curve scaled from 1 Mbps (10) to 500 Mbps (98)
    score = 20.0 * math.log10(max(1.0, effective_mbps) + 1.0) * 1.6
    return max(0.0, min(100.0, round(score, 1)))

def calculate_latency_score(latency_ms: float) -> float:
    """
    Calculates latency score on a 0-100 scale.
    - <= 10ms: 98-100 (Competitive gaming / real-time)
    - 15-30ms: 88-95 (Excellent broadband)
    - 50ms: 75 (Acceptable)
    - 100ms: 50
    - > 200ms: < 25
    """
    if latency_ms <= 0:
        return 100.0
    
    if latency_ms <= 15:
        score = 100.0 - (latency_ms * 0.4)
    elif latency_ms <= 50:
        score = 94.0 - ((latency_ms - 15) * 0.55)
    elif latency_ms <= 120:
        score = 75.0 - ((latency_ms - 50) * 0.45)
    else:
        score = max(0.0, 43.5 - ((latency_ms - 120) * 0.25))
        
    return max(0.0, min(100.0, round(score, 1)))

def calculate_jitter_score(jitter_ms: float) -> float:
    """
    Calculates jitter quality score on a 0-100 scale.
    - <= 2ms: 98-100 (Rock solid)
    - 5ms: 90
    - 15ms: 70
    - 30ms: 45
    """
    if jitter_ms <= 0:
        return 100.0
    
    if jitter_ms <= 3.0:
        score = 100.0 - (jitter_ms * 1.5)
    elif jitter_ms <= 10.0:
        score = 95.5 - ((jitter_ms - 3.0) * 2.5)
    elif jitter_ms <= 30.0:
        score = 78.0 - ((jitter_ms - 10.0) * 1.8)
    else:
        score = max(0.0, 42.0 - ((jitter_ms - 30.0) * 0.8))
        
    return max(0.0, min(100.0, round(score, 1)))

def calculate_stability_score(
    speed_samples_mbps: List[float],
    latency_spikes_count: int = 0
) -> float:
    """
    Calculates connection stability from actual speed samples variance
    and detected latency spikes.
    """
    if not speed_samples_mbps or len(speed_samples_mbps) < 3:
        return 90.0 # Default baseline if sample window is too short
        
    # Exclude initial warm-up sample (first 10%)
    valid_samples = speed_samples_mbps[max(1, len(speed_samples_mbps) // 10):]
    mean_speed = sum(valid_samples) / len(valid_samples)
    
    if mean_speed <= 0:
        return 0.0
        
    variance = sum((s - mean_speed) ** 2 for s in valid_samples) / len(valid_samples)
    std_dev = math.sqrt(variance)
    coefficient_of_variation = std_dev / mean_speed # CV = std / mean
    
    # Base stability derived from low coefficient of variation
    cv_score = max(0.0, 100.0 - (coefficient_of_variation * 85.0))
    
    # Deduct penalty for detected latency spikes
    spike_penalty = min(25.0, latency_spikes_count * 5.0)
    
    final_stability = max(0.0, min(100.0, cv_score - spike_penalty))
    return round(final_stability, 1)

def calculate_overall_quality_score(
    download_mbps: float,
    upload_mbps: float,
    latency_ms: float,
    jitter_ms: float,
    stability_score: float,
    http_failure_rate: float = 0.0
) -> Dict[str, Any]:
    """
    Transparent Connection Quality Scoring Algorithm with documented weights:
    - Speed Score: 35%
    - Latency Score: 25%
    - Jitter Score: 15%
    - Stability Score: 20%
    - HTTP Success Rate: 5%
    """
    speed_score = calculate_speed_score(download_mbps, upload_mbps)
    latency_score = calculate_latency_score(latency_ms)
    jitter_score = calculate_jitter_score(jitter_ms)
    http_success_score = max(0.0, 100.0 - http_failure_rate)
    
    overall = (
        (speed_score * 0.35) +
        (latency_score * 0.25) +
        (jitter_score * 0.15) +
        (stability_score * 0.20) +
        (http_success_score * 0.05)
    )
    overall = max(0.0, min(100.0, round(overall, 1)))
    
    # Rating Tier
    if overall >= 90.0:
        rating = "Excellent"
        rating_desc = "Optimal for 4K/8K streaming, competitive low-latency gaming, and intensive remote work."
    elif overall >= 80.0:
        rating = "Very Good"
        rating_desc = "Great performance for video conferencing, fast downloads, and smooth streaming."
    elif overall >= 65.0:
        rating = "Good"
        rating_desc = "Reliable for typical day-to-day web browsing, HD video, and casual use."
    elif overall >= 45.0:
        rating = "Fair"
        rating_desc = "Usable, but high-bandwidth tasks or gaming may experience buffering or lag."
    else:
        rating = "Poor"
        rating_desc = "Connection is experiencing severe bottlenecks, high latency, or packet drops."
        
    return {
        "overall_score": overall,
        "speed_score": speed_score,
        "latency_score": latency_score,
        "jitter_score": jitter_score,
        "stability_score": stability_score,
        "http_success_score": http_success_score,
        "rating": rating,
        "description": rating_desc,
        "weights": {
            "speed": "35%",
            "latency": "25%",
            "jitter": "15%",
            "stability": "20%",
            "http_reliability": "5%"
        }
    }
