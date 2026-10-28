from fastapi import APIRouter
from app.learning_engine import learning_engine

router = APIRouter()

@router.get("/questions")
def get_viva_questions():
    """Returns 16+ core viva questions and structured answers with current run examples."""
    return {
        "questions": learning_engine.get_viva_qna()
    }

@router.get("/walkthrough")
def get_run_walkthrough():
    """Generates an ordered narrative of the current run for a live presentation."""
    return learning_engine.walk_through_run()
