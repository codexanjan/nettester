# Measurement Methodology & Calculation Formulas

## 1. Non-Negotiable Accuracy Principles

NetScope enforces a strict no-fake-data policy. Every displayed metric is derived from high-resolution microsecond timers (`performance.now()`), actual byte stream counters, and true HTTP probe round-trips.

---

## 2. Mathematical Formulas

### A. Throughput Calculation (Mbps)
Throughput measures the actual transfer rate of uncompressed binary data:

$$\text{Mbps} = \frac{\text{Bytes Transferred} \times 8}{\text{Elapsed Seconds} \times 1,000,000}$$

- **High-Resolution Delta Sampling**: Telemetry emits snapshots every 100ms:
  $$\text{Instant Mbps} = \frac{(\text{Bytes}_t - \text{Bytes}_{t-1}) \times 8}{(t - t-1) \times 1,000,000}$$
- **Rolling Average**: Cumulative bytes over cumulative test duration.

### B. Latency (Ping)
Latency is measured through multiple sequential HTTP ping probes:
- **Primary Displayed Latency**: Median Round-Trip Time (RTT), resisting transient outliers:
  $$\text{Primary Latency} = \text{Median}(RTT_1, RTT_2, \dots, RTT_N)$$
- Also reports Minimum RTT, Average RTT, and Maximum RTT.

### C. Jitter (RFC 3550 Standard)
Jitter measures the statistical variance in packet arrival latency using the Mean Absolute Successive Difference:

$$J = \frac{1}{N - 1} \sum_{i=1}^{N-1} |RTT_{i+1} - RTT_i|$$

### D. Connection Stability Score (0 - 100%)
Connection stability quantifies throughput consistency and detects latency spikes:
1. Calculates the Coefficient of Variation ($CV = \frac{\sigma}{\mu}$) of speed samples.
2. Derives baseline stability:
   $$\text{Base Score} = \max(0, 100 - (CV \times 85.0))$$
3. Deducts penalties for detected latency spikes ($RTT > 1.5 \times \text{Median}$):
   $$\text{Spike Penalty} = \min(25, \text{Spikes Count} \times 5.0)$$
4. Final Stability:
   $$\text{Stability} = \max(0, \min(100, \text{Base Score} - \text{Spike Penalty}))$$

### E. Connection Quality Score (0 - 100)
A transparent, multi-dimensional rating algorithm:
- **Speed Score (35%)**: Logarithmic utility curve evaluating bandwidth.
- **Latency Score (25%)**: Linear penalty scale (<15ms = 95-100, 50ms = 75, >120ms drops).
- **Jitter Score (15%)**: Strict penalty for packet delay variation.
- **Stability Score (20%)**: Variance & spike mitigation score.
- **HTTP Success Rate (5%)**: $100 - \text{HTTP Failure Rate}$.

---

## 3. Browser Technical Limitations & Transparent Disclosures

1. **ICMP Packet Loss**: Web browsers operate in an unprivileged security sandbox without raw raw-socket / ICMP access. NetScope accurately reports "Not directly measurable in browser mode" and separately provides the measured "HTTP Request Failure Rate".
2. **Direct Socket DNS Timing**: Browsers abstract DNS lookup resolution inside TCP socket connect pools. NetScope accurately documents this limitation rather than fabricating synthetic socket timings.
