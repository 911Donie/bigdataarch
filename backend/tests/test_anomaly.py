import pytest
import time
from app.generator import generator
from app.stream_engine import stream_engine
from app.anomaly_detector import anomaly_detector
from app.alert_manager import alert_manager

def test_anomaly_detection_methods():
    generator.reset()
    now = time.time()
    
    # Establish a baseline
    for _ in range(20):
        stream_engine.rolling_history["North"].append(10.0)
        
    # Inject sudden massive burst into North (Spike: 60 eps vs 10 eps baseline)
    burst_events = [{
        "event_id": f"BURST-{i}",
        "timestamp": now - 2,
        "event_type": "SMS",
        "source_region": "North",
        "zone_id": "North-01",
        "status": "DELIVERED",
        "latency_ms": 110.0
    } for i in range(150)]
    generator.processing_buffer.extend(burst_events)
    
    anomalies = anomaly_detector.evaluate_anomalies()
    assert len(anomalies) > 0
    
    # At least Method A or Method B should flag the burst
    methods = [a["detection_method"] for a in anomalies]
    assert any("Method A" in m or "Method B" in m for m in methods)

def test_alert_manager_deduplication():
    # Trigger first alert
    a1 = alert_manager.trigger_alert(
        severity="WARNING",
        title="High Latency Alert",
        description="SMS latency above threshold",
        category="LATENCY",
        affected_zone="South-02"
    )
    assert a1 is not None
    
    # Immediate identical trigger should be suppressed by cooldown
    a2 = alert_manager.trigger_alert(
        severity="WARNING",
        title="High Latency Alert",
        description="SMS latency above threshold",
        category="LATENCY",
        affected_zone="South-02"
    )
    assert a2 is None  # Cooldown active!
    
    # Acknowledging should work
    ack_res = alert_manager.acknowledge_alert(a1["id"])
    assert ack_res is True
    
    # Resolving should work
    res_res = alert_manager.resolve_alert(a1["id"])
    assert res_res is True
