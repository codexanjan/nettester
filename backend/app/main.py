import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.security import limiter, add_security_headers
from app.core.database import init_db, async_session_factory
from app.api.servers import seed_servers_if_empty
from app.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    await init_db()
    
    # Seed default server registry if empty
    async with async_session_factory() as session:
        await seed_servers_if_empty(session)
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Attach rate limiter state
app.state.limiter = limiter

# Rate limit exceeded handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please wait a moment before re-testing."}
    )

# Security headers middleware
app.middleware("http")(add_security_headers)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "Content-Encoding", "X-Server-Time"]
)

# Mount API routes
app.include_router(api_router)

@app.get("/health", tags=["Health"])
async def root_health_check():
    """
    Root health check endpoint for container orchestrators and load balancers.
    """
    return {
        "status": "healthy",
        "service": "NetScope Speed Tester Backend",
        "version": settings.VERSION,
        "timestamp": time.time()
    }
