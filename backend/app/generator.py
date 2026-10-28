import time
import random
import uuid
import threading
from typing import Dict, Any, List, Optional
from collections import deque
from app.config import settings
from app.data_quality import data_quality_engine

class TelecomEventGenerator:
    def __init__(self):
        self.state = "STOPPED"  # RUNNING, PAUSED, STOPPED
        self.rate_eps = 40      # events per second
        self.mix_sms_pct = 65   # 65% SMS, 35% Voice
        self.target_region: Optional[str] = None
        self.active_scenario = "NORMAL"
        self.random_seed: Optional[int] = None
        self.simulation_duration_s: Optional[int] = None
        self.start_time: Optional[float] = None
        
        # Bounded in-memory event queues and buffers
        self.event_queue = deque(maxlen=settings.MAX_IN_MEMORY_EVENTS)
        self.processing_buffer = deque(maxlen=settings.MAX_IN_MEMORY_EVENTS)
        self.lock = threading.Lock()
        
        # Counters
        self.total_generated = 0
        self.total_processed = 0
        self.total_failed = 0
        
        # Dynamic throttles / bottlenecks modified by scenarios or mitigation actions
        self.consumer_capacity_multiplier = 1.0
        self.backoff_enabled = False
        self.reroute_map: Dict[str, str] = {}  # e.g., "South-02" -> "South-01"
        self.capacity_boost_map: Dict[str, float] = {} # e.g. "South-02" -> 1.5

        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        
        # Predefined region to zones mapping
        self.region_zones = {
            "North": ["North-01", "North-02"],
            "South": ["South-01", "South-02"],
            "East": ["East-01"],
            "West": ["West-01"],
            "Central": ["Central-01"]
        }

    def configure(self, rate_eps: Optional[int] = None, mix_sms_pct: Optional[int] = None,
                  region: Optional[str] = None, seed: Optional[int] = None, duration_s: Optional[int] = None):
        with self.lock:
            if rate_eps is not None:
                self.rate_eps = max(1, min(500, rate_eps))
            if mix_sms_pct is not None:
                self.mix_sms_pct = max(0, min(100, mix_sms_pct))
            if region is not None:
                self.target_region = None if region == "ALL" else region
            if seed is not None:
                self.random_seed = seed
                random.seed(seed)
            if duration_s is not None:
                self.simulation_duration_s = duration_s

    def set_scenario(self, scenario_id: str):
        with self.lock:
            self.active_scenario = scenario_id
            # Reset temporary simulator modifiers when switching scenarios
            if scenario_id == "NORMAL":
                self.rate_eps = 40
                self.mix_sms_pct = 65
                self.consumer_capacity_multiplier = 1.0
                self.backoff_enabled = False
                self.reroute_map.clear()
            elif scenario_id == "SMS_SPIKE":
                self.rate_eps = 120
                self.mix_sms_pct = 90
            elif scenario_id == "VOICE_SURGE":
                self.rate_eps = 110
                self.mix_sms_pct = 15
            elif scenario_id == "SMS_RETRY_STORM":
                self.rate_eps = 130
                self.mix_sms_pct = 95
                self.backoff_enabled = False
            elif scenario_id == "REGIONAL_CONGESTION":
                self.rate_eps = 85
                self.target_region = "South"
            elif scenario_id == "PROCESSING_BOTTLENECK":
                self.rate_eps = 70
                self.consumer_capacity_multiplier = 0.25 # consumer chokes
            elif scenario_id == "RECOVERY":
                self.rate_eps = 35
                self.consumer_capacity_multiplier = 1.2
                self.backoff_enabled = True

    def start(self):
        with self.lock:
            if self.state == "RUNNING":
                return
            self.state = "RUNNING"
            self.start_time = time.time()
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._run_loop, daemon=True)
            self._thread.start()

    def pause(self):
        with self.lock:
            if self.state == "RUNNING":
                self.state = "PAUSED"

    def resume(self):
        with self.lock:
            if self.state == "PAUSED":
                self.state = "RUNNING"

    def stop(self):
        with self.lock:
            self.state = "STOPPED"
            self._stop_event.set()

    def reset(self):
        with self.lock:
            self.state = "STOPPED"
            self._stop_event.set()
            self.event_queue.clear()
            self.processing_buffer.clear()
            self.total_generated = 0
            self.total_processed = 0
            self.total_failed = 0
            self.active_scenario = "NORMAL"
            self.consumer_capacity_multiplier = 1.0
            self.backoff_enabled = False
            self.reroute_map.clear()
            self.capacity_boost_map.clear()
            data_quality_engine.reset()

    def _generate_single_event(self) -> Dict[str, Any]:
        now = time.time()
        is_sms = (random.random() * 100) < self.mix_sms_pct
        event_type = "SMS" if is_sms else "VOICE"
        
        # Region selection
        if self.active_scenario == "REGIONAL_CONGESTION":
            source_region = "South"
        elif self.target_region and self.target_region in settings.REGIONS:
            source_region = self.target_region
        else:
            source_region = random.choice(settings.REGIONS)
            
        destination_region = random.choice(settings.REGIONS)
        
        # Zone selection
        available_zones = self.region_zones.get(source_region, ["Central-01"])
        if self.active_scenario == "REGIONAL_CONGESTION" and source_region == "South":
            zone_id = "South-02" if random.random() < 0.85 else "South-01"
        else:
            zone_id = random.choice(available_zones)
            
        # Check rerouting mitigation
        if zone_id in self.reroute_map:
            zone_id = self.reroute_map[zone_id]

        event_id = f"EVT-{int(now * 1000)}-{uuid.uuid4().hex[:6].upper()}"
        
        # Event timing & failure dynamics based on scenario
        failure_prob = 0.02
        latency_ms = random.gauss(90, 15)
        call_setup_ms = random.gauss(180, 30)
        call_duration_s = max(5, random.expovariate(1/120)) # avg 2 min call
        failure_reason = None
        retry_count = 0
        priority = "NORMAL"
        
        # Inject scenario effects
        if self.active_scenario == "SMS_SPIKE" and is_sms:
            latency_ms = random.gauss(240, 50)
            failure_prob = 0.05
        elif self.active_scenario == "VOICE_SURGE" and not is_sms:
            call_setup_ms = random.gauss(420, 80)
            failure_prob = 0.08
        elif self.active_scenario == "SMS_RETRY_STORM" and is_sms:
            retry_count = random.choice([1, 2, 3, 4])
            latency_ms = random.gauss(450, 100)
            failure_prob = 0.14
        elif self.active_scenario == "REGIONAL_CONGESTION" and zone_id == "South-02":
            latency_ms = random.gauss(380, 70)
            call_setup_ms = random.gauss(520, 90)
            failure_prob = 0.12
        elif self.active_scenario == "PROCESSING_BOTTLENECK":
            latency_ms = random.gauss(550, 120)
            failure_prob = 0.07

        # Determine Status
        is_failed = random.random() < failure_prob
        if is_sms:
            if is_failed:
                status = "FAILED"
                failure_reason = random.choice(["CONGESTION_TIMEOUT", "SMSC_BACKLOG", "ROUTING_TIMEOUT"])
            else:
                status = "DELIVERED"
        else:
            if is_failed:
                status = "FAILED" if random.random() < 0.7 else "DROPPED"
                failure_reason = random.choice(["CIRCUIT_BUSY", "RADIO_LINK_FAILURE", "NO_ANSWER"])
            else:
                status = "CONNECTED"

        event = {
            "event_id": event_id,
            "timestamp": now,
            "event_type": event_type,
            "source_region": source_region,
            "destination_region": destination_region,
            "zone_id": zone_id,
            "operator_id": "PulseNet-Core",
            "status": status,
            "latency_ms": round(max(10.0, latency_ms), 1),
            "call_duration_s": round(call_duration_s, 1) if not is_sms else 0.0,
            "call_setup_ms": round(max(30.0, call_setup_ms), 1) if not is_sms else 0.0,
            "failure_reason": failure_reason,
            "priority": priority,
            "retry_count": retry_count,
            "scenario_id": self.active_scenario
        }
        
        # Inject Data Quality test anomalies if enabled
        if data_quality_engine.inject_delay and random.random() < 0.08:
            # Event timestamp is skewed in the past (late event)
            event["timestamp"] = now - random.uniform(8.0, 25.0)
        if data_quality_engine.inject_schema_errors and random.random() < 0.04:
            # Corrupted missing field
            del event["status"]
            
        return event

    def _run_loop(self):
        """
        Generates events and places them into the input queue.
        Consumes from input queue at the consumer throughput rate.
        """
        while not self._stop_event.is_set():
            if self.state == "PAUSED":
                time.sleep(0.1)
                continue
            if self.state == "STOPPED":
                break

            # Duration check
            if self.simulation_duration_s and self.start_time:
                if (time.time() - self.start_time) > self.simulation_duration_s:
                    self.stop()
                    break

            start_cycle = time.time()
            batch_size = max(1, int(self.rate_eps * 0.1)) # 100ms interval batch
            
            # 1. Produce batch to Kafka / Streaming Ingestion Queue
            for _ in range(batch_size):
                evt = self._generate_single_event()
                self.total_generated += 1
                
                # Check for duplicate injection
                if data_quality_engine.inject_duplicates and random.random() < 0.07:
                    # Enqueue duplicate identical event
                    self.event_queue.append(evt)
                    self.total_generated += 1
                
                self.event_queue.append(evt)

            # 2. Process batch out of queue (Consumer stream processing)
            # Simulated consumer speed affected by bottleneck and bottlenecks
            consumer_drain_count = int(batch_size * self.consumer_capacity_multiplier)
            for _ in range(consumer_drain_count):
                if not self.event_queue:
                    break
                raw_evt = self.event_queue.popleft()
                
                # Validate through Data Quality Engine
                accepted, reason, valid_evt = data_quality_engine.validate_and_filter(raw_evt)
                if accepted and valid_evt:
                    with self.lock:
                        self.processing_buffer.append(valid_evt)
                        self.total_processed += 1
                        if valid_evt.get("status") in ["FAILED", "DROPPED"]:
                            self.total_failed += 1

            # Precise sleep for remaining interval
            elapsed = time.time() - start_cycle
            sleep_time = max(0.005, 0.1 - elapsed)
            time.sleep(sleep_time)

    def get_processed_events(self) -> List[Dict[str, Any]]:
        with self.lock:
            return list(self.processing_buffer)

    def get_stats(self) -> Dict[str, Any]:
        with self.lock:
            return {
                "state": self.state,
                "rate_eps": self.rate_eps,
                "mix_sms_pct": self.mix_sms_pct,
                "scenario": self.active_scenario,
                "queue_backlog": len(self.event_queue),
                "total_generated": self.total_generated,
                "total_processed": self.total_processed,
                "total_failed": self.total_failed,
                "buffer_size": len(self.processing_buffer),
                "consumer_efficiency_pct": int(self.consumer_capacity_multiplier * 100),
                "target_region": self.target_region or "ALL"
            }

generator = TelecomEventGenerator()
