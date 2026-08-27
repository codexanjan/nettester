from typing import List, Dict, Any
from pydantic import BaseModel

class SystemResourceUsage(BaseModel):
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_total_mb: float
    active_threads: int
    uptime_seconds: float

class ServerHealthDetail(BaseModel):
    id: str
    name: str
    hostname: str
    region: str
    status: str
    latency_ms: float
    capacity_gbps: float

class AdminMetricsOut(BaseModel):
    system: SystemResourceUsage
    total_tests_completed: int
    tests_last_24h: int
    avg_download_24h: float
    avg_upload_24h: float
    avg_latency_24h: float
    error_rate_percent: float
    active_servers: List[ServerHealthDetail]
    database_status: str
