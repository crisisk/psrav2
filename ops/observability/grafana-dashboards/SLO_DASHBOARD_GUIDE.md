# PSRA-LTSD SLO Dashboard Guide

## Overview

The SLO (Service Level Objective) Dashboard provides comprehensive monitoring and tracking of key performance indicators (KPIs) and service level objectives for the PSRA-LTSD Enterprise platform.

## Dashboard Location

**File**: `/home/vncuser/psra-ltsd-enterprise-v2/ops/observability/grafana-dashboards/slo-dashboard.json`

**Grafana UID**: `psra-slo-dashboard`

**Dashboard URL**: `http://<grafana-host>/d/psra-slo-dashboard/psra-ltsd-slo-dashboard`

## Key Features

### 1. SLO Overview - Key Metrics

This section provides at-a-glance visibility into the four primary SLO targets:

#### p95 Latency (Target: <200ms)
- **Metric**: `histogram_quantile(0.95, psra_http_request_duration_seconds_bucket)`
- **SLO**: 95th percentile latency should remain below 200 milliseconds
- **Visualization**: Gauge with green (<150ms), yellow (150-200ms), and red (>200ms) thresholds
- **Alert**: HighP95Latency fires when p95 > 200ms for 10 minutes

#### Webhook Success Rate (Target: ≥99%)
- **Metric**: `psra_webhook_deliveries_total{status="success"} / psra_webhook_deliveries_total`
- **SLO**: 99% or higher webhook delivery success rate
- **Visualization**: Gauge showing percentage with red (<95%), yellow (95-99%), and green (≥99%) thresholds
- **Alert**: WebhookFailureRateHigh fires when failure rate > 5% for 10 minutes

#### ETL Freshness (Target: <1 hour)
- **Metric**: `time() - psra_etl_last_success_timestamp`
- **SLO**: ETL data should be refreshed within 1 hour
- **Visualization**: Gauge showing seconds since last successful ETL run
- **Alert**: ETLStaleness fires when data is >2 hours stale for 10 minutes

#### LLM Cost per Hour
- **Metric**: `rate(psra_llm_cost_dollars_total[1h]) * 3600`
- **SLO**: Monitor and control LLM API costs
- **Visualization**: Cost display with green (<$75), yellow ($75-$100), and red (>$100) thresholds
- **Alert**: LLMCostSpike fires when cost > $100/hour for 15 minutes

### 2. Error Budget Tracking

Error budgets are based on the **99.9% uptime SLO**, which allows for **43.2 minutes of downtime per month** (or 0.1% error rate).

#### Error Budget Remaining (Monthly)
- Shows the percentage of error budget still available
- Calculated over a 30-day rolling window
- Formula: `(1 - (error_rate) - 0.999) / (1 - 0.999) * 100`
- Red (<25%), Yellow (25-50%), Green (>50%)

#### Error Budget Burn Rate
- Displays how fast the error budget is being consumed
- Three time windows: 1h, 6h, and 24h burn rates
- **Burn Rate = 1.0** means budget is consumed at exactly the allowed rate
- **Burn Rate > 1.0** means budget is being consumed faster than sustainable
- **Burn Rate < 1.0** means consumption is below the allowed rate
- Threshold line at 1.0 (yellow) and 2.0 (red)

#### Budget Time Remaining
- Estimates time until error budget exhaustion at current burn rate
- Red (<24 hours), Yellow (24h-7d), Green (>7 days)
- Shows "EXHAUSTED" when budget is fully consumed

#### Downtime Budget Consumed
- Bar gauge showing actual downtime consumed vs. 43.2 minute monthly budget
- Visual representation of error budget consumption

#### Budget Consumed Trend
- Time series showing error budget consumption over time
- Helps identify patterns and trends in service reliability

### 3. Service Level Indicators (SLI)

SLIs are the actual measurements used to calculate whether SLOs are being met.

#### Request Success Rate
- Shows percentage of non-5xx responses
- Two time windows: 5-minute and 1-hour rates
- Target: ≥99.9% for SLO compliance
- Visual threshold lines at 99% and 99.9%

#### Cache Hit Rate
- Tracks cache effectiveness across all cache types
- Formula: `cache_hits / (cache_hits + cache_misses) * 100`
- Overall rate plus breakdown by cache type
- Target: ≥85% (warning at <70%)
- Alert: CacheHitRateLow fires when rate < 70% for 15 minutes

#### Database Query Performance
- Shows p50, p95, and p99 query latencies by query type
- Helps identify slow database operations
- Threshold line at 0.5s (yellow) and 1.0s (red)
- Alert: DatabaseQuerySlow fires when p95 > 1.0s for 10 minutes

#### Endpoint Success Rates
- Table view showing success rate and request rate per endpoint
- Sortable columns for identifying problematic endpoints
- Color-coded by success rate thresholds

### 4. Detailed SLO Metrics

#### Latency Percentiles (p50/p90/p95/p99)
- Comprehensive latency distribution over time
- All four percentiles on one chart for comparison
- 200ms threshold line for p95 SLO
- Helps identify latency patterns and outliers

#### Webhook Delivery Rate
- Stacked area chart showing successful vs. failed webhook deliveries
- Green for success, red for failures
- Shows both volume and failure patterns

#### ETL Pipeline Freshness
- Time series showing seconds since last successful ETL run
- Threshold lines at 50 minutes (yellow) and 60 minutes (red)
- Point markers show individual ETL completions

#### LLM Cost Breakdown
- Stacked area chart showing costs by LLM model
- Total cost per hour plus per-model breakdown
- Helps identify cost drivers and optimization opportunities

### 5. Alerting Status & Thresholds

#### Active SLO Alerts
- Real-time table of all SLO-related alerts
- Shows alert name, severity, and current state (OK/FIRING)
- Includes alerts for:
  - ErrorBudgetBurnCritical
  - ETLStaleness
  - WebhookFailureRateHigh
  - HighP95Latency
  - LLMCostSpike
  - CacheHitRateLow
  - DatabaseQuerySlow

#### Alert Threshold Proximity
- Bar gauge showing how close each metric is to its alerting threshold
- Expressed as percentage of threshold
- Green (<70%), Yellow (70-90%), Red (>90%)
- Helps identify metrics approaching alert conditions before they fire

## Template Variables

The dashboard includes three template variables for customization:

### Data Source
- **Variable**: `$datasource`
- **Type**: Datasource selector
- **Default**: Prometheus
- **Usage**: Select the Prometheus data source to query

### SLO Target
- **Variable**: `$slo_target`
- **Type**: Custom dropdown
- **Options**: 99.99%, 99.9%, 99.5%, 99%
- **Default**: 99.9%
- **Usage**: Adjust SLO target percentage for error budget calculations

### Budget Window
- **Variable**: `$budget_window`
- **Type**: Custom dropdown
- **Options**: 7d, 14d, 30d
- **Default**: 30d
- **Usage**: Set the time window for error budget calculations

## Metrics Reference

### Required Prometheus Metrics

The dashboard expects the following metrics to be exposed by the application:

#### HTTP Request Metrics
```promql
# HTTP request counter with status, method, endpoint labels
psra_http_requests_total{status, method, endpoint}

# HTTP request duration histogram
psra_http_request_duration_seconds_bucket{le, method, endpoint}
psra_http_request_duration_seconds_sum{method, endpoint}
psra_http_request_duration_seconds_count{method, endpoint}

# Active requests gauge
psra_active_requests
```

#### Webhook Metrics
```promql
# Webhook delivery counter with status label
psra_webhook_deliveries_total{status="success"|"failed"}
```

#### ETL Metrics
```promql
# Unix timestamp of last successful ETL run
psra_etl_last_success_timestamp
```

#### LLM Cost Metrics
```promql
# Cumulative LLM costs counter
psra_llm_cost_dollars_total{model}
```

#### Cache Metrics
```promql
# Cache hit counter by cache type
psra_cache_hits_total{cache_type}

# Cache miss counter by cache type
psra_cache_misses_total{cache_type}
```

#### Database Query Metrics
```promql
# Database query duration histogram
psra_database_query_duration_seconds_bucket{le, query_type}
psra_database_query_duration_seconds_sum{query_type}
psra_database_query_duration_seconds_count{query_type}
```

## Installation

### Import Dashboard to Grafana

#### Method 1: Grafana UI
1. Log into Grafana
2. Navigate to **Dashboards** → **Import**
3. Click **Upload JSON file**
4. Select `/home/vncuser/psra-ltsd-enterprise-v2/ops/observability/grafana-dashboards/slo-dashboard.json`
5. Select your Prometheus data source
6. Click **Import**

#### Method 2: Grafana Provisioning
1. Copy the dashboard JSON to your Grafana provisioning directory:
   ```bash
   cp /home/vncuser/psra-ltsd-enterprise-v2/ops/observability/grafana-dashboards/slo-dashboard.json \
      /etc/grafana/provisioning/dashboards/
   ```

2. Create or update the provisioning configuration:
   ```yaml
   # /etc/grafana/provisioning/dashboards/psra.yaml
   apiVersion: 1
   providers:
     - name: 'PSRA-LTSD'
       orgId: 1
       folder: 'PSRA-LTSD'
       type: file
       disableDeletion: false
       updateIntervalSeconds: 10
       allowUiUpdates: true
       options:
         path: /etc/grafana/provisioning/dashboards
   ```

3. Restart Grafana:
   ```bash
   systemctl restart grafana-server
   ```

#### Method 3: Grafana API
```bash
# Set Grafana credentials
GRAFANA_URL="http://localhost:3000"
GRAFANA_API_KEY="your-api-key"

# Import dashboard via API
curl -X POST "${GRAFANA_URL}/api/dashboards/db" \
  -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @/home/vncuser/psra-ltsd-enterprise-v2/ops/observability/grafana-dashboards/slo-dashboard.json
```

## Alert Integration

The dashboard displays alerts configured in `/home/vncuser/psra-ltsd-enterprise-v2/ops/observability/prometheus_alerts.yml`:

### Critical Alerts
- **ErrorBudgetBurnCritical**: Error rate > 5% for 5 minutes
- **ETLStaleness**: ETL stale for >2 hours for 10 minutes
- **WebhookFailureRateHigh**: Webhook failure rate > 5% for 10 minutes

### Warning Alerts
- **HighP95Latency**: p95 latency > 200ms for 10 minutes
- **LLMCostSpike**: LLM costs > $100/hour for 15 minutes
- **CacheHitRateLow**: Cache hit rate < 70% for 15 minutes
- **DatabaseQuerySlow**: p95 query time > 1.0s for 10 minutes

Each alert includes:
- Severity level (critical/warning)
- Description with actual metric value
- Runbook URL for troubleshooting guidance

## Best Practices

### Monitoring SLOs

1. **Daily Review**: Check the dashboard daily for SLO compliance
2. **Error Budget Management**: Monitor burn rate to avoid budget exhaustion
3. **Proactive Alerts**: Act on warning alerts before they become critical
4. **Trend Analysis**: Use time series panels to identify patterns
5. **Root Cause Analysis**: Use endpoint-level breakdowns to identify issues

### Error Budget Policies

#### When Error Budget is Healthy (>50% remaining)
- Continue with normal feature releases
- Maintain standard deployment cadence
- Focus on feature development

#### When Error Budget is Warning (25-50% remaining)
- Increase monitoring and alerting
- Review recent changes for potential issues
- Consider slowing deployment cadence
- Focus on stability improvements

#### When Error Budget is Critical (<25% remaining)
- Halt non-critical releases
- Focus exclusively on reliability improvements
- Conduct incident retrospectives
- Implement additional safeguards

#### When Error Budget is Exhausted (0% remaining)
- Implement release freeze for new features
- Emergency response mode
- All hands on deck for stability
- Executive escalation

### Dashboard Refresh Settings

- **Default**: 30 seconds auto-refresh
- **Recommended**: 10-30 seconds for operations center displays
- **Adjust**: Use time picker for historical analysis
- **Time Range**: Default 6 hours, adjustable from 5 minutes to 90 days

## Troubleshooting

### No Data Displayed

1. **Check Prometheus Connection**:
   ```bash
   # Test Prometheus connectivity
   curl http://prometheus:9090/-/healthy
   ```

2. **Verify Metrics are Being Scraped**:
   ```bash
   # Check if metrics exist
   curl http://prometheus:9090/api/v1/query?query=psra_http_requests_total
   ```

3. **Check Grafana Data Source Configuration**:
   - Navigate to **Configuration** → **Data Sources**
   - Verify Prometheus URL is correct
   - Test the connection

4. **Update Data Source UID**:
   - The dashboard uses `PROMETHEUS_UID` as a placeholder
   - Replace with your actual Prometheus data source UID
   - Or select the correct data source from the variable dropdown

### Incorrect Calculations

1. **Verify Metric Labels**: Ensure your metrics have the expected labels (status, method, endpoint, etc.)
2. **Check Time Ranges**: Some calculations use specific time windows (5m, 1h, 30d)
3. **Review Prometheus Rules**: Ensure recording rules are evaluating correctly

### Alerts Not Showing

1. **Check AlertManager Configuration**:
   ```bash
   # Verify AlertManager is running
   curl http://alertmanager:9093/-/healthy
   ```

2. **Verify Alert Rules are Loaded**:
   ```bash
   # Check Prometheus rules
   curl http://prometheus:9090/api/v1/rules
   ```

3. **Review Alert Annotations**: Ensure annotations are configured in the dashboard

## Customization

### Adding New SLO Metrics

1. **Define the Metric**: Determine what you want to measure
2. **Set SLO Target**: Define acceptable threshold
3. **Create Prometheus Alert**: Add alert rule to `prometheus_alerts.yml`
4. **Add Dashboard Panel**: Create new panel in appropriate dashboard section
5. **Update Documentation**: Document the new SLO in this guide

### Modifying Thresholds

Edit the dashboard JSON directly or through Grafana UI:

```json
"thresholds": {
  "mode": "absolute",
  "steps": [
    {"color": "green", "value": null},
    {"color": "yellow", "value": 150},
    {"color": "red", "value": 200}
  ]
}
```

### Changing Time Windows

Adjust PromQL query time ranges:

```promql
# Change from 5m to 10m
rate(psra_http_requests_total[10m])

# Change from 1h to 2h
rate(psra_llm_cost_dollars_total[2h]) * 7200
```

## Related Documentation

- [Prometheus Configuration](/home/vncuser/psra-ltsd-enterprise-v2/ops/observability/prometheus.yml)
- [Alert Rules](/home/vncuser/psra-ltsd-enterprise-v2/ops/observability/prometheus_alerts.yml)
- [AlertManager Configuration](/home/vncuser/psra-ltsd-enterprise-v2/ops/observability/alertmanager.yml)
- [HTTP Metrics Dashboard](/home/vncuser/psra-ltsd-enterprise-v2/ops/observability/grafana-dashboards/http-metrics-dashboard.json)

## Support

For issues or questions regarding the SLO dashboard:

1. Check Prometheus metrics are being collected
2. Verify Grafana data source configuration
3. Review Prometheus alert rules
4. Consult runbook URLs in alert annotations
5. Contact the platform engineering team

## Changelog

### Version 1.0 (2025-10-13)
- Initial SLO dashboard creation
- Key SLO metrics: p95 latency, webhook success rate, ETL freshness, LLM costs
- Error budget tracking with burn rate monitoring
- Service Level Indicators for cache, database, and request success
- Alert status and threshold proximity visualizations
- Template variables for customization
