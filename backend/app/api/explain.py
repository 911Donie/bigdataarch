from fastapi import APIRouter, Query
from app.learning_engine import learning_engine

router = APIRouter()

@router.get("/metric/{metric_id}")
def explain_metric(metric_id: str):
    """Returns the 5-part explanation with live data for a specific metric."""
    return learning_engine.explain_metric(metric_id)

@router.get("/ask-why")
def ask_why(question_key: str = Query(...)):
    """Answers a specific technical inquiry based on current simulation state."""
    return learning_engine.answer_ask_why(question_key)
