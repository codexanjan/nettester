# NetScope API Specification

## Base URL
`/api` (Default local development: `http://localhost:8000/api`)

---

## 1. Speed Test Endpoints

### `GET /api/speedtest/ping`
Microsecond-precision zero-payload latency probe.
- **Parameters**: `echo` (string, optional)
- **Response**:
```json
{
  "status": "ok",
  "server_time": 1740645000.123456,
  "client_echo": "echo_0"
}
```
- **Rate Limit**: 120 requests/minute per client IP.

### `GET /api/speedtest/download`
High-throughput uncompressed pseudo-random binary stream.
- **Parameters**:
  - `size_mb` (int, default: 25, 1-100)
  - `chunk_kb` (int, default: 256, 16-1024)
  - `duration_s` (float, default: 15.0, 1.0-30.0)
- **Headers Returned**:
  - `Content-Encoding: identity` (Disables gzip/brotli compression distortion)
  - `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`
  - `Content-Length: <bytes>`
- **Rate Limit**: 30 requests/minute.

### `POST /api/speedtest/upload`
Asynchronous binary upload stream sink. Discards payload immediately from RAM.
- **Payload**: Raw binary octet-stream (`application/octet-stream`)
- **Response**:
```json
{
  "status": "success",
  "bytes_received": 10485760,
  "duration_seconds": 1.254,
  "mbps": 66.89
}
```
- **Rate Limit**: 30 requests/minute.

---

## 2. Server Registry & Network Endpoints

### `GET /api/servers`
Returns all registered active edge test servers.

### `GET /api/servers/health`
Probes and returns real-time latency and operational availability of servers.

### `GET /api/network/info`
Resolves client public network metadata (ISP, ASN, region, IPv4/IPv6 availability).

---

## 3. History, Analytics & Diagnostics

### `POST /api/tests`
Records completed test result in database with client IP anonymization (SHA-256 hash).

### `GET /api/tests/analytics`
Returns 24h, 7d, 30d aggregations and personal records.

### `POST /api/diagnostics/evaluate`
Executes deterministic rule-based network diagnosis on measured telemetry.

### `POST /api/diagnostics/ai-doctor`
AI-assisted natural language consultation interpreting real measurements.

---

## 4. Admin Portal

### `GET /api/admin/metrics`
- **Header Required**: `X-Admin-Key: <ADMIN_API_KEY>`
- **Response**: System CPU, RAM, active threads, test count, error rate, server nodes health.
