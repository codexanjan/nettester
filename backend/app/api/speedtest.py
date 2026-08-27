import time
from fastapi import APIRouter, Request, Query, Response
from fastapi.responses import StreamingResponse
from app.core.config import settings
from app.core.security import limiter
from app.schemas.speedtest import PingResponse, UploadResponse
from app.services.measurement import generate_download_stream, consume_upload_stream

router = APIRouter(prefix="/speedtest", tags=["Speedtest"])

@router.get("/ping", response_model=PingResponse)
@limiter.limit(settings.RATE_LIMIT_PING)
async def ping(request: Request, echo: str = Query(None, description="Optional client echo token")):
    """
    Lightweight, microsecond-precision latency probe endpoint.
    Returns current server timestamp for RTT calculation.
    """
    return PingResponse(
        status="ok",
        server_time=time.time(),
        client_echo=echo
    )

@router.get("/download")
@limiter.limit(settings.RATE_LIMIT_DOWNLOAD)
async def download_test(
    request: Request,
    size_mb: int = Query(25, ge=1, le=100, description="Total transfer size in MB"),
    chunk_kb: int = Query(256, ge=16, le=1024, description="Chunk size in KB"),
    duration_s: float = Query(15.0, ge=1.0, le=30.0, description="Max streaming duration in seconds")
):
    """
    High-throughput uncompressed binary download stream.
    Zero-caching and identity content encoding prevents compression distortion.
    """
    total_bytes = size_mb * 1024 * 1024
    chunk_bytes = chunk_kb * 1024
    
    stream = generate_download_stream(
        total_bytes=total_bytes,
        chunk_size_bytes=chunk_bytes,
        max_duration_seconds=duration_s
    )

    response = StreamingResponse(
        stream,
        media_type="application/octet-stream"
    )
    
    # Critical headers to guarantee uncompressed, direct raw measurement
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["Content-Encoding"] = "identity"
    response.headers["Content-Length"] = str(total_bytes)
    response.headers["Access-Control-Expose-Headers"] = "Content-Length, Content-Encoding"
    
    return response

@router.post("/upload", response_model=UploadResponse)
@limiter.limit(settings.RATE_LIMIT_UPLOAD)
async def upload_test(request: Request):
    """
    Ephemeral upload measurement sink.
    Asynchronously measures incoming stream throughput and discards all data in memory.
    Never persists payload to disk or database.
    """
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    result = await consume_upload_stream(request, max_bytes=max_bytes)
    
    return UploadResponse(
        status="success",
        bytes_received=result["bytes_received"],
        duration_seconds=result["duration_seconds"],
        mbps=result["mbps"]
    )
