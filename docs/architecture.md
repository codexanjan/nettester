# NetScope Architecture & System Design

## 1. System Overview

NetScope is a high-precision, privacy-first Internet Speed Tester engineered to execute genuine network throughput and latency measurements directly in the browser and edge backend without synthetic, interpolated, or fabricated data.

```
+-----------------------------------------------------------------------------------+
|                                 FRONTEND (React + TS + Vite)                      |
|  +---------------------+  +---------------------+  +----------------------------+ |
|  | Speedometer & Live  |  |   Test Controller   |  | Measurement Engine         | |
|  | Telemetry Charts    |  |    State Machine    |  | - Parallel Stream Download | |
|  | (Recharts/Canvas)   |  | (Idle->Ping->DL->UL)|  | - High-Res Upload Engine   | |
|  +---------------------+  +---------------------+  | - Multi-RTT Ping & Jitter  | |
|  +---------------------+  +---------------------+  +----------------------------+ |
|  |  Local Storage /    |  | Analytics, Quality  |  | Diagnostic Engine          | |
|  |  IndexedDB History  |  |  Scoring & Baselines|  | & AI Network Doctor        | |
|  +---------------------+  +---------------------+  +----------------------------+ |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (Zero-Compression Streaming)
+------------------------------------------v----------------------------------------+
|                                 BACKEND (Python FastAPI)                          |
|  +------------------------------------------------------------------------------+ |
|  |  Measurement Core:                                                           | |
|  |  - GET /api/speedtest/ping      -> Microsecond-precision zero-payload probe  | |
|  |  - GET /api/speedtest/download  -> High-throughput uncompressed stream       | |
|  |  - POST /api/speedtest/upload   -> Stream-sink discarding payload in RAM     | |
|  +------------------------------------------------------------------------------+ |
|  +------------------------------------------------------------------------------+ |
|  |  Security & Privacy Middleware:                                              | |
|  |  - Strict CORS, Rate Limiter, Upload Size Bounds, IP Anonymization,          | |
|  |  - Ephemeral Payload Discard, Safe Error Handling                            | |
|  +------------------------------------------------------------------------------+ |
|  +------------------------------------------------------------------------------+ |
|  |  Persistence Layer: SQLAlchemy 2.0 (PostgreSQL + SQLite fallback support)    | |
|  +------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 2. State Machine

The client measurement lifecycle is strictly managed via a finite state machine:

```
[ IDLE ]
   ↓
[ CONNECTING ]
   ↓
[ SERVER_SELECTION ]
   ↓
[ LATENCY_TEST ] (10 - 30 Sequential High-Precision RTT Probes)
   ↓
[ DOWNLOAD_TEST ] (Parallel Fetch Streams with High-Res Byte Accounting)
   ↓
[ UPLOAD_TEST ] (Streaming Binary Chunks to Ephemeral In-Memory Sink)
   ↓
[ ANALYSIS ] (Stability Variance & Transparent Quality Score Computation)
   ↓
[ COMPLETED ]

* Interrupted at any stage via [ CANCELLED ] or [ FAILED ]
```

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, Canvas Confetti, IDB (IndexedDB).
- **Backend**: Python 3.13, FastAPI, Uvicorn, SQLAlchemy 2.0 (Async), SlowAPI, Pydantic v2.
- **Database**: PostgreSQL (Production) / SQLite with aiosqlite (Development).
- **Containerization**: Docker, docker-compose, multi-stage Alpine images with Nginx reverse proxy.
