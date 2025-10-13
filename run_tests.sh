#!/bin/bash

# Run tests for the PSRA-LTSD Service Components

# Set environment variables for testing
export PYTHONPATH=/home/ubuntu/sevensa_implementation/kubernetes_migration/services/psra/langgraph:$PYTHONPATH
export ENABLE_PARALLEL_PROCESSING=true
export ENABLE_CACHING=true
export CHECKPOINT_PERSISTENCE=false
export LOG_LEVEL=ERROR

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate the virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r ../langgraph/requirements.txt
pip install pytest pytest-cov pytest-mock httpx

# Run the tests
echo "Running tests..."
pytest -v --cov=../langgraph --cov-report=term --cov-report=html

# Deactivate the virtual environment
deactivate

echo "Tests completed."
