# ⚡ NetScope Pro — Real, Accurate & Privacy-First Internet Speed Tester

A full-stack, production-grade Internet Speed Tester engineered for **accurate real-world network measurements**, client-side privacy, transparent diagnostic evaluations, and zero fabricated data.

---

## 🌟 Key Features

- **Real Network Measurements**:
  - **Download Speed**: Multi-stream parallel reader measuring uncompressed binary throughput.
  - **Upload Speed**: Real binary chunk streaming into an in-memory ephemeral sink.
  - **Latency (Ping)**: Microsecond-precision multi-probe RTT measurement (Min, Median, Avg, Max).
  - **Jitter**: Industry-standard RFC 3550 Mean Absolute Successive Difference.
  - **Stability & Degradation**: Sample variance scoring and 7-day baseline degradation detection.
  - **Connection Quality**: Transparent, documented 5-component weighted quality scoring algorithm.
- **Privacy-First Architecture**:
  - Zero mandatory accounts or logins.
  - Temporary random upload byte payloads discarded immediately in RAM (never written to disk or DB).
  - Client IP anonymization via cryptographic salt-hashing.
  - Local-first storage (IndexedDB) with instant 1-click wipe and JSON/CSV export.
- **Intelligent Diagnostics**:
  - Deterministic rules-based Network Diagnostic Engine.
  - Optional AI Network Doctor for actionable troubleshooting steps based strictly on real metrics.
- **Admin & Multi-Server Infrastructure**:
  - Multi-server latency benchmarks and auto-routing.
  - Protected Admin Portal for real-time CPU, RAM, error rate, and cluster node telemetry.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Create and activate virtualenv
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI backend (port 8000)
cd backend
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🐳 Docker Deployment

Run the complete multi-container stack (FastAPI + React + PostgreSQL):

```bash
docker-compose up --build
```
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

---

## 🧪 Running Automated Tests

### Backend Unit & Integration Tests:
```bash
pytest tests/backend -v
```

---

## 📚 Technical Documentation
- [Architecture & State Machine](docs/architecture.md)
- [API Specification](docs/api.md)
- [Measurement Formulas & Methodology](docs/measurement-methodology.md)
- [Privacy Governance](docs/privacy.md)
- [Security Hardening](docs/security.md)

---

## 📄 License
MIT License
