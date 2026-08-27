# ⚡ NetScope Pro — High-Throughput FastAPI Backend

A production-grade Python FastAPI backend designed for uncompressed binary streaming, microsecond-latency probes, ephemeral in-memory upload measurement, and network diagnostics.

## 🚀 Features

- **Uncompressed Binary Streaming**: Asynchronously generates non-compressible binary chunks (1MB–4MB) without CPU compression bottlenecks.
- **Ephemeral RAM Upload Sink**: Asynchronously measures incoming stream throughput and discards payload from memory immediately (never written to disk or database).
- **Microsecond Latency Probing**: High-precision RTT timestamps with zero-overhead response payloads.
- **Deterministic Diagnostic Engine**: Rule-based evaluator for ISP throttling, bufferbloat, jitter variance, and network health.
- **AI Network Doctor**: Integrated LLM troubleshooting generator with deterministic fallback advice.
- **Cluster Admin Telemetry**: Live CPU, memory usage, active threads, error rates, and cluster server health monitoring.
- **Cryptographic Anonymization**: Hashes client IPs with rotating daily salt to guarantee privacy.

## 🛠️ Tech Stack

- **Python 3.11+**
- **FastAPI** & **Uvicorn** (ASGI server)
- **SQLAlchemy 2.0 (Async)** with SQLite / PostgreSQL support
- **Pydantic v2** for robust data validation
- **SlowAPI** for endpoint rate limiting
- **HTTPX** for async server health probing

## 💻 Development

```bash
# Activate virtual environment
# Windows: .\.venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server with live reload on port 8000
uvicorn app.main:app --reload --port 8000
```

Interactive API documentation available at `http://localhost:8000/api/docs`.
