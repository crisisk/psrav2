"""
Health Check Module for Python Applications

This module provides a comprehensive health check implementation for Python applications.
It includes checks for database connections, Redis, external services, and system resources.
"""

import os
import time
import json
import socket
import platform
import logging
import asyncio
import psutil
from typing import Dict, Any, List, Optional, Union
from datetime import datetime

import aiohttp
import redis
import psycopg2
from fastapi import APIRouter, Response, Depends
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration with defaults
class HealthCheckConfig:
    def __init__(self):
        # Service info
        self.service_name = os.environ.get("SERVICE_NAME", "service")
        self.service_version = os.environ.get("SERVICE_VERSION", "1.0.0")
        
        # Database
        self.db_enabled = os.environ.get("DB_ENABLED", "true").lower() != "false"
        self.db_host = os.environ.get("DB_HOST")
        self.db_port = int(os.environ.get("DB_PORT", "5432"))
        self.db_name = os.environ.get("DB_NAME")
        self.db_user = os.environ.get("DB_USER")
        self.db_password = os.environ.get("DB_PASSWORD")
        self.db_password_file = os.environ.get("DB_PASSWORD_FILE")
        
        # Redis
        self.redis_enabled = os.environ.get("REDIS_ENABLED", "true").lower() != "false"
        self.redis_host = os.environ.get("REDIS_HOST")
        self.redis_port = int(os.environ.get("REDIS_PORT", "6379"))
        self.redis_password = os.environ.get("REDIS_PASSWORD")
        self.redis_password_file = os.environ.get("REDIS_PASSWORD_FILE")
        
        # External services
        external_services_str = os.environ.get("EXTERNAL_SERVICES", "")
        self.external_services = []
        if external_services_str:
            for service in external_services_str.split(","):
                if ":" in service:
                    name, url = service.split(":", 1)
                    self.external_services.append({"name": name, "url": url})
        
        # Thresholds
        self.cpu_threshold = float(os.environ.get("CPU_THRESHOLD", "0.9"))
        self.memory_threshold = float(os.environ.get("MEMORY_THRESHOLD", "0.9"))
        self.disk_threshold = float(os.environ.get("DISK_THRESHOLD", "0.9"))
        
        # Timeouts
        self.db_timeout = int(os.environ.get("DB_TIMEOUT", "5"))
        self.redis_timeout = int(os.environ.get("REDIS_TIMEOUT", "5"))
        self.external_timeout = int(os.environ.get("EXTERNAL_TIMEOUT", "5"))
        
        # Read password from file if specified
        if self.db_password_file and not self.db_password:
            try:
                with open(self.db_password_file, "r") as f:
                    self.db_password = f.read().strip()
            except Exception as e:
                logger.error(f"Failed to read database password file: {e}")
        
        if self.redis_password_file and not self.redis_password:
            try:
                with open(self.redis_password_file, "r") as f:
                    self.redis_password = f.read().strip()
            except Exception as e:
                logger.error(f"Failed to read Redis password file: {e}")

# Create config instance
config = HealthCheckConfig()

# Pydantic models for responses
class SystemStatus(BaseModel):
    status: str
    cpu: Dict[str, Any]
    memory: Dict[str, Any]
    uptime: float
    hostname: str

class DatabaseStatus(BaseModel):
    status: str
    response_time: Optional[float] = None
    connections: Optional[Dict[str, int]] = None
    error: Optional[str] = None

class RedisStatus(BaseModel):
    status: str
    response_time: Optional[float] = None
    connected: Optional[bool] = None
    error: Optional[str] = None

class ExternalServiceStatus(BaseModel):
    status: str
    status_code: Optional[int] = None
    response_time: Optional[float] = None
    error: Optional[str] = None

class HealthCheckResponse(BaseModel):
    status: str
    timestamp: str
    service: str
    version: str
    duration: Optional[str] = None
    checks: Dict[str, Any]

# Create FastAPI router
router = APIRouter()

# Database connection function
async def check_database() -> Dict[str, Any]:
    """Check database connection"""
    if not config.db_enabled or not config.db_host or not config.db_name or not config.db_user or not config.db_password:
        return {"status": "disabled"}
    
    try:
        start_time = time.time()
        conn = psycopg2.connect(
            host=config.db_host,
            port=config.db_port,
            dbname=config.db_name,
            user=config.db_user,
            password=config.db_password,
            connect_timeout=config.db_timeout
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()
        
        duration = (time.time() - start_time) * 1000  # Convert to ms
        
        return {
            "status": "ok",
            "response_time": duration,
            "connections": {
                "total": 1,  # Basic info, would need connection pooling for more details
                "idle": 0,
                "waiting": 0,
            },
        }
    except Exception as e:
        logger.error(f"Database check failed: {e}")
        return {
            "status": "error",
            "error": str(e),
        }

# Redis connection function
async def check_redis() -> Dict[str, Any]:
    """Check Redis connection"""
    if not config.redis_enabled or not config.redis_host:
        return {"status": "disabled"}
    
    try:
        start_time = time.time()
        r = redis.Redis(
            host=config.redis_host,
            port=config.redis_port,
            password=config.redis_password,
            socket_timeout=config.redis_timeout,
            socket_connect_timeout=config.redis_timeout,
        )
        
        r.ping()
        duration = (time.time() - start_time) * 1000  # Convert to ms
        
        return {
            "status": "ok",
            "response_time": duration,
            "connected": True,
        }
    except Exception as e:
        logger.error(f"Redis check failed: {e}")
        return {
            "status": "error",
            "error": str(e),
        }

# External services check function
async def check_external_services() -> Dict[str, Any]:
    """Check external services"""
    if not config.external_services:
        return {"status": "disabled"}
    
    results = {}
    
    async with aiohttp.ClientSession() as session:
        for service in config.external_services:
            try:
                start_time = time.time()
                async with session.get(service["url"], timeout=config.external_timeout) as response:
                    duration = (time.time() - start_time) * 1000  # Convert to ms
                    
                    results[service["name"]] = {
                        "status": "ok" if 200 <= response.status < 300 else "error",
                        "status_code": response.status,
                        "response_time": duration,
                    }
            except Exception as e:
                logger.error(f"External service check failed for {service['name']}: {e}")
                results[service["name"]] = {
                    "status": "error",
                    "error": str(e),
                }
    
    return results

# System resources check function
def check_system() -> Dict[str, Any]:
    """Check system resources"""
    memory = psutil.virtual_memory()
    memory_usage = memory.percent / 100
    
    cpu_usage = psutil.cpu_percent(interval=0.1) / 100
    
    return {
        "status": "ok",
        "cpu": {
            "usage": cpu_usage,
            "status": "ok" if cpu_usage < config.cpu_threshold else "warning",
            "cores": psutil.cpu_count(),
            "load_avg": [x / psutil.cpu_count() for x in psutil.getloadavg()],
        },
        "memory": {
            "total": memory.total,
            "free": memory.available,
            "used": memory.used,
            "usage": memory_usage,
            "status": "ok" if memory_usage < config.memory_threshold else "warning",
        },
        "uptime": time.time() - psutil.boot_time(),
        "hostname": socket.gethostname(),
    }

@router.get("/liveness", response_model=Dict[str, Any])
async def liveness_check():
    """
    Perform a liveness check
    This is a simple check to determine if the application is running
    """
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "service": config.service_name,
        "version": config.service_version,
    }

@router.get("/readiness", response_model=Dict[str, Any])
async def readiness_check(response: Response):
    """
    Perform a readiness check
    This checks if the application is ready to handle requests
    """
    db_status, redis_status, external_status = await asyncio.gather(
        check_database(),
        check_redis(),
        check_external_services(),
    )
    
    system_status = check_system()
    
    is_ready = (
        (db_status["status"] == "ok" or db_status["status"] == "disabled") and
        (redis_status["status"] == "ok" or redis_status["status"] == "disabled") and
        system_status["status"] == "ok"
    )
    
    external_services_ready = all(
        service["status"] == "ok" or service["status"] == "disabled"
        for service in external_status.values()
        if isinstance(service, dict)
    )
    
    status = "ok" if is_ready and external_services_ready else "error"
    
    if status != "ok":
        response.status_code = 503
    
    return {
        "status": status,
        "timestamp": datetime.now().isoformat(),
        "service": config.service_name,
        "version": config.service_version,
        "checks": {
            "database": db_status,
            "redis": redis_status,
            "external_services": external_status,
            "system": system_status,
        },
    }

@router.get("/", response_model=Dict[str, Any])
async def health_check(response: Response):
    """
    Comprehensive health check endpoint
    """
    start_time = time.time()
    
    db_status, redis_status, external_status = await asyncio.gather(
        check_database(),
        check_redis(),
        check_external_services(),
    )
    
    system_status = check_system()
    
    is_healthy = (
        (db_status["status"] == "ok" or db_status["status"] == "disabled") and
        (redis_status["status"] == "ok" or redis_status["status"] == "disabled") and
        system_status["status"] == "ok"
    )
    
    external_services_healthy = all(
        service["status"] == "ok" or service["status"] == "disabled"
        for service in external_status.values()
        if isinstance(service, dict)
    )
    
    status = "ok" if is_healthy and external_services_healthy else "error"
    
    duration = (time.time() - start_time) * 1000  # Convert to ms
    
    if status != "ok":
        response.status_code = 503
    
    return {
        "status": status,
        "timestamp": datetime.now().isoformat(),
        "service": config.service_name,
        "version": config.service_version,
        "duration": f"{duration:.2f}ms",
        "checks": {
            "database": db_status,
            "redis": redis_status,
            "external_services": external_status,
            "system": system_status,
        },
    }

# Function to add the health check routes to a FastAPI app
def add_health_routes(app, prefix="/health"):
    """
    Add health check routes to a FastAPI application
    
    Args:
        app: FastAPI application
        prefix: URL prefix for health check routes
    """
    app.include_router(router, prefix=prefix)
    
    # Also add a root health check endpoint
    @app.get("/health")
    async def root_health_check(response: Response):
        return await health_check(response)
