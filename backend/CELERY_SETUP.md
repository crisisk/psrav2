# Celery Worker Setup for Async Webhook Delivery

## Overview

This setup provides asynchronous webhook delivery using Celery workers with Redis as the message broker.

## Components

### 1. Celery Application (`celery_app.py`)
- Main Celery application configuration
- Redis broker connection
- Task configuration and limits
- Periodic task scheduling (Celery Beat)

### 2. Webhook Delivery Tasks (`tasks/webhook_delivery.py`)
Three tasks are registered:
- `webhooks.deliver_event` - Deliver webhook events asynchronously
- `webhooks.cleanup_old_deliveries` - Clean up old delivery records (runs daily)
- `webhooks.retry_failed_deliveries` - Retry failed deliveries (runs every 5 minutes)

### 3. Redis Broker
- Container: `psra-redis`
- Exposed on: `localhost:6379`
- Database: 0

## Installation

Celery and Redis packages are already installed:
```bash
pip3 install celery redis
```

Version installed: Celery 5.5.3

## Configuration

### Environment Variables

The Celery app supports the following environment variables:

```bash
REDIS_HOST=localhost    # Default: psra-redis (use localhost for host-based workers)
REDIS_PORT=6379        # Default: 6379
REDIS_DB=0             # Default: 0
```

## Running the Worker

### Development / Manual Testing

Run the worker directly from the command line:

```bash
cd /home/vncuser/psra-ltsd-enterprise-v2/backend

# With localhost Redis
REDIS_HOST=localhost celery -A celery_app worker \
    -I tasks.webhook_delivery \
    --loglevel=info

# Or inside Docker (using psra-redis hostname)
celery -A celery_app worker \
    -I tasks.webhook_delivery \
    --loglevel=info
```

### Production (Systemd Services)

Two systemd services have been created:

#### 1. Celery Worker Service
```bash
# Enable and start the worker
sudo systemctl daemon-reload
sudo systemctl enable psra-celery.service
sudo systemctl start psra-celery.service

# Check status
sudo systemctl status psra-celery.service

# View logs
sudo journalctl -u psra-celery.service -f
# or
sudo tail -f /var/log/celery/worker.log

# Stop the worker
sudo systemctl stop psra-celery.service

# Restart the worker
sudo systemctl restart psra-celery.service
```

#### 2. Celery Beat Service (Periodic Tasks)
```bash
# Enable and start beat scheduler
sudo systemctl enable psra-celery-beat.service
sudo systemctl start psra-celery-beat.service

# Check status
sudo systemctl status psra-celery-beat.service

# View logs
sudo journalctl -u psra-celery-beat.service -f
# or
sudo tail -f /var/log/celery/beat.log

# Stop beat
sudo systemctl stop psra-celery-beat.service
```

## Task Usage

### From Python Code

```python
from tasks.webhook_delivery import deliver_webhook_event

# Queue a webhook delivery task
event_data = {
    "event": "application.submitted",
    "partner_id": "partner-123",
    "data": {...},
    "timestamp": "2025-10-13T13:00:00Z"
}

# Asynchronous delivery
task = deliver_webhook_event.delay(
    webhook_id="webhook-xyz",
    event_data=event_data
)

# Get task ID
print(f"Task ID: {task.id}")

# Check task status (if needed)
result = task.get(timeout=10)  # Wait up to 10 seconds
```

### Task Monitoring

View registered tasks:
```bash
cd /home/vncuser/psra-ltsd-enterprise-v2/backend
REDIS_HOST=localhost celery -A celery_app inspect registered
```

Check active tasks:
```bash
REDIS_HOST=localhost celery -A celery_app inspect active
```

View task stats:
```bash
REDIS_HOST=localhost celery -A celery_app inspect stats
```

## Periodic Tasks

Configured in `celery_app.py`:

1. **Cleanup Old Deliveries**
   - Task: `webhooks.cleanup_old_deliveries`
   - Schedule: Daily (86400 seconds)
   - Deletes delivery records older than 90 days

2. **Retry Failed Deliveries**
   - Task: `webhooks.retry_failed_deliveries`
   - Schedule: Every 5 minutes (300 seconds)
   - Retries webhook deliveries that failed

## Task Configuration

From `celery_app.py`:

- **Task Time Limit**: 300 seconds (5 minutes hard limit)
- **Soft Time Limit**: 240 seconds (4 minutes soft limit)
- **Max Retries**: 3 attempts
- **Retry Backoff**: Exponential backoff up to 10 minutes
- **Concurrency**: 4 worker processes
- **Task Acknowledgment**: Late acknowledgment (after completion)
- **Worker Restart**: After 1000 tasks processed

## Troubleshooting

### Worker Won't Start

1. Check Redis is running:
   ```bash
   docker ps | grep redis
   redis-cli -h localhost -p 6379 ping
   ```

2. Verify Redis connection:
   ```bash
   telnet localhost 6379
   ```

3. Check worker logs:
   ```bash
   sudo journalctl -u psra-celery.service -n 50
   ```

### Tasks Not Executing

1. Verify tasks are registered:
   ```bash
   cd /home/vncuser/psra-ltsd-enterprise-v2/backend
   REDIS_HOST=localhost celery -A celery_app inspect registered
   ```

2. Check task queue:
   ```bash
   redis-cli -h localhost -p 6379
   > LLEN celery
   > LRANGE celery 0 -1
   ```

3. Monitor worker in real-time:
   ```bash
   REDIS_HOST=localhost celery -A celery_app worker \
       -I tasks.webhook_delivery \
       --loglevel=debug
   ```

### Redis Connection Issues

If worker can't connect to Redis:

1. For host-based workers: Use `REDIS_HOST=localhost`
2. For Docker-based workers: Use `REDIS_HOST=psra-redis`
3. Check Redis is exposed on host:
   ```bash
   netstat -tuln | grep 6379
   ```

## Security Notes

The systemd service runs as root. For production environments, consider:

1. Creating a dedicated celery user:
   ```bash
   sudo useradd -r -s /bin/false celery
   ```

2. Update service file User/Group:
   ```ini
   User=celery
   Group=celery
   ```

3. Set proper file permissions:
   ```bash
   sudo chown -R celery:celery /home/vncuser/psra-ltsd-enterprise-v2/backend
   ```

## Files Created

- `/home/vncuser/psra-ltsd-enterprise-v2/backend/celery_app.py` - Main Celery application
- `/home/vncuser/psra-ltsd-enterprise-v2/backend/tasks/__init__.py` - Tasks module init
- `/etc/systemd/system/psra-celery.service` - Worker service
- `/etc/systemd/system/psra-celery-beat.service` - Beat scheduler service
- `/home/vncuser/psra-ltsd-enterprise-v2/backend/CELERY_SETUP.md` - This documentation

## Next Steps

1. Update webhook_service.py to use `deliver_webhook_event.delay()` for async delivery
2. Implement proper database session management in tasks
3. Add monitoring and alerting for failed deliveries
4. Configure Flower for task monitoring (optional)
5. Set up log rotation for Celery logs
