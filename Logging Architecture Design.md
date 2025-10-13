# Logging Architecture Design

## Overview

This document outlines the design for implementing a comprehensive logging solution for the Sevensa platform. The logging architecture is designed to provide centralized log collection, storage, and analysis capabilities for all services and infrastructure components.

## Current State

The current logging setup is fragmented, with logs scattered across different services and hosts. This makes it difficult to correlate events and troubleshoot issues. This design aims to implement a centralized logging solution that provides a unified view of all logs across the platform.

## Logging Design Principles

1. **Centralized Collection**: Collect logs from all services and infrastructure components in a central location.
2. **Structured Logging**: Use structured logging formats (JSON) to enable better parsing and analysis.
3. **Correlation**: Enable correlation of logs across different services and components.
4. **Retention**: Implement appropriate retention policies based on log importance and compliance requirements.
5. **Security**: Ensure that logs are securely stored and access is controlled.
6. **Scalability**: Scale with the platform as it grows.

## Logging Components

The logging architecture consists of the following key components:

1. **Loki**: For log storage and indexing.
2. **Promtail**: For log collection from services and hosts.
3. **Grafana**: For log visualization and exploration.
4. **Vector**: For advanced log processing and transformation.

### Component Relationships

```
                                 +-------------------+
                                 |                   |
                                 |     Grafana       |
                                 |                   |
                                 +--------+----------+
                                          |
                                 +--------v----------+
                                 |                   |
                                 |       Loki        |
                                 |                   |
                                 +--------+----------+
                                          |
                     +--------------------+--------------------+
                     |                                         |
            +--------v----------+                   +----------v---------+
            |                   |                   |                    |
            |     Promtail      |                   |      Vector        |
            |                   |                   |                    |
            +--------+----------+                   +----------+---------+
                     |                                         |
      +--------------+-------------+                +----------+---------+
      |              |             |                |                    |
+-----v-----+ +------v------+ +----v------+   +-----v------+    +-------v-----+
|           | |             | |           |   |            |    |             |
|  System   | | Container   | | Service   |   |  Service   |    |  Database   |
|   Logs    | |    Logs     | |   Logs    |   |   Logs     |    |    Logs     |
|           | |             | |           |   |            |    |             |
+-----------+ +-------------+ +-----------+   +------------+    +-------------+
```

## Log Collection

### System Logs

The following system logs will be collected:

1. **Kernel Logs**: `/var/log/kern.log`
2. **Authentication Logs**: `/var/log/auth.log`
3. **System Logs**: `/var/log/syslog`
4. **CRON Logs**: `/var/log/cron.log`
5. **Mail Logs**: `/var/log/mail.log`

### Container Logs

Container logs will be collected from Docker's log files:

1. **Docker Container Logs**: `/var/lib/docker/containers/*/*-json.log`

### Service Logs

Service logs will be collected from each service's log output:

1. **RentGuy Logs**: From the RentGuy service containers
2. **PSRA Logs**: From the PSRA service containers
3. **WPCS Logs**: From the WPCS service containers
4. **AI Orchestration Logs**: From the AI Orchestration service containers

### Database Logs

Database logs will be collected from each database:

1. **PostgreSQL Logs**: From the PostgreSQL database containers
2. **MySQL Logs**: From the MySQL database containers
3. **Redis Logs**: From the Redis containers

## Log Processing

Logs will be processed using Vector to:

1. **Parse**: Extract structured data from log messages
2. **Filter**: Remove unnecessary log messages
3. **Transform**: Enrich log messages with additional context
4. **Route**: Send logs to the appropriate destination

### Processing Rules

The following processing rules will be applied:

1. **JSON Parsing**: Parse JSON-formatted logs
2. **Timestamp Normalization**: Normalize timestamps to UTC
3. **Log Level Extraction**: Extract log levels from messages
4. **Service Tagging**: Tag logs with service name
5. **Error Detection**: Detect and tag error messages
6. **PII Redaction**: Redact personally identifiable information

## Log Storage

Logs will be stored in Loki with the following configuration:

1. **Retention**: 30 days for general logs, 90 days for security logs
2. **Compression**: Compress logs to reduce storage requirements
3. **Indexing**: Index logs by service, host, and log level
4. **Partitioning**: Partition logs by date for better performance

## Log Visualization

Logs will be visualized in Grafana with the following dashboards:

1. **Log Explorer**: For ad-hoc log exploration
2. **Service Logs**: For viewing logs from specific services
3. **Error Logs**: For viewing error logs across all services
4. **Security Logs**: For viewing security-related logs
5. **Audit Logs**: For viewing audit logs

## Log Correlation

Logs will be correlated using the following methods:

1. **Request ID**: Include a unique request ID in all logs related to a request
2. **Trace ID**: Include a trace ID for distributed tracing
3. **Session ID**: Include a session ID for user session tracking
4. **Timestamp**: Use timestamps for temporal correlation

## Implementation Approach

The implementation will follow these steps:

1. **Set up Loki**:
   - Deploy Loki for log storage
   - Configure retention policies
   - Configure indexing

2. **Set up Promtail**:
   - Deploy Promtail on all hosts
   - Configure log sources
   - Configure parsing rules

3. **Set up Vector**:
   - Deploy Vector for advanced log processing
   - Configure processing rules
   - Configure routing

4. **Configure Services**:
   - Update service configurations to use structured logging
   - Include correlation IDs in logs
   - Configure log levels

5. **Create Dashboards**:
   - Create log explorer dashboard
   - Create service-specific log dashboards
   - Create error log dashboard

## Docker Compose Configuration

The logging stack will be deployed using Docker Compose with the following configuration:

```yaml
version: '3.8'

services:
  loki:
    image: grafana/loki:latest
    container_name: loki
    restart: unless-stopped
    volumes:
      - ./loki:/etc/loki
      - loki-data:/loki
    command:
      - '-config.file=/etc/loki/loki.yml'
    networks:
      - logging_network
      - shared_network

  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    restart: unless-stopped
    volumes:
      - ./promtail:/etc/promtail
      - /var/log:/var/log
      - /var/lib/docker/containers:/var/lib/docker/containers
    command:
      - '-config.file=/etc/promtail/promtail.yml'
    networks:
      - logging_network

  vector:
    image: timberio/vector:latest
    container_name: vector
    restart: unless-stopped
    volumes:
      - ./vector:/etc/vector
      - /var/log:/var/log
      - /var/lib/docker/containers:/var/lib/docker/containers
    command:
      - '--config=/etc/vector/vector.toml'
    networks:
      - logging_network
      - shared_network

volumes:
  loki-data:

networks:
  logging_network:
    external: true
  shared_network:
    external: true
```

## Loki Configuration

The Loki configuration will include the following settings:

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/index
    cache_location: /loki/cache
    cache_ttl: 24h
    shared_store: filesystem
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  retention_period: 744h  # 31 days

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 744h  # 31 days
```

## Promtail Configuration

The Promtail configuration will include the following settings:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: varlogs
          __path__: /var/log/*log

  - job_name: containers
    static_configs:
      - targets:
          - localhost
        labels:
          job: containerlogs
          __path__: /var/lib/docker/containers/*/*log

    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
            attrs: attrs
      - json:
          expressions:
            tag: attrs.tag
          source: attrs
      - regex:
          expression: (?P<container_name>(?:[^|]*[^|]))
          source: tag
      - labels:
          container_name:

  - job_name: rentguy
    static_configs:
      - targets:
          - localhost
        labels:
          job: rentguy
          service: rentguy
          __path__: /var/lib/docker/containers/*rentguy*/*log

  - job_name: psra
    static_configs:
      - targets:
          - localhost
        labels:
          job: psra
          service: psra
          __path__: /var/lib/docker/containers/*psra*/*log

  - job_name: wpcs
    static_configs:
      - targets:
          - localhost
        labels:
          job: wpcs
          service: wpcs
          __path__: /var/lib/docker/containers/*wpcs*/*log

  - job_name: ai
    static_configs:
      - targets:
          - localhost
        labels:
          job: ai
          service: ai
          __path__: /var/lib/docker/containers/*ai*/*log
```

## Vector Configuration

The Vector configuration will include the following settings:

```toml
[sources.docker_logs]
type = "docker_logs"
include_containers = ["*"]

[sources.file_logs]
type = "file"
include = ["/var/log/**/*.log"]
ignore_older = 86400  # 1 day

[transforms.parse_docker_logs]
type = "remap"
inputs = ["docker_logs"]
source = '''
  .parsed = parse_json!(.message)
  .timestamp = to_timestamp!(.parsed.time)
  .message = .parsed.log
  .container_name = .container_name
  .container_id = .container_id
  .image = .image
'''

[transforms.parse_json_logs]
type = "remap"
inputs = ["parse_docker_logs"]
source = '''
  if is_json(.message) {
    .parsed = parse_json!(.message)
    .level = .parsed.level
    .message = .parsed.message
    .request_id = .parsed.request_id
    .trace_id = .parsed.trace_id
    .session_id = .parsed.session_id
  }
'''

[transforms.detect_errors]
type = "remap"
inputs = ["parse_json_logs"]
source = '''
  if .level == "error" || .level == "ERROR" || .level == "FATAL" || .level == "fatal" {
    .is_error = true
  } else {
    .is_error = false
  }
'''

[transforms.redact_pii]
type = "remap"
inputs = ["detect_errors"]
source = '''
  if exists(.message) {
    .message = replace(.message, /[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}/, "[REDACTED]")
    .message = replace(.message, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, "[REDACTED]")
  }
'''

[sinks.loki]
type = "loki"
inputs = ["redact_pii"]
endpoint = "http://loki:3100"
encoding.codec = "json"
labels.job = "{{ service }}"
labels.host = "{{ hostname }}"
labels.level = "{{ level }}"
labels.container_name = "{{ container_name }}"
labels.is_error = "{{ is_error }}"
```

## Service Configuration

Services will be configured to use structured logging with the following format:

```json
{
  "timestamp": "2025-10-09T12:34:56.789Z",
  "level": "info",
  "message": "Request processed successfully",
  "request_id": "req-12345",
  "trace_id": "trace-12345",
  "session_id": "sess-12345",
  "user_id": "user-12345",
  "service": "rentguy-api",
  "method": "GET",
  "path": "/api/v1/tenants",
  "status_code": 200,
  "response_time_ms": 123
}
```

## Log Retention Policies

The following log retention policies will be implemented:

1. **General Logs**: 30 days
2. **Error Logs**: 90 days
3. **Security Logs**: 90 days
4. **Audit Logs**: 365 days

## Security Considerations

The following security measures will be implemented:

1. **Access Control**: Restrict access to logs based on user roles
2. **PII Redaction**: Redact personally identifiable information from logs
3. **Encryption**: Encrypt logs at rest
4. **Audit Logging**: Log all access to the logging system

## Conclusion

This logging architecture provides a comprehensive solution for collecting, processing, storing, and analyzing logs from all services and infrastructure components in the Sevensa platform. It enables centralized log management, correlation of logs across different services, and advanced log analysis capabilities. The implementation approach ensures that the logging solution is scalable, secure, and provides valuable insights for troubleshooting and monitoring.
