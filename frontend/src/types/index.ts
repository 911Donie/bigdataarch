export interface MetricExplanation {
  metric_name: string;
  current_value: number | string;
  unit: string;
  delta_previous: number;
  plain_language_explanation: string;
  calculation_tooltip: string;
  numerator?: number;
  denominator?: number;
  measurement_window?: string;
}

export interface ZoneStatus {
  zone_id: string;
  name: string;
  region: string;
  configured_capacity_eps: number;
  current_load_eps: number;
  utilization_pct: number;
  queue_length: number;
  avg_sms_latency_ms: number;
  avg_call_setup_ms: number;
  failure_rate_pct: number;
  dropped_rate_pct: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'CONGESTED';
  status_evidence: string;
}

export interface Anomaly {
  anomaly_id: string;
  timestamp: number;
  region: string;
  zone_id?: string;
  event_type: string;
  current_traffic_rate: number;
  historical_baseline: number;
  percentage_change: number;
  detection_method: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  confidence_score: number;
  suggested_investigation: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  is_congestion?: boolean;
}

export interface Alert {
  id: string;
  timestamp: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  category: string;
  affected_region?: string;
  affected_zone?: string;
  current_val?: number;
  threshold?: number;
  suggested_action?: string;
  acknowledged: boolean;
  resolved: boolean;
}

export interface TimeSeriesPoint {
  time: string;
  timestamp: number;
  throughput_eps: number;
  sms_eps: number;
  voice_eps: number;
  sms_latency_ms: number;
  call_setup_ms: number;
  sms_failed: number;
  sms_delivered: number;
  voice_failed: number;
  voice_connected: number;
  queue_backlog: number;
}

export interface RegionalShare {
  region: string;
  total: number;
  sms: number;
  voice: number;
  failures: number;
  share_pct: number;
}

export interface DashboardSummary {
  timestamp: number;
  mode: string;
  simulation_state: 'RUNNING' | 'PAUSED' | 'STOPPED';
  scenario: string;
  window_duration_s: number;
  kpis: {
    total_events_processed: MetricExplanation;
    total_sms_processed: MetricExplanation;
    total_call_attempts: MetricExplanation;
    successful_sms_deliveries: MetricExplanation;
    sms_failure_rate: MetricExplanation;
    successful_calls: MetricExplanation;
    call_failure_rate: MetricExplanation;
    dropped_call_rate: MetricExplanation;
    avg_call_duration: MetricExplanation;
    avg_sms_latency: MetricExplanation;
    avg_call_setup_ms: MetricExplanation;
    current_throughput_eps: MetricExplanation;
    queue_backlog: MetricExplanation;
  };
  active_regions_count: number;
  active_alerts_count: number;
  zones: ZoneStatus[];
  throughput_series: TimeSeriesPoint[];
  regional_distribution: RegionalShare[];
  severity_distribution: {
    INFO: number;
    WARNING: number;
    CRITICAL: number;
  };
}

export interface PipelineStage {
  id: string;
  name: string;
  tech: string;
  status: string;
  events_in: number;
  events_out: number;
  latency_ms: number;
  what_it_does: string;
  why_it_exists: string;
  input_data: string;
  output_data: string;
  processing_example: string;
}

export interface BigDataV {
  title: string;
  description: string;
  current_metric: string;
  live_explanation: string;
}

export interface PipelineStatusData {
  mode: string;
  is_distributed: boolean;
  pipeline_status: string;
  stages: PipelineStage[];
  big_data_5vs: {
    Volume: BigDataV;
    Velocity: BigDataV;
    Variety: BigDataV;
    Veracity: BigDataV;
    Value: BigDataV;
  };
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  what_happens: string;
  expected_behavior: string;
}

export interface MitigationAction {
  id: string;
  name: string;
  problem_addressed: string;
  proposed_action: string;
  expected_outcome: string;
  trade_offs: string;
  default_target: string;
}

export interface MitigationRecord {
  id: string;
  timestamp: number;
  action_id: string;
  action_name: string;
  target_zone: string;
  problem_addressed: string;
  proposed_action: string;
  expected_outcome: string;
  trade_offs: string;
  before_metrics: any;
  after_metrics: any;
  status: string;
  evaluation_result: string;
  is_effective?: boolean;
}

export interface VivaQuestion {
  id: number;
  question: string;
  short_answer: string;
  technical_answer: string;
  current_run_example: string;
}

export interface WalkthroughStep {
  step: number;
  title: string;
  detail: string;
}

export interface DataQualityMetrics {
  events_received: number;
  events_accepted: number;
  events_rejected: number;
  duplicates_detected: number;
  late_events_detected: number;
  schema_validation_errors: number;
  acceptance_rate_pct: number;
  watermark_delay_s: number;
  injection_status: {
    duplicates: boolean;
    delay: boolean;
    schema_errors: boolean;
  };
}
