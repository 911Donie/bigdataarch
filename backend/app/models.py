import time
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, Text, Index
from app.database import Base

class DBTelecomEvent(Base):
    __tablename__ = "telecom_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(String(64), unique=True, index=True, nullable=False)
    timestamp = Column(Float, index=True, nullable=False)
    event_type = Column(String(16), index=True, nullable=False)  # SMS or VOICE
    source_region = Column(String(32), index=True, nullable=False)
    destination_region = Column(String(32), nullable=False)
    zone_id = Column(String(32), index=True, nullable=False)
    operator_id = Column(String(32), default="PulseNet-Core")
    status = Column(String(32), nullable=False)  # DELIVERED, FAILED, CONNECTED, DROPPED, etc.
    latency_ms = Column(Float, default=0.0)
    call_duration_s = Column(Float, default=0.0)
    call_setup_ms = Column(Float, default=0.0)
    failure_reason = Column(String(64), nullable=True)
    priority = Column(String(16), default="NORMAL")
    retry_count = Column(Integer, default=0)
    scenario_id = Column(String(64), default="NORMAL")

class DBWindowSnapshot(Base):
    __tablename__ = "window_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(Float, index=True, nullable=False)
    window_duration_s = Column(Integer, nullable=False)
    total_events = Column(Integer, nullable=False)
    sms_count = Column(Integer, default=0)
    voice_count = Column(Integer, default=0)
    sms_delivered = Column(Integer, default=0)
    sms_failed = Column(Integer, default=0)
    voice_connected = Column(Integer, default=0)
    voice_failed = Column(Integer, default=0)
    voice_dropped = Column(Integer, default=0)
    sms_failure_rate = Column(Float, default=0.0)
    voice_failure_rate = Column(Float, default=0.0)
    dropped_call_rate = Column(Float, default=0.0)
    avg_sms_latency_ms = Column(Float, default=0.0)
    avg_call_duration_s = Column(Float, default=0.0)
    avg_call_setup_ms = Column(Float, default=0.0)
    throughput_eps = Column(Float, default=0.0)
    queue_backlog = Column(Integer, default=0)
    active_alerts = Column(Integer, default=0)

class DBAlert(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(Float, index=True, nullable=False)
    severity = Column(String(16), nullable=False)  # INFO, WARNING, CRITICAL
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), nullable=False)
    affected_region = Column(String(32), nullable=True)
    affected_zone = Column(String(32), nullable=True)
    current_val = Column(Float, nullable=True)
    threshold = Column(Float, nullable=True)
    suggested_action = Column(Text, nullable=True)
    acknowledged = Column(Boolean, default=False)
    resolved = Column(Boolean, default=False)
    resolved_at = Column(Float, nullable=True)

class DBMitigationHistory(Base):
    __tablename__ = "mitigation_history"

    id = Column(String(64), primary_key=True)
    timestamp = Column(Float, index=True, nullable=False)
    action_type = Column(String(64), nullable=False)
    target_zone = Column(String(32), nullable=True)
    problem_addressed = Column(Text, nullable=False)
    expected_outcome = Column(Text, nullable=False)
    trade_offs = Column(Text, nullable=False)
    before_metrics = Column(Text, nullable=False)  # JSON string
    after_metrics = Column(Text, nullable=True)    # JSON string
    status = Column(String(32), default="APPLIED")
    evaluation_result = Column(Text, nullable=True)

class DBSimulationSession(Base):
    __tablename__ = "simulation_sessions"

    id = Column(String(64), primary_key=True)
    started_at = Column(Float, nullable=False)
    ended_at = Column(Float, nullable=True)
    scenario_id = Column(String(64), nullable=False)
    events_generated = Column(Integer, default=0)
    events_processed = Column(Integer, default=0)
    events_rejected = Column(Integer, default=0)
