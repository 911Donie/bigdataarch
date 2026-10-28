import time
import io
import csv
from fastapi import APIRouter, Query, Response
from typing import Optional
from app.stream_engine import stream_engine
from app.generator import generator

router = APIRouter()

@router.get("/live")
def get_live_traffic():
    """Returns recent time-series telemetry points for real-time charts."""
    return {
        "timestamp": time.time(),
        "series": list(stream_engine.time_series_history),
        "recent_events": list(generator.processing_buffer)[-25:]
    }

@router.get("/history")
def get_historical_traffic(
    region: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    scenario: Optional[str] = Query(None),
    limit: int = Query(100, le=500)
):
    """
    Queries historical events from buffer with multi-attribute filtering.
    """
    events = generator.get_processed_events()
    
    if region and region != "ALL":
        events = [e for e in events if e.get("source_region") == region]
    if event_type and event_type != "ALL":
        events = [e for e in events if e.get("event_type") == event_type]
    if status and status != "ALL":
        events = [e for e in events if e.get("status") == status]
    if scenario and scenario != "ALL":
        events = [e for e in events if e.get("scenario_id") == scenario]
        
    return {
        "total_matched": len(events),
        "events": events[-limit:]
    }

@router.get("/export-csv")
def export_traffic_csv(
    region: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """
    Exports filtered historical records as downloadable CSV.
    """
    events = generator.get_processed_events()
    if region and region != "ALL":
        events = [e for e in events if e.get("source_region") == region]
    if event_type and event_type != "ALL":
        events = [e for e in events if e.get("event_type") == event_type]
    if status and status != "ALL":
        events = [e for e in events if e.get("status") == status]

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Event ID", "Timestamp", "Formatted Time", "Type", "Source Region",
        "Dest Region", "Zone ID", "Status", "Latency (ms)", "Call Setup (ms)",
        "Call Duration (s)", "Failure Reason", "Scenario"
    ])
    
    for e in events:
        t_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(e.get("timestamp", time.time())))
        writer.writerow([
            e.get("event_id"),
            e.get("timestamp"),
            t_str,
            e.get("event_type"),
            e.get("source_region"),
            e.get("destination_region"),
            e.get("zone_id"),
            e.get("status"),
            e.get("latency_ms", 0.0),
            e.get("call_setup_ms", 0.0),
            e.get("call_duration_s", 0.0),
            e.get("failure_reason") or "N/A",
            e.get("scenario_id")
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=telecom_traffic_export_{int(time.time())}.csv"}
    )
