from fastapi import APIRouter
from app.config import settings
from app.generator import generator
from app.stream_engine import stream_engine
from app.anomaly_detector import anomaly_detector
from app.data_quality import data_quality_engine

router = APIRouter()

@router.get("/status")
def get_pipeline_status():
    m = stream_engine.compute_window_metrics(30)
    dq = data_quality_engine.get_metrics()
    
    stages = [
        {
            "id": "stage-1",
            "name": "Telecom Event Generator",
            "tech": "Python Async Event Engine (Poisson arrival)",
            "status": "ACTIVE" if generator.state == "RUNNING" else generator.state,
            "events_in": generator.total_generated,
            "events_out": generator.total_generated,
            "latency_ms": 0.4,
            "what_it_does": "Generates continuous, realistic SMS and Voice network signaling and CDR events with Gaussian latency distributions.",
            "why_it_exists": "Simulates real-world mobile switching centers (MSC), base station controllers (BSC), and SMSCs continuously producing events.",
            "input_data": "Configured scenario parameters (rate, region, traffic mix, error rates)",
            "output_data": "Raw event records: event_id, timestamp, type, region, zone_id, status",
            "processing_example": "{'event_id': 'EVT-10293', 'type': 'SMS', 'zone': 'South-02', 'status': 'DELIVERED', 'latency': 94.2}"
        },
        {
            "id": "stage-2",
            "name": "Event Ingestion & Message Broker",
            "tech": "Kafka Broker / Partitioned FIFO Ingestion Queue" if settings.STREAMING_MODE == "KAFKA_SPARK" else "Bounded Stream Queue Buffer",
            "status": "HEALTHY",
            "events_in": generator.total_generated,
            "events_out": generator.total_processed + len(generator.event_queue),
            "latency_ms": 1.2,
            "what_it_does": "Buffers high-velocity event bursts and decouples producers from downstream consumers.",
            "why_it_exists": "Acts as an elastic shock absorber preventing downstream database overload during sudden surges.",
            "input_data": "Unvalidated event stream from mobile switching nodes",
            "output_data": "Buffered, ordered event stream partitioned by region and event type",
            "processing_example": f"Ingestion Queue length: {len(generator.event_queue)} pending items"
        },
        {
            "id": "stage-3",
            "name": "Data Quality & Schema Validation",
            "tech": "LRU Bloom Filter Deduplication + Watermark Filter",
            "status": "FILTERING",
            "events_in": dq["events_received"],
            "events_out": dq["events_accepted"],
            "latency_ms": 0.8,
            "what_it_does": "Checks 3GPP schema conformity, drops corrupted records, detects duplicates, and handles late-arriving timestamps.",
            "why_it_exists": "Ensures downstream analytical aggregates and ML detectors are not corrupted by duplicate or malformed events.",
            "input_data": "Raw buffered events",
            "output_data": "Validated clean stream records + error audit counters",
            "processing_example": f"Accepted: {dq['events_accepted']} | Duplicates Dropped: {dq['duplicates_detected']} | Late: {dq['late_events_detected']}"
        },
        {
            "id": "stage-4",
            "name": "Stream Window Processing",
            "tech": "Apache Spark Structured Streaming / In-Memory Window Engine",
            "status": "PROCESSING",
            "events_in": dq["events_accepted"],
            "events_out": generator.total_processed,
            "latency_ms": 2.5,
            "what_it_does": "Computes rolling multi-temporal window aggregations (10s, 30s, 60s, 300s) on event timestamps.",
            "why_it_exists": "Calculates real-time KPIs (throughput eps, failure rates, average latencies) over dynamic sliding time intervals.",
            "input_data": "Clean validated event stream",
            "output_data": "Aggregated window metrics dictionaries and rolling statistical baselines",
            "processing_example": f"30s Window: {m['total_events']} events, Throughput: {m['throughput_eps']} eps, SMS Fail: {m['sms_failure_rate']}%"
        },
        {
            "id": "stage-5",
            "name": "Multi-Method Anomaly Detection",
            "tech": "Statistical Baseline Engine + Scikit-Learn Isolation Forest",
            "status": "MONITORING",
            "events_in": generator.total_processed,
            "events_out": len(anomaly_detector.detected_anomalies),
            "latency_ms": 3.8,
            "what_it_does": "Evaluates traffic across 5 complementary detection methods (Relative Spike, Z-Score, Failure-Rate, Queue Growth, and ML).",
            "why_it_exists": "Identifies abnormal traffic surges and isolates true network congestion from benign demand spikes.",
            "input_data": "Window metrics and historical regional baselines",
            "output_data": "Structured anomaly alerts with severity, confidence score, and suggested investigation",
            "processing_example": "Method B: Z-Score = 2.87σ (Exceeds 2.5σ threshold) -> Emit CRITICAL alert"
        },
        {
            "id": "stage-6",
            "name": "Historical Persistence & Alert Dispatch",
            "tech": "PostgreSQL / SQLite Storage + WebSocket Dispatcher",
            "status": "COMMITTED",
            "events_in": len(anomaly_detector.detected_anomalies),
            "events_out": len(anomaly_detector.detected_anomalies),
            "latency_ms": 1.5,
            "what_it_does": "Persists window snapshots, deduplicated alerts, and mitigation history for longitudinal audit and queries.",
            "why_it_exists": "Enables historical trend analysis, post-incident RCA (Root Cause Analysis), and compliance reporting.",
            "input_data": "Aggregated metrics, anomalies, and operator actions",
            "output_data": "Indexed database records and live WebSocket broadcast messages",
            "processing_example": "Committed snapshot: 30s window aggregate saved to DB"
        }
    ]

    # Big Data 5 Vs live metrics
    big_data_5vs = {
        "Volume": {
            "title": "Volume (Data Scale)",
            "description": "Continuous accumulation of high-density event streams.",
            "current_metric": f"{generator.total_processed} processed events",
            "live_explanation": f"The pipeline has handled {generator.total_generated} generated events. In a commercial carrier network, this scales to 4.5 billion events daily (~12 TB raw CDRs)."
        },
        "Velocity": {
            "title": "Velocity (Processing Speed)",
            "description": "Sub-second event arrival and low-latency sliding window processing.",
            "current_metric": f"{m['throughput_eps']} events/second",
            "live_explanation": f"Events are ingested and processed within <5ms latency. Window metrics refresh continuously every second."
        },
        "Variety": {
            "title": "Variety (Data Heterogeneity)",
            "description": "Diverse event formats with distinct payload schemas.",
            "current_metric": "SMS (SMPP) + Voice (SIP/ISUP)",
            "live_explanation": f"The pipeline seamlessly processes both SMS delivery receipts (delivery latencies, SMSC errors) and Voice calls (call setup delays, duration, drop reasons)."
        },
        "Veracity": {
            "title": "Veracity (Data Trustworthiness)",
            "description": "Mitigating duplicates, delayed arrivals, and corrupted records.",
            "current_metric": f"{dq['acceptance_rate_pct']}% data acceptance",
            "live_explanation": f"Watermark engine detected {dq['duplicates_detected']} duplicate packets and {dq['late_events_detected']} late-arriving events, protecting KPI calculations from corruption."
        },
        "Value": {
            "title": "Value (Business & Operational Impact)",
            "description": "Transforming raw packet telemetries into proactive operator interventions.",
            "current_metric": f"{len(anomaly_detector.detected_anomalies)} anomalies flagged",
            "live_explanation": "Prevents catastrophic cellular network outages, protects regulatory SLA compliance, and guides automated dynamic load rerouting."
        }
    }

    return {
        "mode": settings.STREAMING_MODE,
        "is_distributed": settings.STREAMING_MODE == "KAFKA_SPARK",
        "pipeline_status": "ACTIVE" if generator.state == "RUNNING" else "PAUSED" if generator.state == "PAUSED" else "IDLE",
        "stages": stages,
        "big_data_5vs": big_data_5vs
    }
