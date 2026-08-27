from fastapi import APIRouter
from app.schemas.diagnostics import (
    DiagnosticReport, AIDoctorRequest, AIDoctorResponse
)
from app.services.diagnostics import evaluate_network_diagnostics
from app.services.ai_doctor import get_ai_network_doctor_analysis

router = APIRouter(prefix="/diagnostics", tags=["Diagnostics"])

@router.post("/evaluate", response_model=DiagnosticReport)
async def evaluate_diagnostics(
    download_mbps: float,
    upload_mbps: float,
    latency_ms: float,
    jitter_ms: float,
    stability_score: float,
    http_failure_rate: float = 0.0
):
    """
    Evaluates real test metrics using the rules-based diagnostic engine.
    """
    return evaluate_network_diagnostics(
        download_mbps=download_mbps,
        upload_mbps=upload_mbps,
        latency_ms=latency_ms,
        jitter_ms=jitter_ms,
        stability_score=stability_score,
        http_failure_rate=http_failure_rate
    )

@router.post("/ai-doctor", response_model=AIDoctorResponse)
async def ai_network_doctor(req: AIDoctorRequest):
    """
    AI-assisted network interpretation of real measurement samples.
    """
    return await get_ai_network_doctor_analysis(req)
