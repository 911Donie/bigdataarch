# Architecture Specification — TelecomPulse AI

## 1. System Overview

**TelecomPulse AI** is a real-time big data telecommunication network operations center (NOC) simulator and streaming analytics engine. It models the collection, validation, windowed aggregation, anomaly detection, congestion analysis, mitigation response, and historical persistence of high-velocity SMS and Voice signaling traffic.

---

## 2. End-to-End Pipeline Diagram

```
+---------------------------------------------------------------------------------+
|                         STAGE 1: 3GPP TELECOM EVENT GENERATOR                   |
|  - Poisson arrival process (SMS submissions, Voice call setups)                 |
|  - Gaussian latency modeling, 3GPP status codes (DELIVERED, FAILED, DROPPED)   |
|  - Controllable rate (10-500 eps), traffic mix, and 7 scenario triggers         |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                    STAGE 2: INGESTION & MESSAGE BROKER TIER                     |
|  - Distributed Mode: Apache Kafka (topics: sms-events, voice-events)           |
|  - Local Simulation Mode: Partitioned FIFO bounded buffer (shock absorber)      |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                STAGE 3: DATA QUALITY, DEDUPLICATION & WATERMARKING              |
|  - Schema conformance verification (drops malformed payloads)                   |
|  - LRU Ring Buffer / Bloom Filter deduplication (drops duplicate event_ids)     |
|  - Stream Watermarking (5.0s delay tolerance for out-of-order packets)          |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|               STAGE 4: WINDOWED STREAM PROCESSING ENGINE                        |
|  - Multi-temporal sliding windows: 10s, 30s, 60s, 300s (historical)            |
|  - Event-time aggregation semantics (differentiates event-time vs process-time) |
|  - Calculates throughput (eps), failure rates (%), latencies (ms), drop rates   |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|               STAGE 5: MULTI-METHOD ANOMALY & CONGESTION DETECTION              |
|  - Method A: Relative Spike Detection (Throughput > K * Baseline)               |
|  - Method B: Statistical Z-Score ((X - μ) / σ > 2.5)                            |
|  - Method C: Failure-Rate Thresholds (>6% SMS / >6.5% Voice failure)            |
|  - Method D: Queue Growth Tracking (>15% continuous backlog growth)             |
|  - Method E: Unsupervised Machine Learning (Scikit-Learn Isolation Forest)      |
|  - Congestion Classifier: Distinguishes demand spikes from true congestion      |
+---------------------------------------------------------------------------------+
                                      |
                    +-----------------+-----------------+
                    |                                   |
                    v                                   v
+---------------------------------------+   +------------------------------------+
|    STAGE 6: ALERT & RESPONSE TIER     |   |   STAGE 7: PERSISTENCE & ANALYTICS |
| - Deduplication & Cooldown Manager    |   | - SQLite (out-of-the-box local)    |
| - Lifecycle: Acknowledge & Resolve    |   | - PostgreSQL 16 (docker cluster)   |
| - Network Response Mitigation Actions |   | - Multi-attribute historical query |
| - Empirical Before/After Verification |   | - CSV export engine                |
+---------------------------------------+   +------------------------------------+
                    |                                   |
                    +-----------------+-----------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|               STAGE 8: NOC DASHBOARD & LEARNING CENTER (FRONTEND)               |
|  - React 18 + TypeScript + Vite + Tailwind CSS + Recharts                       |
|  - WebSocket real-time live push with HTTP polling fallback                     |
|  - 5-Part "Explain This Metric" modal with live current values                  |
|  - Interactive "Ask Why?" engine + 16-Question Jury Viva Defense Mode           |
+---------------------------------------------------------------------------------+
```

---

## 3. Big Data 5 Vs Mapping

| Dimension | Real-World Carrier Context | TelecomPulse AI Implementation |
| :--- | :--- | :--- |
| **Volume** | Billions of CDRs per day (~15 TB) | Cumulative processed events counter, persistent SQLite/PostgreSQL storage, bounded memory buffers. |
| **Velocity** | 100,000+ packets/sec arrival rate | Sub-5ms stream windowing engine, real-time WebSocket push, instantaneous throughput calculations. |
| **Variety** | SMPP SMS receipts, SIP call signaling, SS7/ISUP | Heterogeneous schemas handling distinct SMS attributes (delivery latency, retry counts) and Voice attributes (call duration, setup delay, dropped calls). |
| **Veracity** | Network jitter, duplicate packets, clock drift | Data Quality Engine: LRU deduplication cache, schema validation, 5s watermark for late events. |
| **Value** | Proactive outage mitigation, SLA compliance | Anomaly detection alerts, Network Response Simulator with empirical before-and-after recovery verification. |

---

## 4. Mathematical Formulations

### Window Throughput (Events/sec)
$$\text{Throughput (eps)} = \frac{\sum \text{Events in Window } [T - W, T]}{W}$$
*Where $W \in \{10, 30, 60, 300\}$ seconds.*

### SMS Delivery Failure Rate (%)
$$\text{Failure Rate}_{\text{SMS}} = \left( \frac{\text{Failed SMS Delivery Attempts}}{\text{Total SMS Delivery Attempts in Window}} \right) \times 100$$

### Voice Call Failure Rate (%)
$$\text{Failure Rate}_{\text{Voice}} = \left( \frac{\text{Failed Call Setups}}{\text{Total Call Initiation Attempts in Window}} \right) \times 100$$

### Dropped Call Rate (%)
$$\text{Dropped Call Rate} = \left( \frac{\text{Abnormally Terminated Calls}}{\text{Total Connected Voice Calls}} \right) \times 100$$

### Zone Utilization (%)
$$\text{Utilization} = \left( \frac{\text{Current Zone Ingestion Load (eps)}}{\text{Configured Zone Capacity (eps)}} \right) \times 100$$

### Statistical Z-Score Anomaly Detector (Method B)
$$Z = \frac{X_{\text{current}} - \mu_{\text{baseline}}}{\sigma_{\text{baseline}}}$$
*Anomaly triggered if $Z \ge 2.5\sigma$.*
