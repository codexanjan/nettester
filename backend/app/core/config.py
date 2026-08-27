import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NetScope Speed Test API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./speedtest.db"
    )
    
    # Speedtest constraints
    MAX_DOWNLOAD_CHUNK_SIZE_MB: int = int(os.getenv("MAX_DOWNLOAD_CHUNK_SIZE_MB", "8"))
    MAX_DOWNLOAD_TIME_SECONDS: int = int(os.getenv("MAX_DOWNLOAD_TIME_SECONDS", "30"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))
    MAX_CONCURRENT_TESTS: int = int(os.getenv("MAX_CONCURRENT_TESTS", "20"))
    
    # Rate Limiting
    RATE_LIMIT_PING: str = os.getenv("RATE_LIMIT_PING", "120/minute")
    RATE_LIMIT_DOWNLOAD: str = os.getenv("RATE_LIMIT_DOWNLOAD", "30/minute")
    RATE_LIMIT_UPLOAD: str = os.getenv("RATE_LIMIT_UPLOAD", "30/minute")
    RATE_LIMIT_DEFAULT: str = os.getenv("RATE_LIMIT_DEFAULT", "60/minute")
    
    # External APIs (Optional)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    IP_LOOKUP_API_KEY: str = os.getenv("IP_LOOKUP_API_KEY", "")
    
    # Admin Key
    ADMIN_API_KEY: str = os.getenv("ADMIN_API_KEY", "netscope-admin-secret-key-2026")
    
    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "allow"
    }

settings = Settings()
