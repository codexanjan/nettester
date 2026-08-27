from typing import Optional
from pydantic import BaseModel, ConfigDict

class ServerBase(BaseModel):
    name: str
    hostname: str
    port: str = "8000"
    protocol: str = "http"
    region: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity_gbps: float = 10.0
    is_default: bool = False

class ServerCreate(ServerBase):
    pass

class ServerOut(ServerBase):
    id: str
    status: str

    model_config = ConfigDict(from_attributes=True)

class ServerHealthOut(BaseModel):
    id: str
    name: str
    hostname: str
    status: str # healthy, degraded, unreachable
    latency_ms: Optional[float] = None
    last_checked: float
