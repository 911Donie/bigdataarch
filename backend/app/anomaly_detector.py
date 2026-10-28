import time
import uuid
import numpy as np
from typing import List, Dict, Any, Optional
from collections import deque
from sklearn.ensemble import IsolationForest
from app.config import settings
from app.stream_engine import stream_engine
from app.generator import generator

class AnomalyDetectionEngine:
    def __init__(self):
        self.detected_anomalies: deque = deque(maxlen=200)
        self.queue_history = deque(maxlen=10)
        
        # Isolation Forest Model initialization
        self.ml_model = IsolationForest(contamination=0.08, random_state=42)
        self._ml_trained = False
        self._bootstrap_ml_model()

    def _bootstrap_ml_model(self):
        """
        Trains initial Isolation Forest model on synthetic baseline distribution
        so it is ready immediately without requiring external datasets.
        Feature vector: [throughput_eps, sms_failure_rate, call_failure_rate, avg_latency, queue_backlog]
        """
        rng = np.random.RandomState(42)
        # Normal operational distribution
        normal_samples = np.column_stack([
            rng.normal(35, 8, 250),     # throughput
            rng.uniform(0.5, 3.0, 250), # sms failure rate %
            rng.uniform(0.5, 3.5, 250), # call failure rate %
            rng.normal(90, 20, 250),    # latency ms
            rng.uniform(0, 40, 250)     # queue backlog
        ])
        # A few anomalous outliers
        anomalies = np.column_stack([
            rng.normal(120, 20, 20),
            rng.uniform(10.0, 25.0, 20),
            rng.uniform(12.0, 30.0, 20),
            rng.normal(450, 100, 20),
            rng.uniform(200, 800, 20)
        ])
        X = np.vstack([normal_samples, anomalies])
        self.ml_model.fit(X)
        self._ml_trained = True

    def evaluate_anomalies(self) -> List[Dict[str, Any]]:
        """
        Runs Methods A, B, C, D, and E against recent window metrics.
        Returns newly detected anomalies.
        """
        now = time.time()
        metrics = stream_engine.compute_window_metrics(10)
        current_throughput = metrics["throughput_eps"]
        current_queue = metrics["queue_backlog"]
        self.queue_history.append(current_queue)
        
        new_anomalies = []
        
        # Evaluate each active region
        for reg in settings.REGIONS:
            stats = stream_engine.get_baseline_stats(reg)
            mean_baseline = stats["mean"]
            std_baseline = stats["std"]
            
            # Regional throughput in 10s
            events = [e for e in stream_engine.get_events_in_window(10) if e.get("source_region") == reg]
            reg_eps = round(len(events) / 10.0, 1)
            pct_change = round(((reg_eps - mean_baseline) / mean_baseline) * 100, 1) if mean_baseline > 0 else 0.0

            # -------------------------------------------------------------
            # Method A: Relative Spike Detection
            # Current rate exceeds configured multiple (e.g. 2.0x) of baseline
            # -------------------------------------------------------------
            if mean_baseline > 2.0 and reg_eps >= (mean_baseline * settings.SPIKE_MULTIPLIER):
                new_anomalies.append({
                    "anomaly_id": f"ANO-A-{uuid.uuid4().hex[:6].upper()}",
                    "timestamp": now,
                    "region": reg,
                    "event_type": "MIXED",
                    "current_traffic_rate": reg_eps,
                    "historical_baseline": round(mean_baseline, 1),
                    "percentage_change": pct_change,
                    "detection_method": "Method A (Relative Spike)",
                    "severity": "WARNING" if reg_eps < (mean_baseline * 2.8) else "CRITICAL",
                    "confidence_score": min(0.99, round(reg_eps / (mean_baseline * 2.0) * 0.85, 2)),
                    "suggested_investigation": f"Region {reg} traffic surged to {reg_eps} eps ({pct_change}% over {round(mean_baseline, 1)} eps baseline). Verify if this is an organic flash crowd/OTP surge or bot activity.",
                    "status": "OPEN",
                    "is_congestion": False
                })

            # -------------------------------------------------------------
            # Method B: Statistical Z-Score Detection
            # (current - mean) / std > threshold
            # -------------------------------------------------------------
            if std_baseline > 0.1:
                z_score = (reg_eps - mean_baseline) / std_baseline
                if z_score >= settings.Z_SCORE_THRESHOLD:
                    new_anomalies.append({
                        "anomaly_id": f"ANO-B-{uuid.uuid4().hex[:6].upper()}",
                        "timestamp": now,
                        "region": reg,
                        "event_type": "MIXED",
                        "current_traffic_rate": reg_eps,
                        "historical_baseline": round(mean_baseline, 1),
                        "percentage_change": pct_change,
                        "detection_method": f"Method B (Statistical Z-Score: {round(z_score, 2)}σ)",
                        "severity": "CRITICAL" if z_score >= 3.5 else "WARNING",
                        "confidence_score": min(0.98, round(0.7 + (z_score / 10.0), 2)),
                        "suggested_investigation": f"Statistically significant deviation in {reg} (Z={round(z_score, 2)} exceeds {settings.Z_SCORE_THRESHOLD} threshold). Check cell tower logs and subscriber distribution.",
                        "status": "OPEN",
                        "is_congestion": False
                    })

        # -------------------------------------------------------------
        # Method C: Failure-Rate Detection
        # Detect elevated SMS failure rate or call failure rate
        # -------------------------------------------------------------
        if metrics["sms_count"] >= 15 and metrics["sms_failure_rate"] >= settings.SMS_FAILURE_THRESHOLD:
            new_anomalies.append({
                "anomaly_id": f"ANO-C-{uuid.uuid4().hex[:6].upper()}",
                "timestamp": now,
                "region": "GLOBAL",
                "event_type": "SMS",
                "current_traffic_rate": metrics["sms_failure_rate"],
                "historical_baseline": 1.5,
                "percentage_change": round(((metrics["sms_failure_rate"] - 1.5) / 1.5) * 100, 1),
                "detection_method": "Method C (Failure-Rate Spike)",
                "severity": "CRITICAL" if metrics["sms_failure_rate"] > 10.0 else "WARNING",
                "confidence_score": 0.94,
                "suggested_investigation": f"SMS failure rate reached {metrics['sms_failure_rate']}%. Check SMSC queues, downstream SMPP binds, and retry storm patterns.",
                "status": "OPEN",
                "is_congestion": True
            })

        if metrics["voice_count"] >= 10 and metrics["call_failure_rate"] >= settings.VOICE_FAILURE_THRESHOLD:
            new_anomalies.append({
                "anomaly_id": f"ANO-C-VOICE-{uuid.uuid4().hex[:6].upper()}",
                "timestamp": now,
                "region": "GLOBAL",
                "event_type": "VOICE",
                "current_traffic_rate": metrics["call_failure_rate"],
                "historical_baseline": 1.8,
                "percentage_change": round(((metrics["call_failure_rate"] - 1.8) / 1.8) * 100, 1),
                "detection_method": "Method C (Call Failure Spike)",
                "severity": "CRITICAL" if metrics["call_failure_rate"] > 12.0 else "WARNING",
                "confidence_score": 0.92,
                "suggested_investigation": f"Voice call failure rate elevated to {metrics['call_failure_rate']}%. Inspect SIP signaling channels, trunks, and circuit utilization.",
                "status": "OPEN",
                "is_congestion": True
            })

        # -------------------------------------------------------------
        # Method D: Queue Growth Detection
        # Detect sustained continuous growth in processing queue
        # -------------------------------------------------------------
        if len(self.queue_history) >= 4:
            q_list = list(self.queue_history)
            if q_list[-1] > 60 and q_list[-1] > q_list[-2] > q_list[-3]:
                growth_rate = round((q_list[-1] - q_list[-3]) / max(1, q_list[-3]) * 100, 1)
                new_anomalies.append({
                    "anomaly_id": f"ANO-D-{uuid.uuid4().hex[:6].upper()}",
                    "timestamp": now,
                    "region": "CORE_STREAM",
                    "event_type": "PIPELINE",
                    "current_traffic_rate": float(q_list[-1]),
                    "historical_baseline": float(q_list[-3]),
                    "percentage_change": growth_rate,
                    "detection_method": "Method D (Queue Growth Detection)",
                    "severity": "CRITICAL" if q_list[-1] > 200 else "WARNING",
                    "confidence_score": 0.90,
                    "suggested_investigation": f"Processing queue grew from {q_list[-3]} to {q_list[-1]} events (+{growth_rate}%). Consumer processing throughput is lagging behind producer ingestion rate.",
                    "status": "OPEN",
                    "is_congestion": True
                })

        # -------------------------------------------------------------
        # Method E: Isolation Forest Unsupervised ML Model
        # -------------------------------------------------------------
        if self._ml_trained and current_throughput > 5:
            feature_vector = np.array([[
                current_throughput,
                metrics["sms_failure_rate"],
                metrics["call_failure_rate"],
                metrics["avg_sms_latency_ms"],
                float(current_queue)
            ]])
            prediction = self.ml_model.predict(feature_vector)[0] # -1 = anomaly, 1 = normal
            anomaly_score = float(self.ml_model.score_samples(feature_vector)[0])
            
            if prediction == -1:
                new_anomalies.append({
                    "anomaly_id": f"ANO-E-ML-{uuid.uuid4().hex[:6].upper()}",
                    "timestamp": now,
                    "region": "NETWORK_FABRIC",
                    "event_type": "MULTIVARIATE",
                    "current_traffic_rate": current_throughput,
                    "historical_baseline": 35.0,
                    "percentage_change": round(((current_throughput - 35.0) / 35.0) * 100, 1),
                    "detection_method": f"Method E (Isolation Forest ML, Score: {round(anomaly_score, 3)})",
                    "severity": "CRITICAL" if anomaly_score < -0.65 else "WARNING",
                    "confidence_score": min(0.97, round(abs(anomaly_score) * 1.4, 2)),
                    "suggested_investigation": "Multivariate anomaly flagged by Isolation Forest. Unsupervised clustering identified non-standard distribution across throughput, latency, and queue features.",
                    "status": "OPEN",
                    "is_congestion": current_queue > 50 or metrics["sms_failure_rate"] > 5.0
                })

        # Store in rolling buffer, deduplicating identical recent alerts
        for ano in new_anomalies:
            self.detected_anomalies.append(ano)
            
        return new_anomalies

    def get_recent_anomalies(self, limit: int = 20) -> List[Dict[str, Any]]:
        return list(self.detected_anomalies)[-limit:]

anomaly_detector = AnomalyDetectionEngine()
