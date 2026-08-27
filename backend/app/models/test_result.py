import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime
from app.core.database import Base

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Anonymized client identifier (hash only, never raw IP)
    client_ip_hash = Column(String(64), index=True, nullable=True)
    
    server_id = Column(String(64), nullable=True)
    server_name = Column(String(128), nullable=True)
    
    # Real measurements
    download_mbps = Column(Float, nullable=False)
    upload_mbps = Column(Float, nullable=False)
    latency_ms = Column(Float, nullable=False)
    latency_min_ms = Column(Float, nullable=True)
    latency_max_ms = Column(Float, nullable=True)
    latency_avg_ms = Column(Float, nullable=True)
    jitter_ms = Column(Float, nullable=False)
    
    http_failure_rate = Column(Float, default=0.0) # Percentage (0-100)
    stability_score = Column(Float, nullable=False) # 0-100
    overall_score = Column(Float, nullable=False)   # 0-100
    speed_score = Column(Float, nullable=True)
    latency_score = Column(Float, nullable=True)
    
    duration = Column(Float, nullable=False) # Total test duration in seconds
    bytes_downloaded = Column(Integer, default=0)
    bytes_uploaded = Column(Integer, default=0)
    
    test_mode = Column(String(32), default="full") # quick, full, advanced
