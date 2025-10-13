# Health Check Implementation

This directory contains standardized health check implementations for various programming languages used in the Sevensa platform. These implementations provide a consistent approach to monitoring service health across all services.

## Overview

The health check implementations provide:

- Liveness checks to determine if a service is running
- Readiness checks to determine if a service is ready to handle requests
- Comprehensive health checks for detailed service status
- Checks for database connections, Redis, external services, and system resources
- Consistent response format across all services

## Implementations

The following implementations are available:

- `js/health-check.js`: Health check implementation for Node.js applications
- `python/health_check.py`: Health check implementation for Python applications
- `php/HealthCheck.php`: Health check implementation for PHP applications

## Features

### Liveness Check

The liveness check is a simple check to determine if the service is running. It returns:

```json
{
  "status": "ok",
  "timestamp": "2025-10-10T12:00:00Z",
  "service": "example-service",
  "version": "1.0.0"
}
```

### Readiness Check

The readiness check determines if the service is ready to handle requests. It checks:

- Database connection
- Redis connection
- External service connections
- System resources

```json
{
  "status": "ok",
  "timestamp": "2025-10-10T12:00:00Z",
  "service": "example-service",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 5.2,
      "connections": {
        "total": 10,
        "idle": 8,
        "waiting": 0
      }
    },
    "redis": {
      "status": "ok",
      "responseTime": 2.1,
      "connected": true
    },
    "externalServices": {
      "auth-service": {
        "status": "ok",
        "statusCode": 200,
        "responseTime": 45.3
      }
    },
    "system": {
      "status": "ok",
      "cpu": {
        "usage": 0.25,
        "status": "ok",
        "cores": 4,
        "loadAvg": [0.2, 0.15, 0.1]
      },
      "memory": {
        "total": 8589934592,
        "free": 4294967296,
        "used": 4294967296,
        "usage": 0.5,
        "status": "ok"
      },
      "uptime": 86400,
      "hostname": "example-host"
    }
  }
}
```

### Comprehensive Health Check

The comprehensive health check provides detailed information about the service's health. It includes all the checks from the readiness check, plus additional details and a duration field.

## Usage

### Node.js

```javascript
const express = require('express');
const app = express();
const healthCheck = require('./health-check');

// Add health check routes
app.use('/health', healthCheck);

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
```

### Python (FastAPI)

```python
from fastapi import FastAPI
from health_check import add_health_routes

app = FastAPI()

# Add health check routes
add_health_routes(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### PHP

```php
<?php
require_once 'HealthCheck.php';

$healthCheck = new \Sevensa\Monitoring\HealthCheck();

// Determine the type of check from the URL
$requestUri = $_SERVER['REQUEST_URI'];
$type = 'health';

if (strpos($requestUri, '/health/liveness') !== false) {
    $type = 'liveness';
} elseif (strpos($requestUri, '/health/readiness') !== false) {
    $type = 'readiness';
}

$healthCheck->outputJson($type);
```

## Configuration

The health check implementations can be configured using environment variables:

### Service Information

- `SERVICE_NAME`: Name of the service (default: "service")
- `SERVICE_VERSION`: Version of the service (default: "1.0.0")

### Database

- `DB_ENABLED`: Enable database checks (default: "true")
- `DB_HOST`: Database host
- `DB_PORT`: Database port (default: 5432 for PostgreSQL, 3306 for MySQL)
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_PASSWORD_FILE`: Path to file containing database password
- `DB_DRIVER`: Database driver (default: "mysql" for PHP)

### Redis

- `REDIS_ENABLED`: Enable Redis checks (default: "true")
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis password
- `REDIS_PASSWORD_FILE`: Path to file containing Redis password

### External Services

- `EXTERNAL_SERVICES`: Comma-separated list of external services in the format "name:url"

### Thresholds

- `CPU_THRESHOLD`: CPU usage threshold (default: 0.9)
- `MEMORY_THRESHOLD`: Memory usage threshold (default: 0.9)
- `DISK_THRESHOLD`: Disk usage threshold (default: 0.9)

### Timeouts

- `DB_TIMEOUT`: Database connection timeout in seconds (default: 5)
- `REDIS_TIMEOUT`: Redis connection timeout in seconds (default: 5)
- `EXTERNAL_TIMEOUT`: External service connection timeout in seconds (default: 5)

## Integration with Monitoring Systems

The health check endpoints can be integrated with monitoring systems like Prometheus and Grafana:

### Prometheus

Add the following to your Prometheus configuration:

```yaml
scrape_configs:
  - job_name: 'services'
    metrics_path: '/health'
    scrape_interval: 15s
    scrape_timeout: 10s
    static_configs:
      - targets: ['service1:3000', 'service2:8000', 'service3:80']
```

### Grafana

Create a dashboard in Grafana that visualizes the health check metrics:

- Service status
- Database response time
- Redis response time
- External service response times
- CPU usage
- Memory usage
- Disk usage

## Best Practices

- Enable health checks for all services
- Configure appropriate thresholds for your environment
- Monitor health check endpoints with Prometheus
- Create alerts for health check failures
- Include health checks in your CI/CD pipeline
- Use health checks for load balancer decisions

## Troubleshooting

### Common Issues

- **Database connection failures**: Check database credentials and network connectivity
- **Redis connection failures**: Check Redis credentials and network connectivity
- **External service failures**: Check external service availability and network connectivity
- **High resource usage**: Check for resource leaks or high load

### Debugging

- Enable debug logging for more detailed information
- Check service logs for error messages
- Use the comprehensive health check endpoint for detailed status information
