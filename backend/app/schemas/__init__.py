from app.schemas.speedtest import PingResponse, UploadResponse, NetworkInfoResponse
from app.schemas.server import ServerBase, ServerCreate, ServerOut, ServerHealthOut
from app.schemas.test_result import (
    TestResultCreate, TestResultOut, AnalyticsPeriod, 
    PersonalRecords, DegradationAnalysis, AnalyticsResponse
)
from app.schemas.diagnostics import DiagnosticItem, DiagnosticReport, AIDoctorRequest, AIDoctorResponse
from app.schemas.admin import AdminMetricsOut, SystemResourceUsage

__all__ = [
    "PingResponse", "UploadResponse", "NetworkInfoResponse",
    "ServerBase", "ServerCreate", "ServerOut", "ServerHealthOut",
    "TestResultCreate", "TestResultOut", "AnalyticsPeriod",
    "PersonalRecords", "DegradationAnalysis", "AnalyticsResponse",
    "DiagnosticItem", "DiagnosticReport", "AIDoctorRequest", "AIDoctorResponse",
    "AdminMetricsOut", "SystemResourceUsage"
]
