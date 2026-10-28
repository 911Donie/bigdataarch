import time
from fastapi import APIRouter, Query
from app.stream_engine import stream_engine
from app.generator import generator
from app.congestion_engine import congestion_engine
from app.alert_manager import alert_manager
from app.config import settings

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(window_seconds: int = Query(30, ge=10, le=300)):
    m = stream_engine.compute_window_metrics(window_seconds)
    zones = congestion_engine.evaluate_zones(window_seconds)
    active_alerts = alert_manager.get_alerts(include_resolved=False)
    
    # Calculate severity distribution
    severity_dist = {"INFO": 0, "WARNING": 0, "CRITICAL": 0}
    for a in active_alerts:
        sev = a.get("severity", "INFO")
        severity_dist[sev] = severity_dist.get(sev, 0) + 1

    # Helpers to format KPI with 5 explainability fields
    return {
        "timestamp": time.time(),
        "mode": settings.STREAMING_MODE,
        "simulation_state": generator.state,
        "scenario": generator.active_scenario,
        "window_duration_s": window_seconds,
        "kpis": {
            "total_events_processed": {
                "metric_name": "Total Events Processed",
                "current_value": generator.total_processed,
                "unit": "events",
                "delta_previous": round(m["throughput_eps"] * 5, 0),
                "plain_language_explanation": f"Total volume of telecom events validated and processed since session start.",
                "calculation_tooltip": f"Cumulative count of accepted events passing schema and watermark validation.",
                "measurement_window": "Session Total"
            },
            "total_sms_processed": {
                "metric_name": "Total SMS Events",
                "current_value": m["sms_count"],
                "unit": "messages",
                "delta_previous": round(m["sms_count"] * 0.05, 1),
                "plain_language_explanation": f"SMS message events handled within the active {window_seconds}s time window.",
                "calculation_tooltip": f"Count of SMS events with event timestamp in [T - {window_seconds}s, T].",
                "numerator": m["sms_count"],
                "denominator": window_seconds,
                "measurement_window": f"{window_seconds}s"
            },
            "total_call_attempts": {
                "metric_name": "Voice Call Attempts",
                "current_value": m["voice_count"],
                "unit": "calls",
                "delta_previous": round(m["voice_count"] * 0.04, 1),
                "plain_language_explanation": f"Number of voice call signaling attempts initiated within the active {window_seconds}s window.",
                "calculation_tooltip": f"Count of VOICE initiation events in [T - {window_seconds}s, T].",
                "numerator": m["voice_count"],
                "denominator": window_seconds,
                "measurement_window": f"{window_seconds}s"
            },
            "successful_sms_deliveries": {
                "metric_name": "Successful SMS Deliveries",
                "current_value": m["sms_delivered"],
                "unit": "delivered",
                "delta_previous": 0.0,
                "plain_language_explanation": f"SMS messages that received successful network delivery receipt acknowledgment.",
                "calculation_tooltip": f"Sum of SMS events with status 'DELIVERED' in the active window.",
                "measurement_window": f"{window_seconds}s"
            },
            "sms_failure_rate": {
                "metric_name": "SMS Delivery Failure Rate",
                "current_value": m["sms_failure_rate"],
                "unit": "%",
                "delta_previous": round(m["sms_failure_rate"] - 1.5, 2),
                "plain_language_explanation": f"Out of every 100 SMS delivery attempts in the last {window_seconds}s, approximately {m['sms_failure_rate']} failed. This can indicate SMSC backlog or route congestion.",
                "calculation_tooltip": f"({m['sms_failed']} failed SMS / {max(1, m['sms_count'])} total SMS attempts) × 100.",
                "numerator": m["sms_failed"],
                "denominator": max(1, m["sms_count"]),
                "measurement_window": f"{window_seconds}s"
            },
            "successful_calls": {
                "metric_name": "Successful Voice Calls",
                "current_value": m["voice_connected"],
                "unit": "connected",
                "delta_previous": 0.0,
                "plain_language_explanation": f"Voice call attempts that successfully established circuit or SIP audio session.",
                "calculation_tooltip": f"Sum of VOICE events with status 'CONNECTED'.",
                "measurement_window": f"{window_seconds}s"
            },
            "call_failure_rate": {
                "metric_name": "Voice Call Failure Rate",
                "current_value": m["call_failure_rate"],
                "unit": "%",
                "delta_previous": round(m["call_failure_rate"] - 1.8, 2),
                "plain_language_explanation": f"Percentage of call setup attempts that failed prior to audio connection.",
                "calculation_tooltip": f"({m['voice_failed']} failed calls / {max(1, m['voice_count'])} call attempts) × 100.",
                "numerator": m["voice_failed"],
                "denominator": max(1, m["voice_count"]),
                "measurement_window": f"{window_seconds}s"
            },
            "dropped_call_rate": {
                "metric_name": "Dropped Call Rate",
                "current_value": m["dropped_call_rate"],
                "unit": "%",
                "delta_previous": 0.0,
                "plain_language_explanation": f"Percentage of connected voice calls abnormally terminated due to radio link or handover loss.",
                "calculation_tooltip": f"({m['voice_dropped']} dropped calls / {max(1, m['voice_count'])} calls) × 100.",
                "numerator": m["voice_dropped"],
                "denominator": max(1, m["voice_count"]),
                "measurement_window": f"{window_seconds}s"
            },
            "avg_call_duration": {
                "metric_name": "Average Call Duration",
                "current_value": m["avg_call_duration_s"],
                "unit": "seconds",
                "delta_previous": 0.0,
                "plain_language_explanation": f"Average length of active subscriber voice conversations.",
                "calculation_tooltip": f"Sum of call durations / total connected voice calls.",
                "measurement_window": f"{window_seconds}s"
            },
            "avg_sms_latency": {
                "metric_name": "Average SMS Latency",
                "current_value": m["avg_sms_latency_ms"],
                "unit": "ms",
                "delta_previous": round(m["avg_sms_latency_ms"] - 95.0, 1),
                "plain_language_explanation": f"Mean elapsed time from subscriber SMS submission to terminal delivery confirmation.",
                "calculation_tooltip": f"Sum of delivery latency for delivered SMS / {max(1, m['sms_delivered'])} delivered messages.",
                "measurement_window": f"{window_seconds}s"
            },
            "avg_call_setup_ms": {
                "metric_name": "Average Call Setup Delay",
                "current_value": m["avg_call_setup_ms"],
                "unit": "ms",
                "delta_previous": round(m["avg_call_setup_ms"] - 180.0, 1),
                "plain_language_explanation": f"Mean signaling latency required to negotiate channels and ring destination.",
                "calculation_tooltip": f"Sum of setup time for initiated calls / total call attempts.",
                "measurement_window": f"{window_seconds}s"
            },
            "current_throughput_eps": {
                "metric_name": "Current Traffic Throughput",
                "current_value": m["throughput_eps"],
                "unit": "events/sec",
                "delta_previous": round(m["throughput_eps"] - 40.0, 1),
                "plain_language_explanation": f"Rate of telecom events arriving and being processed per second.",
                "calculation_tooltip": f"{m['total_events']} events in window / {window_seconds} seconds = {m['throughput_eps']} eps.",
                "numerator": m["total_events"],
                "denominator": window_seconds,
                "measurement_window": f"{window_seconds}s"
            },
            "queue_backlog": {
                "metric_name": "Queue Backlog",
                "current_value": m["queue_backlog"],
                "unit": "events pending",
                "delta_previous": 0.0,
                "plain_language_explanation": f"Events currently queued in buffer awaiting stream consumer worker processing.",
                "calculation_tooltip": f"Length of ingestion queue buffer.",
                "measurement_window": "Instantaneous"
            }
        },
        "active_regions_count": len(settings.REGIONS),
        "active_alerts_count": len(active_alerts),
        "zones": zones,
        "throughput_series": list(stream_engine.time_series_history),
        "regional_distribution": m["regional_distribution"],
        "severity_distribution": severity_dist
    }
