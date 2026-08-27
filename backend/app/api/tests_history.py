from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy import select, delete, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import anonymize_ip
from app.models.test_result import TestResult
from app.schemas.test_result import (
    TestResultCreate, TestResultOut, AnalyticsResponse,
    AnalyticsPeriod, PersonalRecords, DegradationAnalysis
)

router = APIRouter(prefix="/tests", tags=["Test History & Analytics"])

@router.post("", response_model=TestResultOut)
async def record_test_result(
    test_in: TestResultCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Records a completed test result in the database.
    Privacy guarantee: Raw IP is hashed and never stored directly in raw form.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    ip_hash = anonymize_ip(client_ip)

    new_result = TestResult(
        client_ip_hash=ip_hash,
        server_id=test_in.server_id,
        server_name=test_in.server_name,
        download_mbps=round(test_in.download_mbps, 2),
        upload_mbps=round(test_in.upload_mbps, 2),
        latency_ms=round(test_in.latency_ms, 2),
        latency_min_ms=round(test_in.latency_min_ms, 2) if test_in.latency_min_ms else None,
        latency_max_ms=round(test_in.latency_max_ms, 2) if test_in.latency_max_ms else None,
        latency_avg_ms=round(test_in.latency_avg_ms, 2) if test_in.latency_avg_ms else None,
        jitter_ms=round(test_in.jitter_ms, 2),
        http_failure_rate=round(test_in.http_failure_rate, 2),
        stability_score=round(test_in.stability_score, 1),
        overall_score=round(test_in.overall_score, 1),
        speed_score=round(test_in.speed_score, 1) if test_in.speed_score else None,
        latency_score=round(test_in.latency_score, 1) if test_in.latency_score else None,
        duration=round(test_in.duration, 2),
        bytes_downloaded=test_in.bytes_downloaded,
        bytes_uploaded=test_in.bytes_uploaded,
        test_mode=test_in.test_mode
    )

    db.add(new_result)
    await db.commit()
    await db.refresh(new_result)
    return new_result

@router.get("", response_model=List[TestResultOut])
async def list_recent_tests(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves recent test history ordered by timestamp descending.
    """
    result = await db.execute(
        select(TestResult).order_by(desc(TestResult.timestamp)).limit(limit)
    )
    return result.scalars().all()

@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Calculates 24h, 7d, 30d performance analytics and personal records
    strictly from recorded measurement data.
    """
    now = datetime.now(timezone.utc)
    
    async def compute_period_stats(since_dt: datetime, period_label: str) -> Optional[AnalyticsPeriod]:
        stmt = select(
            func.count(TestResult.id),
            func.avg(TestResult.download_mbps),
            func.avg(TestResult.upload_mbps),
            func.avg(TestResult.latency_ms),
            func.avg(TestResult.jitter_ms),
            func.avg(TestResult.stability_score),
            func.avg(TestResult.overall_score),
            func.max(TestResult.download_mbps),
            func.max(TestResult.upload_mbps),
            func.min(TestResult.latency_ms),
            func.min(TestResult.jitter_ms),
            func.min(TestResult.download_mbps)
        ).where(TestResult.timestamp >= since_dt)
        
        res = await db.execute(stmt)
        row = res.first()
        if not row or row[0] == 0:
            return None
            
        return AnalyticsPeriod(
            period=period_label,
            test_count=row[0],
            avg_download_mbps=round(row[1] or 0.0, 2),
            avg_upload_mbps=round(row[2] or 0.0, 2),
            avg_latency_ms=round(row[3] or 0.0, 2),
            avg_jitter_ms=round(row[4] or 0.0, 2),
            avg_stability_score=round(row[5] or 0.0, 1),
            avg_overall_score=round(row[6] or 0.0, 1),
            best_download_mbps=round(row[7] or 0.0, 2),
            best_upload_mbps=round(row[8] or 0.0, 2),
            lowest_latency_ms=round(row[9] or 0.0, 2),
            lowest_jitter_ms=round(row[10] or 0.0, 2),
            worst_download_mbps=round(row[11] or 0.0, 2)
        )

    # 24h, 7d, 30d summaries
    summary_24h = await compute_period_stats(now - timedelta(days=1), "24h")
    summary_7d = await compute_period_stats(now - timedelta(days=7), "7d")
    summary_30d = await compute_period_stats(now - timedelta(days=30), "30d")

    # All-time Personal Records
    rec_stmt = select(
        func.max(TestResult.download_mbps),
        func.max(TestResult.upload_mbps),
        func.min(TestResult.latency_ms),
        func.min(TestResult.jitter_ms),
        func.max(TestResult.overall_score)
    )
    rec_res = await db.execute(rec_stmt)
    rec_row = rec_res.first()

    records = PersonalRecords(
        fastest_download=round(rec_row[0], 2) if rec_row and rec_row[0] is not None else None,
        fastest_upload=round(rec_row[1], 2) if rec_row and rec_row[1] is not None else None,
        lowest_latency=round(rec_row[2], 2) if rec_row and rec_row[2] is not None else None,
        lowest_jitter=round(rec_row[3], 2) if rec_row and rec_row[3] is not None else None,
        best_overall_score=round(rec_row[4], 1) if rec_row and rec_row[4] is not None else None
    )

    # Recent history list
    recent_res = await db.execute(
        select(TestResult).order_by(desc(TestResult.timestamp)).limit(30)
    )
    recent_history = recent_res.scalars().all()

    return AnalyticsResponse(
        summary_24h=summary_24h,
        summary_7d=summary_7d,
        summary_30d=summary_30d,
        records=records,
        recent_history=recent_history
    )

@router.get("/degradation-check", response_model=DegradationAnalysis)
async def check_degradation(
    current_download_mbps: float,
    db: AsyncSession = Depends(get_db)
):
    """
    Compares current speed against user's actual 7-day average baseline.
    """
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    stmt = select(func.avg(TestResult.download_mbps)).where(TestResult.timestamp >= seven_days_ago)
    res = await db.execute(stmt)
    avg_row = res.scalar()

    if not avg_row or avg_row <= 0:
        return DegradationAnalysis(
            typical_download_mbps=current_download_mbps,
            current_download_mbps=current_download_mbps,
            percentage_change=0.0,
            is_degraded=False,
            message="Insufficient historical baseline to determine degradation."
        )

    pct_change = ((current_download_mbps - avg_row) / avg_row) * 100.0
    is_degraded = pct_change <= -25.0

    if is_degraded:
        msg = f"Significant decrease ({pct_change:.1f}%) compared with your recent average ({avg_row:.1f} Mbps)."
    elif pct_change >= 20.0:
        msg = f"Notable performance improvement (+{pct_change:.1f}%) above your recent average ({avg_row:.1f} Mbps)."
    else:
        msg = f"Performance is consistent with your typical baseline ({avg_row:.1f} Mbps)."

    return DegradationAnalysis(
        typical_download_mbps=round(avg_row, 2),
        current_download_mbps=round(current_download_mbps, 2),
        percentage_change=round(pct_change, 1),
        is_degraded=is_degraded,
        message=msg
    )

@router.delete("")
async def clear_all_history(
    db: AsyncSession = Depends(get_db)
):
    """
    Privacy control: Clears all stored test history.
    """
    await db.execute(delete(TestResult))
    await db.commit()
    return {"status": "success", "message": "All test history cleared successfully"}

@router.get("/{test_id}", response_model=TestResultOut)
async def get_test_by_id(test_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestResult).where(TestResult.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test result not found")
    return test
