import pytest
import time
from app.generator import generator
from app.congestion_engine import congestion_engine
from app.response_simulator import response_simulator

def test_congestion_classification():
    generator.reset()
    now = time.time()
    
    # Base capacity of South-02 is 100 eps.
    # Inject 120 eps (1200 events over 10s) with high latency to simulate congestion
    events = [{
        "event_id": f"CONG-{i}",
        "timestamp": now - 3,
        "event_type": "SMS",
        "source_region": "South",
        "zone_id": "South-02",
        "status": "DELIVERED" if i % 10 != 0 else "FAILED",
        "latency_ms": 320.0
    } for i in range(400)]
    generator.processing_buffer.extend(events)
    
    zones = congestion_engine.evaluate_zones(10)
    s02 = next((z for z in zones if z["zone_id"] == "South-02"), None)
    assert s02 is not None
    assert s02["current_load_eps"] > 0
    assert "evidence" in s02["status_evidence"].lower() or "capacity" in s02["status_evidence"].lower()

def test_mitigation_response_cycle():
    # Execute rerouting mitigation
    record = response_simulator.execute_action("REROUTE_TRAFFIC", "South-02")
    assert record["action_id"] == "REROUTE_TRAFFIC"
    assert record["status"] == "APPLIED"
    assert generator.reroute_map.get("South-02") == "South-01"
    
    # Evaluate intervention
    eval_record = response_simulator.evaluate_recent_action(record["id"])
    assert eval_record is not None
    assert eval_record["status"] == "EVALUATED"
    assert eval_record["after_metrics"] is not None
