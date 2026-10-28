import time
import uuid
from typing import Dict, Any, List, Optional
from collections import deque
from app.database import SessionLocal
from app.models import DBAlert

class AlertManager:
    def __init__(self, cooldown_seconds: float = 25.0):
        self.cooldown_seconds = cooldown_seconds
        # Maps alert_key -> timestamp_last_emitted
        self.last_emitted_keys: Dict[str, float] = {}
        self.active_alerts_cache = deque(maxlen=100)

    def trigger_alert(
        self,
        severity: str,
        title: str,
        description: str,
        category: str,
        affected_region: Optional[str] = None,
        affected_zone: Optional[str] = None,
        current_val: Optional[float] = None,
        threshold: Optional[float] = None,
        suggested_action: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Creates alert with deduplication and cooldown enforcement.
        """
        alert_key = f"{category}:{affected_zone or affected_region or 'GLOBAL'}:{severity}"
        now = time.time()
        
        # Check cooldown to prevent duplicate alert storms
        last_time = self.last_emitted_keys.get(alert_key, 0)
        if (now - last_time) < self.cooldown_seconds:
            return None # Suppressed by deduplication cooldown
            
        self.last_emitted_keys[alert_key] = now
        alert_id = f"ALT-{int(now)}-{uuid.uuid4().hex[:4].upper()}"
        
        alert_obj = {
            "id": alert_id,
            "timestamp": now,
            "severity": severity,
            "title": title,
            "description": description,
            "category": category,
            "affected_region": affected_region,
            "affected_zone": affected_zone,
            "current_val": current_val,
            "threshold": threshold,
            "suggested_action": suggested_action,
            "acknowledged": False,
            "resolved": False
        }
        
        self.active_alerts_cache.appendleft(alert_obj)
        
        # Save to database
        try:
            db = SessionLocal()
            db_record = DBAlert(
                id=alert_id,
                timestamp=now,
                severity=severity,
                title=title,
                description=description,
                category=category,
                affected_region=affected_region,
                affected_zone=affected_zone,
                current_val=current_val,
                threshold=threshold,
                suggested_action=suggested_action,
                acknowledged=False,
                resolved=False
            )
            db.add(db_record)
            db.commit()
            db.close()
        except Exception:
            pass # Keep in-memory cache functioning even if DB is in transition
            
        return alert_obj

    def acknowledge_alert(self, alert_id: str) -> bool:
        found = False
        for alt in self.active_alerts_cache:
            if alt["id"] == alert_id:
                alt["acknowledged"] = True
                found = True
                break
                
        try:
            db = SessionLocal()
            record = db.query(DBAlert).filter(DBAlert.id == alert_id).first()
            if record:
                record.acknowledged = True
                db.commit()
                found = True
            db.close()
        except Exception:
            pass
        return found

    def resolve_alert(self, alert_id: str) -> bool:
        found = False
        for alt in self.active_alerts_cache:
            if alt["id"] == alert_id:
                alt["resolved"] = True
                found = True
                break
                
        try:
            db = SessionLocal()
            record = db.query(DBAlert).filter(DBAlert.id == alert_id).first()
            if record:
                record.resolved = True
                record.resolved_at = time.time()
                db.commit()
                found = True
            db.close()
        except Exception:
            pass
        return found

    def get_alerts(self, include_resolved: bool = True, limit: int = 50) -> List[Dict[str, Any]]:
        alerts = list(self.active_alerts_cache)
        if not include_resolved:
            alerts = [a for a in alerts if not a.get("resolved", False)]
        return alerts[:limit]

alert_manager = AlertManager()
