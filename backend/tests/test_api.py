import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.generator import generator

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_api_dashboard_summary():
    res = client.get("/api/dashboard/summary?window_seconds=30")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert "total_events_processed" in data["kpis"]
    assert "sms_failure_rate" in data["kpis"]
    assert "zones" in data

def test_api_simulation_lifecycle():
    # Start
    res_start = client.post("/api/simulation/start")
    assert res_start.status_code == 200
    assert res_start.json()["state"] == "RUNNING"
    
    # Pause
    res_pause = client.post("/api/simulation/pause")
    assert res_pause.status_code == 200
    assert res_pause.json()["state"] == "PAUSED"
    
    # Resume
    res_resume = client.post("/api/simulation/resume")
    assert res_resume.status_code == 200
    assert res_resume.json()["state"] == "RUNNING"
    
    # Scenario trigger
    res_scen = client.post("/api/simulation/scenario", json={"scenario_id": "SMS_SPIKE"})
    assert res_scen.status_code == 200
    assert res_scen.json()["active_scenario"] == "SMS_SPIKE"

def test_api_pipeline_and_5vs():
    res = client.get("/api/pipeline/status")
    assert res.status_code == 200
    data = res.json()
    assert "stages" in data
    assert len(data["stages"]) >= 5
    assert "big_data_5vs" in data
    assert "Volume" in data["big_data_5vs"]
    assert "Velocity" in data["big_data_5vs"]

def test_api_explain_and_viva():
    # Explain metric
    res_exp = client.get("/api/explain/metric/sms_failure_rate")
    assert res_exp.status_code == 200
    exp_data = res_exp.json()
    assert "what_is_it" in exp_data
    assert "why_it_matters" in exp_data
    assert "how_calculated" in exp_data
    
    # Ask why
    res_why = client.get("/api/explain/ask-why?question_key=what_kafka_does")
    assert res_why.status_code == 200
    why_data = res_why.json()
    assert "Kafka" in why_data["direct_answer"]
    
    # Viva questions
    res_viva = client.get("/api/viva/questions")
    assert res_viva.status_code == 200
    assert len(res_viva.json()["questions"]) >= 16
    
    # Walkthrough
    res_walk = client.get("/api/viva/walkthrough")
    assert res_walk.status_code == 200
    assert len(res_walk.json()["steps"]) >= 4
