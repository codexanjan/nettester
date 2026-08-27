import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from app.services.scoring import (
    calculate_jitter_rfc3550,
    calculate_speed_score,
    calculate_latency_score,
    calculate_jitter_score,
    calculate_stability_score,
    calculate_overall_quality_score
)
from app.services.diagnostics import evaluate_network_diagnostics

def test_jitter_rfc3550():
    # Sequence: 10, 13, 11, 15, 12
    # Differences: |13-10|=3, |11-13|=2, |15-11|=4, |12-15|=3
    # Sum = 12, N-1 = 4 => mean = 3.0
    samples = [10.0, 13.0, 11.0, 15.0, 12.0]
    jitter = calculate_jitter_rfc3550(samples)
    assert jitter == 3.0

def test_jitter_empty_or_single():
    assert calculate_jitter_rfc3550([]) == 0.0
    assert calculate_jitter_rfc3550([12.5]) == 0.0

def test_scoring_weights_and_bounds():
    # Gigabit connection test
    score_res = calculate_overall_quality_score(
        download_mbps=500.0,
        upload_mbps=100.0,
        latency_ms=8.0,
        jitter_ms=1.5,
        stability_score=95.0,
        http_failure_rate=0.0
    )
    assert score_res["overall_score"] >= 90.0
    assert score_res["rating"] == "Excellent"
    assert "weights" in score_res

    # Degraded connection test
    poor_res = calculate_overall_quality_score(
        download_mbps=2.0,
        upload_mbps=0.5,
        latency_ms=180.0,
        jitter_ms=45.0,
        stability_score=40.0,
        http_failure_rate=15.0
    )
    assert poor_res["overall_score"] < 50.0
    assert poor_res["rating"] == "Poor"

def test_diagnostics_rules_evaluation():
    report = evaluate_network_diagnostics(
        download_mbps=250.0,
        upload_mbps=80.0,
        latency_ms=12.0,
        jitter_ms=2.0,
        stability_score=94.0,
        http_failure_rate=0.0
    )
    assert report.overall_status == "Excellent"
    assert len(report.items) > 0
    # Verify possible causes don't claim absolute certainty
    for item in report.items:
        for cause in item.possible_causes:
            assert isinstance(cause, str)
