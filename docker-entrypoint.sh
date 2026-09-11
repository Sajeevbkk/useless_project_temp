#!/bin/bash
set -e

echo "Starting FastAPI backend on port 5098..."
cd /app/backend
python -m uvicorn main:app --host 127.0.0.1 --port 5098 &
BACKEND_PID=$!

echo "Starting Nginx frontend on port 8097..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Graceful shutdown handler
cleanup() {
    echo "Shutting down services..."
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    nginx -s quit 2>/dev/null || true
}

trap cleanup SIGTERM SIGINT

# Wait for either process to terminate
wait -n "$BACKEND_PID" "$NGINX_PID"
EXIT_CODE=$?

cleanup
exit $EXIT_CODE
