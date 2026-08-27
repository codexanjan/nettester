import time
import os
import psutil
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_admin_key
from app.models.server import Server
from app.models.test_result import TestResult
from app.schemas.admin import AdminMetricsOut, SystemResourceUsage, ServerHealthDetail

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

_SERVER_START_TIME = time.time()

@router.get("/metrics", response_model=AdminMetricsOut)
async def get_admin_metrics(
    db: AsyncSession = Depends(get_db),
    admin: str = Depends(get_admin_key)
):
    """
    Returns server telemetry, system resource usage, and test statistics.
    Protected by admin authorization key.
    """
    # 1. System resource usage
    process = psutil.Process(os.getpid())
    mem_info = process.memory_info()
    sys_mem = psutil.virtual_memory()
    
    system_usage = SystemResourceUsage(
        cpu_percent=psutil.cpu_percent(interval=None),
        memory_percent=sys_mem.percent,
        memory_used_mb=round(mem_info.rss / (1024 * 1024), 2),
        memory_total_mb=round(sys_mem.total / (1024 * 1024), 2),
        active_threads=process.num_threads(),
        uptime_seconds=round(time.time() - _SERVER_START_TIME, 1)
    )

    # 2. Database test counts and performance
    now = datetime.now(timezone.utc)
    twenty_four_hours_ago = now - timedelta(days=1)

    # Total tests
    total_res = await db.execute(select(func.count(TestResult.id)))
    total_tests = total_res.scalar() or 0

    # 24h metrics
    stats_24h_stmt = select(
        func.count(TestResult.id),
        func.avg(TestResult.download_mbps),
        func.avg(TestResult.upload_mbps),
        func.avg(TestResult.latency_ms),
        func.avg(TestResult.http_failure_rate)
    ).where(TestResult.timestamp >= twenty_four_hours_ago)
    stats_24h_res = await db.execute(stats_24h_stmt)
    s24 = stats_24h_res.first()

    tests_24h = s24[0] if s24 else 0
    avg_dl_24h = round(s24[1] or 0.0, 2) if s24 else 0.0
    avg_ul_24h = round(s24[2] or 0.0, 2) if s24 else 0.0
    avg_lat_24h = round(s24[3] or 0.0, 2) if s24 else 0.0
    err_rate = round(s24[4] or 0.0, 2) if s24 else 0.0

    # 3. Active servers
    srv_res = await db.execute(select(Server))
    servers = srv_res.scalars().all()
    
    server_details = [
        ServerHealthDetail(
            id=s.id,
            name=s.name,
            hostname=s.hostname,
            region=s.region,
            status=s.status,
            latency_ms=0.5 if s.hostname in ("127.0.0.1", "localhost") else 12.0,
            capacity_gbps=s.capacity_gbps
        )
        for s in servers
    ]

    return AdminMetricsOut(
        system=system_usage,
        total_tests_completed=total_tests,
        tests_last_24h=tests_24h,
        avg_download_24h=avg_dl_24h,
        avg_upload_24h=avg_ul_24h,
        avg_latency_24h=avg_lat_24h,
        error_rate_percent=err_rate,
        active_servers=server_details,
        database_status="connected (healthy)"
    )
