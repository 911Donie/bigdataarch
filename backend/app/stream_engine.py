import time
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from collections import defaultdict, deque
from app.config import settings
from app.generator import generator

class StreamProcessingEngine:
    def __init__(self):
        # Rolling historical baseline tracking per (region, event_type)
        # Stores recent throughput observations (every second)
        self.rolling_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=300)) # 5 min history
        
        # Periodic snapshot cache
        self.last_computed_metrics: Dict[int, Dict[str, Any]] = {}
        self.time_series_history = deque(maxlen=60) # 60 points for live graphs
        self.last_tick = time.time()
        
    def get_events_in_window(self, window_seconds: int) -> List[Dict[str, Any]]:
        """
        Extracts events within the last `window_seconds` using event timestamps.
        Emulates event-time windowing semantics in Apache Spark Structured Streaming.
        """
        now = time.time()
        cutoff = now - window_seconds
        
        # Buffer is thread-safely snapshotted
        events = [
            e for e in generator.get_processed_events()
            if e.get("timestamp", 0) >= cutoff
        ]
        return events

    def compute_window_metrics(self, window_seconds: int = 30) -> Dict[str, Any]:
        """
        Calculates all real-time KPIs and aggregations for a specified window duration.
        """
        events = self.get_events_in_window(window_seconds)
        now = time.time()
        
        total_events = len(events)
        throughput_eps = round(total_events / float(window_seconds), 1) if window_seconds > 0 else 0.0
        
        sms_events = [e for e in events if e.get("event_type") == "SMS"]
        voice_events = [e for e in events if e.get("event_type") == "VOICE"]
        
        sms_count = len(sms_events)
        voice_count = len(voice_events)
        
        # SMS stats
        sms_delivered = sum(1 for e in sms_events if e.get("status") == "DELIVERED")
        sms_failed = sum(1 for e in sms_events if e.get("status") == "FAILED")
        sms_failure_rate = round((sms_failed / sms_count * 100), 2) if sms_count > 0 else 0.0
        sms_latencies = [e.get("latency_ms", 0.0) for e in sms_events if e.get("latency_ms", 0) > 0]
        avg_sms_latency = round(float(np.mean(sms_latencies)), 1) if sms_latencies else 0.0
        
        # Voice stats
        voice_connected = sum(1 for e in voice_events if e.get("status") == "CONNECTED")
        voice_failed = sum(1 for e in voice_events if e.get("status") == "FAILED")
        voice_dropped = sum(1 for e in voice_events if e.get("status") == "DROPPED")
        voice_total_failures = voice_failed + voice_dropped
        call_failure_rate = round((voice_failed / voice_count * 100), 2) if voice_count > 0 else 0.0
        dropped_call_rate = round((voice_dropped / voice_count * 100), 2) if voice_count > 0 else 0.0
        
        call_durations = [e.get("call_duration_s", 0.0) for e in voice_events if e.get("call_duration_s", 0) > 0]
        avg_call_duration = round(float(np.mean(call_durations)), 1) if call_durations else 0.0
        
        call_setups = [e.get("call_setup_ms", 0.0) for e in voice_events if e.get("call_setup_ms", 0) > 0]
        avg_call_setup = round(float(np.mean(call_setups)), 1) if call_setups else 0.0

        # Regional breakdown
        regional_counts = defaultdict(lambda: {"total": 0, "sms": 0, "voice": 0, "failures": 0})
        for e in events:
            reg = e.get("source_region", "Central")
            regional_counts[reg]["total"] += 1
            if e.get("event_type") == "SMS":
                regional_counts[reg]["sms"] += 1
            else:
                regional_counts[reg]["voice"] += 1
            if e.get("status") in ["FAILED", "DROPPED"]:
                regional_counts[reg]["failures"] += 1

        queue_backlog = len(generator.event_queue)

        metrics = {
            "timestamp": now,
            "window_duration_s": window_seconds,
            "total_events": total_events,
            "throughput_eps": throughput_eps,
            "sms_count": sms_count,
            "voice_count": voice_count,
            "sms_delivered": sms_delivered,
            "sms_failed": sms_failed,
            "sms_failure_rate": sms_failure_rate,
            "avg_sms_latency_ms": avg_sms_latency,
            "voice_connected": voice_connected,
            "voice_failed": voice_failed,
            "voice_dropped": voice_dropped,
            "call_failure_rate": call_failure_rate,
            "dropped_call_rate": dropped_call_rate,
            "avg_call_duration_s": avg_call_duration,
            "avg_call_setup_ms": avg_call_setup,
            "queue_backlog": queue_backlog,
            "regional_distribution": [
                {
                    "region": reg,
                    "total": data["total"],
                    "sms": data["sms"],
                    "voice": data["voice"],
                    "failures": data["failures"],
                    "share_pct": round((data["total"] / total_events * 100), 1) if total_events > 0 else 0.0
                }
                for reg, data in regional_counts.items()
            ]
        }
        
        self.last_computed_metrics[window_seconds] = metrics
        return metrics

    def update_history_tick(self):
        """
        Invoked periodically (e.g., every 1-2s) to update sliding historical baselines
        and rolling time series charts.
        """
        now = time.time()
        # Compute default 10s and 30s windows
        m30 = self.compute_window_metrics(30)
        m10 = self.compute_window_metrics(10)
        
        # Update rolling baselines per region
        events_10s = self.get_events_in_window(10)
        reg_eps = defaultdict(float)
        for e in events_10s:
            reg = e.get("source_region", "Central")
            reg_eps[reg] += 0.1 # 10s window / 10
            
        for reg in settings.REGIONS:
            val = reg_eps.get(reg, 0.0)
            self.rolling_history[reg].append(val)
        self.rolling_history["GLOBAL"].append(m10["throughput_eps"])

        # Push to time series history for charts
        point = {
            "time": time.strftime("%H:%M:%S", time.localtime(now)),
            "timestamp": now,
            "throughput_eps": m10["throughput_eps"],
            "sms_eps": round(m10["sms_count"] / 10.0, 1),
            "voice_eps": round(m10["voice_count"] / 10.0, 1),
            "sms_latency_ms": m10["avg_sms_latency_ms"],
            "call_setup_ms": m10["avg_call_setup_ms"],
            "sms_failed": m10["sms_failed"],
            "sms_delivered": m10["sms_delivered"],
            "voice_failed": m10["voice_failed"],
            "voice_connected": m10["voice_connected"],
            "queue_backlog": m10["queue_backlog"],
        }
        self.time_series_history.append(point)

    def get_baseline_for_region(self, region: str) -> float:
        """
        Calculates moving baseline throughput using historical window.
        """
        history = list(self.rolling_history[region])
        if not history or len(history) < 5:
            return 8.0 # fallback nominal baseline per region
        return float(np.mean(history))

    def get_baseline_stats(self, region: str) -> Dict[str, float]:
        history = list(self.rolling_history[region])
        if not history or len(history) < 5:
            return {"mean": 8.0, "std": 1.5}
        return {"mean": float(np.mean(history)), "std": max(0.5, float(np.std(history)))}

stream_engine = StreamProcessingEngine()
