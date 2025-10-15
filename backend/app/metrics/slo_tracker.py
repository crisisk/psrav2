import time
from collections import deque
from prometheus_client import Gauge, CollectorRegistry

# Reuse or create registry
registry = CollectorRegistry()

# SLO Metrics
availability_sli = Gauge(
    'psra_availability_sli',
    'Current availability SLI (percentage)',
    registry=registry
)

latency_sli = Gauge(
    'psra_latency_sli',
    'Current latency SLI (percentage of requests under threshold)',
    registry=registry
)

# SLO Targets
UPTIME_SLO = 0.999  # 99.9%
LATENCY_THRESHOLD = 2.0  # 2 seconds for validation

# Tracking data (sliding window: last 30 days, assuming daily checks)
WINDOW_SIZE = 30  # Days
uptime_window = deque(maxlen=WINDOW_SIZE)  # Store daily uptime percentages
latency_window = deque(maxlen=WINDOW_SIZE)  # Store daily latency compliance percentages

def track_daily_uptime(uptime_percentage):
    """Add daily uptime percentage to window."""
    uptime_window.append(uptime_percentage)
    availability_sli.set(sum(uptime_window) / len(uptime_window) * 100)

def track_daily_latency(latency_compliance_percentage):
    """Add daily latency compliance percentage to window."""
    latency_window.append(latency_compliance_percentage)
    latency_sli.set(sum(latency_window) / len(latency_window) * 100)

def check_slo_compliance():
    """Check if SLOs are met."""
    current_availability = sum(uptime_window) / len(uptime_window) if uptime_window else 0
    current_latency = sum(latency_window) / len(latency_window) if latency_window else 0
    return {
        'uptime_slo_met': current_availability >= UPTIME_SLO,
        'latency_slo_met': current_latency >= 0.95,  # Example: 95% of requests under threshold
        'current_availability': current_availability,
        'current_latency': current_latency
    }

# Example integration: Call daily (e.g., via cron or scheduler)
# track_daily_uptime(0.999)  # Based on actual uptime calculation
# track_daily_latency(0.97)  # Based on histogram percentiles