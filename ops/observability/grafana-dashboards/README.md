# PSRA-LTSD Grafana Dashboards

This directory contains Grafana dashboard JSON files for monitoring the PSRA-LTSD Enterprise system.

## Available Dashboards

### 1. System Overview Dashboard (`system-overview-dashboard.json`)
**UID:** `psra-system-overview`

High-level system health and performance metrics:
- API status and uptime
- Request throughput and error rates
- p95 latency
- Business operations summary (24h)
- LLM cost overview

**Best for:** Quick system health checks, executive summaries

---

### 2. HTTP Metrics Dashboard (`http-metrics-dashboard.json`)
**UID:** `psra-http-metrics`

Detailed HTTP request metrics:
- Request rate by endpoint and method
- Active requests gauge
- Request latency percentiles (p95, p50)
- HTTP status code distribution
- Top endpoints by volume
- Endpoint performance table

**Best for:** API performance analysis, troubleshooting slow endpoints

---

### 3. Business Metrics Dashboard (`business-metrics-dashboard.json`)
**UID:** `psra-business-metrics`

PSRA-specific business operations:
- HS code lookups (rate and total)
- Origin assessments by verdict (qualified/not_qualified)
- LTSD operations by type and status
- Webhook delivery success/failure rates
- Database query performance
- Cache hit rates
- ETL job status

**Best for:** Business analytics, understanding usage patterns

---

### 4. LLM Usage Dashboard (`llm-usage-dashboard.json`)
**UID:** `psra-llm-metrics`

LLM API usage and cost tracking:
- Total LLM calls and cost (24h)
- Call rate by model
- Latency by model (p95, p50)
- Cost per hour by model
- Success rate tracking
- Cost distribution analysis
- Cumulative cost trends

**Best for:** Cost optimization, LLM performance monitoring

---

## Installation

### Option 1: Manual Import via Grafana UI

1. Log into Grafana
2. Navigate to **Dashboards > Import**
3. Click **Upload JSON file**
4. Select one of the dashboard files
5. Configure the Prometheus datasource
6. Click **Import**

### Option 2: Provisioning (Recommended)

Add this to your Grafana provisioning configuration:

```yaml
# /etc/grafana/provisioning/dashboards/psra-ltsd.yaml
apiVersion: 1

providers:
  - name: 'PSRA-LTSD Dashboards'
    orgId: 1
    folder: 'PSRA-LTSD'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /path/to/psra-ltsd-enterprise-v2/ops/observability/grafana-dashboards
```

### Option 3: Using Grafana API

```bash
# Set your Grafana credentials
GRAFANA_URL="http://localhost:3000"
GRAFANA_API_KEY="your-api-key"

# Import all dashboards
for dashboard in *.json; do
  curl -X POST \
    -H "Authorization: Bearer $GRAFANA_API_KEY" \
    -H "Content-Type: application/json" \
    -d @"$dashboard" \
    "$GRAFANA_URL/api/dashboards/db"
done
```

---

## Configuration

### Datasource Configuration

All dashboards expect a Prometheus datasource. Update the `PROMETHEUS_UID` placeholder in the JSON files:

```bash
# Replace PROMETHEUS_UID with your actual Prometheus datasource UID
sed -i 's/PROMETHEUS_UID/your-datasource-uid/g' *.json
```

Or set it during import in the Grafana UI.

### Dashboard Variables (Optional)

You can add template variables for filtering:

- **Environment:** Filter by environment (dev, staging, prod)
- **Instance:** Filter by specific API instance
- **Time Range:** Adjust default time ranges

---

## Metrics Reference

### HTTP Metrics
- `psra_http_requests_total` - Total HTTP requests (counter)
- `psra_http_request_duration_seconds` - Request latency (histogram)
- `psra_active_requests` - Active concurrent requests (gauge)

### Business Metrics
- `psra_hs_code_lookups_total` - HS code lookup operations (counter)
- `psra_origin_assessments_total` - Origin assessment operations (counter)
- `psra_ltsd_operations_total` - LTSD operations (counter)
- `psra_webhook_deliveries_total` - Webhook deliveries (counter)
- `psra_etl_last_success_timestamp` - Last successful ETL run (gauge)

### LLM Metrics
- `psra_llm_calls_total` - Total LLM API calls (counter)
- `psra_llm_cost_dollars_total` - Total LLM cost in USD (counter)
- `psra_llm_latency_seconds` - LLM call latency (histogram)

### Cache & Database Metrics
- `psra_cache_hits_total` - Cache hit count (counter)
- `psra_cache_misses_total` - Cache miss count (counter)
- `psra_database_query_duration_seconds` - Database query duration (histogram)

---

## Alerting

Consider setting up alerts for:

1. **High Error Rate:** `rate(psra_http_requests_total{status=~"5.."}[5m]) > 10`
2. **High Latency:** `histogram_quantile(0.95, rate(psra_http_request_duration_seconds_bucket[5m])) > 5`
3. **LLM Cost Spike:** `increase(psra_llm_cost_dollars_total[1h]) > 50`
4. **ETL Failures:** `time() - psra_etl_last_success_timestamp > 7200`
5. **Low Cache Hit Rate:** `rate(psra_cache_hits_total[5m]) / (rate(psra_cache_hits_total[5m]) + rate(psra_cache_misses_total[5m])) < 0.5`

---

## Troubleshooting

### No Data in Dashboards

1. Verify Prometheus is scraping the `/metrics` endpoint:
   ```bash
   curl http://localhost:8000/metrics
   ```

2. Check Prometheus targets:
   ```bash
   # Navigate to Prometheus UI
   http://localhost:9090/targets
   ```

3. Verify datasource configuration in Grafana

### Dashboard Shows "No Data"

1. Check time range settings
2. Verify metric names match your Prometheus metrics
3. Check that the service has processed requests (some metrics only appear after activity)

### Slow Dashboard Performance

1. Reduce the time range
2. Increase scrape intervals
3. Add time-based aggregation to queries
4. Use recording rules in Prometheus for complex queries

---

## Customization

### Adding Custom Panels

1. Click **Add Panel** in any dashboard
2. Select visualization type
3. Configure PromQL query
4. Save dashboard

### Modifying Queries

All panels use PromQL queries. Examples:

```promql
# Request rate by endpoint
rate(psra_http_requests_total{job="psra-ltsd-api"}[5m])

# p95 latency
histogram_quantile(0.95, rate(psra_http_request_duration_seconds_bucket[5m]))

# Cache hit rate
sum(rate(psra_cache_hits_total[5m])) / (sum(rate(psra_cache_hits_total[5m])) + sum(rate(psra_cache_misses_total[5m])))
```

---

## Support

For issues or questions:
1. Check the main PSRA-LTSD documentation
2. Review Grafana and Prometheus documentation
3. Check application logs for metric collection issues

---

## Version History

- **v1.0.0** - Initial dashboard collection
  - System Overview Dashboard
  - HTTP Metrics Dashboard
  - Business Metrics Dashboard
  - LLM Usage Dashboard
