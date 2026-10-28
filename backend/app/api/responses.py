from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.response_simulator import response_simulator
from app.schemas import MitigationActionRequest

router = APIRouter()

@router.get("/available")
def get_available_mitigations():
    return {
        "actions": response_simulator.get_available_actions()
    }

@router.post("/execute")
def execute_mitigation(req: MitigationActionRequest):
    try:
        record = response_simulator.execute_action(req.action_type, req.target_zone)
        return {"status": "success", "mitigation": record}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/evaluate/{record_id}")
def evaluate_mitigation(record_id: str):
    record = response_simulator.evaluate_recent_action(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Mitigation record not found")
    return {"status": "success", "mitigation": record}

@router.get("/history")
def get_mitigation_history():
    return {
        "history": response_simulator.get_history()
    }
