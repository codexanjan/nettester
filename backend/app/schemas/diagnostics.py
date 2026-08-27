from typing import List, Optional
from pydantic import BaseModel

class DiagnosticItem(BaseModel):
    category: str # "speed", "latency", "jitter", "stability", "general"
    severity: str # "info", "success", "warning", "critical"
    title: str
    description: str
    possible_causes: List[str] = []
    recommendations: List[str] = []

class DiagnosticReport(BaseModel):
    overall_status: str # "Excellent", "Good", "Fair", "Degraded", "Unstable"
    connection_type_estimate: str
    items: List[DiagnosticItem]
    metrics_summary: dict
    timestamp: float

class AIDoctorRequest(BaseModel):
    download_mbps: float
    upload_mbps: float
    latency_ms: float
    jitter_ms: float
    stability_score: float
    http_failure_rate: float = 0.0
    server_name: Optional[str] = None
    historical_avg_download: Optional[float] = None
    historical_avg_latency: Optional[float] = None
    user_notes: Optional[str] = None

class AIDoctorResponse(BaseModel):
    summary: str
    analysis: str
    possible_issues: List[str]
    possible_causes: List[str]
    recommendations: List[str]
    is_ai_generated: bool = False
