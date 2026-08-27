# ⚡ NetScope Pro — Ultra-Fast, Real & Accurate Internet Speed Tester

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](LICENSE)
[![Accuracy](https://img.shields.io/badge/Speed%20Accuracy-Exact%20ISP%20Matching-blueviolet.svg?style=flat)](#-measurement-accuracy-algorithm)

**NetScope Pro** is a modern, enterprise-grade, privacy-first Internet Speed Tester engineered for **exact real-world network accuracy**, multi-stream bandwidth saturation, microsecond latency probes, and transparent diagnostics — with zero fabricated data and zero forced logins.

---

## 🚀 Why NetScope Pro? (Exact Speed Accuracy)

Most web-based speed tests either fabricate artificial curves or fail to saturate high-bandwidth fiber connections (100 Mbps – 10 Gbps) due to single-stream TCP bottlenecks and cold-start slow down. 

NetScope Pro solves this with an **advanced dual-engine architecture** matching the accuracy standards of **Fast.com** and **Speedtest by Ookla**:

1. **Parallel Multi-Stream Saturation**: Simultaneously opens 4 to 8 parallel HTTP/2 & HTTP/1.1 chunk readers to fully saturate ISP downstream and upstream bandwidth.
2. **TCP Slow-Start Ramp-Up Discarding**: Discards the initial 1.0–1.2s TCP window expansion ramp-up and computes the sustained trimmed steady-state throughput (eliminating artificial cold-start penalties).
3. **Dual Engine (Global Edge CDN + Dedicated Backend)**:
   - 🌐 **Global Anycast Edge CDN**: Directly measures ISP bandwidth across 300+ worldwide edge PoPs using uncompressed binary payloads with zero proxy bottleneck.
   - ⚡ **Dedicated NetScope Server**: Tests directly against self-hosted high-throughput Python FastAPI nodes with non-compressible RAM chunks.
4. **Microsecond Precision Latency & Jitter**: Multi-probe RTT measurement (Min, Median, Avg, Max) with RFC 3550 Standard Mean Absolute Successive Difference Jitter calculation.
5. **Adaptive Chunk Sizing**: Dynamically scales payload sizes (from 256 KB up to 4 MB) based on measured line rate to avoid HTTP handshake overhead.

---

## 📊 Feature Comparison

| Feature | NetScope Pro | Fast.com | Speedtest.net | LibreSpeed |
| :--- | :---: | :---: | :---: | :---: |
| **Exact ISP Accuracy** | ✅ **Yes** | ✅ **Yes** | ✅ **Yes** | ⚠️ Partial |
| **Multi-Stream Saturation** | ✅ **Yes (4–8 Streams)** | ✅ Yes | ✅ Yes | ⚠️ Optional |
| **TCP Ramp-Up Discarding** | ✅ **Yes** | ✅ Yes | ✅ Yes | ❌ No |
| **RFC 3550 Jitter Standard** | ✅ **Yes** | ❌ No | ⚠️ Basic | ⚠️ Basic |
| **5-Pillar Quality Score** | ✅ **Yes (Transparent)** | ❌ No | ❌ No | ❌ No |
| **AI Network Doctor** | ✅ **Yes** | ❌ No | ❌ No | ❌ No |
| **Privacy-First (No Disk Storing)** | ✅ **Yes (100% RAM)** | ⚠️ Closed | ❌ Heavy Ads/Trackers | ✅ Yes |
| **Self-Hostable (Docker)** | ✅ **Yes** | ❌ No | ❌ No | ✅ Yes |
| **Zero Account / Ad Free** | ✅ **100% Free & Clean** | ✅ Clean | ❌ Heavy Ads | ✅ Clean |

---

## 🌟 Key Capabilities

### ⚡ 1. Real Network Measurements
- **Download Speed**: Multi-stream uncompressed binary stream throughput with smooth exponential moving average (EMA) speedometer needle.
- **Upload Speed**: In-memory ephemeral upload sink measuring high-throughput binary chunk streaming.
- **Latency (Ping)**: Microsecond-precision multi-burst RTT probes.
- **Jitter**: Industry-standard RFC 3550 computation.
- **Bufferbloat / Stability Score**: Calculates sample variance and coefficient of variation ($CV$) to detect connection instability under load.

### 🛡️ 2. Privacy-First Architecture
- **Zero Disk Writes**: All upload test payloads are streamed into volatile RAM and discarded immediately.
- **No Personal Identifiers**: Client IPs are hashed with a daily rotating cryptographic salt.
- **Local-First History**: Test results are stored securely in browser **IndexedDB** with instant 1-click wipe and JSON/CSV export.

### 🧠 3. Diagnostics & AI Network Doctor
- **Deterministic Rules Engine**: Analyzes connection characteristics (Packet loss, Jitter, RTT, Bandwidth ratio) and flags ISP throttling, bufferbloat, or DNS issues.
- **AI Network Doctor**: Provides actionable, plain-English troubleshooting advice tailored to your exact network metrics.

### 🌐 4. Multi-Server & Global Edge Selection
- **Smart Auto-Routing**: Probes candidate servers and automatically selects the edge with the lowest latency.
- **Manual Edge Selector**: Choose from Global Anycast Edge, India (Bengaluru, Mumbai), APAC (Singapore), US East (Virginia), Europe (Frankfurt), UK (London), or Localhost.

---

## 🏗️ Architecture & Tech Stack

```
                               ┌────────────────────────────────────────┐
                               │       Client Browser (React + TS)      │
                               │  - Multi-Stream Worker Pool            │
                               │  - High-Precision performance.now()    │
                               │  - Smooth SVG Speedometer + Live Graph │
                               │  - IndexedDB Local Storage             │
                               └──────────────────┬─────────────────────┘
                                                  │
                      ┌───────────────────────────┴───────────────────────────┐
                      │                                                       │
                      ▼                                                       ▼
        ┌───────────────────────────┐                           ┌───────────────────────────┐
        │   Global Anycast Edge CDN │                           │  NetScope FastAPI Backend │
        │   (speed.cloudflare.com)  │                           │  - Zero-Copy Binary Stream│
        │   - 300+ Global PoPs      │                           │  - Ephemeral RAM Sink     │
        │   - Direct ISP Bandwidth  │                           │  - Diagnostic Rules Engine│
        │   - Sub-10ms Anycast Route│                           │  - System Health Telemetry│
        └───────────────────────────┘                           └─────────────┬─────────────┘
                                                                              │
                                                                ┌─────────────▼─────────────┐
                                                                │  SQLite / PostgreSQL DB   │
                                                                │  - Server Registry        │
                                                                │  - Anonymized Aggregates  │
                                                                └───────────────────────────┘
```

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Vite
- **Backend**: Python 3.11+, FastAPI, Uvicorn, SQLAlchemy Async, SlowAPI, Pydantic v2
- **Storage**: IndexedDB (client-side) & SQLite / PostgreSQL (server-side)
- **Containerization**: Docker, Docker Compose, Nginx

---

## ⚡ Quick Start Guide

### 🐳 Run with Docker (Recommended)

Run the complete multi-container stack in one command:

```bash
docker-compose up --build
```

- 🌐 **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- 🔌 **Backend API**: [http://localhost:8000](http://localhost:8000)
- 📖 **Interactive Swagger Docs**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

---

### 💻 Manual Local Development

#### 1. Clone the repository
```bash
git clone https://github.com/codexanjan/nettester.git
cd nettester
```

#### 2. Backend Setup
```bash
# Create and activate Python virtual environment
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Launch FastAPI server on port 8000
cd backend
uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend Setup
```bash
# Open a new terminal
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing & Validation

### Run Backend Unit & Integration Tests:
```bash
pytest tests/backend -v
```

### Run Frontend Production Build:
```bash
cd frontend
npm run build
```

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health and uptime check |
| `GET` | `/api/speedtest/ping` | Microsecond latency probe endpoint |
| `GET` | `/api/speedtest/download` | High-throughput uncompressed binary download stream |
| `POST` | `/api/speedtest/upload` | In-memory ephemeral upload measurement sink |
| `GET` | `/api/servers` | Server node registry with active latency metrics |
| `GET` | `/api/network/info` | Client ASN, ISP, and geo-location resolution |
| `POST` | `/api/diagnostics/evaluate`| Deterministic network diagnostic rules evaluator |
| `POST` | `/api/diagnostics/ai-doctor`| AI Network Doctor troubleshooting analysis |
| `GET` | `/api/admin/metrics` | Real-time CPU, RAM, and cluster node telemetry |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author & Contributions

Created with ❤️ by **[codexanjan](https://github.com/codexanjan)**. Contributions, issues, and feature requests are welcome!
