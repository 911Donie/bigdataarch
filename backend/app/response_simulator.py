import time
import uuid
import json
from typing import Dict, Any, List, Optional
from collections import deque
from app.generator import generator
from app.congestion_engine import congestion_engine
from app.stream_engine import stream_engine
from app.database import SessionLocal
from app.models import DBMitigationHistory

AVAILABLE_ACTIONS = [
    {
        "id": "REROUTE_TRAFFIC",
        "name": "Dynamic Load Rerouting",
        "problem_addressed": "Severe traffic imbalance and localized congestion in a single cell cluster (e.g., South-02).",
        "proposed_action": "Reroute 80% of new traffic from South-02 to neighboring cluster South-01 which has spare capacity.",
        "expected_outcome": "Immediate reduction of South-02 load from >95% to ~50%; eliminates packet drops and reduces queue delay.",
        "trade_offs": "Slightly increases hop latency for redirected subscribers (+15ms transmission path) and increases load on South-01.",
        "default_target": "South-02"
    },
    {
        "id": "EXPAND_CAPACITY",
        "name": "Auto-Scale Processing Capacity",
        "problem_addressed": "Cell cluster or consumer tier operating at near-100% capacity during high peak demand.",
        "proposed_action": "Allocate 50% additional processing threads / network band capacity to the target zone.",
        "expected_outcome": "Increases capacity from 100 eps to 150 eps, lowering utilization % below critical threshold.",
        "trade_offs": "Higher simulated cloud/compute resource consumption and cost.",
        "default_target": "South-02"
    },
    {
        "id": "RATE_LIMIT_ADMISSION",
        "name": "Traffic Admission Rate Limiting",
        "problem_addressed": "Catastrophic incoming traffic volume exceeding aggregate network headroom.",
        "proposed_action": "Enforce token-bucket rate limiting at edge gate to cap incoming events to nominal thresholds.",
        "expected_outcome": "Protects core messaging queues from overflow and prevents system-wide cascading crash.",
        "trade_offs": "A fraction of low-priority events are rejected at the edge rather than processed.",
        "default_target": "GLOBAL"
    },
    {
        "id": "PRIORITIZE_VOICE",
        "name": "Emergency Class-of-Service Prioritization",
        "problem_addressed": "Voice call failures during sudden surge, risking critical emergency communication.",
        "proposed_action": "Prioritize Voice SIP call setup packets in queue and defer bulk SMS dispatch.",
        "expected_outcome": "Call setup failure rate drops to <1%; call setup latency normalizes to <200ms.",
        "trade_offs": "Non-urgent bulk SMS delivery latency will temporarily increase while voice channels clear.",
        "default_target": "GLOBAL"
    },
    {
        "id": "SMS_RETRY_BACKOFF",
        "name": "Exponential Backoff & Jitter Protocol",
        "problem_addressed": "SMS retry storm causing amplification of failures and queue saturation.",
        "proposed_action": "Force sending SMSCs to apply exponential backoff (2^n + jitter) on failed attempts.",
        "expected_outcome": "Stops retry amplification; flattens queue backlog and restores SMS delivery success.",
        "trade_offs": "Individual failed messages take longer to re-attempt delivery.",
        "default_target": "GLOBAL"
    },
    {
        "id": "SCALE_CONSUMER_THREADS",
        "name": "Scale Stream Consumer Worker Threads",
        "problem_addressed": "Processing bottleneck where Kafka consumer throughput lags behind producer ingestion.",
        "proposed_action": "Scale consumer thread multiplier from constrained state back to 1.5x full throughput.",
        "expected_outcome": "Drains in-flight queue backlog rapidly and restores end-to-end stream latency to baseline.",
        "trade_offs": "Temporary CPU spike during queue drain phase.",
        "default_target": "CORE_STREAM"
    }
]

class NetworkResponseSimulator:
    def __init__(self):
        self.history: deque = deque(maxlen=25)

    def get_available_actions(self) -> List[Dict[str, Any]]:
        return AVAILABLE_ACTIONS

    def take_snapshot(self) -> Dict[str, Any]:
        """Takes a point-in-time snapshot of key metrics to compare before and after."""
        metrics = stream_engine.compute_window_metrics(10)
        zones = congestion_engine.evaluate_zones(10)
        
        # Target South-02 or primary zone if available
        s02_zone = next((z for z in zones if z["zone_id"] == "South-02"), None)
        
        return {
            "timestamp": time.time(),
            "throughput_eps": metrics["throughput_eps"],
            "queue_backlog": metrics["queue_backlog"],
            "sms_failure_rate": metrics["sms_failure_rate"],
            "call_failure_rate": metrics["call_failure_rate"],
            "avg_sms_latency_ms": metrics["avg_sms_latency_ms"],
            "avg_call_setup_ms": metrics["avg_call_setup_ms"],
            "target_zone_utilization": s02_zone["utilization_pct"] if s02_zone else 0.0,
            "target_zone_status": s02_zone["status"] if s02_zone else "NORMAL"
        }

    def execute_action(self, action_id: str, target_zone: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes a simulated mitigation response action.
        Captures before snapshot, modifies simulation parameters, and prepares evaluation.
        """
        action_def = next((a for a in AVAILABLE_ACTIONS if a["id"] == action_id), None)
        if not action_def:
            raise ValueError(f"Unknown action: {action_id}")

        before_snapshot = self.take_snapshot()
        applied_target = target_zone or action_def.get("default_target", "South-02")
        
        # Apply simulated changes in generator / engines
        if action_id == "REROUTE_TRAFFIC":
            # Reroute South-02 -> South-01
            generator.reroute_map["South-02"] = "South-01"
        elif action_id == "EXPAND_CAPACITY":
            # Boost capacity by 50%
            congestion_engine.adjust_zone_capacity(applied_target, 1.5)
        elif action_id == "RATE_LIMIT_ADMISSION":
            # Cap generation rate
            generator.configure(rate_eps=max(20, int(generator.rate_eps * 0.6)))
        elif action_id == "PRIORITIZE_VOICE":
            # Adjust mix to clear voice
            generator.configure(mix_sms_pct=25)
        elif action_id == "SMS_RETRY_BACKOFF":
            # Stop retry amplification
            generator.backoff_enabled = True
            generator.configure(rate_eps=max(30, int(generator.rate_eps * 0.7)))
        elif action_id == "SCALE_CONSUMER_THREADS":
            # Scale consumer processing throughput
            generator.consumer_capacity_multiplier = 1.6

        record_id = f"MIT-{int(time.time())}-{uuid.uuid4().hex[:4].upper()}"
        entry = {
            "id": record_id,
            "timestamp": time.time(),
            "action_id": action_id,
            "action_name": action_def["name"],
            "target_zone": applied_target,
            "problem_addressed": action_def["problem_addressed"],
            "proposed_action": action_def["proposed_action"],
            "expected_outcome": action_def["expected_outcome"],
            "trade_offs": action_def["trade_offs"],
            "before_metrics": before_snapshot,
            "after_metrics": None,
            "status": "APPLIED",
            "evaluation_result": "Mitigation applied. System processing under new parameters..."
        }
        
        self.history.appendleft(entry)
        return entry

    def evaluate_recent_action(self, record_id: str) -> Optional[Dict[str, Any]]:
        """
        Evaluates the measured impact of an applied mitigation using live simulation data.
        """
        entry = next((e for e in self.history if e["id"] == record_id), None)
        if not entry:
            return None

        after_snapshot = self.take_snapshot()
        before = entry["before_metrics"]
        
        # Compare deltas
        delta_queue = after_snapshot["queue_backlog"] - before["queue_backlog"]
        delta_latency = round(after_snapshot["avg_sms_latency_ms"] - before["avg_sms_latency_ms"], 1)
        delta_util = round(after_snapshot["target_zone_utilization"] - before["target_zone_utilization"], 1)
        delta_fail = round(after_snapshot["sms_failure_rate"] - before["sms_failure_rate"], 2)

        is_improved = (delta_queue <= 0 or delta_latency <= 0 or delta_util < 0)
        
        explanation = (
            f"Observed results after intervention: "
            f"Queue backlog shifted by {delta_queue} events ({before['queue_backlog']} -> {after_snapshot['queue_backlog']}). "
            f"SMS Latency changed by {delta_latency} ms ({before['avg_sms_latency_ms']} -> {after_snapshot['avg_sms_latency_ms']} ms). "
            f"Target zone utilization changed by {delta_util}% ({before['target_zone_utilization']}% -> {after_snapshot['target_zone_utilization']}%). "
            f"{'Intervention successfully relieved network pressure.' if is_improved else 'Load remains elevated; further throttling or scaling required.'}"
        )

        entry["after_metrics"] = after_snapshot
        entry["status"] = "EVALUATED"
        entry["evaluation_result"] = explanation
        entry["is_effective"] = is_improved
        
        # Save to DB
        try:
            db = SessionLocal()
            rec = DBMitigationHistory(
                id=entry["id"],
                timestamp=entry["timestamp"],
                action_type=entry["action_id"],
                target_zone=entry["target_zone"],
                problem_addressed=entry["problem_addressed"],
                expected_outcome=entry["expected_outcome"],
                trade_offs=entry["trade_offs"],
                before_metrics=json.dumps(before),
                after_metrics=json.dumps(after_snapshot),
                status="EVALUATED",
                evaluation_result=explanation
            )
            db.merge(rec)
            db.commit()
            db.close()
        except Exception:
            pass
            
        return entry

    def get_history(self) -> List[Dict[str, Any]]:
        return list(self.history)

response_simulator = NetworkResponseSimulator()
