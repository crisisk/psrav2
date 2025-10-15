#!/bin/bash
# /home/vncuser/psra-ltsd-enterprise-v2/backend/scripts/test_runner.sh

# Set up environment
export DATABASE_URL="postgresql://user:pass@localhost/test_db"  # Adjust as needed
export PYTHONPATH="/home/vncuser/psra-ltsd-enterprise-v2/backend:$PYTHONPATH"
LOG_FILE="/tmp/test_runner.log"
TEST_DIR="/home/vncuser/psra-ltsd-enterprise-v2/backend/tests"
SCRIPT_DIR="/home/vncuser/psra-ltsd-enterprise-v2/backend/scripts"

# Function to log
log() {
    echo "$(date): $1" | tee -a "$LOG_FILE"
}

# Function to cleanup
cleanup() {
    log "Cleaning up..."
    rm -f "$LOG_FILE"
    # Add any other cleanup, e.g., drop test DB
}

# Trap for cleanup on exit
trap cleanup EXIT

log "Starting test runner..."

# Run pytest
log "Running pytest..."
cd "$TEST_DIR"
pytest test_new_endpoints.py test_validation.py --tb=short --log-cli-level=INFO -v >> "$LOG_FILE" 2>&1
PYTEST_EXIT=$?
if [ $PYTEST_EXIT -ne 0 ]; then
    log "Pytest failed with exit code $PYTEST_EXIT"
    exit 1
fi

# Run integration tests
log "Running integration tests..."
bash "$SCRIPT_DIR/integration_test.sh" >> "$LOG_FILE" 2>&1
INT_EXIT=$?
if [ $INT_EXIT -ne 0 ]; then
    log "Integration tests failed with exit code $INT_EXIT"
    exit 1
fi

log "All tests passed!"
