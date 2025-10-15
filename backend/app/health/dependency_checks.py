import psutil
import redis
import requests
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
import logging

# Assuming these are configured elsewhere (e.g., in app config)
DATABASE_URL = "postgresql://user:pass@localhost/db"  # Replace with actual
REDIS_URL = "redis://localhost:6379"  # Replace with actual
ML_SERVICE_URL = "http://ml-service:8000/health"  # Replace with actual

def check_database() -> Dict[str, Any]:
    """Check database connectivity."""
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"healthy": True}
    except SQLAlchemyError as e:
        return {"healthy": False, "error": str(e)}

def check_redis() -> Dict[str, Any]:
    """Check Redis connectivity."""
    try:
        r = redis.Redis.from_url(REDIS_URL)
        r.ping()
        return {"healthy": True}
    except redis.ConnectionError as e:
        return {"healthy": False, "error": str(e)}

def check_ml_services() -> Dict[str, Any]:
    """Check ML services availability via HTTP."""
    try:
        response = requests.get(ML_SERVICE_URL, timeout=5)
        if response.status_code == 200:
            return {"healthy": True}
        else:
            return {"healthy": False, "error": f"Status code {response.status_code}"}
    except requests.RequestException as e:
        return {"healthy": False, "error": str(e)}

def check_disk_space() -> Dict[str, Any]:
    """Check disk space (e.g., ensure >10% free)."""
    disk = psutil.disk_usage('/')
    free_percent = (disk.free / disk.total) * 100
    if free_percent > 10:
        return {"healthy": True, "free_percent": free_percent}
    else:
        return {"healthy": False, "error": f"Low disk space: {free_percent:.2f}%"}

def check_memory() -> Dict[str, Any]:
    """Check memory usage (e.g., ensure <90% used)."""
    memory = psutil.virtual_memory()
    used_percent = memory.percent
    if used_percent < 90:
        return {"healthy": True, "used_percent": used_percent}
    else:
        return {"healthy": False, "error": f"High memory usage: {used_percent:.2f}%"}