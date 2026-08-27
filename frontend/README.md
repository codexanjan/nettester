# 🎨 NetScope Pro — Frontend Client

A high-performance React 18, TypeScript, and Tailwind CSS client engineered for high-precision, real-time network speed testing.

## 🚀 Features

- **Smooth Speedometer Gauge**: Real-time SVG gauge with logarithmic curve and Exponential Moving Average (EMA) needle interpolation.
- **Continuous Telemetry Graph**: High-resolution time-series charting showing live download and upload Mbps trajectories.
- **Dual-Engine Support**: Seamlessly tests against Global Edge CDNs (Cloudflare Speed API) and dedicated NetScope FastAPI nodes.
- **Smart Server Selector**: Measures real-time latency across all nodes with 1-click auto-routing to the lowest-ping edge.
- **5-Pillar Quality Scoring**: Transparent, multi-factor scoring (Speed, Latency, Jitter, Stability, Failure Rate).
- **Diagnostics & AI Network Doctor**: Actionable root-cause insights for buffering, latency spikes, and ISP degradation.
- **Local-First History**: IndexedDB storage with zero tracking, instant 1-click purge, and JSON/CSV export.

## 🛠️ Tech Stack

- **React 18** with functional components & hooks
- **TypeScript** for end-to-end type safety
- **Vite** for fast HMR and optimized production builds
- **Tailwind CSS** for responsive dark-mode glassmorphic styling
- **Lucide Icons** & **Recharts** for visualizations
- **Canvas-Confetti** for celebratory milestone animations

## 💻 Development

```bash
# Install dependencies
npm install

# Start Vite dev server on port 5173
npm run dev

# Production build
npm run build
```
