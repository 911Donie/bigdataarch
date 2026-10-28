from fastapi import APIRouter
from pydantic import BaseModel
from app.data_quality import data_quality_engine

router = APIRouter()

class DataQualityInjectionRequest(BaseModel):
    duplicates: bool = False
    delay: bool = False
    schema_errors: bool = False

@router.get("/metrics")
def get_data_quality_metrics():
    return data_quality_engine.get_metrics()

@router.post("/inject")
def set_data_quality_injection(req: DataQualityInjectionRequest):
    data_quality_engine.set_injection_modes(
        duplicates=req.duplicates,
        delay=req.delay,
        schema_errors=req.schema_errors
    )
    return {
        "status": "updated",
        "metrics": data_quality_engine.get_metrics()
    }

@router.post("/reset")
def reset_data_quality():
    data_quality_engine.reset()
    return {"status": "reset", "metrics": data_quality_engine.get_metrics()}
