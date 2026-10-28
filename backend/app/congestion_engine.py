import time
import numpy as np
from typing import Dict, Any, List
from collections import defaultdict
from app.config import settings
from app.stream_engine import stream_engine
from app.generator import generator

class NetworkCongestionEngine:
    def __init__(self):
        # Base zone configuration
        self.zone_capacities: Dict[str, int] = dict(settings.ZONE_CAPACITIES)
        self.capacity_multipliers: Dict[str, float] = defaultdict(lambda: 1.0)
        
    def adjust_zone_capacity(self, zone_id: str, multiplier: float):
        self.capacity_multipliers[zone_id] = multiplier

    def reset_capacities(self):
        self.capacity_multipliers.clear()

    def get_effective_capacity(self, zone_id: str) -> int:
        base = self.zone_capacities.get(zone_id, 100)
        return int(base * self.capacity_multipliers[zone_id])

    def evaluate_zones(self, window_seconds: int = 10) -> List[Dict[str, Any]]:
        """
        Evaluates current load, utilization %, service impact indicators,
        and derives explainable congestion classification for each zone.
        """
        events = stream_engine.get_events_in_window(window_seconds)
        now = time.time()
        
        # Partition events by zone
        zone_events = defaultdict(list)
        for e in events:
            zid = e.get("zone_id", "Central-01")
            zone_events[zid].append(e)

        zone_statuses = []
        for zid, base_cap in self.zone_capacities.items():
            cap = self.get_effective_capacity(zid)
            evts = zone_events.get(zid, [])
            count = len(evts)
            load_eps = round(count / float(window_seconds), 1) if window_seconds > 0 else 0.0
            utilization_pct = round((load_eps / cap * 100), 1) if cap > 0 else 0.0
            
            # Service quality indicators
            sms_evts = [e for e in evts if e.get("event_type") == "SMS"]
            voice_evts = [e for e in evts if e.get("event_type") == "VOICE"]
            
            sms_fails = sum(1 for e in sms_evts if e.get("status") == "FAILED")
            sms_latency_list = [e.get("latency_ms", 0) for e in sms_evts if e.get("latency_ms", 0) > 0]
            avg_sms_lat = round(float(np.mean(sms_latency_list)), 1) if sms_latency_list else 95.0
            
            voice_fails = sum(1 for e in voice_evts if e.get("status") == "FAILED")
            voice_dropped = sum(1 for e in voice_evts if e.get("status") == "DROPPED")
            call_setup_list = [e.get("call_setup_ms", 0) for e in voice_evts if e.get("call_setup_ms", 0) > 0]
            avg_setup_ms = round(float(np.mean(call_setup_list)), 1) if call_setup_list else 180.0
            
            total_voice = len(voice_evts)
            failure_rate = round((voice_fails / total_voice * 100), 1) if total_voice > 0 else 0.0
            dropped_rate = round((voice_dropped / total_voice * 100), 1) if total_voice > 0 else 0.0
            
            # Simulated local zone queue backlog (proportional to overload)
            excess_load = max(0.0, load_eps - cap)
            zone_queue = int(excess_load * 8)
            
            # Determine Status with nuanced logic distinguishing spike vs true congestion
            status = "NORMAL"
            evidence = f"Operating at {utilization_pct}% capacity ({load_eps}/{cap} eps). Service parameters healthy."
            
            service_degraded = (avg_sms_lat > 250.0 or avg_setup_ms > 350.0 or failure_rate > 5.0 or zone_queue > 20)
            
            if utilization_pct >= settings.UTILIZATION_WARNING:
                if service_degraded:
                    status = "CONGESTED"
                    evidence = (
                        f"Zone {zid} is operating at {utilization_pct}% capacity ({load_eps}/{cap} eps). "
                        f"Queue is growing ({zone_queue} events) and latency is degraded ({avg_sms_lat} ms). "
                        f"High load combined with degraded service indicators confirms active congestion."
                    )
                else:
                    status = "WARNING"
                    evidence = (
                        f"High utilization ({utilization_pct}%), but service indicators remain healthy "
                        f"(SMS latency {avg_sms_lat} ms, call failure {failure_rate}%). "
                        f"Classified as 'High utilization — monitor' without declaring service failure."
                    )
            elif utilization_pct >= settings.UTILIZATION_NORMAL:
                status = "WARNING" if service_degraded else "NORMAL"
                if service_degraded:
                    evidence = f"Moderate load ({utilization_pct}%) but elevated latency ({avg_sms_lat} ms) observed."
                else:
                    evidence = f"Normal traffic load ({utilization_pct}%). All KPI metrics within tolerance."

            # Infer region
            region = "Central"
            for reg, zones in generator.region_zones.items():
                if zid in zones:
                    region = reg
                    break

            zone_statuses.append({
                "zone_id": zid,
                "name": f"Cell Cluster {zid}",
                "region": region,
                "configured_capacity_eps": cap,
                "current_load_eps": load_eps,
                "utilization_pct": min(150.0, utilization_pct),
                "queue_length": zone_queue,
                "avg_sms_latency_ms": avg_sms_lat,
                "avg_call_setup_ms": avg_setup_ms,
                "failure_rate_pct": failure_rate,
                "dropped_rate_pct": dropped_rate,
                "status": status,
                "status_evidence": evidence
            })
            
        return zone_statuses

congestion_engine = NetworkCongestionEngine()
