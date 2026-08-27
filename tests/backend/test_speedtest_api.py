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

@pytest.mark.asyncio
async def test_servers_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/servers")
        assert res.status_code == 200
        servers = res.json()
        assert len(servers) > 0
        assert any(s["id"] == "srv-auto" for s in servers)

        res_health = await ac.get("/api/servers/health")
        assert res_health.status_code == 200
        health = res_health.json()
        assert len(health) > 0

@pytest.mark.asyncio
async def test_network_info_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/network/info")
        assert res.status_code == 200
        data = res.json()
        assert "ip" in data
        assert "isp" in data

@pytest.mark.asyncio
async def test_test_record_and_analytics_pipeline():
    test_payload = {
        "server_id": "srv-auto",
        "server_name": "Auto Edge",
        "download_mbps": 120.5,
        "upload_mbps": 45.2,
        "latency_ms": 14.5,
        "latency_min_ms": 12.0,
        "latency_max_ms": 18.0,
        "latency_avg_ms": 14.8,
        "jitter_ms": 1.2,
        "http_failure_rate": 0.0,
        "stability_score": 92.0,
        "overall_score": 88.0,
        "duration": 15.0,
        "bytes_downloaded": 50000000,
        "bytes_uploaded": 15000000,
        "test_mode": "full"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create
        res_post = await ac.post("/api/tests", json=test_payload)
        assert res_post.status_code == 200
        rec = res_post.json()
        assert rec["id"] is not None
        assert rec["download_mbps"] == 120.5

        # List
        res_list = await ac.get("/api/tests?limit=10")
        assert res_list.status_code == 200
        assert len(res_list.json()) >= 1

        # Analytics
        res_analytics = await ac.get("/api/tests/analytics")
        assert res_analytics.status_code == 200
        analytics = res_analytics.json()
        assert "records" in analytics
        assert analytics["records"]["fastest_download"] >= 120.5

        # Degradation check
        res_deg = await ac.get("/api/tests/degradation-check?current_download_mbps=110.0")
        assert res_deg.status_code == 200
        deg = res_deg.json()
        assert "is_degraded" in deg
