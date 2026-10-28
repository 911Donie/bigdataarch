from fastapi import APIRouter, Query, HTTPException
from app.alert_manager import alert_manager
from app.anomaly_detector import anomaly_detector

router = APIRouter()

@router.get("")
def list_alerts(include_resolved: bool = Query(True)):
    alerts = alert_manager.get_alerts(include_resolved=include_resolved)
    anomalies = anomaly_detector.get_recent_anomalies(30)
    return {
        "alerts": alerts,
        "anomalies": anomalies
    }

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    success = alert_manager.acknowledge_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "success", "alert_id": alert_id, "acknowledged": True}

@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    success = alert_manager.resolve_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "success", "alert_id": alert_id, "resolved": True}
