from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class TestResultCreate(BaseModel):
    server_id: Optional[str] = None
    server_name: Optional[str] = None
    download_mbps: float
    upload_mbps: float
    latency_ms: float
    latency_min_ms: Optional[float] = None
    latency_max_ms: Optional[float] = None
    latency_avg_ms: Optional[float] = None
    jitter_ms: float
    http_failure_rate: float = 0.0
    stability_score: float
    overall_score: float
    speed_score: Optional[float] = None
    latency_score: Optional[float] = None
    duration: float
    bytes_downloaded: int = 0
    bytes_uploaded: int = 0
    test_mode: str = "full"

class TestResultOut(BaseModel):
    id: str
    timestamp: datetime
    server_id: Optional[str] = None
    server_name: Optional[str] = None
    download_mbps: float
    upload_mbps: float
    latency_ms: float
    latency_min_ms: Optional[float] = None
    latency_max_ms: Optional[float] = None
    latency_avg_ms: Optional[float] = None
    jitter_ms: float
    http_failure_rate: float
    stability_score: float
    overall_score: float
    speed_score: Optional[float] = None
    latency_score: Optional[float] = None
    duration: float
    bytes_downloaded: int
    bytes_uploaded: int
    test_mode: str

    model_config = ConfigDict(from_attributes=True)

class AnalyticsPeriod(BaseModel):
    period: str # "24h", "7d", "30d"
    test_count: int
    avg_download_mbps: float
    avg_upload_mbps: float
    avg_latency_ms: float
    avg_jitter_ms: float
    avg_stability_score: float
    avg_overall_score: float
    best_download_mbps: float
    best_upload_mbps: float
    lowest_latency_ms: float
    lowest_jitter_ms: float
    worst_download_mbps: float

class PersonalRecords(BaseModel):
    fastest_download: Optional[float] = None
    fastest_upload: Optional[float] = None
    lowest_latency: Optional[float] = None
    lowest_jitter: Optional[float] = None
    best_overall_score: Optional[float] = None

class DegradationAnalysis(BaseModel):
    typical_download_mbps: float
    current_download_mbps: float
    percentage_change: float
    is_degraded: bool
    message: str

class AnalyticsResponse(BaseModel):
    summary_24h: Optional[AnalyticsPeriod] = None
    summary_7d: Optional[AnalyticsPeriod] = None
    summary_30d: Optional[AnalyticsPeriod] = None
    records: PersonalRecords
    recent_history: List[TestResultOut] = []
