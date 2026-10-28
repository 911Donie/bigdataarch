from fastapi import APIRouter
from app.generator import generator
from app.schemas import SimulationControlRequest, ScenarioTriggerRequest

router = APIRouter()

@router.get("/status")
def get_simulation_status():
    return generator.get_stats()

@router.post("/start")
def start_simulation():
    generator.start()
    return {"status": "started", "state": generator.state}

@router.post("/pause")
def pause_simulation():
    generator.pause()
    return {"status": "paused", "state": generator.state}

@router.post("/resume")
def resume_simulation():
    generator.resume()
    return {"status": "resumed", "state": generator.state}

@router.post("/stop")
def stop_simulation():
    generator.stop()
    return {"status": "stopped", "state": generator.state}

@router.post("/reset")
def reset_simulation():
    generator.reset()
    return {"status": "reset", "state": generator.state}

@router.post("/configure")
def configure_simulation(req: SimulationControlRequest):
    generator.configure(
        rate_eps=req.rate_eps,
        mix_sms_pct=req.mix_sms_pct,
        region=req.region,
        seed=req.seed,
        duration_s=req.duration_s
    )
    if req.action == "start":
        generator.start()
    elif req.action == "pause":
        generator.pause()
    elif req.action == "resume":
        generator.resume()
    elif req.action == "stop":
        generator.stop()
    elif req.action == "reset":
        generator.reset()
        
    return {"status": "configured", "state": generator.get_stats()}

@router.post("/scenario")
def trigger_scenario(req: ScenarioTriggerRequest):
    generator.set_scenario(req.scenario_id)
    if generator.state != "RUNNING":
        generator.start()
    return {"status": "scenario_applied", "active_scenario": req.scenario_id}

@router.get("/scenarios")
def get_scenarios():
    return {
        "scenarios": [
            {
                "id": "NORMAL",
                "name": "Scenario 1: Normal Traffic",
                "description": "Steady balanced baseline traffic (~35-45 eps, low latency 80-120ms, <2% failure rate).",
                "what_happens": "Generates steady SMS and Voice events with normal Poisson arrival distribution.",
                "expected_behavior": "All network clusters stay in NORMAL status (<70% utilization), zero critical alerts."
            },
            {
                "id": "SMS_SPIKE",
                "name": "Scenario 2: Sudden SMS Traffic Spike",
                "description": "Simulates a sharp 4-5x increase in SMS submissions (flash crowds, promotional blasts, OTP surge).",
                "what_happens": "Ingestion rate jumps to 120 eps with 90% SMS mix.",
                "expected_behavior": "Method A & B flag relative throughput surge; SMS latency slightly rises."
            },
            {
                "id": "VOICE_SURGE",
                "name": "Scenario 3: Voice Call Surge",
                "description": "Sudden sharp influx of Voice calls during emergency or breaking event.",
                "what_happens": "Voice traffic jumps to 85% of total volume at 110 eps.",
                "expected_behavior": "Call setup latency increases; circuit busy warnings emitted by Method C."
            },
            {
                "id": "SMS_RETRY_STORM",
                "name": "Scenario 4: SMS Retry Storm",
                "description": "Repeated aggressive retries with zero backoff amplify traffic load and queue backlog.",
                "what_happens": "Ingestion rate increases to 130 eps with high retry counts and simulated network timeouts.",
                "expected_behavior": "SMS failure rate spikes to >12%; Method C and D detect failure surge and queue growth."
            },
            {
                "id": "REGIONAL_CONGESTION",
                "name": "Scenario 5: Regional Congestion",
                "description": "Traffic heavily concentrated into South-02 while neighboring South-01 has spare capacity.",
                "what_happens": "85% of incoming events are directed into South-02 cell cluster.",
                "expected_behavior": "South-02 utilization breaches 95% into CONGESTED status, while South-01 remains <35%."
            },
            {
                "id": "PROCESSING_BOTTLENECK",
                "name": "Scenario 6: Processing Bottleneck",
                "description": "High incoming ingestion rate while stream consumer throughput drops sharply.",
                "what_happens": "Simulated consumer capacity multiplier reduced to 25%.",
                "expected_behavior": "Queue backlog swells above 200 events; Method D flags sustained queue growth."
            },
            {
                "id": "RECOVERY",
                "name": "Scenario 7: Recovery Phase",
                "description": "Restores processing capacity and redistributes load to return metrics to baseline.",
                "what_happens": "Normalizes traffic rate to 35 eps and accelerates consumer processing to 120%.",
                "expected_behavior": "In-flight queues drain, latency returns to <100ms, and alerts resolve."
            }
        ]
    }
