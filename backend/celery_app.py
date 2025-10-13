"""
Celery Application Configuration

Main Celery app initialization for PSRA webhook delivery.
This is the entry point for Celery workers.
"""

import os
from celery import Celery

# Redis configuration
# Use environment variable to allow override, default to Docker hostname
REDIS_HOST = os.getenv("REDIS_HOST", "psra-redis")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_DB = os.getenv("REDIS_DB", "0")
REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

# Initialize Celery app
celery_app = Celery(
    "psra_webhooks",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max
    task_soft_time_limit=240,  # 4 minutes soft limit
    task_acks_late=True,  # Acknowledge tasks after completion
    worker_prefetch_multiplier=1,  # Process one task at a time
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks
)

# Import tasks manually to register them
# Auto-discovery doesn't work well when celery_app is outside a package
print("Celery app initialized")
print(f"Broker: {REDIS_URL}")

# We'll include tasks at runtime via -I flag or CELERY_IMPORTS
# Example: celery -A celery_app worker -I tasks.webhook_delivery --loglevel=info

# Periodic tasks configuration (for Celery Beat)
celery_app.conf.beat_schedule = {
    "cleanup-old-deliveries": {
        "task": "webhooks.cleanup_old_deliveries",
        "schedule": 86400.0,  # Daily
        "kwargs": {"days_old": 90},
    },
    "retry-failed-deliveries": {
        "task": "webhooks.retry_failed_deliveries",
        "schedule": 300.0,  # Every 5 minutes
    },
}

if __name__ == "__main__":
    celery_app.start()
