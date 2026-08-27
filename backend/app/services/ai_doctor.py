import httpx
import json
from app.core.config import settings
from app.schemas.diagnostics import AIDoctorRequest, AIDoctorResponse
from app.services.diagnostics import evaluate_network_diagnostics

async def get_ai_network_doctor_analysis(req: AIDoctorRequest) -> AIDoctorResponse:
    """
    Generates intelligent Network Doctor analysis based strictly on real measurement inputs.
    Never invents or hallucinates fake metrics.
    If GEMINI_API_KEY is available, queries Gemini AI model; otherwise uses an intelligent
    deterministic diagnostic engine.
    """
    # Deterministic fallback evaluation first
    rule_report = evaluate_network_diagnostics(
        download_mbps=req.download_mbps,
        upload_mbps=req.upload_mbps,
        latency_ms=req.latency_ms,
        jitter_ms=req.jitter_ms,
        stability_score=req.stability_score,
        http_failure_rate=req.http_failure_rate
    )
    
    # Try Gemini API if key is present
    if settings.GEMINI_API_KEY:
        try:
            prompt = f"""
You are the NetScope AI Network Doctor. You are analyzing REAL network speed test measurements.
DO NOT hallucinate or alter any metric values. Strictly interpret these actual measured numbers:

- Download Speed: {req.download_mbps:.1f} Mbps
- Upload Speed: {req.upload_mbps:.1f} Mbps
- Latency (RTT): {req.latency_ms:.1f} ms
- Jitter: {req.jitter_ms:.1f} ms
- Connection Stability: {req.stability_score:.1f}%
- HTTP Failure Rate: {req.http_failure_rate:.1f}%
- Server: {req.server_name or 'Default Edge Server'}
- Historical Avg Download: {f"{req.historical_avg_download:.1f} Mbps" if req.historical_avg_download else 'No baseline'}
- Historical Avg Latency: {f"{req.historical_avg_latency:.1f} ms" if req.historical_avg_latency else 'No baseline'}

Provide a JSON response with keys:
1. "summary": Short 1-2 sentence overall diagnosis.
2. "analysis": Clear explanation of the bottlenecks or strengths.
3. "possible_issues": List of 1-3 specific issues detected (or "None" if great).
4. "possible_causes": List of 2-4 possible root causes (use "Possible cause:", not certainties).
5. "recommendations": List of 2-4 concrete, actionable troubleshooting steps.
Return ONLY valid JSON.
"""
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    url,
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"response_mime_type": "application/json"}
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(raw_text)
                    return AIDoctorResponse(
                        summary=parsed.get("summary", "Analysis completed."),
                        analysis=parsed.get("analysis", "Your network connection was evaluated successfully."),
                        possible_issues=parsed.get("possible_issues", []),
                        possible_causes=parsed.get("possible_causes", []),
                        recommendations=parsed.get("recommendations", []),
                        is_ai_generated=True
                    )
        except Exception:
            # Fall through gracefully to deterministic analysis
            pass

    # Built-in Intelligent Deterministic Analysis
    issues = []
    causes = []
    recs = []

    for item in rule_report.items:
        if item.severity in ("warning", "critical"):
            issues.append(f"{item.title}: {item.description}")
            causes.extend(item.possible_causes)
            recs.extend(item.recommendations)

    if not issues:
        issues.append("No network bottlenecks detected.")
        causes.append("Healthy network routing and abundant bandwidth.")
        recs.append("Your connection is running in prime condition. No troubleshooting required.")

    # Deduplicate while preserving order
    causes = list(dict.fromkeys(causes))[:4]
    recs = list(dict.fromkeys(recs))[:4]

    summary = (
        f"Your network demonstrated {req.download_mbps:.1f} Mbps download with "
        f"{req.latency_ms:.1f} ms latency and {req.stability_score:.1f}% stability ({rule_report.overall_status.lower()})."
    )

    analysis_text = (
        f"Based on real telemetry samples, the connection exhibits {rule_report.connection_type_estimate.lower()} characteristics. "
        f"Throughput is {req.download_mbps:.1f} Mbps down / {req.upload_mbps:.1f} Mbps up with {req.jitter_ms:.1f} ms jitter."
    )

    return AIDoctorResponse(
        summary=summary,
        analysis=analysis_text,
        possible_issues=issues[:3],
        possible_causes=causes,
        recommendations=recs,
        is_ai_generated=False
    )
