#!/bin/bash
# Start the Alimail Reply Generator server locally

set -e

# Change to script directory
cd "$(dirname "$0")"

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Start the server
echo "Starting server on http://localhost:8000"
echo "Press Ctrl+C to stop"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
