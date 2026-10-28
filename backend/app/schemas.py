from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class TelecomEventSchema(BaseModel):
    event_id: str
    timestamp: float
    event_type: str  # SMS or VOICE
    source_region: str
    destination_region: str
    zone_id: str
    operator_id: str = "PulseNet-Core"
    status: str
    latency_ms: float = 0.0
    call_duration_s: float = 0.0
    call_setup_ms: float = 0.0
    failure_reason: Optional[str] = None
    priority: str = "NORMAL"
    retry_count: int = 0
    scenario_id: str = "NORMAL"

class MetricExplanation(BaseModel):
    metric_name: str
    current_value: Any
    unit: str
    delta_previous: float
    plain_language_explanation: str
    calculation_tooltip: str
    numerator: Optional[float] = None
    denominator: Optional[float] = None
    measurement_window: str = "30s"

class DashboardSummaryResponse(BaseModel):
    timestamp: float
    mode: str
    simulation_state: str  # RUNNING, PAUSED, STOPPED
    scenario: str
    window_duration_s: int
    
    # Core KPIs
    total_events_processed: MetricExplanation
    total_sms_processed: MetricExplanation
    total_call_attempts: MetricExplanation
    successful_sms_deliveries: MetricExplanation
    sms_failure_rate: MetricExplanation
    successful_calls: MetricExplanation
    call_failure_rate: MetricExplanation
    dropped_call_rate: MetricExplanation
    avg_call_duration: MetricExplanation
    avg_sms_latency: MetricExplanation
    avg_call_setup_ms: MetricExplanation
    current_throughput_eps: MetricExplanation
    queue_backlog: MetricExplanation
    active_regions_count: int
    active_alerts_count: int
    
    # Live mini series
    throughput_series: List[Dict[str, Any]]
    sms_vs_voice_series: List[Dict[str, Any]]
    regional_distribution: List[Dict[str, Any]]
    utilization_series: List[Dict[str, Any]]
    severity_distribution: Dict[str, int]

class ZoneStatusSchema(BaseModel):
    zone_id: str
    name: str
    region: str
    configured_capacity_eps: int
    current_load_eps: float
    utilization_pct: float
    queue_length: int
    avg_sms_latency_ms: float
    avg_call_setup_ms: float
    failure_rate_pct: float
    dropped_rate_pct: float
    status: str  # NORMAL, WARNING, CRITICAL, CONGESTED
    status_evidence: str

class AnomalySchema(BaseModel):
    anomaly_id: str
    timestamp: float
    region: str
    zone_id: Optional[str] = None
    event_type: str
    current_traffic_rate: float
    historical_baseline: float
    percentage_change: float
    detection_method: str  # Method A, B, C, D, or E
    severity: str          # INFO, WARNING, CRITICAL
    confidence_score: float
    suggested_investigation: str
    status: str            # OPEN, ACKNOWLEDGED, RESOLVED

class AlertSchema(BaseModel):
    id: str
    timestamp: float
    severity: str
    title: str
    description: str
    category: str
    affected_region: Optional[str] = None
    affected_zone: Optional[str] = None
    current_val: Optional[float] = None
    threshold: Optional[float] = None
    suggested_action: Optional[str] = None
    acknowledged: bool = False
    resolved: bool = False

class PipelineStageSchema(BaseModel):
    id: str
    name: str
    tech: str
    status: str
    events_in: int
    events_out: int
    latency_ms: float
    what_it_does: str
    why_it_exists: str
    input_data: str
    output_data: str
    processing_example: str

class PipelineStatusResponse(BaseModel):
    mode: str
    is_distributed: bool
    pipeline_status: str
    stages: List[PipelineStageSchema]
    big_data_5vs: Dict[str, Dict[str, Any]]

class MitigationActionRequest(BaseModel):
    action_type: str
    target_zone: Optional[str] = None
    parameter_value: Optional[float] = None

class SimulationControlRequest(BaseModel):
    action: str  # start, pause, resume, stop, reset
    rate_eps: Optional[int] = None
    mix_sms_pct: Optional[int] = None
    region: Optional[str] = None
    duration_s: Optional[int] = None
    seed: Optional[int] = None

class ScenarioTriggerRequest(BaseModel):
    scenario_id: str
