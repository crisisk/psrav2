# Centralized Logging & Monitoring Implementatieplan

## Overzicht

Dit document beschrijft de implementatie van een gecentraliseerd logging en monitoring systeem voor de multi-tenant Docker-omgeving op VPS 147.93.57.40. Het doel is om volledige zichtbaarheid te krijgen in de gezondheid, prestaties en logs van alle services, waardoor proactief beheer en snelle incident response mogelijk wordt.

## Huidige Situatie

De huidige architectuur heeft de volgende beperkingen op het gebied van logging en monitoring:

1. Gefragmenteerde logging over verschillende services
2. Geen gecentraliseerde monitoring van systeemmetrics
3. Beperkte zichtbaarheid in de gezondheid van services
4. Geen geautomatiseerde alerting
5. Geen historische data voor trend- en capaciteitsanalyse

## Implementatiestrategie

We implementeren een gecentraliseerd logging en monitoring systeem met de volgende componenten:

1. **Prometheus**: Voor het verzamelen en opslaan van metrics
2. **Grafana**: Voor visualisatie en dashboards
3. **Loki**: Voor gecentraliseerde logging
4. **Promtail**: Voor het verzamelen van logs
5. **AlertManager**: Voor alerting en notificaties
6. **Node Exporter**: Voor host metrics
7. **cAdvisor**: Voor container metrics

## Implementatiefasen

### Fase 1: Monitoring Infrastructure Setup (Week 1-2)

1. Implementeer Prometheus server
2. Implementeer Grafana voor dashboards
3. Configureer data sources in Grafana
4. Implementeer AlertManager voor alerting

### Fase 2: Log Aggregation Setup (Week 3-4)

1. Implementeer Loki voor log aggregatie
2. Implementeer Promtail voor log collection
3. Configureer log parsing en labeling
4. Integreer Loki met Grafana

### Fase 3: Service Instrumentation (Week 5-8)

1. Instrumenteer RentGuy met Prometheus exporters
2. Instrumenteer PSRA-LTSD met Prometheus exporters
3. Instrumenteer WPCS met Prometheus exporters
4. Instrumenteer AI/Orchestration services met Prometheus exporters

### Fase 4: Dashboard en Alerting (Week 9-12)

1. Creëer service-specifieke dashboards
2. Configureer alerting rules
3. Implementeer notificatiekanalen (email, Slack, etc.)
4. Documenteer monitoring en alerting procedures

## Technische Specificaties

### Prometheus Configuratie

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'traefik'
    static_configs:
      - targets: ['traefik:8082']

  - job_name: 'rentguy'
    static_configs:
      - targets: ['rentguy-api:3000']

  - job_name: 'psra'
    static_configs:
      - targets: ['psra-api:3000']

  - job_name: 'wpcs'
    static_configs:
      - targets: ['wpcs-api:3000']

  - job_name: 'ai-orchestrator'
    static_configs:
      - targets: ['ai-orchestrator:3000']
```

### Loki Configuratie

```yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

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
  max_transfer_retries: 0

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
    active_index_directory: /data/loki/index
    cache_location: /data/loki/index_cache
    cache_ttl: 24h
    shared_store: filesystem
  filesystem:
    directory: /data/loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s

compactor:
  working_directory: /data/loki/compactor
  shared_store: filesystem
```

### Promtail Configuratie

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

  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
```

### AlertManager Configuratie

```yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.sevensa.nl:587'
  smtp_from: 'alertmanager@sevensa.nl'
  smtp_auth_username: 'alertmanager@sevensa.nl'
  smtp_auth_password: '${SMTP_PASSWORD}'
  smtp_require_tls: true

route:
  group_by: ['alertname', 'job']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'email'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true

receivers:
  - name: 'email'
    email_configs:
      - to: 'alerts@sevensa.nl'
        send_resolved: true
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
        send_resolved: true

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

## Risico's en Mitigatie

| Risico | Impact | Waarschijnlijkheid | Mitigatie |
|--------|--------|-------------------|-----------|
| Overmatige data opslag | Medium | Hoog | Configureer retentiebeleid, log rotatie |
| Vals-positieve alerts | Medium | Medium | Zorgvuldige tuning van alerting rules |
| Performance impact | Medium | Laag | Optimaliseer scrape intervals, sampling |
| Onvolledige dekking | Hoog | Medium | Uitgebreide service instrumentatie |

## Succesfactoren

- Alle services zijn gemonitord met Prometheus
- Alle logs worden gecentraliseerd in Loki
- Dashboards geven inzicht in de gezondheid en prestaties van services
- Alerts worden gegenereerd voor kritieke problemen
- Historische data is beschikbaar voor trend- en capaciteitsanalyse

## Volgende Stappen

1. Implementeer Prometheus, Grafana, AlertManager
2. Implementeer Loki, Promtail
3. Instrumenteer services met Prometheus exporters
4. Creëer dashboards en alerting rules
