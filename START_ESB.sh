#!/bin/bash

# ESB Startup Script (Redis-based)
# This script starts Redis and all related services

echo "🚀 Starting ESB (Redis) and Backend Services..."
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found in current directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "   Please start Docker Desktop and try again"
    exit 1
fi

# Start services
echo "📦 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check Redis status
echo ""
echo "🔍 Checking Redis status..."
REDIS_PASSWORD=${REDIS_PASSWORD:-redis123}
if docker exec egseekers-redis redis-cli -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "⚠️  Redis may still be starting..."
fi

# Check Backend status
echo ""
echo "🔍 Checking Backend status..."
if curl -s http://localhost:10000/api/health > /dev/null; then
    echo "✅ Backend API is running"
else
    echo "⚠️  Backend API may still be starting..."
fi

echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Access Points:"
echo "   - Backend API:        http://localhost:10000"
echo "   - Redis:              localhost:6379"
echo ""
echo "📚 Documentation:"
echo "   - Integration Guide:  See backend/ESB_INTEGRATION.md"
echo ""
echo "✅ Done! Services are starting up."
