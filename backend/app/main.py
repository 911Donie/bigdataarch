import asyncio
import threading
import time
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.generator import generator
from app.stream_engine import stream_engine
from app.anomaly_detector import anomaly_detector
from app.alert_manager import alert_manager
from app.congestion_engine import congestion_engine

# Import API routers
from app.api.dashboard import router as dashboard_router
from app.api.traffic import router as traffic_router
from app.api.alerts import router as alerts_router
from app.api.simulation import router as simulation_router
from app.api.pipeline import router as pipeline_router
from app.api.responses import router as responses_router
from app.api.explain import router as explain_router
from app.api.viva import router as viva_router
from app.api.data_quality_api import router as data_quality_router

bg_stop_event = threading.Event()

# Background periodic evaluation worker
def background_evaluation_worker():
    while not bg_stop_event.is_set():
        try:
            # 1. Update rolling sliding window history
            stream_engine.update_history_tick()
            
            # 2. Evaluate anomalies if running or has data
            if generator.total_processed > 10:
                new_anomalies = anomaly_detector.evaluate_anomalies()
                for ano in new_anomalies:
                    alert_manager.trigger_alert(
                        severity=ano["severity"],
                        title=f"{ano['detection_method']}: {ano['region']}",
                        description=ano["suggested_investigation"],
                        category=ano["detection_method"],
                        affected_region=ano["region"],
                        affected_zone=ano.get("zone_id"),
                        current_val=ano["current_traffic_rate"],
                        threshold=ano["historical_baseline"],
                        suggested_action="Review zone utilization and execute dynamic rerouting or capacity scaling."
                    )
        except Exception as e:
            print(f"Background worker exception: {e}")
            
        time.sleep(1.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    bg_stop_event.clear()
    generator.start()
    
    bg_thread = threading.Thread(target=background_evaluation_worker, daemon=True)
    bg_thread.start()
    
    yield
    # Shutdown
    bg_stop_event.set()
    generator.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(traffic_router, prefix="/api/traffic", tags=["Traffic"])
app.include_router(alerts_router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(simulation_router, prefix="/api/simulation", tags=["Simulation"])
app.include_router(pipeline_router, prefix="/api/pipeline", tags=["Pipeline"])
app.include_router(responses_router, prefix="/api/responses", tags=["Responses"])
app.include_router(explain_router, prefix="/api/explain", tags=["Explainability"])
app.include_router(viva_router, prefix="/api/viva", tags=["Viva Mode"])
app.include_router(data_quality_router, prefix="/api/data-quality", tags=["Data Quality"])

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "mode": settings.STREAMING_MODE,
        "timestamp": time.time(),
        "simulation_state": generator.state,
        "events_processed": generator.total_processed
    }

# WebSocket for real-time live streaming push to frontend
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@app.websocket("/ws/telecom")
async def websocket_telecom_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Broadcast live telemetry update every second
            m = stream_engine.compute_window_metrics(30)
            zones = congestion_engine.evaluate_zones(10)
            alerts = alert_manager.get_alerts(include_resolved=False, limit=5)
            
            payload = {
                "timestamp": time.time(),
                "throughput_eps": m["throughput_eps"],
                "total_processed": generator.total_processed,
                "sms_failure_rate": m["sms_failure_rate"],
                "call_failure_rate": m["call_failure_rate"],
                "avg_sms_latency_ms": m["avg_sms_latency_ms"],
                "queue_backlog": m["queue_backlog"],
                "active_alerts_count": len(alerts),
                "zones": zones,
                "latest_alert": alerts[0] if alerts else None
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# Mount static frontend build if it exists
import os
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static_frontend")

