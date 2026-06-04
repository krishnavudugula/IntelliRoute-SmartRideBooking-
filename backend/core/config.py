"""Application settings and configuration"""

from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings"""
    
    # App
    APP_NAME: str = "IntelliRoute"
    DEBUG: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = "sqlite:///./db.sqlite3"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Pricing config
    BASE_FARE: dict = {
        "bike": 20,
        "auto": 30,
        "car": 50,
        "cab": 50
    }
    
    DISTANCE_RATE: dict = {
        "bike": 10,
        "auto": 12,
        "car": 15,
        "cab": 15
    }
    
    TIME_RATE: dict = {
        "bike": 1,
        "auto": 1.5,
        "car": 2,
        "cab": 2
    }
    
    # Distance limits (km)
    DISTANCE_LIMITS: dict = {
        "bike": 15,
        "auto": 25,
        "car": 80,
        "cab": 80
    }
    
    # Matching radius (km)
    MATCHING_RADIUS: dict = {
        "urban": 2.0,
        "suburban": 5.0
    }
    
    class Config:
        env_file = ".env"

settings = Settings()
