from pydantic import BaseModel, Field
from typing import Optional

class PingResponse(BaseModel):
    status: str = "ok"
    server_time: float
    client_echo: Optional[str] = None

class UploadResponse(BaseModel):
    status: str = "success"
    bytes_received: int
    duration_seconds: float
    mbps: float

class NetworkInfoResponse(BaseModel):
    ip: str
    ip_version: str # IPv4 or IPv6
    isp: str
    organization: str
    asn: str
    city: str
    region: str
    country: str
    country_code: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_vpn_or_proxy: Optional[bool] = None
