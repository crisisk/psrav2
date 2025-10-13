# DevOps & AI Observability Dashboard

Dit document beschrijft het ontwerp en de implementatie van een uitgebreid DevOps & AI Observability Dashboard voor de Sevensa platform services. Het dashboard biedt real-time inzicht in service health, AI performance, security metrics en resource gebruik.

## 1. Dashboard Architectuur

Het dashboard is gebaseerd op een Grafana frontend met Prometheus, Loki en Jaeger als data sources. De architectuur bestaat uit de volgende componenten:

### 1.1 Data Collection

- **Prometheus**: Verzamelt metrics van alle services via de `/metrics` endpoints
- **Loki**: Verzamelt logs van alle services via Promtail
- **Jaeger**: Verzamelt distributed traces via OpenTelemetry
- **OpenTelemetry Collector**: Centraliseert telemetry data en stuurt deze door naar de juiste backends

### 1.2 Data Storage

- **Prometheus TSDB**: Slaat time-series metrics data op
- **Loki Storage**: Slaat log data op met labels voor efficiënte queries
- **Jaeger Storage**: Slaat trace data op
- **Redis**: Caching layer voor dashboard performance

### 1.3 Visualization

- **Grafana**: Frontend voor dashboards en visualisaties
- **Alertmanager**: Beheert alerts en notificaties
- **Custom API**: Biedt geaggregeerde data voor complexe visualisaties

## 2. Dashboard Componenten

Het dashboard bestaat uit de volgende hoofdcomponenten:

### 2.1 Service Health Overview

![Service Health Overview](https://example.com/service-health-overview.png)

Deze sectie toont de overall health van alle services met:

- Service status indicators (healthy, degraded, down)
- Response time trends per service
- Error rates per service
- SLA compliance metrics
- Recent incidents timeline

**Implementatie:**

```yaml
# Prometheus query voor service health
sum by (service) (
  rate(http_requests_total{status=~"5.."}[5m])
) / sum by (service) (
  rate(http_requests_total[5m])
) * 100
```

### 2.2 AI Performance Metrics

![AI Performance Metrics](https://example.com/ai-performance-metrics.png)

Deze sectie is specifiek gericht op de performance van AI componenten:

- LangGraph Origin Engine response times
- Token usage per request
- Model latency distribution
- Cache hit/miss ratio
- Confidence scores distribution
- Error analysis by component

**Implementatie:**

```yaml
# Prometheus query voor LLM latency
histogram_quantile(0.95, sum(rate(llm_request_duration_seconds_bucket{service="langgraph-api"}[5m])) by (le))
```

### 2.3 Security & Compliance

![Security & Compliance](https://example.com/security-compliance.png)

Deze sectie biedt inzicht in security metrics:

- Failed authentication attempts
- Secret rotation status
- Certificate expiration timeline
- Vulnerability scan results
- Compliance status indicators
- Audit log activity heatmap

**Implementatie:**

```yaml
# Loki query voor failed auth attempts
sum(count_over_time({app="keycloak"} |= "Failed login" [1h])) by (realm)
```

### 2.4 Resource Utilization

![Resource Utilization](https://example.com/resource-utilization.png)

Deze sectie toont resource gebruik en kosten:

- CPU & memory usage per service
- Storage utilization trends
- Network traffic patterns
- Estimated cloud costs
- Resource efficiency metrics
- Scaling events timeline

**Implementatie:**

```yaml
# Prometheus query voor container resource gebruik
sum by (service) (
  container_memory_usage_bytes{namespace="sevensa"}
)
```

### 2.5 User Experience

![User Experience](https://example.com/user-experience.png)

Deze sectie richt zich op de gebruikerservaring:

- Page load times
- API response times
- User flow completion rates
- Error rates by user journey
- Geographic usage distribution
- Device/browser distribution

**Implementatie:**

```yaml
# Prometheus query voor API response times
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{handler=~"/api/.*"}[5m])) by (handler, le))
```

## 3. AI-Specific Observability

### 3.1 LangGraph Origin Engine Dashboard

![LangGraph Dashboard](https://example.com/langgraph-dashboard.png)

Een gespecialiseerd dashboard voor de LangGraph Origin Engine met:

- Node execution times per workflow step
- Success/failure rates per step
- Token usage per step
- Caching efficiency metrics
- Parallel processing performance
- Error distribution by error type

**Implementatie:**

```yaml
# Prometheus query voor node execution times
histogram_quantile(0.95, sum(rate(langgraph_node_duration_seconds_bucket{service="langgraph-api"}[5m])) by (node, le))
```

### 3.2 Model Performance Analysis

![Model Performance](https://example.com/model-performance.png)

Gedetailleerde analyse van model performance:

- Model latency trends
- Token usage efficiency
- Confidence score distribution
- Prompt token usage
- Completion token usage
- Cost per request

**Implementatie:**

```yaml
# Prometheus query voor token usage
sum(rate(llm_token_usage_total{service="langgraph-api", type="prompt"}[5m])) by (model)
```

### 3.3 AI Cost Management

![AI Cost Management](https://example.com/ai-cost-management.png)

Inzicht in AI-gerelateerde kosten:

- Cost per model
- Cost trends over time
- Cost per service
- Cost per request type
- Cost optimization opportunities
- Budget vs. actual spending

**Implementatie:**

```yaml
# Prometheus query voor AI kosten
sum(rate(llm_request_cost_dollars_total[24h])) by (model, service)
```

## 4. Alerting & Notification

### 4.1 Alert Rules

Het dashboard bevat de volgende alert rules:

| Alert | Condition | Severity | Description |
|-------|-----------|----------|-------------|
| ServiceDown | service_health < 1 for 5m | Critical | Service is completely down |
| HighErrorRate | error_rate > 5% for 5m | Warning | Service has elevated error rate |
| SlowResponses | p95_latency > SLO for 10m | Warning | Service responses are slower than SLO |
| LowAIConfidence | avg_confidence_score < 0.7 for 15m | Warning | AI model confidence is below threshold |
| HighTokenUsage | token_usage > daily_budget * 0.8 | Warning | Token usage approaching daily budget |
| SecretRotationFailed | secret_rotation_status != "success" | Critical | Secret rotation job failed |
| CertificateExpiringSoon | cert_days_remaining < 14 | Warning | TLS certificate expiring soon |

### 4.2 Notification Channels

Alerts worden verstuurd via de volgende kanalen:

- Slack (#alerts, #security-alerts)
- Email (ops@sevensa.nl, security@sevensa.nl)
- PagerDuty (voor critical alerts)
- Microsoft Teams (algemene alerts)

## 5. Implementation Plan

### 5.1 Prometheus Configuration

Bestandslocatie: `/home/ubuntu/sevensa_implementation/config/monitoring/prometheus/config/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/node_rules.yml"
  - "rules/container_rules.yml"
  - "rules/service_rules.yml"
  - "rules/ai_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'services'
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        filters:
          - name: label
            values: ["prometheus.scrape=true"]
    relabel_configs:
      - source_labels: [__meta_docker_container_label_sevensa_service]
        target_label: service
      - source_labels: [__meta_docker_container_label_prometheus_port]
        target_label: __metrics_path__
        regex: (.+)
        replacement: /metrics
      - source_labels: [__address__, __meta_docker_container_label_prometheus_port]
        target_label: __address__
        regex: (.+);(.+)
        replacement: $1:$2
```

### 5.2 Grafana Dashboard JSON

Bestandslocatie: `/home/ubuntu/sevensa_implementation/config/monitoring/grafana/dashboards/ai_observability.json`

```json
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": 1,
  "links": [],
  "panels": [
    {
      "datasource": null,
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "id": 2,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "text": {},
        "textMode": "auto"
      },
      "pluginVersion": "7.5.5",
      "targets": [
        {
          "exemplar": true,
          "expr": "sum(rate(langgraph_request_duration_seconds_count{service=\"langgraph-api\"}[5m]))",
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "LangGraph Request Rate",
      "type": "stat"
    },
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": null,
      "fieldConfig": {
        "defaults": {},
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 4,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.5.5",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "exemplar": true,
          "expr": "histogram_quantile(0.95, sum(rate(langgraph_request_duration_seconds_bucket{service=\"langgraph-api\"}[5m])) by (le))",
          "interval": "",
          "legendFormat": "p95",
          "refId": "A"
        },
        {
          "exemplar": true,
          "expr": "histogram_quantile(0.50, sum(rate(langgraph_request_duration_seconds_bucket{service=\"langgraph-api\"}[5m])) by (le))",
          "hide": false,
          "interval": "",
          "legendFormat": "p50",
          "refId": "B"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "LangGraph Request Latency",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "s",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    }
  ],
  "refresh": "10s",
  "schemaVersion": 27,
  "style": "dark",
  "tags": [],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "AI Observability Dashboard",
  "uid": "ai-observability",
  "version": 1
}
```

### 5.3 OpenTelemetry Collector Configuration

Bestandslocatie: `/home/ubuntu/sevensa_implementation/config/monitoring/otel-collector/config.yaml`

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
  
  memory_limiter:
    check_interval: 1s
    limit_mib: 1000
    spike_limit_mib: 200

  resource:
    attributes:
      - key: service.namespace
        value: "sevensa"
        action: upsert

exporters:
  prometheus:
    endpoint: 0.0.0.0:8889
    namespace: otel
    send_timestamps: true
    metric_expiration: 180m
    resource_to_telemetry_conversion:
      enabled: true
  
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true
  
  loki:
    endpoint: http://loki:3100/loki/api/v1/push
    tenant_id: "sevensa"
    labels:
      resource:
        service.name: "service"
        service.namespace: "namespace"
        service.version: "version"
      attributes:
        level: "level"
        event.domain: "domain"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [jaeger]
    
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [prometheus]
    
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [loki]
```

## 6. Conclusie

Het DevOps & AI Observability Dashboard biedt een uitgebreid inzicht in de gezondheid, performance en kosten van de Sevensa platform services, met speciale aandacht voor AI-gerelateerde metrics. Door deze observability te implementeren, kunnen we:

1. **Proactief problemen detecteren** voordat ze impact hebben op gebruikers
2. **Performance bottlenecks identificeren** en optimaliseren
3. **AI-gerelateerde kosten monitoren** en optimaliseren
4. **Security en compliance** continu bewaken
5. **Data-driven beslissingen nemen** over infrastructuur en resource allocatie

De implementatie van dit dashboard is een essentiële stap in de evolutie naar een volledig observable platform dat voldoet aan enterprise-grade standaarden voor betrouwbaarheid, veiligheid en performance.
