# NetScope Security Architecture & Hardening

## 1. Rate Limiting & Abuse Prevention
- **SlowAPI Token-Bucket Limiter**: Rate limits are enforced on high-bandwidth endpoints per client IP:
  - Latency Ping: `120 requests / minute`
  - Download Streaming: `30 requests / minute`
  - Upload Sink: `30 requests / minute`
- Prevents resource exhaustion and unbounded network traffic.

---

## 2. Payload and Stream Boundaries
- **Max Upload Size**: Capped at 100 MB per test request to prevent memory starvation attacks.
- **Max Download Duration**: Hard timeout after 30 seconds of active streaming.
- **Max Concurrent Tests**: Global concurrency semaphore prevents CPU saturation.

---

## 3. Strict HTTP Security Headers
All responses include hardened security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 4. Protected Administration Surface
- `/api/admin/*` endpoints require the `X-Admin-Key` header with environment-configured secret validation.
- Unauthenticated requests receive HTTP 403 Forbidden.
