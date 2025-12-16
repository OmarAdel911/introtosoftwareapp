#!/bin/bash
# Script to kill process on port 5001

PORT=${1:-5001}

echo "🔍 Checking for processes on port $PORT..."

PID=$(lsof -ti:$PORT)

if [ -z "$PID" ]; then
  echo "✅ No process found on port $PORT"
else
  echo "⚠️  Found process $PID on port $PORT"
  kill -9 $PID
  sleep 1
  if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "❌ Failed to kill process on port $PORT"
  else
    echo "✅ Successfully killed process on port $PORT"
  fi
fi

