import os
from pydantic import BaseModel
from typing import List, Dict

class Settings(BaseModel):
    PROJECT_NAME: str = "TelecomPulse AI — Real-Time SMS and Voice Traffic Monitoring"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./telecompulse.db")
    
    # Streaming Engine Mode: "LOCAL_SIMULATION" (default, runs out of the box) or "KAFKA_SPARK"
    STREAMING_MODE: str = os.getenv("STREAMING_MODE", "LOCAL_SIMULATION")
    
    # Processing Windows (in seconds)
    WINDOWS: List[int] = [10, 30, 60, 300]
    DEFAULT_WINDOW: int = 30
    
    # Bounded buffer sizes
    MAX_IN_MEMORY_EVENTS: int = 5000
    MAX_HISTORICAL_EVENTS: int = 50000
    
    # Regions and Network Zones
    REGIONS: List[str] = ["North", "South", "East", "West", "Central"]
    
    ZONE_CAPACITIES: Dict[str, int] = {
        # Base capacities in events per second (eps)
        "North-01": 100,
        "North-02": 80,
        "South-01": 120,
        "South-02": 100,
        "East-01": 90,
        "West-01": 110,
        "Central-01": 150
    }
    
    # Utilization Thresholds (%)
    UTILIZATION_NORMAL: float = 70.0
    UTILIZATION_WARNING: float = 85.0
    
    # Anomaly Detection thresholds
    SPIKE_MULTIPLIER: float = 2.0         # Method A: Relative Spike
    Z_SCORE_THRESHOLD: float = 2.5        # Method B: Statistical Z-Score
    SMS_FAILURE_THRESHOLD: float = 6.0    # Method C: SMS Failure %
    VOICE_FAILURE_THRESHOLD: float = 6.5  # Method C: Voice Failure %
    QUEUE_GROWTH_THRESHOLD: float = 1.15  # Method D: 15% growth rate

settings = Settings()
