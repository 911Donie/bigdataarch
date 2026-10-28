import time
from typing import Dict, Any, Tuple, Optional
from collections import deque

class DataQualityEngine:
    def __init__(self, watermark_delay_s: float = 5.0, deduplication_window: int = 1000):
        self.watermark_delay_s = watermark_delay_s
        self.seen_event_ids = set()
        self.event_id_ring = deque(maxlen=deduplication_window)
        
        # Counters
        self.events_received = 0
        self.events_accepted = 0
        self.events_rejected = 0
        self.duplicates_detected = 0
        self.late_events_detected = 0
        self.schema_validation_errors = 0
        self.out_of_order_events = 0
        
        # Simulation toggles
        self.inject_duplicates = False
        self.inject_delay = False
        self.inject_schema_errors = False
        
        self.current_watermark = time.time()
        
    def reset(self):
        self.seen_event_ids.clear()
        self.event_id_ring.clear()
        self.events_received = 0
        self.events_accepted = 0
        self.events_rejected = 0
        self.duplicates_detected = 0
        self.late_events_detected = 0
        self.schema_validation_errors = 0
        self.out_of_order_events = 0
        self.current_watermark = time.time()

    def set_injection_modes(self, duplicates: bool = False, delay: bool = False, schema_errors: bool = False):
        self.inject_duplicates = duplicates
        self.inject_delay = delay
        self.inject_schema_errors = schema_errors

    def validate_and_filter(self, event_dict: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        """
        Validates event against telecom data schema, checks duplicates,
        and enforces stream watermarks for late events.
        Returns: (is_accepted, rejection_reason, processed_event)
        """
        self.events_received += 1
        now = time.time()
        
        # 1. Schema Validation
        required_fields = ["event_id", "timestamp", "event_type", "source_region", "zone_id", "status"]
        for field in required_fields:
            if field not in event_dict or event_dict[field] is None:
                self.events_rejected += 1
                self.schema_validation_errors += 1
                return False, f"Missing required field: {field}", None
                
        if event_dict["event_type"] not in ["SMS", "VOICE"]:
            self.events_rejected += 1
            self.schema_validation_errors += 1
            return False, f"Invalid event_type: {event_dict['event_type']}", None
            
        event_time = event_dict.get("timestamp", now)
        if event_time <= 0 or event_time > now + 300: # future timestamp beyond 5 mins
            self.events_rejected += 1
            self.schema_validation_errors += 1
            return False, f"Corrupted timestamp: {event_time}", None

        # 2. Deduplication check (via bounded memory cache)
        event_id = event_dict["event_id"]
        if event_id in self.seen_event_ids:
            self.events_rejected += 1
            self.duplicates_detected += 1
            return False, "Duplicate event_id detected", None
            
        # 3. Watermark check for Late Events
        # Watermark = max(seen_event_time) - watermark_delay_s
        if event_time > self.current_watermark:
            self.current_watermark = event_time - self.watermark_delay_s
            
        is_late = False
        if event_time < self.current_watermark:
            self.late_events_detected += 1
            is_late = True
            # In Big Data architectures like Spark Structured Streaming, late events within 
            # allowed watermark are still accepted for window recalculation; beyond watermark they are dropped.
            if (self.current_watermark - event_time) > (self.watermark_delay_s * 3):
                self.events_rejected += 1
                return False, "Dropped: event arrived beyond allowed watermark window", None

        # Record into deduplication LRU
        if len(self.event_id_ring) == self.event_id_ring.maxlen:
            evicted = self.event_id_ring.popleft()
            self.seen_event_ids.discard(evicted)
        self.event_id_ring.append(event_id)
        self.seen_event_ids.add(event_id)

        self.events_accepted += 1
        event_dict["is_late"] = is_late
        return True, None, event_dict

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "events_received": self.events_received,
            "events_accepted": self.events_accepted,
            "events_rejected": self.events_rejected,
            "duplicates_detected": self.duplicates_detected,
            "late_events_detected": self.late_events_detected,
            "schema_validation_errors": self.schema_validation_errors,
            "acceptance_rate_pct": round((self.events_accepted / self.events_received * 100), 2) if self.events_received > 0 else 100.0,
            "watermark_delay_s": self.watermark_delay_s,
            "injection_status": {
                "duplicates": self.inject_duplicates,
                "delay": self.inject_delay,
                "schema_errors": self.inject_schema_errors
            }
        }

data_quality_engine = DataQualityEngine()
