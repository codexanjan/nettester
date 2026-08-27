import hashlib
from fastapi import Request, HTTPException, Security, status
from fastapi.security.api_key import APIKeyHeader
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings

# Rate Limiter based on remote client IP
limiter = Limiter(key_func=get_remote_address)

# Admin API Key Header Security
API_KEY_NAME = "X-Admin-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_admin_key(api_key: str = Security(api_key_header)):
    if not api_key or api_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized admin access"
        )
    return api_key

def anonymize_ip(ip_str: str) -> str:
    """
    Privacy-first IP anonymization:
    Hashes the client IP with a salt so raw IPs are never stored in database or exposed.
    """
    if not ip_str:
        return "anonymous"
    salt = "netscope-privacy-salt"
    return hashlib.sha256(f"{salt}-{ip_str}".encode("utf-8")).hexdigest()[:16]

async def add_security_headers(request: Request, call_next):
    """
    Adds strict HTTP security headers to all responses.
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response
