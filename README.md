# TelecomPulse AI — Real-Time SMS and Voice Traffic Monitoring Using Big Data

An academic, end-to-end Big Data telecommunications stream processing and Network Operations Center (NOC) monitoring system. Built for college demonstrations, jury evaluations, and technical viva presentations.

---

## 1. Project Highlights

- **Explainable Big Data Telemetry:** Every single metric card, chart, alert, and pipeline stage provides an interactive **"Why?"** breakdown explaining:
  1. *What am I looking at?*
  2. *Why does this metric matter?*
  3. *How is it calculated? (with numerator, denominator, and window period)*
  4. *What is happening in the current simulation? (using live current values)*
  5. *What would a telecom operator investigate next?*
- **Real-Time Telecom Event Generator:** Generates continuous 3GPP SMS and Voice signaling traffic using Poisson arrivals and Gaussian latency distributions.
- **Sliding Window Processing:** Real-time multi-temporal window calculations across 10s, 30s, 60s, and 300s intervals using event-time semantics.
- **5-Method Anomaly Detection Engine:**
  - **Method A:** Relative Spike Detection (multiple of rolling baseline)
  - **Method B:** Statistical Z-Score Detection ($Z \ge 2.5\sigma$)
  - **Method C:** Failure-Rate Spike Detection (SMS & Voice thresholds)
  - **Method D:** Ingestion Queue Growth Detection (sustained queue backlog growth)
  - **Method E:** Unsupervised Machine Learning (`IsolationForest` across multi-dimensional feature vectors)
- **Spike vs. Congestion Disambiguation:** Distinguishes between harmless subscriber demand spikes and true network congestion (which requires proven QoS degradation).
- **Network Response Simulator:** Execute simulated operator mitigations (dynamic load rerouting, capacity auto-scaling, admission throttling, voice prioritization, exponential backoff) and verify empirical before-and-after recovery deltas.
- **Data Quality & Reliability Module:** Demonstrates data veracity challenges: duplicate packet deduplication, watermark delay handling for late/out-of-order packets, and schema validation.
- **Viva Defense Mode:** 16+ comprehensive jury viva questions and answers with current run examples + **"Walk Me Through This Run"** automated presentation narrative.
- **Zero-Friction Windows Startup:** Runs 100% out of the box in Local Simulation Mode without requiring Docker, Kafka, or PostgreSQL, while also including a full `docker-compose.yml` cluster configuration for containerized deployment!

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Vanilla CSS + Tailwind CSS (Curated Dark NOC Palette: Navy `#0b1120`, Slate `#111c30`, Cyan `#06b6d4`, Violet `#8b5cf6`)
- **Charts:** Recharts (Area, Line, Bar, and Dual-Axis graphs)
- **Icons:** Lucide React
- **Streaming:** Native WebSocket with auto-reconnect and polling fallback

### Backend
- **Framework:** Python 3.10+ / FastAPI / Uvicorn
- **Validation:** Pydantic v2
- **Analytics:** Pandas 3.0 + NumPy 2.3
- **Machine Learning:** Scikit-Learn (`IsolationForest`)
- **Database:** SQLite 3 (Default local zero-setup) / PostgreSQL 16 (Configurable)
- **Testing:** Pytest (11 automated unit and integration tests)

### Distributed Infrastructure (Optional Docker Mode)
- **Message Broker:** Apache Kafka (Confluent cp-kafka)
- **Distributed Processing:** Apache Spark 3.5 Structured Streaming
- **Database:** PostgreSQL 16 Alpine

---

## 3. Quick Start (Windows)

### Option A: 1-Click Launch (Recommended)
Double-click `start_project.bat` or run in PowerShell:
```powershell
.\start_project.ps1
```
This automatically verifies dependencies, serves the compiled React dashboard and backend on **http://localhost:8000**, and opens your default browser!

### Option B: Manual Local Startup

#### 1. Backend Server
```powershell
cd backend
python run_backend.py
```
*Backend runs on `http://localhost:8000` (serving both the API and the compiled React frontend).*

#### 2. Frontend Development Server (Optional for HMR)
```powershell
cd frontend
npm install
npm run dev
```
*Vite dev server runs on `http://localhost:5173` with proxying to backend on port 8000.*

### Option C: Docker Compose Full Cluster
If Docker Desktop is running:
```powershell
docker-compose up --build
```
This launches PostgreSQL, ZooKeeper, Apache Kafka, Apache Spark Master, Spark Worker, Backend, and Frontend.

---

## 4. How to Demonstrate the Scenarios

Use the **Demonstration Scenarios** toolbar at the top of the Overview Dashboard:

1. **Scenario 1: Normal Traffic**
   - Click *Normal Traffic*.
   - Observe stable throughput (~35-45 eps), low SMS latency (80-120ms), and 0 critical congestion alerts.
2. **Scenario 2: Sudden SMS Traffic Spike**
   - Click *SMS Spike*.
   - Watch ingestion rate jump to 120 eps (90% SMS). Method A and Method B flag a relative throughput surge. Notice how the system identifies this as a spike, not congestion, because cell clusters still have spare headroom!
3. **Scenario 3: Voice Call Surge**
   - Click *Voice Surge*.
   - Voice calls climb to 85% of volume. Setup delays rise and Method C triggers warnings.
4. **Scenario 4: SMS Retry Storm**
   - Click *Retry Storm*.
   - Retries amplify load to 130 eps with soaring failure rates (>12%) and queue growth.
5. **Scenario 5: Regional Congestion**
   - Click *Regional Congestion*.
   - 85% of traffic concentrates into cell cluster `South-02`. South-02 utilization breaches 95% into **CONGESTED** status, while neighboring cluster `South-01` remains healthy.
6. **Scenario 6: Pipeline Bottleneck**
   - Click *Pipeline Bottleneck*.
   - Consumer throughput drops to 25%, causing the in-flight queue backlog to swell past 200 events. Method D flags sustained queue growth.
7. **Scenario 7: Recovery**
   - Click *Recovery Phase*.
   - Consumer capacity normalizes, queues drain, latencies drop below 100ms, and alerts resolve.

---

## 5. How to Demonstrate Network Response Mitigation

1. Navigate to the **Network Response Simulator** page from the sidebar.
2. Select **Dynamic Load Rerouting** (reroutes traffic from overloaded `South-02` to `South-01`).
3. Click **Execute Simulated Mitigation**.
4. The system executes the action, processes events under the new routing topology for 3 seconds, and displays an **Empirical Impact Evaluation Table** comparing before vs after:
   - Queue backlog reduction
   - SMS latency improvement
   - Target zone utilization drop
   - Honest scientific evaluation note confirming whether relief was achieved.

---

## 6. How to Run the Automated Test Suite

Run pytest in the backend directory:
```powershell
cd backend
python -m pytest tests/
```
Output:
```
tests\test_anomaly.py ..                                                 [ 18%]
tests\test_api.py .....                                                  [ 63%]
tests\test_congestion.py ..                                              [ 81%]
tests\test_stream_engine.py ..                                           [100%]
======================== 11 passed in 4.65s =========================
```

---

## 7. Viva Mode & Jury Presentation Guide

1. Navigate to the **Learning & Viva Mode** page.
2. Review the **Interactive "Ask Why?" Engine** to answer live queries like *"Why did traffic increase?"* and *"What does Kafka do here?"*.
3. Click the **Jury Viva Mode** tab to review answers to all 16 foundational questions:
   - *Why is this a Big Data project?*
   - *Why can't we simply use a normal database?*
   - *What is the difference between batch and stream processing?*
   - *What is the difference between a traffic spike and network congestion?*
   - *How does stream watermarking handle late-arriving events?*
4. Click **"Walk Me Through This Run"** to generate an ordered narrative of the current scenario, the metrics that shifted, the detectors triggered, and the recommended mitigations.

---

## 8. Ethical Transparency Statement

All data processed in this application is simulated using mathematically sound Poisson arrival distributions and 3GPP signaling schemas. This prototype does not monitor, tap into, or compromise any commercial carrier's private network infrastructure.
