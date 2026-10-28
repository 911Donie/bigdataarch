import pytest
import time
from app.generator import generator
from app.stream_engine import stream_engine
from app.data_quality import data_quality_engine

def test_data_quality_validation():
    data_quality_engine.reset()
    
    # Valid event
    valid_evt = {
        "event_id": "TEST-001",
        "timestamp": time.time(),
        "event_type": "SMS",
        "source_region": "North",
        "zone_id": "North-01",
        "status": "DELIVERED"
    }
    accepted, reason, processed = data_quality_engine.validate_and_filter(valid_evt)
    assert accepted is True
    assert reason is None
    
    # Duplicate event
    accepted_dup, reason_dup, _ = data_quality_engine.validate_and_filter(valid_evt)
    assert accepted_dup is False
    assert "Duplicate" in reason_dup

    # Corrupted event missing required field
    corrupt_evt = {
        "event_id": "TEST-002",
        "timestamp": time.time(),
        "event_type": "INVALID_TYPE"
    }
    accepted_corrupt, reason_corrupt, _ = data_quality_engine.validate_and_filter(corrupt_evt)
    assert accepted_corrupt is False

def test_window_metrics_calculation():
    generator.reset()
    now = time.time()
    
    # Inject known events directly into processing buffer
    test_events = [
        # 10 SMS: 8 DELIVERED, 2 FAILED (20% failure rate)
        *[{
            "event_id": f"TEST-SMS-{i}",
            "timestamp": now - 5,
            "event_type": "SMS",
            "source_region": "North",
            "zone_id": "North-01",
            "status": "DELIVERED" if i < 8 else "FAILED",
            "latency_ms": 100.0,
            "call_duration_s": 0.0,
            "call_setup_ms": 0.0
        } for i in range(10)],
        
        # 10 VOICE: 7 CONNECTED, 2 FAILED, 1 DROPPED (20% failure, 10% drop)
        *[{
            "event_id": f"TEST-VOICE-{i}",
            "timestamp": now - 5,
            "event_type": "VOICE",
            "source_region": "South",
            "zone_id": "South-01",
            "status": "CONNECTED" if i < 7 else ("FAILED" if i < 9 else "DROPPED"),
            "latency_ms": 0.0,
            "call_duration_s": 60.0,
            "call_setup_ms": 200.0
        } for i in range(10)]
    ]
    
    generator.processing_buffer.extend(test_events)
    
    # Compute 10s window metrics
    metrics = stream_engine.compute_window_metrics(10)
    
    assert metrics["total_events"] == 20
    assert metrics["sms_count"] == 10
    assert metrics["voice_count"] == 10
    assert metrics["sms_delivered"] == 8
    assert metrics["sms_failed"] == 2
    assert metrics["sms_failure_rate"] == 20.0
    assert metrics["voice_connected"] == 7
    assert metrics["voice_failed"] == 2
    assert metrics["voice_dropped"] == 1
    assert metrics["call_failure_rate"] == 20.0
    assert metrics["dropped_call_rate"] == 10.0
    assert metrics["throughput_eps"] == 2.0  # 20 events / 10s
