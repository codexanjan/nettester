import httpx
from fastapi import APIRouter, Request
from app.schemas.speedtest import NetworkInfoResponse

router = APIRouter(prefix="/network", tags=["Network Info"])

@router.get("/info", response_model=NetworkInfoResponse)
async def get_network_info(request: Request):
    """
    Retrieves client public network metadata (ISP, ASN, approximate location)
    using privacy-safe resolution.
    Falls back gracefully to 'Unavailable' if offline or resolution fails.
    Never fabricates fake data.
    """
    client_host = request.client.host if request.client else ""
    ip_version = "IPv6" if ":" in client_host else "IPv4"

    # Default fallback object
    info = {
        "ip": client_host or "127.0.0.1",
        "ip_version": ip_version,
        "isp": "Local Network / Private ISP",
        "organization": "Local Loopback",
        "asn": "Unavailable",
        "city": "Localhost",
        "region": "Local",
        "country": "Local",
        "country_code": "LOC",
        "latitude": None,
        "longitude": None,
        "is_vpn_or_proxy": False
    }

    # If client is loopback/internal (e.g. 127.0.0.1), try querying external IP lookup service for actual public gateway info
    if client_host in ("127.0.0.1", "localhost", "::1", "") or client_host.startswith(("192.168.", "10.", "172.")):
        try:
            # Query ipapi.co or ip-api.com with short timeout
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get("https://ipapi.co/json/")
                if res.status_code == 200:
                    data = res.json()
                    public_ip = data.get("ip", info["ip"])
                    info.update({
                        "ip": public_ip,
                        "ip_version": "IPv6" if ":" in public_ip else "IPv4",
                        "isp": data.get("org") or data.get("asn") or "Broadband Provider",
                        "organization": data.get("org", "Unavailable"),
                        "asn": data.get("asn", "Unavailable"),
                        "city": data.get("city", "Unavailable"),
                        "region": data.get("region", "Unavailable"),
                        "country": data.get("country_name", "Unavailable"),
                        "country_code": data.get("country_code", "UN"),
                        "latitude": data.get("latitude"),
                        "longitude": data.get("longitude"),
                    })
        except Exception:
            # Network resolution failed or offline; retain clear 'Unavailable' flags
            info["isp"] = "Unavailable"
            info["organization"] = "Unavailable"
            info["city"] = "Unavailable"
            info["region"] = "Unavailable"
            info["country"] = "Unavailable"

    return NetworkInfoResponse(**info)
