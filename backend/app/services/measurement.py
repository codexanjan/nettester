import os
import time
import asyncio
from typing import AsyncGenerator
from fastapi import Request

# Pre-generate 4MB of pseudo-random non-compressible binary data in memory
# so streaming doesn't suffer from CPU generation bottlenecks or compression distortion
_CHUNK_4MB = os.urandom(4 * 1024 * 1024)
_CHUNK_1MB = _CHUNK_4MB[:1024 * 1024]
_CHUNK_256KB = _CHUNK_1MB[:256 * 1024]
_CHUNK_64KB = _CHUNK_1MB[:64 * 1024]

async def generate_download_stream(
    total_bytes: int,
    chunk_size_bytes: int = 1024 * 1024,
    max_duration_seconds: float = 20.0
) -> AsyncGenerator[bytes, None]:
    """
    Asynchronously streams uncompressible binary data chunks with zero CPU compression overhead.
    Monitors elapsed time to prevent unbounded transfer.
    """
    # Pick suitable buffer
    if chunk_size_bytes <= 64 * 1024:
        chunk = _CHUNK_64KB[:chunk_size_bytes]
    elif chunk_size_bytes <= 256 * 1024:
        chunk = _CHUNK_256KB[:chunk_size_bytes]
    elif chunk_size_bytes <= 1024 * 1024:
        chunk = _CHUNK_1MB[:chunk_size_bytes]
    else:
        chunk = _CHUNK_4MB[:min(chunk_size_bytes, len(_CHUNK_4MB))]

    actual_chunk_len = len(chunk)
    bytes_sent = 0
    start_time = time.perf_counter()
    loop_count = 0

    while bytes_sent < total_bytes:
        elapsed = time.perf_counter() - start_time
        if elapsed > max_duration_seconds:
            break

        to_send = min(actual_chunk_len, total_bytes - bytes_sent)
        if to_send == actual_chunk_len:
            yield chunk
            bytes_sent += actual_chunk_len
        else:
            yield chunk[:to_send]
            bytes_sent += to_send
            
        loop_count += 1
        # Yield control periodically to event loop without thrashing CPU
        if loop_count % 4 == 0:
            await asyncio.sleep(0)

async def consume_upload_stream(request: Request, max_bytes: int = 150 * 1024 * 1024) -> dict:
    """
    Receives uploaded binary data stream asynchronously.
    Measures received bytes and duration from first byte, immediately discarding data from memory.
    Never persists payload to disk or database.
    """
    bytes_received = 0
    start_time = None

    async for chunk in request.stream():
        if start_time is None:
            start_time = time.perf_counter()
        chunk_len = len(chunk)
        bytes_received += chunk_len
        
        # Immediate memory discard
        del chunk

        if bytes_received > max_bytes:
            break

    if start_time is None:
        start_time = time.perf_counter()

    duration_seconds = max(0.0001, time.perf_counter() - start_time)
    mbps = (bytes_received * 8.0) / duration_seconds / 1_000_000.0

    return {
        "bytes_received": bytes_received,
        "duration_seconds": round(duration_seconds, 4),
        "mbps": round(mbps, 2)
    }
