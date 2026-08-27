import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from app.main import app
from app.core.database import init_db
from app.core.security import anonymize_ip

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()
    yield

def test_ip_anonymization():
    ip1 = "192.168.1.100"
    ip2 = "192.168.1.100"
    ip3 = "10.0.0.1"
    
    hash1 = anonymize_ip(ip1)
    hash2 = anonymize_ip(ip2)
    hash3 = anonymize_ip(ip3)

    assert hash1 == hash2 # Deterministic hashing for aggregation
    assert hash1 != hash3 # Different for distinct clients
    assert ip1 not in hash1 # Raw IP is never preserved

@pytest.mark.asyncio
async def test_security_headers():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert "camera=()" in response.headers.get("Permissions-Policy", "")

@pytest.mark.asyncio
async def test_admin_protection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Unauthorized
        resp_unauth = await ac.get("/api/admin/metrics")
        assert resp_unauth.status_code == 403

        # Authorized with proper key
        resp_auth = await ac.get(
            "/api/admin/metrics",
            headers={"X-Admin-Key": "netscope-admin-secret-key-2026"}
        )
        assert resp_auth.status_code == 200
        data = resp_auth.json()
        assert "system" in data
        assert "active_servers" in data
