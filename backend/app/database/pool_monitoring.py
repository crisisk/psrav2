from prometheus_client import Gauge, Counter, Histogram, start_http_server
import time
from app.database.connection_pool import engine

# Define metrics
pool_size_gauge = Gauge('sqlalchemy_pool_size', 'Current pool size')
max_overflow_gauge = Gauge('sqlalchemy_max_overflow', 'Max overflow allowed')
active_connections_gauge = Gauge('sqlalchemy_active_connections', 'Number of active connections')
overflow_connections_gauge = Gauge('sqlalchemy_overflow_connections', 'Number of overflow connections')
pool_timeouts_counter = Counter('sqlalchemy_pool_timeouts_total', 'Total pool timeouts')
connection_checkout_histogram = Histogram('sqlalchemy_connection_checkout_duration', 'Connection checkout duration')

# Function to update metrics (call this periodically, e.g., via a scheduler)
def update_pool_metrics():
    pool = engine.pool
    pool_size_gauge.set(pool.size())
    max_overflow_gauge.set(pool._max_overflow)
    active_connections_gauge.set(pool.checkedout())
    overflow_connections_gauge.set(pool.overflow())
    # Note: Timeouts and checkout duration would need event hooks to track accurately

# Start Prometheus metrics server (call this in your app startup)
def start_monitoring_server(port=8000):
    start_http_server(port)
    print(f"Monitoring server started on port {port}")

# Example usage: In your main app, call update_pool_metrics() every minute