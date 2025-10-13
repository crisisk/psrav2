#!/bin/bash

# PSRA-LTSD Alertmanager Test Script
# Tests alert generation, routing, and Slack notifications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROMETHEUS_URL="http://localhost:9090"
ALERTMANAGER_URL="http://localhost:9093"
PUSHGATEWAY_URL="http://localhost:9091"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_section() {
    echo ""
    echo "=============================================="
    print_status "$BLUE" "$1"
    echo "=============================================="
}

# Function to check if service is running
check_service() {
    local service_name=$1
    local service_url=$2

    print_status "$YELLOW" "Checking $service_name..."

    if curl -s -f "$service_url" > /dev/null 2>&1; then
        print_status "$GREEN" "✓ $service_name is running"
        return 0
    else
        print_status "$RED" "✗ $service_name is not responding"
        return 1
    fi
}

# Function to send test metric to Pushgateway
send_test_metric() {
    local metric_name=$1
    local metric_value=$2
    local job_name=$3
    local labels=$4

    print_status "$YELLOW" "Sending test metric: $metric_name = $metric_value"

    cat <<EOF | curl --data-binary @- "$PUSHGATEWAY_URL/metrics/job/$job_name$labels"
# TYPE $metric_name gauge
$metric_name $metric_value
EOF

    if [ $? -eq 0 ]; then
        print_status "$GREEN" "✓ Metric sent successfully"
    else
        print_status "$RED" "✗ Failed to send metric"
        return 1
    fi
}

# Function to trigger error budget alert
trigger_error_budget_alert() {
    print_section "TEST 1: Error Budget Burn Alert"

    # Send high error rate metric
    send_test_metric "psra_http_requests_total" "1000" "test-alert" "/status/5xx"
    send_test_metric "psra_http_requests_total" "10000" "test-alert" "/status/2xx"

    print_status "$BLUE" "Error rate: 10% (threshold: 5%)"
    print_status "$BLUE" "Wait 5 minutes for alert to fire..."
}

# Function to trigger ETL staleness alert
trigger_etl_staleness_alert() {
    print_section "TEST 2: ETL Staleness Alert"

    # Send old timestamp (2 hours ago)
    local old_timestamp=$(($(date +%s) - 7200))
    send_test_metric "psra_etl_last_success_timestamp" "$old_timestamp" "test-alert"

    print_status "$BLUE" "Last ETL run: 2 hours ago (threshold: 2 hours)"
    print_status "$BLUE" "Wait 10 minutes for alert to fire..."
}

# Function to trigger webhook failure alert
trigger_webhook_failure_alert() {
    print_section "TEST 3: Webhook Failure Rate Alert"

    # Send high webhook failure rate
    send_test_metric "psra_webhook_deliveries_total" "100" "test-alert" "/status/failed"
    send_test_metric "psra_webhook_deliveries_total" "1000" "test-alert" "/status/success"

    print_status "$BLUE" "Webhook failure rate: 10% (threshold: 5%)"
    print_status "$BLUE" "Wait 10 minutes for alert to fire..."
}

# Function to trigger high latency warning
trigger_high_latency_alert() {
    print_section "TEST 4: High Latency Warning"

    # Send high latency metrics
    for i in {1..100}; do
        send_test_metric "psra_http_request_duration_seconds" "0.5" "test-alert" "/endpoint/api/v1/partner"
    done

    print_status "$BLUE" "p95 latency: 500ms (threshold: 200ms)"
    print_status "$BLUE" "Wait 10 minutes for alert to fire..."
}

# Function to trigger LLM cost spike
trigger_llm_cost_spike() {
    print_section "TEST 5: LLM Cost Spike Warning"

    # Send high cost metric
    send_test_metric "psra_llm_cost_dollars_total" "500" "test-alert"

    print_status "$BLUE" "LLM cost rate: $500/hour (threshold: $100/hour)"
    print_status "$BLUE" "Wait 15 minutes for alert to fire..."
}

# Function to trigger cache hit rate low
trigger_cache_hit_rate_alert() {
    print_section "TEST 6: Cache Hit Rate Low Warning"

    # Send low cache hit rate
    send_test_metric "psra_cache_hits_total" "600" "test-alert"
    send_test_metric "psra_cache_misses_total" "400" "test-alert"

    print_status "$BLUE" "Cache hit rate: 60% (threshold: 70%)"
    print_status "$BLUE" "Wait 15 minutes for alert to fire..."
}

# Function to check current alerts
check_current_alerts() {
    print_section "Current Active Alerts"

    local alerts=$(curl -s "$PROMETHEUS_URL/api/v1/alerts" | jq -r '.data.alerts[] | "[\(.state)] \(.labels.alertname) - \(.annotations.summary)"' 2>/dev/null)

    if [ -z "$alerts" ]; then
        print_status "$YELLOW" "No active alerts"
    else
        echo "$alerts"
    fi
}

# Function to check alertmanager status
check_alertmanager_status() {
    print_section "Alertmanager Status"

    # Get alertmanager status
    local status=$(curl -s "$ALERTMANAGER_URL/api/v2/status" | jq -r '.cluster.status' 2>/dev/null)
    print_status "$GREEN" "Cluster Status: $status"

    # Get active alerts in alertmanager
    local alert_count=$(curl -s "$ALERTMANAGER_URL/api/v2/alerts" | jq '. | length' 2>/dev/null)
    print_status "$GREEN" "Active alerts in Alertmanager: $alert_count"

    # Show silences
    local silence_count=$(curl -s "$ALERTMANAGER_URL/api/v2/silences" | jq '. | length' 2>/dev/null)
    print_status "$GREEN" "Active silences: $silence_count"
}

# Function to verify alert routing
verify_alert_routing() {
    print_section "Alert Routing Configuration"

    print_status "$BLUE" "Checking routing tree..."
    local routing=$(curl -s "$ALERTMANAGER_URL/api/v2/status" | jq -r '.config.route' 2>/dev/null)

    if [ ! -z "$routing" ]; then
        print_status "$GREEN" "✓ Routing configuration loaded"
        echo "$routing" | jq .
    else
        print_status "$RED" "✗ Failed to load routing configuration"
    fi
}

# Function to test Slack notification manually
test_slack_notification() {
    print_section "Testing Slack Notification"

    print_status "$YELLOW" "Sending test alert to Alertmanager..."

    # Create a test alert
    local alert_json=$(cat <<EOF
[
  {
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning",
      "instance": "test-instance",
      "service": "test-service"
    },
    "annotations": {
      "summary": "This is a test alert",
      "description": "Testing alert routing and Slack notification",
      "runbook_url": "https://docs.sevensa.nl/runbooks/test"
    },
    "startsAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "endsAt": "$(date -u -d '+5 minutes' +%Y-%m-%dT%H:%M:%S.%3NZ)"
  }
]
EOF
)

    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$alert_json" \
        "$ALERTMANAGER_URL/api/v2/alerts")

    if [ $? -eq 0 ]; then
        print_status "$GREEN" "✓ Test alert sent successfully"
        print_status "$BLUE" "Check #psra-warnings Slack channel for notification"
    else
        print_status "$RED" "✗ Failed to send test alert"
        echo "$response"
        return 1
    fi
}

# Function to test critical alert to different channel
test_critical_alert() {
    print_section "Testing Critical Alert (Separate Channel)"

    print_status "$YELLOW" "Sending critical test alert..."

    local alert_json=$(cat <<EOF
[
  {
    "labels": {
      "alertname": "TestCriticalAlert",
      "severity": "critical",
      "instance": "test-instance",
      "service": "test-service"
    },
    "annotations": {
      "summary": "This is a CRITICAL test alert",
      "description": "Testing critical alert routing to #psra-critical channel",
      "runbook_url": "https://docs.sevensa.nl/runbooks/test-critical"
    },
    "startsAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "endsAt": "$(date -u -d '+5 minutes' +%Y-%m-%dT%H:%M:%S.%3NZ)"
  }
]
EOF
)

    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$alert_json" \
        "$ALERTMANAGER_URL/api/v2/alerts")

    if [ $? -eq 0 ]; then
        print_status "$GREEN" "✓ Critical test alert sent successfully"
        print_status "$BLUE" "Check #psra-critical Slack channel for notification"
    else
        print_status "$RED" "✗ Failed to send critical test alert"
        return 1
    fi
}

# Function to validate alert configuration
validate_prometheus_config() {
    print_section "Validating Prometheus Configuration"

    print_status "$YELLOW" "Checking Prometheus config..."

    # Check if prometheus is running
    if ! check_service "Prometheus" "$PROMETHEUS_URL/-/healthy"; then
        return 1
    fi

    # Check loaded rules
    local rules_count=$(curl -s "$PROMETHEUS_URL/api/v1/rules" | jq '.data.groups[].rules | length' | awk '{s+=$1} END {print s}')
    print_status "$GREEN" "✓ Loaded alert rules: $rules_count"

    # List all alert rules
    print_status "$BLUE" "Alert Rules:"
    curl -s "$PROMETHEUS_URL/api/v1/rules" | jq -r '.data.groups[].rules[] | select(.type=="alerting") | "  - \(.name) [\(.labels.severity)]"'
}

# Function to validate alertmanager config
validate_alertmanager_config() {
    print_section "Validating Alertmanager Configuration"

    print_status "$YELLOW" "Checking Alertmanager config..."

    if ! check_service "Alertmanager" "$ALERTMANAGER_URL/-/healthy"; then
        return 1
    fi

    # Check receivers
    local receivers=$(curl -s "$ALERTMANAGER_URL/api/v2/status" | jq -r '.config.receivers[].name')
    print_status "$GREEN" "✓ Configured receivers:"
    echo "$receivers" | while read receiver; do
        print_status "$BLUE" "  - $receiver"
    done
}

# Function to monitor alerts in real-time
monitor_alerts() {
    print_section "Monitoring Alerts (Press Ctrl+C to stop)"

    while true; do
        clear
        echo "=== Active Alerts at $(date) ==="
        echo ""

        # Get alerts from Prometheus
        curl -s "$PROMETHEUS_URL/api/v1/alerts" | jq -r '.data.alerts[] | "\(.state) | \(.labels.severity) | \(.labels.alertname) | \(.annotations.summary)"' | column -t -s '|'

        echo ""
        echo "=== Alertmanager Alerts ==="
        curl -s "$ALERTMANAGER_URL/api/v2/alerts" | jq -r '.[] | "\(.status.state) | \(.labels.severity) | \(.labels.alertname) | \(.startsAt)"' | column -t -s '|'

        sleep 10
    done
}

# Function to cleanup test metrics
cleanup_test_metrics() {
    print_section "Cleaning Up Test Metrics"

    print_status "$YELLOW" "Removing test metrics from Pushgateway..."

    curl -X DELETE "$PUSHGATEWAY_URL/metrics/job/test-alert"

    if [ $? -eq 0 ]; then
        print_status "$GREEN" "✓ Test metrics cleaned up"
    else
        print_status "$RED" "✗ Failed to cleanup test metrics"
    fi
}

# Main menu
show_menu() {
    print_section "PSRA-LTSD Alert Testing Menu"
    echo "1) Check all services status"
    echo "2) Validate configurations"
    echo "3) Test Slack notification (Warning)"
    echo "4) Test Slack notification (Critical)"
    echo "5) Trigger test alerts (requires wait time)"
    echo "6) Check current alerts"
    echo "7) Monitor alerts in real-time"
    echo "8) Cleanup test metrics"
    echo "9) Run full test suite"
    echo "0) Exit"
    echo ""
    read -p "Select option: " option

    case $option in
        1)
            check_service "Prometheus" "$PROMETHEUS_URL/-/healthy"
            check_service "Alertmanager" "$ALERTMANAGER_URL/-/healthy"
            check_service "Pushgateway" "$PUSHGATEWAY_URL/-/healthy"
            check_alertmanager_status
            ;;
        2)
            validate_prometheus_config
            validate_alertmanager_config
            verify_alert_routing
            ;;
        3)
            test_slack_notification
            ;;
        4)
            test_critical_alert
            ;;
        5)
            print_status "$YELLOW" "Select alert to trigger:"
            echo "  a) Error Budget Burn"
            echo "  b) ETL Staleness"
            echo "  c) Webhook Failure"
            echo "  d) High Latency"
            echo "  e) LLM Cost Spike"
            echo "  f) Cache Hit Rate Low"
            read -p "Select: " alert_type

            case $alert_type in
                a) trigger_error_budget_alert ;;
                b) trigger_etl_staleness_alert ;;
                c) trigger_webhook_failure_alert ;;
                d) trigger_high_latency_alert ;;
                e) trigger_llm_cost_spike ;;
                f) trigger_cache_hit_rate_alert ;;
                *) print_status "$RED" "Invalid option" ;;
            esac
            ;;
        6)
            check_current_alerts
            check_alertmanager_status
            ;;
        7)
            monitor_alerts
            ;;
        8)
            cleanup_test_metrics
            ;;
        9)
            print_status "$YELLOW" "Running full test suite..."
            validate_prometheus_config
            validate_alertmanager_config
            test_slack_notification
            sleep 2
            test_critical_alert
            ;;
        0)
            print_status "$GREEN" "Exiting..."
            exit 0
            ;;
        *)
            print_status "$RED" "Invalid option"
            ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_status "$RED" "Error: jq is required but not installed."
    print_status "$YELLOW" "Install with: apt-get install jq (Debian/Ubuntu) or brew install jq (macOS)"
    exit 1
fi

# Start menu
show_menu
