import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from app.main import app
from app.core.database import init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()
    yield

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data

@pytest.mark.asyncio
async def test_ping_latency_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/speedtest/ping?echo=token123")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "server_time" in data
    assert data["client_echo"] == "token123"

@pytest.mark.asyncio
async def test_download_streaming_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Request 1MB stream
        response = await ac.get("/api/speedtest/download?size_mb=1&chunk_kb=64")
    assert response.status_code == 200
    assert response.headers.get("Content-Encoding") == "identity"
    assert response.headers.get("Cache-Control") == "no-store, no-cache, must-revalidate, max-age=0"
    content = response.content
    assert len(content) == 1 * 1024 * 1024

@pytest.mark.asyncio
async def test_upload_streaming_endpoint():
    # 512 KB payload
    payload = b"X" * (512 * 1024)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/speedtest/upload", content=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["bytes_received"] == 512 * 1024
    assert data["duration_seconds"] > 0
    assert data["mbps"] > 0
