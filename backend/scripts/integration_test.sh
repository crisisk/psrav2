#!/bin/bash
# /home/vncuser/psra-ltsd-enterprise-v2/backend/scripts/integration_test.sh

# Set up environment
export DATABASE_URL="postgresql://user:pass@localhost/test_db"  # Adjust as needed
export PYTHONPATH="/home/vncuser/psra-ltsd-enterprise-v2/backend:$PYTHONPATH"

# Function to log and exit on error
log_error() {
    echo "ERROR: $1" >&2
    exit 1
}

# Start the server in background (assuming uvicorn or similar)
echo "Starting server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
SERVER_PID=$!
sleep 5  # Wait for server to start

# Test 1: POST /certificates with valid data
echo "Testing POST /certificates with valid data..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/certificates \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Cert","issuer":"Issuer","valid_from":"2023-01-01T00:00:00Z","valid_to":"2024-01-01T00:00:00Z","status":"valid"}')
if [ "$RESPONSE" -ne 201 ]; then
    log_error "POST valid data failed with status $RESPONSE"
fi

# Test 2: POST /certificates with invalid data
echo "Testing POST /certificates with invalid data..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/certificates \
    -H "Content-Type: application/json" \
    -d '{"issuer":"Issuer"}')  # Missing required fields
if [ "$RESPONSE" -ne 422 ]; then
    log_error "POST invalid data did not return 422, got $RESPONSE"
fi

# Test 3: GET /certificates pagination
echo "Testing GET /certificates pagination..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:8000/api/v1/certificates?page=1&limit=10")
if [ "$RESPONSE" -ne 200 ]; then
    log_error "GET pagination failed with status $RESPONSE"
fi

# Test 4: GET /certificates filtering
echo "Testing GET /certificates filtering..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:8000/api/v1/certificates?status=valid")
if [ "$RESPONSE" -ne 200 ]; then
    log_error "GET filtering failed with status $RESPONSE"
fi

# Test 5: Database index usage (query explain, assuming psql)
echo "Testing database index usage..."
psql "$DATABASE_URL" -c "EXPLAIN SELECT * FROM certificates WHERE status = 'valid';" | grep -q "Index Scan" || log_error "Index not used"

# Cleanup
kill $SERVER_PID
echo "Integration tests passed!"
